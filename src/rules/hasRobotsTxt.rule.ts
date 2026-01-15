import axios from "axios";
import { type SiteRule } from "../types/rules.js";
import { rules } from "./rules.js";

export const hasRobotsTxt: SiteRule = {
  ...rules.hasRobotsTxt,

  check: async (context) => {
    const cleanUrl = context.baseUrl.endsWith("/")
      ? context.baseUrl.slice(0, -1)
      : context.baseUrl;
    const robotsUrl = `${cleanUrl}/robots.txt`;

    try {
      const res = await axios.get(robotsUrl, { timeout: 5000 });
      if (res.status === 200) {
        return { success: true };
      }
      return { success: false, message: "robots.txt not found" };
    } catch (err) {
      return { success: false, message: "robots.txt not found" };
    }
  },
};

