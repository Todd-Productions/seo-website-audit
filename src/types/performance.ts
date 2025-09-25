import type { RuleLevel } from "./rules.js";

type PageMetric = {
  url: string;
  value: boolean;
};

type BasePerformanceMetric = {
  name: string;
  level: RuleLevel;
};

type SitePerformanceMetric = BasePerformanceMetric & {
  value: boolean;
};

type SEOPerformanceMetric = BasePerformanceMetric & {
  pages: PageMetric[];
};

type PerformanceMetric = SitePerformanceMetric | SEOPerformanceMetric;

export {
  type BasePerformanceMetric,
  type PageMetric,
  type PerformanceMetric,
  type SEOPerformanceMetric,
  type SitePerformanceMetric,
};
