import { Dataset } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { runLighthouse } from "../crawler/actions/lighthouse.js";
import {
  getSitemapUrl,
  getUrlsFromSitemap,
} from "../crawler/actions/sitemap.js";
import { getAuditCrawler } from "../crawler/audit.crawler.js";
import { calculateProportionalScore, evaluateSiteRules } from "./evaluate.js";
import { formatByPage, formatByRule } from "./formatters.js";
import { logger } from "./logger.js";
import { Timer } from "./timer.js";
import { isHtmlPage } from "./urlClassifier.js";

// Page-level rules
import { has4xxErrors } from "../rules/has4xxErrors.rule.js";
import { has5xxErrors } from "../rules/has5xxErrors.rule.js";
import { hasHTTPS } from "../rules/hasHTTPS.rule.js";
import { hasMetaDescription } from "../rules/hasMetaDescription.rule.js";
import { hasMixedContent } from "../rules/hasMixedContent.rule.js";
import { hasRedirectLoops } from "../rules/hasRedirectLoops.rule.js";
import { hasTitle } from "../rules/hasTitle.rule.js";
import { titleTooLong } from "../rules/titleTooLong.rule.js";

// Site-level rules
import { hasRobotsTxt } from "../rules/hasRobotsTxt.rule.js";
import { hasSitemapXml } from "../rules/hasSitemapXml.rule.js";
import { sitemapComplete } from "../rules/sitemapComplete.rule.js";

import { AuditStatus, OutputFormat } from "../types/audit.js";
import { type SEORule, type SiteRule } from "../types/rules.js";
import { type ScrapedData } from "../types/scrape.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AuditOptions {
  website: string;
  outputFormat: "by-page" | "by-rule";
  doLighthouse: boolean;
  onProgress?: (progress: number, message: string) => void;
}

export interface AuditResult {
  website: string;
  overallScore: number;
  totalUrls: number;
  totalPages: number;
  indexedPages: number;
  outputFormat: string;
  formattedResult: any;
  lighthouseScore: number | undefined;
  elapsed: {
    minutes: number;
    seconds: number;
  };
}

/**
 * Export audit results to JSON file
 */
