import { type SEORule } from "../types/rules.js";
import { rules } from "./rules.js";

export const has4xxErrors: SEORule = {
  ...rules.has4xxErrors,

  check: async (page) => {
    // Get the response status from the page
    const response = page.context().pages()[0]?.url() === page.url() 
      ? await page.goto(page.url(), { waitUntil: "domcontentloaded" }).catch(() => null)
      : null;

    // Note: This rule is primarily checked via crawler's response handling
    // This is a fallback check
    const statusCode = response?.status();
    
    if (!statusCode) {
      return { success: true };
    }

    if (statusCode >= 400 && statusCode < 500) {
      return {
        success: false,
        message: `Page returned ${statusCode} client error`,
      };
    }

    return { success: true };
  },
};

