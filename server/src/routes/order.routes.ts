import { Router, Request, Response } from "express";
import { OrderModel } from "../models/Order.model";

const router = Router();

// Store active SSE client responses in memory
const sseClients = new Set<Response>();

let changeStreamStarted = false;
let fallbackInterval: NodeJS.Timeout | null = null;
let lastKnownOrderCount = 0;

/**
 * Broadcasts an SSE message to all connected clients
 */
function broadcast(data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

/**
 * Initializes MongoDB change stream or polling fallback to track orders in real time.
 * One single shared listener handles all clients efficiently.
 */
function initOrderWatcher() {
  if (changeStreamStarted) return;
  changeStreamStarted = true;

  try {
    const changeStream = OrderModel.watch();

    changeStream.on("change", async (change: any) => {
      broadcast({
        type: "order_change",
        operation: change.operationType,
        documentKey: change.documentKey,
      });

      try {
        const unconfirmedCount = await OrderModel.countDocuments({ status: "placed" });
        broadcast({ type: "orders_update", count: unconfirmedCount });
      } catch {
        // ignore
      }
    });

    changeStream.on("error", (err: any) => {
      console.warn("⚠️  Change stream error (switching to poll fallback):", err?.message || err);
      startPollFallback();
    });

    console.log("📡 MongoDB Order ChangeStream initialized successfully");
  } catch (err: any) {
    console.warn("⚠️  ChangeStream not supported (requires replica set), using lightweight polling fallback:", err?.message || err);
    startPollFallback();
  }
}

function startPollFallback() {
  if (fallbackInterval) return;
  fallbackInterval = setInterval(async () => {
    if (sseClients.size === 0) return;
    try {
      const count = await OrderModel.countDocuments({ status: "placed" });
      if (count !== lastKnownOrderCount) {
        lastKnownOrderCount = count;
        broadcast({ type: "orders_update", count });
        broadcast({ type: "order_change", operation: "update" });
      }
    } catch {
      // ignore
    }
  }, 4000);
}

/**
 * GET /api/orders/stream
 * Persistent SSE stream for real-time order updates.
 * Runs in Node.js Express — never times out after 300s like Vercel serverless.
 */
router.get("/orders/stream", (req: Request, res: Response) => {
  // SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
    "X-Accel-Buffering": "no",
  });

  // Ensure watcher is running
  initOrderWatcher();

  // Add client to active pool
  sseClients.add(res);

  // Send initial connection payload
  res.write(`data: ${JSON.stringify({ type: "connected", source: "node_server" })}\n\n`);

  // Heartbeat ping every 15s to keep proxy/load-balancer sockets active
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

/**
 * GET /api/orders/health
 * Simple diagnostic endpoint to inspect active SSE connections
 */
router.get("/orders/stream/stats", (_req: Request, res: Response) => {
  res.json({
    activeClients: sseClients.size,
    watcherActive: changeStreamStarted,
  });
});

export default router;
