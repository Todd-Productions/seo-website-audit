import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath, quiet: true });

export const config = {
  maxRequests: parseInt(process.env.CRAWL_MAX_REQUESTS || "500", 10),
  concurrency: parseInt(process.env.CRAWL_MAX_CONCURRENCY || "5", 10),
};
