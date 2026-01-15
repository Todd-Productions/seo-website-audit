import { RuleLevel } from "../types/rules.js";

/**
 * Centralize list of rules here
 */
export const rules = {
  // Page-level rules
  hasTitle: {
    name: "has_title_tag",
    level: RuleLevel.ERROR,
  },
  hasMetaDescription: {
    name: "has_description_tag",
    level: RuleLevel.ERROR,
  },
  hasHTTPS: {
    name: "has_https",
    level: RuleLevel.ERROR,
  },
  hasMixedContent: {
    name: "has_mixed_content",
    level: RuleLevel.WARNING,
  },
  has4xxErrors: {
    name: "has_4xx_errors",
    level: RuleLevel.ERROR,
  },
  has5xxErrors: {
    name: "has_5xx_errors",
    level: RuleLevel.ERROR,
  },
  hasRedirectLoops: {
    name: "has_redirect_loops",
    level: RuleLevel.ERROR,
  },
  titleTooLong: {
    name: "title_too_long",
    level: RuleLevel.WARNING,
  },

  // Site-level rules
  hasRobotsTxt: {
    name: "has_robots_txt",
    level: RuleLevel.WARNING,
  },
  hasSitemapXml: {
    name: "has_sitemap_xml",
    level: RuleLevel.WARNING,
  },
  sitemapComplete: {
    name: "sitemap_complete",
    level: RuleLevel.NOTICE,
  },
};
