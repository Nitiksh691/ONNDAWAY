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

      let prevPendingCount = -1;

      // Internal polling loop (runs every 3s)
      const interval = setInterval(async () => {
        try {
          // Just count unconfirmed placed orders to keep it lightweight
          const unconfirmedCount = await Order.countDocuments({
            status: "placed",
            confirmed: { $ne: true }
          });

          if (unconfirmedCount !== prevPendingCount) {
            sendEvent({ type: "orders_update", count: unconfirmedCount });
            prevPendingCount = unconfirmedCount;
          } else {
            // Keep-alive heartbeat to prevent timeouts (e.g. Vercel)
            sendEvent({ type: "ping" });
          }
        } catch (error) {
          logger.error("sse_poll_error", { error: String(error) });
        }
      }, 3000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
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
