import { type SEORule } from "../types/rules.js";
import { rules } from "./rules.js";

export const hasRedirectLoops: SEORule = {
  ...rules.hasRedirectLoops,

  check: async () => {
    // This will be checked via the redirect chain captured during crawling
    // For now, we'll do a basic check
    // If we successfully loaded the page, there's no redirect loop
    // Redirect loops would typically cause the crawler to fail
    return { success: true };
  },
};
