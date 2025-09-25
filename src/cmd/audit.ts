import { Dataset } from "crawlee";

import { hasMetaDescription } from "src/rules/hasMetaDescription.rule.js";
import { hasTitle } from "src/rules/hasTitle.rule.js";
import { runLighthouse } from "../crawler/actions/lighthouse.js";
import {
  getSitemapUrl,
  getUrlsFromSitemap,
} from "../crawler/actions/sitemap.js";
import { getAuditCrawler } from "../crawler/audit.crawler.js";
import { promptForLighthouse } from "../prompts/lighthouse.prompt.js";
import { promptForWebsite } from "../prompts/website.prompt.js";

(async () => {
  const website = await promptForWebsite();
  const doLighthouse = await promptForLighthouse();
  const smURL = await getSitemapUrl(website); // TODO: Use the null value as a weighted score

  // Starting variables
  let startUrls: string[] = [website];
  let smPages = [];

  // If website has a sitemap
  if (smURL) {
    smPages = await getUrlsFromSitemap(smURL);
    startUrls = smPages.length ? smPages : [website];
  }

  // Setup Crawler with SEO Rules
  const crawler = getAuditCrawler([hasTitle, hasMetaDescription]);

  // Start Crawling
  await crawler.run(startUrls);

  // Get All Scraped Data
  const data = await Dataset.getData();

  // Run Lighthouse Audit
  if (doLighthouse) {
    // TODO: Finish this... only running on page now
    const { seoScore, performanceScore, accessibilityScore } =
      await runLighthouse(website);
    console.log(`SEO Score: ${seoScore}`);
    console.log(`Performance Score: ${performanceScore}`);
    console.log(`Accessibility Score: ${accessibilityScore}`);
  }

  // Compile Output (with scores)
})();
