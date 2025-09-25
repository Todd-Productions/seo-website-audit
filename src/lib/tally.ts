// TODO: This code is used for scoring the websites

import type { SeoRule } from "../rules/rules.js";

export type PageMetric = {
  url: string;
  value: number;
};

/**
 * Interface for overall scoring
 */
export type PerformanceMetric = {
  name: string;
  value: number;
} & (
  | {
      value: boolean;
    }
  | {
      pages: PageMetric[];
    }
);

export const getSEOPerformanceMetrics = (
  seoRules: SeoRule[]
): PerformanceMetric[] => {
  // TODO: Implement SEO Performance Metrics
  return [];
};

export const tally = () => {
  // TODO: Implement tally logic
};
