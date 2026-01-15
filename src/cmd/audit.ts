import { Dataset, log } from "crawlee";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { runLighthouse } from "../crawler/actions/lighthouse.js";
import {
  getSitemapUrl,
  getUrlsFromSitemap,
} from "../crawler/actions/sitemap.js";
import { getAuditCrawler } from "../crawler/audit.crawler.js";
import {
  calculateProportionalScore,
  evaluateSiteRules,
} from "../lib/evaluate.js";
import { formatByPage, formatByRule } from "../lib/formatters.js";
import { logger } from "../lib/logger.js";
import { Timer } from "../lib/timer.js";
import { isHtmlPage } from "../lib/urlClassifier.js";
import { promptForLighthouse } from "../prompts/lighthouse.prompt.js";
import { promptForOutputFormat } from "../prompts/outputFormat.prompt.js";
import { promptForWebsite } from "../prompts/website.prompt.js";

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

/**
 * Export audit results to JSON file
 * Creates tmp/ directory if it doesn't exist
 * Filename format: [domain]-[timestamp].json
 */
async function exportResultsToJson(
  website: string,
  results: any
): Promise<string> {
  try {
    // Create tmp directory if it doesn't exist
    const tmpDir = path.resolve(__dirname, "../../tmp");
    await fs.mkdir(tmpDir, { recursive: true });

    // Extract domain from website URL
    const domain = new URL(website).hostname.replace(/^www\./, "");

    // Create timestamp in ISO format, replacing colons with hyphens for filename
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];

    // Create filename: domain-timestamp.json
    const filename = `${domain}-${timestamp}.json`;
    const filePath = path.join(tmpDir, filename);

    // Write JSON file
    await fs.writeFile(filePath, JSON.stringify(results, null, 2), "utf-8");

    return filePath;
  } catch (error: any) {
    logger.error(`Failed to export results to JSON: ${error.message}`, error);
    throw error;
  }
}

