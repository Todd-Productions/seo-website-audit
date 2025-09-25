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
    async requestHandler({ request, page, enqueueLinks }) {
      const seoReport = await evaluateSEORules(page, seoRules);
      const linksFound = await gatherPageLinks(page);

      // Adding To Dataset
      const crawlData: ScrapedData = {
        url: request.loadedUrl,
        linksFound: linksFound,
        seoReport,
      };

      await Dataset.pushData(crawlData);

      // Enqueue Internal Links
      await enqueueLinks();
    },

    async failedRequestHandler({ request, error }) {
      // TODO: Implement Failed Request
      console.log("Failed Request:", request.loadedUrl);
      console.log(error);

      // await Dataset.pushData({
      //   url: request.loadedUrl,
      //   error: error instanceof Error ? error.message : JSON.stringify(error),
      // });
    },
  });

  return crawler;
};
