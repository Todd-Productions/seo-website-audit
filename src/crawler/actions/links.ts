import type { Page } from "playwright";

/**
 * Gather All Links On Page
 *
 * @param {Page} page
 * @returns {Promise<string[]>}
 */
export const gatherPageLinks = async (page: Page) => {
  const locator = await page.locator("a[href]");
  const linksFound = locator.evaluateAll((anchors) =>
    anchors
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((href) => !href.startsWith("mailto:") && !href.startsWith("tel:"))
  );

  return linksFound;
};
