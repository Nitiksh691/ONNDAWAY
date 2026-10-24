// good be with me and guide me in your this world
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // If dedicated Node.js server URL is provided, redirect to it directly (SSE supports 307 redirects)
  const nodeServerUrl = process.env.NODE_SERVER_URL || process.env.NEXT_PUBLIC_NODE_SERVER_URL;
  if (nodeServerUrl) {
    try {
      const target = new URL("/api/orders/stream", nodeServerUrl);
      return NextResponse.redirect(target, 307);
    } catch {
      // Fall through to Next.js handler if URL is invalid
    }
  }

  try {
    await dbConnect();
  } catch (err) {
    return new Response("Database connection failed", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;

      const sendEvent = (data: any) => {
        if (isClosed) return;
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

      // Keep-alive heartbeat every 15s to keep proxy alive
      const pingInterval = setInterval(() => {
        sendEvent({ type: "ping" });
      }, 15000);

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(pingInterval);
        clearTimeout(cycleTimer);
        if (changeStream) {
          changeStream.close().catch(() => { });
        }
      };

      // CRITICAL VERCEL FIX: Serverless functions cannot run indefinitely (timeout after 300s or 60s).
      // Gracefully close the stream after 45 seconds with 200 OK.
      // Standard browser EventSource immediately and automatically reconnects with zero error!
      const cycleTimer = setTimeout(() => {
        try {
          sendEvent({ type: "stream_cycle" });
          cleanup();
          controller.close();
        } catch { }
      }, 45000);

      // Clean up when the client disconnects or aborts
      req.signal.addEventListener("abort", () => {
        cleanup();
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