(async () => {
  try {
    logger.info("=== SEO Website Audit Tool ===");
    logger.info(`Debug mode: ${logger.isDebugEnabled() ? "ON" : "OFF"}`);

    const website = await promptForWebsite();

    // Check if user cancelled the prompt
    if (!website) {
      console.log("\n👋 Audit cancelled by user");
      process.exit(0);
    }

    logger.info(`Target website: ${website}`);

    const outputFormat = await promptForOutputFormat();

    // Check if user cancelled the prompt
    if (!outputFormat) {
      console.log("\n👋 Audit cancelled by user");
      process.exit(0);
    }

    logger.info(
      `Output format: ${
        outputFormat === OutputFormat.BY_PAGE ? "By Page" : "By Rule"
      }`
    );

    const doLighthouse = await promptForLighthouse();

    // Check if user cancelled the prompt (doLighthouse can be false, so check for undefined)
    if (doLighthouse === undefined) {
      console.log("\n👋 Audit cancelled by user");
      process.exit(0);
    }

    logger.info(`Lighthouse audit: ${doLighthouse ? "Enabled" : "Disabled"}`);

    // Initialize file logging
    await logger.initializeFileLogging(website);

    const timer = new Timer();

    // Get sitemap
    logger.step("getSitemap", "Checking for sitemap");
    const smURL = await getSitemapUrl(website);

    // Starting variables
    let startUrls: string[] = [website];
    let smPages: string[] = [];

    // If website has a sitemap, use it; otherwise crawl from homepage
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
    const siteRules: SiteRule[] = [
      hasRobotsTxt,
      hasSitemapXml,
      sitemapComplete,
    ];
    logger.info(`Configured ${siteRules.length} site-level rules`);

    const crawler = getAuditCrawler(pageRules);

    // Start Crawling
    logger.info(`Starting crawl with ${startUrls.length} start URL(s)`);
    console.log(`🚀 Starting audit of ${website}...`);

    try {
      await crawler.run(startUrls);
      logger.success("Crawl completed successfully");
    } catch (err: any) {
      logger.error("Crawl failed", err);
      throw new Error(`Crawl failed: ${err.message}`);
    }

    // Get All Scraped Data
    logger.step("processResults", "Processing crawl results");
    const data = await Dataset.getData();
    const allData = data.items as ScrapedData[];
    logger.info(`Retrieved ${allData.length} items from dataset`);

    // Calculate URL and page counts
    const totalUrls = allData.length;
    const htmlPages = allData.filter((item) => isHtmlPage(item.urlType));
    const totalPages = htmlPages.length;
    const indexedPages = htmlPages.filter((item) => item.isIndexable).length;

    // Filter to only HTML pages for SEO evaluation
    const pageData = htmlPages;

    logger.success(`Discovered ${totalUrls} total URL(s)`);
    logger.info(`  - ${totalPages} HTML page(s)`);
    logger.info(`  - ${indexedPages} indexable page(s)`);
    logger.info(`  - ${totalUrls - totalPages} document(s) (PDFs, DOCs, etc.)`);

    console.log(`✅ Discovered ${totalUrls} total URL(s)`);
    console.log(`   - ${totalPages} HTML page(s)`);
    console.log(`   - ${indexedPages} indexable page(s)`);
    console.log(
      `   - ${totalUrls - totalPages} document(s) (PDFs, DOCs, etc.)`
    );

    // Evaluate Site-level Rules
    const crawledUrls = pageData.map((p) => p.url);
    const siteRuleContext = {
      baseUrl: website,
      sitemapUrl: smURL,
      crawledUrls,
    };

    const siteReport = await evaluateSiteRules(siteRuleContext, siteRules);

    // Run Lighthouse Audit (optional)
    if (doLighthouse) {
      console.log("🔍 Running Lighthouse audit...");
      const { seoScore, performanceScore, accessibilityScore } =
        await runLighthouse(website);
      console.log(`  SEO Score: ${seoScore}`);
      console.log(`  Performance Score: ${performanceScore}`);
      console.log(`  Accessibility Score: ${accessibilityScore}`);
    }

    // Calculate Overall Score
    const overallScore = calculateProportionalScore(
      pageData,
      pageRules,
      siteReport
    );

    // Create Audit Metadata
    const auditMeta = {
      runtime: timer.getFormattedRuntime(),
      start: timer.getStartTime(),
      end: timer.getCurrentTime(),
      status: AuditStatus.SUCCESS,
      total_urls: totalUrls,
      total_pages: totalPages,
      indexed_pages: indexedPages,
    };

    // Format Output
    let formattedResult;
    if (outputFormat === OutputFormat.BY_PAGE) {
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

    // Export results to JSON file
    logger.step("exportJSON", "Exporting results to JSON file");
    try {
      const exportPath = await exportResultsToJson(website, formattedResult);
      logger.success(`Results exported to: ${exportPath}`);
      console.log(`\n💾 Results saved to: ${exportPath}`);
    } catch (error: any) {
      logger.warn(`Failed to export JSON file: ${error.message}`);
      console.log(
        `\n⚠️  Warning: Could not save results to file (${error.message})`
      );
    }

    // Output Results
    console.log("\n" + "=".repeat(60));
    console.log(`📊 SEO Audit Results for ${website}`);
    console.log("=".repeat(60));
    console.log(`Overall Score: ${overallScore}/100`);
    console.log(`Total URLs Discovered: ${totalUrls}`);
    console.log(`HTML Pages: ${totalPages}`);
    console.log(`Indexable Pages: ${indexedPages}`);
    console.log(
      `Format: ${outputFormat === OutputFormat.BY_PAGE ? "By Page" : "By Rule"}`
    );
    console.log("=".repeat(60) + "\n");

    log.info(JSON.stringify(formattedResult, null, 2));

    const elapsed = timer.getElapsedTime();
    logger.success(
      `Audit completed in ${elapsed.minutes}m ${elapsed.seconds}s`
    );
    console.log(`\n🏁 Finished in ${elapsed.minutes}m ${elapsed.seconds}s`);

    // Flush log buffer to ensure all logs are written
    await logger.flushBuffer();

    // Show log file location
    const logFilePath = logger.getLogFilePath();
    if (logFilePath) {
      console.log(`📝 Log file saved to: ${logFilePath}`);
    }
  } catch (error: any) {
    logger.error("Fatal error during audit", error);
    console.error("\n❌ Audit failed with error:");
    console.error(error.message);
    if (logger.isDebugEnabled() && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }

    // Flush log buffer even on error
    await logger.flushBuffer();

    process.exit(1);
  }
})();
