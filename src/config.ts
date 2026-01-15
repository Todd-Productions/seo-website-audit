import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath, quiet: true });

export const config = {
  // Crawl limits
  maxRequests: parseInt(process.env.CRAWL_MAX_REQUESTS || "100", 10), // Reduced default from 500
  concurrency: parseInt(process.env.CRAWL_MAX_CONCURRENCY || "3", 10), // Reduced default from 5

  // Timeout settings (in milliseconds)
  navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || "30000", 10), // 30 seconds
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "30000", 10), // 30 seconds
  sitemapTimeout: parseInt(process.env.SITEMAP_TIMEOUT || "15000", 10), // 15 seconds

  // Retry settings
  maxRetries: parseInt(process.env.MAX_RETRIES || "2", 10),

  // Debug mode
  debug: process.env.DEBUG === "true",

  // Performance optimizations
  blockResources: process.env.BLOCK_RESOURCES !== "false", // Default: true (block images, fonts, media)
  blockImages: process.env.BLOCK_IMAGES !== "false", // Default: true
  blockStylesheets: process.env.BLOCK_STYLESHEETS === "true", // Default: false (CSS might affect SEO)
  blockFonts: process.env.BLOCK_FONTS !== "false", // Default: true
  blockMedia: process.env.BLOCK_MEDIA !== "false", // Default: true (videos, audio)

  // Wait strategy for page loads
  // Options: "load" (full load), "domcontentloaded" (faster), "networkidle" (wait for network)
  waitUntil: (process.env.WAIT_UNTIL || "domcontentloaded") as
    | "load"
    | "domcontentloaded"
    | "networkidle",
};
