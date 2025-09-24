import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import { config as defaultConfig } from "../config.js";
import { evaluateRules, type SeoRule } from "../rules/index.js";

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
      const seoReport = await evaluateRules(page, seoRules);

      await Dataset.pushData({
        url: request.loadedUrl,
        seoReport,
      });

      // enqueue internal links
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
