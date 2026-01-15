import type { Page } from "playwright";

/**
 * Check if a page has a noindex directive
 * Checks both meta robots tag and X-Robots-Tag header
 *
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} - True if page has noindex directive
 */
export async function hasNoIndexDirective(page: Page): Promise<boolean> {
  // Check meta robots tag
  const metaRobots = await page
    .locator('meta[name="robots"]')
    .getAttribute("content")
    .catch(() => null);

  if (metaRobots) {
    const contentLower = metaRobots.toLowerCase();
    if (contentLower.includes("noindex")) {
      return true;
    }
  }

  // Check for googlebot-specific meta tag
  const metaGooglebot = await page
    .locator('meta[name="googlebot"]')
    .getAttribute("content")
    .catch(() => null);

  if (metaGooglebot) {
    const contentLower = metaGooglebot.toLowerCase();
    if (contentLower.includes("noindex")) {
      return true;
    }
  }

  return false;
}

/**
 * Determine if a page is likely to be indexed by search engines
 * Considers noindex directives, HTTP status codes, and other factors
 *
 * @param {boolean} hasNoIndex - Whether page has noindex directive
 * @param {number | undefined} statusCode - HTTP status code
 * @returns {boolean} - True if page is likely indexed
 */
export function isPageIndexable(
  hasNoIndex: boolean,
  statusCode: number | undefined
): boolean {
  // If page has noindex, it's not indexable
  if (hasNoIndex) {
    return false;
  }

  // If no status code available, assume not indexable
  if (!statusCode) {
    return false;
  }

  // Only 2xx and 3xx status codes are indexable
  // 4xx and 5xx errors are not indexable
  if (statusCode >= 400) {
    return false;
  }

  // Page is likely indexable
  return true;
}

/**
 * Get indexability status details for reporting
 *
 * @param {boolean} hasNoIndex - Whether page has noindex directive
 * @param {number | undefined} statusCode - HTTP status code
 * @returns {object} - Indexability status details
 */
export function getIndexabilityStatus(
  hasNoIndex: boolean,
  statusCode: number | undefined
): {
  isIndexable: boolean;
  reason?: string;
} {
  if (hasNoIndex) {
    return {
      isIndexable: false,
      reason: "Page has noindex directive",
    };
  }

  if (!statusCode) {
    return {
      isIndexable: false,
      reason: "No status code available",
    };
  }

  if (statusCode >= 400 && statusCode < 500) {
    return {
      isIndexable: false,
      reason: `Client error (${statusCode})`,
    };
  }

  if (statusCode >= 500) {
    return {
      isIndexable: false,
      reason: `Server error (${statusCode})`,
    };
  }

  return {
    isIndexable: true,
  };
}

