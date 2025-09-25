import { rules, type SeoRule } from "./rules.js";

export const hasTitle: SeoRule = {
  ...rules.hasTitle,

  check: async (page) => {
    const title = await page.title();

    if (title && title.length > 0) return { success: true };

    return { success: false, message: "Missing title tag" };
  },
};
