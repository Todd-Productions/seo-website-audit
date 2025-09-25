import { type SEORule } from "../types/rules.js";

import { rules } from "./rules.js";

export const hasTitle: SEORule = {
  ...rules.hasTitle,

  check: async (page) => {
    const title = await page.title();

    if (title && title.length > 0) return { success: true };

    return { success: false, message: "Missing title tag" };
  },
};
