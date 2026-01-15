import type { Request, Response } from "express";
import { Router } from "express";

import { getFullUrlWithProtocol } from "../lib/http.js";
import { logger } from "../lib/logger.js";
import { getUrlStatus } from "../lib/url.js";
import { JobModel } from "../models/job.model.js";

const router: Router = Router();
const jobModel = JobModel.getInstance();

/**
 * POST /api/audit - Submit new audit job
 */
router.post("/audit", async (req: Request, res: Response) => {
  try {
    const { domain, outputFormat, doLighthouse } = req.body;

    // Validate required fields
    if (!domain || !outputFormat || doLighthouse === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: domain, outputFormat, doLighthouse",
      });
    }

    // Validate outputFormat
    if (outputFormat !== "by-page" && outputFormat !== "by-rule") {
      return res.status(400).json({
        status: "error",
        message: "outputFormat must be either 'by-page' or 'by-rule'",
      });
    }

    // Validate doLighthouse
    if (typeof doLighthouse !== "boolean") {
      return res.status(400).json({
        status: "error",
        message: "doLighthouse must be a boolean",
      });
    }

    // Normalize domain (strip http/https if present)
    let normalizedDomain = domain;
    if (normalizedDomain.startsWith("http://")) {
      normalizedDomain = normalizedDomain.replace("http://", "");
    } else if (normalizedDomain.startsWith("https://")) {
      normalizedDomain = normalizedDomain.replace("https://", "");
    }

    // Get proper HTTP or HTTPS protocol
    let fullUrl: string;
    try {
      fullUrl = await getFullUrlWithProtocol(normalizedDomain);
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: `Domain is unreachable: ${normalizedDomain}`,
      });
    }

    // Check for redirects
    try {
      const urlStatus = await getUrlStatus(fullUrl);

      if (urlStatus.isRedirect && urlStatus.location) {
        return res.status(302).json({
          status: "redirect",
          redirectUrl: urlStatus.location,
          message:
            "Domain redirects to different URL. Please confirm and resubmit.",
        });
      }

      if (urlStatus.isClientError || urlStatus.isServerError) {
        return res.status(400).json({
          status: "error",
          message: `Domain returned error status: ${urlStatus.status}`,
        });
      }
    } catch (error: any) {
      logger.warn(
        `Failed to check URL status for ${fullUrl}: ${error.message}`
      );
      // Continue anyway - the audit will handle errors
    }

    // Create job
    const job = await jobModel.createJob(fullUrl, outputFormat, doLighthouse);

    logger.info(`Created audit job ${job.jobId} for ${fullUrl}`);

    return res.status(201).json({
      status: "queued",
      jobId: job.jobId,
      message: "Audit job queued successfully",
    });
  } catch (error: any) {
    logger.error("Failed to create audit job", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/audit/:jobId - Get job status
 */
router.get("/audit/:jobId", async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;

    const job = await jobModel.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found",
      });
    }

    return res.status(200).json({
      jobId: job.jobId,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      progress: job.progress,
      results: job.results,
      error: job.error,
    });
  } catch (error: any) {
    logger.error("Failed to get job status", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/health - Health check endpoint
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
