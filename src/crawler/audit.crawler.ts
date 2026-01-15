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
        // Performance: Disable unnecessary browser features
        args: [
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      },
    },

    // Navigation timeout
    navigationTimeoutSecs: defaultConfig.navigationTimeout / 1000,

    // Request handler timeout
    requestHandlerTimeoutSecs: defaultConfig.requestTimeout / 1000,

    // Max retries
    maxRequestRetries: defaultConfig.maxRetries,

    async requestHandler({ request, page, enqueueLinks, response }) {
      // Performance: Set up request interception for resource blocking
      if (defaultConfig.blockResources) {
        await page.route("**/*", (route) => {
          const resourceType = route.request().resourceType();
          const url = route.request().url();

          // Block based on resource type
          const shouldBlock =
            (defaultConfig.blockImages &&
              (resourceType === "image" || resourceType === "imageset")) ||
            (defaultConfig.blockFonts && resourceType === "font") ||
            (defaultConfig.blockMedia &&
              (resourceType === "media" ||
                url.match(/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i))) ||
            (defaultConfig.blockStylesheets && resourceType === "stylesheet");

          if (shouldBlock) {
            logger.debug(`Blocking ${resourceType}: ${url}`);
            route.abort();
          } else {
            route.continue();
          }
        });
      }
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

          // Enqueue links with explicit strategy to ensure deduplication
          // The 'same-domain' strategy ensures we only crawl internal links
          // Crawlee automatically deduplicates URLs in the request queue
          await enqueueLinks({
            strategy: "same-domain",
            // Transform URLs to normalize them (remove trailing slashes, fragments, etc.)
            transformRequestFunction: (req) => {
              // Normalize URL by removing trailing slash and fragment
              let url = req.url;

              // Remove fragment (hash)
              const urlWithoutFragment = url.split("#")[0];
              if (urlWithoutFragment) {
                url = urlWithoutFragment;
              }

              // Remove trailing slash for consistency
              if (url.endsWith("/") && url !== new URL(url).origin + "/") {
                url = url.slice(0, -1);
              }

              req.url = url;
              req.uniqueKey = url; // Ensure uniqueKey matches normalized URL

              logger.debug(`Normalized URL for queue: ${url}`);
              return req;
            },
          });

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
