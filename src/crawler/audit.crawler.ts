import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import { config as defaultConfig } from "../config.js";
import { evaluateSEORules } from "../lib/evaluate.js";
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
  const config = _config || {
    maxRequestsPerCrawl: defaultConfig.maxRequests,
    maxConcurrency: defaultConfig.concurrency,
  };

  const crawler = new PlaywrightCrawler({
    ...config,
    async requestHandler({ request, page, enqueueLinks, response }) {
      const seoReport = await evaluateSEORules(page, seoRules);
      const linksFound = await gatherPageLinks(page);

      // Get status code from response
      const statusCode = response?.status();

      // Adding To Dataset
      const crawlData: ScrapedData = {
        url: request.loadedUrl || request.url,
        linksFound: linksFound,
        seoReport,
        statusCode,
      };

      await Dataset.pushData(crawlData);

      // Enqueue Internal Links
      await enqueueLinks();
    },

    async failedRequestHandler({ request, error }) {
      console.log("Failed Request:", request.loadedUrl || request.url);
      console.log(error);

      // For failed requests, we still want to track them
      // Create a minimal SEO report indicating failure
      const failedReport = {
        results: seoRules.map((rule) => ({
          rule: rule.name,
          success: false,
          message: "Page failed to load",
        })),
        score: 0,
      };

      await Dataset.pushData({
        url: request.loadedUrl || request.url,
        linksFound: [],
        seoReport: failedReport,
        statusCode: undefined,
      });
    },
  });

  return crawler;
};
