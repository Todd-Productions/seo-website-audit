import axios from "axios";
import * as xml2js from "xml2js";

/**
 * Gets the sitemap URL for a given website
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
export async function getSitemapUrl(url: string): Promise<string | null> {
  const cleanUrl = url.endsWith("/") ? url.slice(0, -1) : url;
  const sitemapUrls = [
    `${cleanUrl}/sitemap.xml`,
    `${cleanUrl}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await axios.get(sitemapUrl);
      if (res.status === 200) return sitemapUrl;
    } catch (err) {
      // Ensure we log as string
      console.log(
        "Sitemap fetch failed:",
        err instanceof Error ? err.message : JSON.stringify(err)
      );
    }
  }

  return null;
}

/**
 * Get the URLs from a sitemap
 *
 * @param {string} sitemapUrl
 * @returns {Promise<string[]>}
 */
export const getUrlsFromSitemap = async (sitemapUrl: string) => {
  const res = await axios.get(sitemapUrl);
  return await parseSitemap(res.data);
};

/**
 * Parses a sitemap XML string
 *
 * @param {string} xml
 * @returns
 */
export async function parseSitemap(xml: string): Promise<string[]> {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  // Handle sitemap index or urlset
  if (result.urlset?.url) {
    return result.urlset.url.map((u: any) => u.loc[0]);
  } else if (result.sitemapindex?.sitemap) {
    return result.sitemapindex.sitemap.map((s: any) => s.loc[0]);
  }

  return [];
}
