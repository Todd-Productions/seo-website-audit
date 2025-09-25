import type { Page } from "playwright";

export enum RuleLevel {
  ERROR = 3,
  WARNING = 2,
  NOTICE = 1,
}

export type SeoRule = {
  name: string;
  level: RuleLevel;
  check: (page: Page) => Promise<{ success: boolean; message?: string }>;
};

/**
 * Centralize list of rules here
 */
export const rules = {
  hasTitle: {
    name: "has_title_tag",
    level: RuleLevel.ERROR,
  },
  hasMetaDescription: {
    name: "has_description_tag",
    level: RuleLevel.ERROR,
  },
};
