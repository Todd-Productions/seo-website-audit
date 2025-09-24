export const config = {
  maxRequests: parseInt(process.env.CRAWL_MAX_REQUESTS || "50", 10),
  concurrency: parseInt(process.env.CRAWL_MAX_CONCURRENCY || "5", 10),
};
