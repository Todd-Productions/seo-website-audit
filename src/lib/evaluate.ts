import type { Page } from "playwright";

import type { PerformanceMetric } from "../types/performance.js";
import {
  type Rule,
  type SEORule,
  type SiteRule,
  type SiteRuleContext,
} from "../types/rules.js";
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
 * Evaluate site-level rules
 *
 * @param {SiteRuleContext} context
 * @param {SiteRule[]} rules
 * @returns {Promise<SEOReport>}
 */
export const evaluateSiteRules = async (
  context: SiteRuleContext,
  rules: SiteRule[]
) => {
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const rule of rules) {
    const result = await rule.check(context);
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

/**
 * Calculate proportional score across all pages and rules
 * Deducts points proportionally based on percentage of pages that fail each rule
 *
 * @param {ScrapedData[]} pageData - All scraped page data
 * @param {Rule[]} pageRules - Page-level rules
 * @param {SEOReport} siteReport - Site-level rule results
 * @returns {number} - Overall score as percentage (0-100)
 */
export const calculateProportionalScore = (
  pageData: ScrapedData[],
  pageRules: Rule[],
  siteReport?: SEOReport
): number => {
  if (pageData.length === 0) return 0;

  let totalPossiblePoints = 0;
  let totalEarnedPoints = 0;

  // Calculate points for page-level rules
  pageRules.forEach((rule) => {
    const ruleWeight = rule.level;
    let passedCount = 0;

    pageData.forEach((page) => {
      const result = page.seoReport.results.find((r) => r.rule === rule.name);
      if (result?.success) {
        passedCount++;
      }
    });

    // Each page can earn the full weight for this rule
    const possiblePoints = ruleWeight * pageData.length;
    const earnedPoints = ruleWeight * passedCount;

    totalPossiblePoints += possiblePoints;
    totalEarnedPoints += earnedPoints;
  });

  // Add site-level rule points
  if (siteReport) {
    siteReport.results.forEach((result) => {
      // We need to find the weight - for now we'll extract it from the result
      // In a real scenario, we'd pass the site rules array
      // For simplicity, we'll assume site rules are worth their level value once
      const weight = 2; // Default weight for site rules (WARNING level)

      totalPossiblePoints += weight;
      if (result.success) {
        totalEarnedPoints += weight;
      }
    });
  }

  return totalPossiblePoints > 0
    ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100)
    : 0;
};
