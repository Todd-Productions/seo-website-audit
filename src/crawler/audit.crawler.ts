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

      // Gathering Additional Links
      const eqLinks = await enqueueLinks();
      const processedLinks = eqLinks.processedRequests.map((r) => r.requestId);
      const unprocessedLinks = eqLinks.unprocessedRequests.map((r) => r.url);
      const linksFound = [...processedLinks, ...unprocessedLinks];

      // Adding To Dataset
      await Dataset.pushData({
        url: request.loadedUrl,
        linksFound: linksFound,
        seoReport,
      });
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
