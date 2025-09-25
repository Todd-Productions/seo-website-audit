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

export { RuleLevel, type Rule, type SEORule };
