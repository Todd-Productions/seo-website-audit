import cors from "cors";
import express from "express";
import { createServer } from "http";
import cron from "node-cron";
import { WebSocketServer } from "ws";

import { config } from "../config.js";
import { JobQueue } from "../lib/job-queue.js";
import { logger } from "../lib/logger.js";
import { WebSocketManager } from "../lib/websocket.js";
import { JobModel } from "../models/job.model.js";
import auditRoutes from "../routes/audit.routes.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/audit" });

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", auditRoutes);

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "SEO Website Audit API",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      submitAudit: "POST /api/audit",
      getJobStatus: "GET /api/audit/:jobId",
      websocket: "WS /ws/audit/:jobId",
    },
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error("Unhandled error", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

// Initialize services
async function initialize() {
  try {
    logger.info("=== SEO Audit Server Starting ===");

    // Connect to MongoDB
    logger.info("Connecting to MongoDB...");
    const jobModel = JobModel.getInstance();
    await jobModel.connect();

    // Initialize WebSocket manager
    logger.info("Initializing WebSocket server...");
    const wsManager = WebSocketManager.getInstance();
    wsManager.initialize(wss);

    // Start job queue processor
    logger.info("Starting job queue processor...");
    const jobQueue = JobQueue.getInstance();
    jobQueue.start();

    // Schedule daily cleanup job (runs at midnight)
    logger.info("Scheduling daily cleanup job...");
    cron.schedule("0 0 * * *", async () => {
      logger.info("Running scheduled cleanup job");
      await jobQueue.cleanupOldJobs(config.jobRetentionHours);
    });

    // Start server
    const port = config.serverPort;
    server.listen(port, () => {
      logger.success(`Server running on port ${port}`);
      logger.info(`REST API: http://localhost:${port}/api`);
      logger.info(`WebSocket: ws://localhost:${port}/ws/audit/:jobId`);
      logger.info(`Health check: http://localhost:${port}/api/health`);
    });
  } catch (error: any) {
    logger.error("Failed to initialize server", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info("Shutting down server...");

  // Stop accepting new jobs
  const jobQueue = JobQueue.getInstance();
  jobQueue.stop();

  // Close WebSocket connections
  const wsManager = WebSocketManager.getInstance();
  wsManager.closeAll();

  // Close HTTP server
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Disconnect from MongoDB
  const jobModel = JobModel.getInstance();
  await jobModel.disconnect();

  logger.success("Server shutdown complete");
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  shutdown();
});

process.on("unhandledRejection", (reason, _promise) => {
  logger.error("Unhandled rejection", reason);
  shutdown();
});

// Start the server
initialize();
