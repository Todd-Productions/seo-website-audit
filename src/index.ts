import { Dataset, PlaywrightCrawler } from "crawlee";

// Main entry point for the application
(async () => {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 50,
    maxConcurrency: 10,

    // Processes each of the crawled pages
    async requestHandler({ request, page, enqueueLinks }) {
      const title = await page.title();

      // Save results as JSON to ./storage/datasets/default
      await Dataset.pushData({
        title,
        url: request.loadedUrl,
        headers: request.headers,
      });

      // Extract links from the current page
      // and add them to the crawling queue
      await enqueueLinks();
    },

    // Failed Request Handler
    async failedRequestHandler({ request, error }) {
      await Dataset.pushData({
        url: request.loadedUrl,
        error,
      });
    },
  });

  // Add URL to crawl
  await crawler.run(["https://www.toddproductions.com"]);

  // Accessing the dataset
  const data = await Dataset.getData();
  data.items.forEach((item) => {
    console.log({ item });
  });
})();
