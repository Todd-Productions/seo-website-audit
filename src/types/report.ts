import type { PerformanceMetric } from "./performance.js";

type Report = {
  score: number;
  performance: PerformanceMetric[];
  numberOfPages: number;
  numberOfLinks: number;
  avgPageLoadTime: number;
  didLighthouseRun: boolean;
  reportRunTime: number;
  reportGeneratedAt: Date;
};

export { type Report };
