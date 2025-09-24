import dotenv from "dotenv";
import path from "path";

import { getAuditCrawler } from "../crawler/audit.crawler.js";
import { getSitemapUrl, getUrlsFromSitemap } from "../lib/sitemap.js";
import { promptForWebsite } from "../prompts/website.prompt.js";

// Initialize Environment Variables
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

(async () => {
  const website = await promptForWebsite();
  const smURL = await getSitemapUrl(website); // TODO: Use the null value as a weighted score

  // Starting variables
  let startUrls: string[] = [website];
  let smPages = [];

  // If website has a sitemap
  if (smURL) {
    smPages = await getUrlsFromSitemap(smURL);
    startUrls = smPages.length ? smPages : [website];
  }

  // Setup Crawler
  const crawler = getAuditCrawler([]);

  // Start Crawling
  await crawler.run(startUrls);

  // Compare Crawled Pages To Sitemap URLs
  console.log(await crawler.getRequestQueue());
  //   const crawledPages = await crawler.getRequestQueue();
})();
