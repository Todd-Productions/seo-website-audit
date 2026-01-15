import { type SiteRule } from "../types/rules.js";
import { getUrlsFromSitemap } from "../crawler/actions/sitemap.js";
import { rules } from "./rules.js";

export const sitemapComplete: SiteRule = {
  ...rules.sitemapComplete,

  check: async (context) => {
    if (!context.sitemapUrl) {
      return { success: true, message: "No sitemap to check" };
    }

    try {
      const sitemapUrls = await getUrlsFromSitemap(context.sitemapUrl);
      const sitemapSet = new Set(
        sitemapUrls.map((url) => url.replace(/\/$/, ""))
      );
      const crawledSet = new Set(
        context.crawledUrls.map((url) => url.replace(/\/$/, ""))
      );

      const missingUrls: string[] = [];
      crawledSet.forEach((url) => {
        if (!sitemapSet.has(url)) {
          missingUrls.push(url);
        }
      });

      if (missingUrls.length === 0) {
        return { success: true };
      }

      return {
        success: false,
        message: `${missingUrls.length} crawled page(s) not in sitemap: ${missingUrls.slice(0, 3).join(", ")}${missingUrls.length > 3 ? "..." : ""}`,
      };
    } catch (err) {
      return {
        success: false,
        message: "Failed to validate sitemap completeness",
      };
    }
  },
};

