import { type SEORule } from "../types/rules.js";

import { rules } from "./rules.js";

export const hasMetaDescription: SEORule = {
  ...rules.hasMetaDescription,

  check: async (page) => {
    const description = await page
      .locator('meta[name="description"]')
      .evaluate((el) => el.getAttribute("content"))
      .catch(() => null);

    if (description) return { success: true };

    return { success: false, message: "Missing meta description" };
  },
};
