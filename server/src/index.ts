import app from "./app";
import { connectDB } from "./db";
import { config } from "./config/env";

async function start(): Promise<void> {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`\n🚀 Onndaway Node Server  →  http://localhost:${config.port}`);
      console.log(`🌐 Next.js app expected  →  ${config.nextjsUrl}`);
      console.log(`📋 Health check         →  http://localhost:${config.port}/api/health`);
      console.log(`🔗 Ping Next.js         →  http://localhost:${config.port}/api/ping-nextjs`);
      console.log(`🌍 Environment          →  ${config.nodeEnv}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
