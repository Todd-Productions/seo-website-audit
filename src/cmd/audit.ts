import { Dataset, log } from "crawlee";

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

(async () => {
  const website = await promptForWebsite();
  const outputFormat = await promptForOutputFormat();
  const doLighthouse = await promptForLighthouse();
  const smURL = await getSitemapUrl(website);

  const timer = new Timer();

  // Starting variables
  let startUrls: string[] = [website];
  let smPages: string[] = [];

  // If website has a sitemap, use it; otherwise crawl from homepage
  if (smURL) {
    smPages = await getUrlsFromSitemap(smURL);
    startUrls = smPages.length ? smPages : [website];
  } else {
    console.log("No sitemap found. Crawling from homepage only.");
  }

  // Setup Page-level SEO Rules
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

  // Setup Site-level Rules
  const siteRules: SiteRule[] = [hasRobotsTxt, hasSitemapXml, sitemapComplete];

  const crawler = getAuditCrawler(pageRules);

  // Start Crawling
  console.log(`🚀 Starting audit of ${website}...`);
  await crawler.run(startUrls);

  // Get All Scraped Data
  const data = await Dataset.getData();
  const allData = data.items as ScrapedData[];

  // Calculate URL and page counts
  const totalUrls = allData.length;
  const htmlPages = allData.filter((item) => isHtmlPage(item.urlType));
  const totalPages = htmlPages.length;
  const indexedPages = htmlPages.filter((item) => item.isIndexable).length;

  // Filter to only HTML pages for SEO evaluation
  const pageData = htmlPages;

  console.log(`✅ Discovered ${totalUrls} total URL(s)`);
  console.log(`   - ${totalPages} HTML page(s)`);
  console.log(`   - ${indexedPages} indexable page(s)`);
  console.log(`   - ${totalUrls - totalPages} document(s) (PDFs, DOCs, etc.)`);

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
  console.log(`\n🏁 Finished in ${elapsed.minutes}m ${elapsed.seconds}s`);
})();
