import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import { config as defaultConfig } from "../config.js";
import { evaluateSEORules } from "../lib/evaluate.js";
import { hasNoIndexDirective, isPageIndexable } from "../lib/indexability.js";
import { logger } from "../lib/logger.js";
import {
  classifyUrlByContentType,
  classifyUrlByExtension,
  isHtmlPage,
  UrlType,
} from "../lib/urlClassifier.js";
import { gatherPageLinks } from "./actions/links.js";

import { type SEORule } from "../types/rules.js";
import type { ScrapedData } from "../types/scrape.js";

/**
 * Gets a crawler for performing an audit
 *
 * @param {SEORule[]} seoRules
 */
export const getAuditCrawler = (
  seoRules: SEORule[],
  _config?: Configuration
) => {
  const crawlerConfig = _config || {
    maxRequestsPerCrawl: defaultConfig.maxRequests,
    maxConcurrency: defaultConfig.concurrency,
  };

  let processedCount = 0;
  const maxRequests = defaultConfig.maxRequests;

  const crawler = new PlaywrightCrawler({
    ...crawlerConfig,

    // Playwright browser options with timeouts
    launchContext: {
      launchOptions: {
        headless: true,
        timeout: defaultConfig.navigationTimeout,
      },
    },

    // Navigation timeout
    navigationTimeoutSecs: defaultConfig.navigationTimeout / 1000,

    // Request handler timeout
    requestHandlerTimeoutSecs: defaultConfig.requestTimeout / 1000,

    // Max retries
    maxRequestRetries: defaultConfig.maxRetries,

    async requestHandler({ request, page, enqueueLinks, response }) {
      processedCount++;
      const url = request.loadedUrl || request.url;

      logger.progress(
        `Processing URL ${processedCount}/${maxRequests}: ${url}`
      );
      logger.step("requestHandler", `Starting to process ${url}`);
      const statusCode = response?.status();
      logger.debug(`Status code: ${statusCode}`);

      // Classify URL by extension first
      logger.step("classifyUrl", "Classifying URL type");
      let urlType = classifyUrlByExtension(url);

      // If extension-based classification is inconclusive, use content-type
      if (urlType === UrlType.UNKNOWN || urlType === UrlType.HTML_PAGE) {
        const contentType = response?.headers()["content-type"] || "";
        if (contentType) {
          logger.debug(`Content-Type: ${contentType}`);
          const contentTypeClassification =
            classifyUrlByContentType(contentType);
          if (contentTypeClassification !== UrlType.UNKNOWN) {
            urlType = contentTypeClassification;
          }
        }
      }

      logger.debug(`URL classified as: ${urlType}`);

      // Check if this is an HTML page that should be evaluated
      const isHtml = isHtmlPage(urlType);

      let seoReport;
      let linksFound: string[] = [];
      let hasNoIndex = false;

      if (isHtml) {
        logger.step("evaluateHTML", "Evaluating HTML page");

        // Only evaluate SEO rules for HTML pages
        try {
          logger.debug("Running SEO rules evaluation");
          seoReport = await evaluateSEORules(page, seoRules);
          logger.debug(`SEO evaluation complete. Score: ${seoReport.score}`);
        } catch (err: any) {
          logger.error(`Failed to evaluate SEO rules: ${err.message}`, err);
          seoReport = {
            results: [],
            score: 0,
          };
        }

        try {
          logger.debug("Gathering page links");
          linksFound = await gatherPageLinks(page);
          logger.debug(`Found ${linksFound.length} links`);
        } catch (err: any) {
          logger.warn(`Failed to gather links: ${err.message}`);
          linksFound = [];
        }

        try {
          logger.debug("Checking for noindex directive");
          hasNoIndex = await hasNoIndexDirective(page);
          logger.debug(`Has noindex: ${hasNoIndex}`);
        } catch (err: any) {
          logger.warn(`Failed to check noindex: ${err.message}`);
          hasNoIndex = false;
        }
      } else {
        logger.debug(`Skipping SEO evaluation for document type: ${urlType}`);
        // For documents (PDFs, DOCs, etc.), create a minimal report
        // indicating they were skipped
        seoReport = {
          results: [],
          score: 100, // Documents don't affect SEO score
        };
      }

      // Determine if page is indexable
      const isIndexable = isPageIndexable(hasNoIndex, statusCode);
      logger.debug(`Page indexable: ${isIndexable}`);

      // Adding To Dataset
      logger.step("saveData", "Saving crawl data to dataset");
      const crawlData: ScrapedData = {
        url,
        linksFound,
        seoReport,
        statusCode,
        urlType,
        isIndexable,
        hasNoIndex,
      };

      try {
        await Dataset.pushData(crawlData);
        logger.debug("Data saved successfully");
      } catch (err: any) {
        logger.error(`Failed to save data: ${err.message}`, err);
      }

      // Enqueue Internal Links (only for HTML pages)
      if (isHtml) {
        try {
          logger.debug("Enqueueing internal links");
          await enqueueLinks();
          logger.debug("Links enqueued successfully");
        } catch (err: any) {
          logger.warn(`Failed to enqueue links: ${err.message}`);
        }
      }

      logger.success(`Completed processing: ${url}`);
    },

    async failedRequestHandler({ request, error }) {
      const url = request.loadedUrl || request.url;
      logger.error(`Failed to process URL: ${url}`, error);

      // Classify the failed URL
      const urlType = classifyUrlByExtension(url);
      const isHtml = isHtmlPage(urlType);

      // For failed requests, we still want to track them
      // Create a minimal SEO report indicating failure
      const failedReport = {
        results: isHtml
          ? seoRules.map((rule) => ({
              rule: rule.name,
              success: false,
              message: "Page failed to load",
            }))
          : [],
        score: 0,
      };

      try {
        await Dataset.pushData({
          url,
          linksFound: [],
          seoReport: failedReport,
          statusCode: undefined,
          urlType,
          isIndexable: false, // Failed pages are not indexable
          hasNoIndex: false,
        });
        logger.debug("Failed request data saved");
      } catch (err: any) {
        logger.error(`Failed to save failed request data: ${err.message}`, err);
      }
    },
  });

  return crawler;
};
