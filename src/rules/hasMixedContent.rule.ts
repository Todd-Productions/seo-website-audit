import { type SEORule } from "../types/rules.js";
import { rules } from "./rules.js";

export const hasMixedContent: SEORule = {
  ...rules.hasMixedContent,

  check: async (page) => {
    const url = page.url();

    // Only check for mixed content on HTTPS pages
    if (!url.startsWith("https://")) {
      return { success: true, message: "Not an HTTPS page" };
    }

    // Check for HTTP resources (images, scripts, stylesheets, etc.)
    const httpResources = await page.evaluate(() => {
      const resources: string[] = [];

      // Check images
      document.querySelectorAll("img[src]").forEach((img) => {
        const src = (img as HTMLImageElement).src;
        if (src.startsWith("http://")) {
          resources.push(src);
        }
      });

      // Check scripts
      document.querySelectorAll("script[src]").forEach((script) => {
        const src = (script as HTMLScriptElement).src;
        if (src.startsWith("http://")) {
          resources.push(src);
        }
      });

      // Check stylesheets
      document.querySelectorAll("link[rel='stylesheet']").forEach((link) => {
        const href = (link as HTMLLinkElement).href;
        if (href.startsWith("http://")) {
          resources.push(href);
        }
      });

      return resources;
    });

    if (httpResources.length === 0) {
      return { success: true };
    }

    return {
      success: false,
      message: `Found ${httpResources.length} HTTP resource(s) on HTTPS page`,
    };
  },
};

