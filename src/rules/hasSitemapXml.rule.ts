import { type SiteRule } from "../types/rules.js";
import { rules } from "./rules.js";

export const hasSitemapXml: SiteRule = {
  ...rules.hasSitemapXml,

  check: async (context) => {
    if (context.sitemapUrl) {
      return { success: true };
    }
    return { success: false, message: "sitemap.xml not found" };
  },
};

