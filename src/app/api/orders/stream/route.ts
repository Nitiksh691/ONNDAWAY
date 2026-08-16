// good be with me and guide me in your this world
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
  } catch (err) {
    return new Response("Database connection failed", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        try {
          const formattedData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(formattedData));
        } catch (e) {
          // ignore
        }
      };

      // Send initial connection success
      sendEvent({ type: "connected" });

      let changeStream: any;
      try {
        changeStream = Order.watch();

        changeStream.on("change", async (change: any) => {
          sendEvent({ type: "order_change", operation: change.operationType, documentKey: change.documentKey });

          try {
            const unconfirmedCount = await Order.countDocuments({
              status: "placed",
            });
            sendEvent({ type: "orders_update", count: unconfirmedCount });
          } catch (e) { }
        });

        changeStream.on("error", (error: any) => {
          logger.error("sse_changestream_error", { error: String(error) });
        });
      } catch (err) {
        logger.error("sse_changestream_init_error", { error: String(err) });
      }

      // Keep-alive heartbeat every 15s to prevent Vercel timeouts
      const pingInterval = setInterval(() => {
        sendEvent({ type: "ping" });
      }, 15000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        if (changeStream) {
          changeStream.close().catch(() => { });
        }
        try {
          controller.close();
        } catch (e) {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
