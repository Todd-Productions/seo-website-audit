import type { SEOReport } from "./seo.js";

type SuccessScrapedData = {
  url: string;
  linksFound: string[];
  seoReport: SEOReport;
};

// TODO: Implement Error Crawl Data
type ErrorScrapedData = {
  url: string;
  error: string;
};

type ScrapedData = SuccessScrapedData; // | ErrorScrapedData;

export { type ErrorScrapedData, type ScrapedData, type SuccessScrapedData };
