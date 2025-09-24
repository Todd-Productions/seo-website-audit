import { Dataset } from "crawlee";
import { getAuditCrawler } from "../crawler/audit.crawler.js";
import { getSitemapUrl, getUrlsFromSitemap } from "../lib/sitemap.js";
import { promptForWebsite } from "../prompts/website.prompt.js";

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

  // Get All Scraped Data
  console.log(await Dataset.getData());
})();
