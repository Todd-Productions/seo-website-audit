import type { SEOReport } from "./seo.js";

type SuccessScrapedData = {
  url: string;
  linksFound: string[];
  seoReport: SEOReport;
  statusCode?: number | undefined;
  redirectChain?: string[] | undefined;
};

// TODO: Implement Error Crawl Data
type ErrorScrapedData = {
  url: string;
  error: string;
  statusCode?: number;
};

type ScrapedData = SuccessScrapedData; // | ErrorScrapedData;

export { type ErrorScrapedData, type ScrapedData, type SuccessScrapedData };
