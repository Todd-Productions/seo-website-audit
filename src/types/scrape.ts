import type { UrlType } from "../lib/urlClassifier.js";
import type { SEOReport } from "./seo.js";

type SuccessScrapedData = {
  url: string;
  linksFound: string[];
  seoReport: SEOReport;
  statusCode?: number | undefined;
  redirectChain?: string[] | undefined;
  urlType: UrlType; // Classification of URL (HTML, PDF, DOC, etc.)
  isIndexable: boolean; // Whether the page is likely indexed by search engines
  hasNoIndex: boolean; // Whether the page has noindex directive
};

// TODO: Implement Error Crawl Data
type ErrorScrapedData = {
  url: string;
  error: string;
  statusCode?: number;
  urlType?: UrlType;
};

type ScrapedData = SuccessScrapedData; // | ErrorScrapedData;

export { type ErrorScrapedData, type ScrapedData, type SuccessScrapedData };
