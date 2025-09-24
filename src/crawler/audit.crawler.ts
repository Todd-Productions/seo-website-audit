import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import type { Page } from "playwright";
import { config as defaultConfig } from "../config.js";
import { evaluateRules, type SeoRule } from "../rules/index.js";

/**
 * Gather All Links On Page
 *
 * @param {Page} page
 * @returns {Promise<string[]>}
 */
const gatherPageLinks = async (page: Page) => {
  const locator = await page.locator("a[href]");
  const linksFound = locator.evaluateAll((anchors) =>
    anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => !href.startsWith("mailto:") && !href.startsWith("tel:"))
  );

  return linksFound;
};

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
