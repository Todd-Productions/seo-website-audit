import { type SEORule } from "../types/rules.js";
import { rules } from "./rules.js";

const MAX_TITLE_LENGTH = 60;

export const titleTooLong: SEORule = {
  ...rules.titleTooLong,

  check: async (page) => {
    const title = await page.title();

    if (!title || title.length === 0) {
      return { success: true, message: "No title to check" };
    }

    if (title.length <= MAX_TITLE_LENGTH) {
      return { success: true };
    }

    return {
      success: false,
      message: `Title is ${title.length} characters (recommended: ${MAX_TITLE_LENGTH} or less)`,
    };
  },
};

