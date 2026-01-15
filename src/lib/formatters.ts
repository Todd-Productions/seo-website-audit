import type {
  AuditResultByPage,
  AuditResultByRule,
  AuditMeta,
  PageResult,
  RuleResult,
  ErrorDetail,
  RuleResultByPage,
} from "../types/audit.js";
import { getRuleLevelName } from "../types/audit.js";
import type { ScrapedData } from "../types/scrape.js";
import type { Rule } from "../types/rules.js";
import type { SEOReport } from "../types/seo.js";

/**
 * Format audit results in "By Page" format
 * Groups results by URL with nested rule violations
 */
export function formatByPage(
  site: string,
  meta: AuditMeta,
  overallScore: number,
  pageData: ScrapedData[],
  pageRules: Rule[],
  siteReport?: SEOReport
): AuditResultByPage {
  const pageResults: PageResult[] = pageData.map((page) => {
    // Calculate page score
    let pageScore = 0;
    let maxPageScore = 0;

    const ruleResults: RuleResultByPage[] = pageRules.map((rule) => {
      const result = page.seoReport.results.find((r) => r.rule === rule.name);
      const weight = rule.level;
      maxPageScore += weight;

      const errors: ErrorDetail[] = [];
      if (result && !result.success) {
        errors.push({
          url: page.url,
          message: result.message || "Rule failed",
        });
      } else {
        pageScore += weight;
      }

      return {
        rule: rule.name,
        type: getRuleLevelName(rule.level),
        calc_weight: weight,
        errors,
      };
    });

    const calculatedPageScore =
      maxPageScore > 0 ? Math.round((pageScore / maxPageScore) * 100) : 100;

    return {
      url: page.url,
      score: calculatedPageScore,
      rules: ruleResults,
    };
  });

  // Add site-level rules as a special "site" page if they exist
  if (siteReport && siteReport.results.length > 0) {
    const siteRuleResults: RuleResultByPage[] = siteReport.results.map(
      (result) => {
        const errors: ErrorDetail[] = [];
        if (!result.success) {
          errors.push({
            url: site,
            message: result.message || "Rule failed",
          });
        }

        return {
          rule: result.rule,
          type: "WARNING", // Site rules are typically warnings
          calc_weight: 2,
          errors,
        };
      }
    );

    pageResults.unshift({
      url: `${site} (Site-wide)`,
      score: Math.round(siteReport.score),
      rules: siteRuleResults,
    });
  }

  return {
    site,
    meta,
    score: overallScore,
    results: pageResults,
  };
}

/**
 * Format audit results in "By Rule" format
 * Groups results by rule type with nested URL violations
 */
export function formatByRule(
  site: string,
  meta: AuditMeta,
  overallScore: number,
  pageData: ScrapedData[],
  pageRules: Rule[],
  siteReport?: SEOReport
): AuditResultByRule {
  const ruleResults: RuleResult[] = pageRules.map((rule) => {
    const errors: ErrorDetail[] = [];

    pageData.forEach((page) => {
      const result = page.seoReport.results.find((r) => r.rule === rule.name);
      if (result && !result.success) {
        errors.push({
          url: page.url,
          message: result.message || "Rule failed",
        });
      }
    });

    return {
      rule: rule.name,
      type: getRuleLevelName(rule.level),
      calc_weight: rule.level,
      errors,
    };
  });

  // Add site-level rules
  if (siteReport && siteReport.results.length > 0) {
    siteReport.results.forEach((result) => {
      const errors: ErrorDetail[] = [];
      if (!result.success) {
        errors.push({
          url: site,
          message: result.message || "Rule failed",
        });
      }

      ruleResults.push({
        rule: result.rule,
        type: "WARNING",
        calc_weight: 2,
        errors,
      });
    });
  }

  return {
    site,
    meta,
    score: overallScore,
    results: ruleResults,
  };
}

