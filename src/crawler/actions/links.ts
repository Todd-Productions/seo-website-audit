import type { Page } from "playwright";

import { logger } from "../../lib/logger.js";

/**
 * Image file extensions to exclude from crawling
 * These URLs point to image files, not HTML pages
 */
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
  ".ico",
  ".avif",
];

/**
 * Check if a URL points to an image file
 * Handles query parameters (e.g., image.jpg?v=123)
 * Case-insensitive matching
 */
const isImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    // If URL parsing fails, check the raw string
    const lowerUrl = url.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => {
      // Check if URL ends with extension or has extension followed by query params
      return (
        lowerUrl.endsWith(ext) ||
        lowerUrl.includes(ext + "?") ||
        lowerUrl.includes(ext + "#")
      );
    });
  }
};

/**
 * Gather All Links On Page
 *
 * @param {Page} page
 * @param {boolean} onlyUnique - Remove duplicate links
 * @returns {Promise<string[]>}
 */
export const gatherPageLinks = async (page: Page, onlyUnique = true) => {
  const locator = await page.locator("a[href]");
  const linksFound = await locator.evaluateAll((anchors) =>
    anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => !href.startsWith("mailto:") && !href.startsWith("tel:"))
  );

  // Filter out image URLs
  const nonImageLinks = linksFound.filter((href) => {
    if (isImageUrl(href)) {
      logger.debug(`Excluding image URL from crawl queue: ${href}`);
      return false;
    }
    return true;
  });

  const imageCount = linksFound.length - nonImageLinks.length;
  if (imageCount > 0) {
    logger.debug(`Filtered out ${imageCount} image URL(s) from page links`);
  }

  const uniqueLinks = Array.from(new Set(nonImageLinks));
  return onlyUnique ? uniqueLinks : nonImageLinks;
};
