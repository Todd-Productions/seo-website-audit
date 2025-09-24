import type { Page } from "playwright";

export type SeoRule = {
  name: string;
  weight: number;
  check: (page: Page) => Promise<{ success: boolean; message?: string }>;
};

/**
 * Evaluate a set of rules against a page
 *
 * @param {Page} page
 * @param {SeoRule[]} rules
 * @returns {Promise<{results: any[], weightedScore: number}>}
 */
export async function evaluateRules(page: Page, rules: SeoRule[]) {
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const rule of rules) {
    const result = await rule.check(page);
    results.push({ rule: rule.name, ...result });
    maxScore += rule.weight;
    if (result.success) score += rule.weight;
  }

  const weightedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return { results, weightedScore };
}
