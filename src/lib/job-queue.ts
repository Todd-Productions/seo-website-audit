import type { Job } from "../models/job.model.js";
import { JobModel, JobStatus } from "../models/job.model.js";
import { runAudit } from "./audit-service.js";
import { logger } from "./logger.js";
import { WebSocketManager } from "./websocket.js";

export class JobQueue {
  private static instance: JobQueue;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private jobModel: JobModel;
  private wsManager: WebSocketManager;

  private constructor() {
    this.jobModel = JobModel.getInstance();
    this.wsManager = WebSocketManager.getInstance();
  }

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue();
    }
    return JobQueue.instance;
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.processingInterval) {
      logger.warn("Job queue already running");
      return;
    }

    logger.info("Starting job queue processor");

    // Process jobs every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 5000);

    // Process immediately
    this.processNextJob();
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info("Job queue processor stopped");
    }
  }

  /**
   * Process next pending job
   */
  private async processNextJob(): Promise<void> {
    // Don't start new job if already processing
    if (this.isProcessing) {
      return;
    }

    try {
      const job = await this.jobModel.getNextPendingJob();

      if (!job) {
        // No pending jobs
        return;
      }

      this.isProcessing = true;
      await this.processJob(job);
    } catch (error: any) {
      logger.error("Error processing job queue", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const { jobId, domain, outputFormat, doLighthouse } = job;

    logger.info(`Starting job ${jobId} for domain ${domain}`);

    try {
      // Update status to RUNNING
      await this.jobModel.updateJobStatus(jobId, JobStatus.RUNNING);
      this.wsManager.sendStatusUpdate(jobId, "RUNNING", 0, "Starting audit");

      // Run the audit with progress callbacks
      const result = await runAudit({
        website: domain,
        outputFormat,
        doLighthouse,
        onProgress: async (progress: number, message: string) => {
          // Update progress in database
          await this.jobModel.updateJobProgress(jobId, progress);

          // Send WebSocket update
          this.wsManager.sendStatusUpdate(jobId, "RUNNING", progress, message);

          logger.debug(`Job ${jobId} progress: ${progress}% - ${message}`);
        },
      });

      // Get log file path
      const logFilePath = logger.getLogFilePath();

      // Update job with results
      const updates: Partial<Job> = {
        results: result.formattedResult,
        progress: 100,
      };

      if (logFilePath) {
        updates.logFilePath = logFilePath;
      }

      await this.jobModel.updateJobStatus(jobId, JobStatus.COMPLETED, updates);

      // Send completion via WebSocket
      this.wsManager.sendCompletion(jobId, result.formattedResult);

      logger.success(`Job ${jobId} completed successfully`);
    } catch (error: any) {
      logger.error(`Job ${jobId} failed`, error);

      // Update job with error
      await this.jobModel.updateJobStatus(jobId, JobStatus.FAILED, {
        error: error.message,
        progress: 0,
      });

      // Send error via WebSocket
      this.wsManager.sendError(jobId, error.message);
    }
  }

  /**
   * Clean up old completed jobs and their log files
   */
  async cleanupOldJobs(hoursOld: number): Promise<void> {
    try {
      logger.info(`Cleaning up jobs older than ${hoursOld} hours`);

      // Delete jobs from database
      const jobsDeleted = await this.jobModel.deleteOldJobs(hoursOld);

      logger.success(`Cleanup complete: ${jobsDeleted} jobs deleted`);
    } catch (error: any) {
      logger.error("Failed to cleanup old jobs", error);
    }
  }
}
