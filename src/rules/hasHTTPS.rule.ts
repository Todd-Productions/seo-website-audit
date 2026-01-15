import { type SEORule } from "../types/rules.js";
import { rules } from "./rules.js";

export const hasHTTPS: SEORule = {
  ...rules.hasHTTPS,

  check: async (page) => {
    const url = page.url();

    if (url.startsWith("https://")) {
      return { success: true };
    }

    return { success: false, message: "Page is not using HTTPS" };
  },
};