async function exportResultsToJson(
  website: string,
  results: any
): Promise<string> {
  try {
    const tmpDir = path.resolve(__dirname, "../../tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    const domain = new URL(website).hostname.replace(/^www\./, "");
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `${domain}-${timestamp}.json`;
    const filePath = path.join(tmpDir, filename);

    await fs.writeFile(filePath, JSON.stringify(results, null, 2), "utf-8");
    return filePath;
  } catch (error: any) {
    logger.error(`Failed to export results to JSON: ${error.message}`, error);
    throw error;
  }
}

/**
 * Run SEO audit
 */
export async function runAudit(options: AuditOptions): Promise<AuditResult> {
  const { website, outputFormat, doLighthouse, onProgress } = options;

  const timer = new Timer();

  // Initialize file logging
  await logger.initializeFileLogging(website);

  // Report progress
  const reportProgress = (progress: number, message: string) => {
    if (onProgress) {
      onProgress(progress, message);
    }
  };

  reportProgress(5, "Checking for sitemap");

  // Get sitemap
  logger.step("getSitemap", "Checking for sitemap");
  const smURL = await getSitemapUrl(website);

  let startUrls: string[] = [website];
  let smPages: string[] = [];

  if (smURL) {
    logger.info(`Sitemap found: ${smURL}`);
    smPages = await getUrlsFromSitemap(smURL);

    if (smPages.length > 0) {
      startUrls = smPages;
      logger.success(`Loaded ${smPages.length} URLs from sitemap`);
    } else {
      logger.warn("Sitemap is empty, falling back to homepage crawl");
      startUrls = [website];
    }
  } else {
    logger.info("No sitemap found. Crawling from homepage only.");
  }

  reportProgress(10, "Setting up SEO rules");

  // Setup Page-level SEO Rules
  logger.step("setupRules", "Setting up SEO rules");
  const pageRules: SEORule[] = [
    hasTitle,
    hasMetaDescription,
    hasHTTPS,
    hasMixedContent,
    has4xxErrors,
    has5xxErrors,
    hasRedirectLoops,
    titleTooLong,
  ];
  logger.info(`Configured ${pageRules.length} page-level rules`);

  // Setup Site-level Rules
  const siteRules: SiteRule[] = [hasRobotsTxt, hasSitemapXml, sitemapComplete];
  logger.info(`Configured ${siteRules.length} site-level rules`);

  const crawler = getAuditCrawler(pageRules);

  reportProgress(15, `Starting crawl with ${startUrls.length} start URL(s)`);

  // Start Crawling
  logger.info(`Starting crawl with ${startUrls.length} start URL(s)`);

  try {
    await crawler.run(startUrls);
    logger.success("Crawl completed successfully");
  } catch (err: any) {
    logger.error("Crawl failed", err);
    throw new Error(`Crawl failed: ${err.message}`);
  }

  reportProgress(70, "Processing crawl results");

  // Get Crawl Data
  logger.step("getData", "Retrieving crawl data from dataset");
  const pageData: ScrapedData[] = await Dataset.getData().then((data) =>
    data.items.map((item) => item as ScrapedData)
  );
  logger.info(`Retrieved ${pageData.length} pages from dataset`);

  reportProgress(75, "Calculating SEO scores");

  // Calculate Overall Score
  logger.step("calculateScore", "Calculating overall SEO score");
  const overallScore = calculateProportionalScore(pageData, pageRules);
  logger.success(`Overall SEO Score: ${overallScore}/100`);

  reportProgress(80, "Evaluating site-level rules");

  // Evaluate Site Rules
  logger.step("evaluateSiteRules", "Evaluating site-level rules");
  const siteRuleContext = {
    baseUrl: website,
    sitemapUrl: smURL || null,
    crawledUrls: smPages,
  };
  const siteReport = await evaluateSiteRules(siteRuleContext, siteRules);
  logger.info("Site-level rules evaluated");

  // Calculate Audit Metadata
  const totalUrls = pageData.length;
  const totalPages = pageData.filter((page) => isHtmlPage(page.urlType)).length;
  const indexedPages = pageData.filter((page) => page.isIndexable).length;

  logger.info(`Total URLs discovered: ${totalUrls}`);
  logger.info(`HTML pages: ${totalPages}`);
  logger.info(`Indexable pages: ${indexedPages}`);

  const startTime = new Date();
  const endTime = new Date();
  const elapsedTime = timer.getElapsedTime();
  const runtime = `${String(elapsedTime.minutes).padStart(2, "0")}:${String(
    elapsedTime.seconds
  ).padStart(2, "0")}:00:000`;

  const auditMeta = {
    runtime,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    status: AuditStatus.SUCCESS,
    total_urls: totalUrls,
    total_pages: totalPages,
    indexed_pages: indexedPages,
  };

  reportProgress(85, "Running Lighthouse audit");

  // Run Lighthouse if requested
  let lighthouseScore: number | undefined = undefined;
  if (doLighthouse) {
    logger.step("lighthouse", "Running Lighthouse audit");
    try {
      const lighthouseResult = await runLighthouse(website);
      // Use SEO score from Lighthouse
      lighthouseScore = lighthouseResult.seoScore
        ? Math.round(lighthouseResult.seoScore * 100)
        : undefined;
      logger.success(`Lighthouse SEO Score: ${lighthouseScore}/100`);
    } catch (err: any) {
      logger.warn(`Lighthouse audit failed: ${err.message}`);
    }
  }

  reportProgress(90, "Formatting results");

  // Format Results
  logger.step("formatResults", "Formatting audit results");
  let formattedResult: any;

  const format =
    outputFormat === "by-page" ? OutputFormat.BY_PAGE : OutputFormat.BY_RULE;

  if (format === OutputFormat.BY_PAGE) {
    formattedResult = formatByPage(
      website,
      auditMeta,
      overallScore,
      pageData,
      pageRules,
      siteReport
    );
  } else {
    formattedResult = formatByRule(
      website,
      auditMeta,
      overallScore,
      pageData,
      pageRules,
      siteReport
    );
  }

  reportProgress(95, "Exporting results");

  // Export results to JSON file
  logger.step("exportJSON", "Exporting results to JSON file");
  try {
    const exportPath = await exportResultsToJson(website, formattedResult);
    logger.success(`Results exported to: ${exportPath}`);
  } catch (error: any) {
    logger.warn(`Failed to export JSON file: ${error.message}`);
  }

  reportProgress(100, "Audit complete");

  const elapsed = timer.getElapsedTime();
  logger.success(`Audit completed in ${elapsed.minutes}m ${elapsed.seconds}s`);

  // Flush log buffer
  await logger.flushBuffer();

  return {
    website,
    overallScore,
    totalUrls,
    totalPages,
    indexedPages,
    outputFormat: format,
    formattedResult,
    lighthouseScore,
    elapsed,
  };
}
