import { Dataset, PlaywrightCrawler, type Configuration } from "crawlee";

import { config as defaultConfig } from "../config.js";
import { evaluateSEORules } from "../lib/evaluate.js";
import { hasNoIndexDirective, isPageIndexable } from "../lib/indexability.js";
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
  const config = _config || {
    maxRequestsPerCrawl: defaultConfig.maxRequests,
    maxConcurrency: defaultConfig.concurrency,
  };

  const crawler = new PlaywrightCrawler({
    ...config,
    async requestHandler({ request, page, enqueueLinks, response }) {
      const url = request.loadedUrl || request.url;
      const statusCode = response?.status();

      // Classify URL by extension first
      let urlType = classifyUrlByExtension(url);

      // If extension-based classification is inconclusive, use content-type
      if (urlType === UrlType.UNKNOWN || urlType === UrlType.HTML_PAGE) {
        const contentType = response?.headers()["content-type"] || "";
        if (contentType) {
          const contentTypeClassification =
            classifyUrlByContentType(contentType);
          if (contentTypeClassification !== UrlType.UNKNOWN) {
            urlType = contentTypeClassification;
          }
        }
      }

      // Check if this is an HTML page that should be evaluated
      const isHtml = isHtmlPage(urlType);

      let seoReport;
      let linksFound: string[] = [];
      let hasNoIndex = false;

      if (isHtml) {
        // Only evaluate SEO rules for HTML pages
        seoReport = await evaluateSEORules(page, seoRules);
        linksFound = await gatherPageLinks(page);
        hasNoIndex = await hasNoIndexDirective(page);
      } else {
        // For documents (PDFs, DOCs, etc.), create a minimal report
        // indicating they were skipped
        seoReport = {
          results: [],
          score: 100, // Documents don't affect SEO score
        };
      }

      // Determine if page is indexable
      const isIndexable = isPageIndexable(hasNoIndex, statusCode);

      // Adding To Dataset
      const crawlData: ScrapedData = {
        url,
        linksFound,
        seoReport,
        statusCode,
        urlType,
        isIndexable,
        hasNoIndex,
      };

      await Dataset.pushData(crawlData);

      // Enqueue Internal Links (only for HTML pages)
      if (isHtml) {
        await enqueueLinks();
      }
    },

    async failedRequestHandler({ request, error }) {
      const url = request.loadedUrl || request.url;
      console.log("Failed Request:", url);
      console.log(error);

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

      await Dataset.pushData({
        url,
        linksFound: [],
        seoReport: failedReport,
        statusCode: undefined,
        urlType,
        isIndexable: false, // Failed pages are not indexable
        hasNoIndex: false,
      });
    },
  });

  return crawler;
};
