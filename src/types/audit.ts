import { RuleLevel } from "./rules.js";

/**
 * Audit status enum
 */
export enum AuditStatus {
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  PENDING = "PENDING",
}

/**
 * Audit metadata
 */
export type AuditMeta = {
  runtime: string; // Format: HH:MM:SS:MS
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  status: AuditStatus;
};

/**
 * Error detail for a specific URL
 */
export type ErrorDetail = {
  url: string;
  message: string;
};

/**
 * Rule result in ByPage format
 */
export type RuleResultByPage = {
  rule: string;
  type: string; // ERROR, WARNING, NOTICE
  calc_weight: number;
  errors: ErrorDetail[];
};

/**
 * Page result in ByPage format
 */
export type PageResult = {
  url: string;
  score: number;
  rules: RuleResultByPage[];
};

/**
 * ByPage output format
 */
export type AuditResultByPage = {
  site: string;
  meta: AuditMeta;
  score: number;
  results: PageResult[];
};

/**
 * Rule result in ByRule format
 */
export type RuleResult = {
  rule: string;
  type: string; // ERROR, WARNING, NOTICE
  calc_weight: number;
  errors: ErrorDetail[];
};

/**
 * ByRule output format
 */
export type AuditResultByRule = {
  site: string;
  meta: AuditMeta;
  score: number;
  results: RuleResult[];
};

/**
 * Output format enum
 */
export enum OutputFormat {
  BY_PAGE = "BY_PAGE",
  BY_RULE = "BY_RULE",
}

/**
 * Helper to get RuleLevel name from value
 */
export function getRuleLevelName(level: RuleLevel): string {
  switch (level) {
    case RuleLevel.ERROR:
      return "ERROR";
    case RuleLevel.WARNING:
      return "WARNING";
    case RuleLevel.NOTICE:
      return "NOTICE";
    default:
      return "UNKNOWN";
  }
}
