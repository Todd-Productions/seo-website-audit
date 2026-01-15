import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

import { logger } from "./logger.js";

export interface WebSocketMessage {
  type: "status" | "error" | "complete";
  jobId: string;
  status: string | undefined;
  progress: number | undefined;
  message: string | undefined;
  timestamp: string;
  results: any | undefined;
  error: string | undefined;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(wss: WebSocketServer): void {
    this.wss = wss;

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      // Extract jobId from URL path: /ws/audit/:jobId
      const url = req.url || "";
      const match = url.match(/\/ws\/audit\/([a-f0-9-]+)/);

      if (!match) {
        logger.warn("WebSocket connection without valid jobId");
        ws.close(1008, "Invalid job ID");
        return;
      }

      const jobId = match[1]!;
      logger.info(`WebSocket client connected for job ${jobId}`);

      // Add client to the job's client set
      if (!this.clients.has(jobId)) {
        this.clients.set(jobId, new Set());
      }
      this.clients.get(jobId)!.add(ws);

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: "status",
        jobId,
        status: undefined,
        progress: undefined,
        message: "Connected to job updates",
        timestamp: new Date().toISOString(),
        results: undefined,
        error: undefined,
      });

      // Handle client disconnect
      ws.on("close", () => {
        logger.info(`WebSocket client disconnected for job ${jobId}`);
        const clientSet = this.clients.get(jobId);
        if (clientSet) {
          clientSet.delete(ws);
          if (clientSet.size === 0) {
            this.clients.delete(jobId);
          }
        }
      });

      // Handle errors
      ws.on("error", (error) => {
        logger.error(`WebSocket error for job ${jobId}`, error);
      });
    });

    logger.info("WebSocket server initialized");
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients watching a specific job
   */
  broadcastToJob(
    jobId: string,
    message: Omit<WebSocketMessage, "timestamp">
  ): void {
    const clientSet = this.clients.get(jobId);
    if (!clientSet || clientSet.size === 0) {
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    };

    logger.debug(
      `Broadcasting to ${clientSet.size} client(s) for job ${jobId}`
    );

    clientSet.forEach((ws) => {
      this.sendToClient(ws, fullMessage);
    });
  }

  /**
   * Send status update
   */
  sendStatusUpdate(
    jobId: string,
    status: string,
    progress: number | undefined,
    message: string | undefined
  ): void {
    this.broadcastToJob(jobId, {
      type: "status",
      jobId,
      status,
      progress,
      message,
      results: undefined,
      error: undefined,
    });
  }

  /**
   * Send completion message
   */
  sendCompletion(jobId: string, results: any): void {
    this.broadcastToJob(jobId, {
      type: "complete",
      jobId,
      status: "COMPLETED",
      progress: undefined,
      message: undefined,
      results,
      error: undefined,
    });
  }

  /**
   * Send error message
   */
  sendError(jobId: string, error: string): void {
    this.broadcastToJob(jobId, {
      type: "error",
      jobId,
      status: "FAILED",
      progress: undefined,
      message: undefined,
      results: undefined,
      error,
    });
  }

  /**
   * Get number of connected clients for a job
   */
  getClientCount(jobId: string): number {
    return this.clients.get(jobId)?.size || 0;
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.clients.forEach((clientSet) => {
      clientSet.forEach((ws) => {
        ws.close(1001, "Server shutting down");
      });
    });
    this.clients.clear();
    logger.info("All WebSocket connections closed");
  }
}
