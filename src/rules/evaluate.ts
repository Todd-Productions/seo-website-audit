import type { Page } from "playwright";

import { RuleLevel, type SeoRule } from "./rules.js";

/**
 * Evaluate a set of rules against a page
 *
 * @param {Page} page
 * @param {SeoRule[]} rules
 * @returns {Promise<{results: any[], weightedScore: number}>}
 */
export async function evaluate(page: Page, rules: SeoRule[]) {
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const rule of rules) {
    const result = await rule.check(page);
    results.push({ rule: rule.name, ...result });
    const weight = Number(RuleLevel[rule.level]);
    maxScore += weight;
    if (result.success) score += weight;
  }

  const weightedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return { results, weightedScore };
}
