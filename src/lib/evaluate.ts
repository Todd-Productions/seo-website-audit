import type { Page } from "playwright";

import type { PerformanceMetric } from "../types/performance.js";
import { type Rule, type SEORule } from "../types/rules.js";
import type { ScrapedData } from "../types/scrape.js";
import type { SEOReport } from "../types/seo.js";

/**
 * Evaluate a set of rules against a page
 *
 * @param {Page} page
 * @param {SEORule[]} rules
 * @returns {Promise<SEOReport>}
 */
export const evaluateSEORules = async (page: Page, rules: SEORule[]) => {
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const rule of rules) {
    const result = await rule.check(page);
    results.push({ rule: rule.name, ...result });
    const weight: number = rule.level;
    maxScore += weight;
    if (result.success) score += weight;
  }

  const weightedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const value: SEOReport = { results, score: weightedScore };
  return value;
};

/**
 * Converting SEO Rules to Performance Metrics
 *
 * @param {ScrapedData[]} data
 * @param {SeoRule[]} rules
 *
 * @returns {PerformanceMetric[]}
 */
export const evaluatePageMetrics = (
  data: ScrapedData[],
  rules: Rule[]
): PerformanceMetric[] => {
  return rules.map((rule) => {
    let passed = true;

    const pages = data
      .map((page) => {
        const result = page.seoReport.results.find((r) => r.rule === rule.name);
        if (!result) return undefined; // Skip if no result
        if (!result.success) passed = false;

        return {
          url: page.url,
          value: result.success,
        };
      })
      .filter((p): p is { url: string; value: boolean } => p !== undefined); // Remove undefined

    return {
      name: rule.name,
      level: rule.level,
      passed,
      pages,
    };
  });
};
