import { Collection, Db, MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";

import { config } from "../config.js";
import { logger } from "../lib/logger.js";

export enum JobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface Job {
  _id?: any;
  jobId: string;
  domain: string;
  outputFormat: "by-page" | "by-rule";
  doLighthouse: boolean;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  results?: any;
  error?: string;
  logFilePath?: string;
}

export class JobModel {
  private static instance: JobModel;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Job> | null = null;

  private constructor() {}

  static getInstance(): JobModel {
    if (!JobModel.instance) {
      JobModel.instance = new JobModel();
    }
    return JobModel.instance;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(config.mongodbUri);
      await this.client.connect();
      
      // Get database name from URI or use default
      const dbName = new URL(config.mongodbUri).pathname.slice(1) || "seo-audit";
      this.db = this.client.db(dbName);
      this.collection = this.db.collection<Job>("jobs");

      // Create indexes
      await this.collection.createIndex({ jobId: 1 }, { unique: true });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ createdAt: 1 });

      logger.info("Connected to MongoDB successfully");
    } catch (error: any) {
      logger.error("Failed to connect to MongoDB", error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      logger.info("Disconnected from MongoDB");
    }
  }

  /**
   * Create a new job
   */
  async createJob(
    domain: string,
    outputFormat: "by-page" | "by-rule",
    doLighthouse: boolean
  ): Promise<Job> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    const job: Job = {
      jobId: uuidv4(),
      domain,
      outputFormat,
      doLighthouse,
      status: JobStatus.PENDING,
      createdAt: new Date(),
      progress: 0,
    };

    await this.collection.insertOne(job);
    logger.info(`Created job ${job.jobId} for domain ${domain}`);
    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    return await this.collection.findOne({ jobId });
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    updates: Partial<Job> = {}
  ): Promise<void> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    const updateData: any = { status, ...updates };

    if (status === JobStatus.RUNNING && !updates.startedAt) {
      updateData.startedAt = new Date();
    }

    if (
      (status === JobStatus.COMPLETED || status === JobStatus.FAILED) &&
      !updates.completedAt
    ) {
      updateData.completedAt = new Date();
    }

    await this.collection.updateOne({ jobId }, { $set: updateData });
    logger.debug(`Updated job ${jobId} status to ${status}`);
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    await this.collection.updateOne({ jobId }, { $set: { progress } });
  }

  /**
   * Get next pending job
   */
  async getNextPendingJob(): Promise<Job | null> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    return await this.collection.findOne(
      { status: JobStatus.PENDING },
      { sort: { createdAt: 1 } }
    );
  }

  /**
   * Delete old completed jobs
   */
  async deleteOldJobs(hoursOld: number): Promise<number> {
    if (!this.collection) {
      throw new Error("Database not connected");
    }

    const cutoffDate = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    const result = await this.collection.deleteMany({
      status: JobStatus.COMPLETED,
      completedAt: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  }
}

