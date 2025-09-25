import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import { config as defaultConfig } from "../config.js";
import { evaluate } from "../rules/evaluate.js";
import { type SeoRule } from "../rules/rules.js";
import { gatherPageLinks } from "./actions/links.js";

/**
 * Gets a crawler for performing an audit
 *
 * @param {SEORule[]} seoRules
 */
export const getAuditCrawler = (
  seoRules: SeoRule[],
  _config?: Configuration
) => {
  const config = _config || {
    maxRequestsPerCrawl: defaultConfig.maxRequests,
    maxConcurrency: defaultConfig.concurrency,
  };

  const crawler = new PlaywrightCrawler({
    ...config,
    async requestHandler({ request, page, enqueueLinks }) {
      const seoReport = await evaluate(page, seoRules);
      const linksFound = await gatherPageLinks(page);

      // Adding To Dataset
      await Dataset.pushData({
        url: request.loadedUrl,
        linksFound: linksFound,
        seoReport,
      });

      // Enqueue Internal Links
      await enqueueLinks();
    },

    async failedRequestHandler({ request, error }) {
      await Dataset.pushData({
        url: request.loadedUrl,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
    },
  });

  return crawler;
};
