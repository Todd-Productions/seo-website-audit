import type { Page } from "playwright";

enum RuleLevel {
  ERROR = 3,
  WARNING = 2,
  NOTICE = 1,
}

type Rule = {
  name: string;
  level: RuleLevel;
};

type SEORule = Rule & {
  check: (page: Page) => Promise<{ success: boolean; message?: string }>;
};

/**
 * Site-level rule context
 */
type SiteRuleContext = {
  baseUrl: string;
  sitemapUrl: string | null;
  crawledUrls: string[];
};

/**
 * Site-level rule (runs once per audit)
 */
type SiteRule = Rule & {
  check: (
    context: SiteRuleContext
  ) => Promise<{ success: boolean; message?: string }>;
};

export {
  RuleLevel,
  type Rule,
  type SEORule,
  type SiteRule,
  type SiteRuleContext,
};
