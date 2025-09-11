import { Dataset, PlaywrightCrawler } from "crawlee";

// Main entry point for the application
(async () => {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 50,
    maxConcurrency: 10,

    // Processes each of the crawled pages
    async requestHandler({ request, page, enqueueLinks, log }) {
      const title = await page.title();
      log.info(`Title of ${request.loadedUrl}: ${title}`);

      // Save results as JSON to ./storage/datasets/default
      await Dataset.pushData({ title, url: request.loadedUrl });

      // Extract links from the current page
      // and add them to the crawling queue
      await enqueueLinks();
    },
  });

  // Add URL to crawl
  await crawler.run(["https://www.stantoncreativemedia.com"]);
})();
