import axios from "axios";
import * as xml2js from "xml2js";
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";

/**
 * Gets the sitemap URL for a given website
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
export async function getSitemapUrl(url: string): Promise<string | null> {
  logger.step("getSitemapUrl", `Checking for sitemap at ${url}`);

  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
  const sitemapUrls = [
    `${cleanUrl}/sitemap.xml`,
    `${cleanUrl}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      logger.debug(`Trying sitemap URL: ${sitemapUrl}`);

      const res = await axios.get(sitemapUrl, {
        timeout: config.sitemapTimeout,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0; +https://github.com)",
        },
        maxRedirects: 5,
      });

      if (res.status === 200) {
        logger.success(`Found sitemap at: ${sitemapUrl}`);
        return sitemapUrl;
      }
    } catch (err: any) {
      logger.debug(`Sitemap not found at ${sitemapUrl}: ${err.message}`);
      // Continue to next URL
    }
  }

  logger.info("No sitemap found");
  return null;
}

/**
 * Get the URLs from a sitemap
 *
 * @param {string} sitemapUrl
 * @returns {Promise<string[]>}
 */
export const getUrlsFromSitemap = async (
  sitemapUrl: string
): Promise<string[]> => {
  logger.step("getUrlsFromSitemap", `Fetching URLs from ${sitemapUrl}`);

  try {
    const res = await axios.get(sitemapUrl, {
      timeout: config.sitemapTimeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0; +https://github.com)",
      },
      maxRedirects: 5,
    });

    const urls = await parseSitemap(res.data);
    logger.success(`Parsed ${urls.length} URLs from sitemap`);

    // Limit URLs if sitemap is too large
    if (urls.length > config.maxRequests) {
      logger.warn(
        `Sitemap contains ${urls.length} URLs, limiting to ${config.maxRequests}`
      );
      return urls.slice(0, config.maxRequests);
    }

    return urls;
  } catch (err: any) {
    logger.error(`Failed to fetch sitemap: ${err.message}`, err);
    return [];
  }
};

/**
 * Parses a sitemap XML string
 *
 * @param {string} xml
 * @returns
 */
export async function parseSitemap(xml: string): Promise<string[]> {
  logger.step("parseSitemap", "Parsing sitemap XML");

  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    // Handle sitemap index or urlset
    if (result.urlset?.url) {
      const urls = result.urlset.url.map((u: any) => u.loc[0]);
      logger.debug(`Found ${urls.length} URLs in urlset`);
      return urls;
    } else if (result.sitemapindex?.sitemap) {
      const sitemapUrls = result.sitemapindex.sitemap.map((s: any) => s.loc[0]);
      logger.debug(`Found ${sitemapUrls.length} sitemaps in sitemap index`);

      // If it's a sitemap index, fetch all child sitemaps
      logger.info(
        `Sitemap index detected, fetching ${sitemapUrls.length} child sitemaps...`
      );
      const allUrls: string[] = [];

      for (const sitemapUrl of sitemapUrls) {
        try {
          logger.debug(`Fetching child sitemap: ${sitemapUrl}`);
          const childUrls = await getUrlsFromSitemap(sitemapUrl);
          allUrls.push(...childUrls);

          // Stop if we've reached the max requests limit
          if (allUrls.length >= config.maxRequests) {
            logger.warn(
              `Reached max requests limit (${config.maxRequests}), stopping sitemap parsing`
            );
            break;
          }
        } catch (err: any) {
          logger.warn(
            `Failed to fetch child sitemap ${sitemapUrl}: ${err.message}`
          );
          // Continue with other sitemaps
        }
      }

      logger.success(
        `Collected ${allUrls.length} total URLs from sitemap index`
      );
      return allUrls;
    }

    logger.warn("Sitemap XML does not contain urlset or sitemapindex");
    return [];
  } catch (err: any) {
    logger.error(`Failed to parse sitemap XML: ${err.message}`, err);
    return [];
  }
}
