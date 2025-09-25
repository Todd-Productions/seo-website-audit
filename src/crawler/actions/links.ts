import type { Page } from "playwright";

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
  const uniqueLinks = Array.from(new Set(linksFound));
  return onlyUnique ? uniqueLinks : linksFound;
};
