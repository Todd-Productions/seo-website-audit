import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

/**
 * Run Lighthouse Audit on a page
 *
 * @param {string} url
 * @returns
 */
export const runLighthouse = async (url: string) => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });

  const result = await lighthouse(url, {
    logLevel: "info",
    output: "json",
    onlyCategories: ["performance", "seo", "accessibility"],
    port: chrome.port,
  });

  await chrome.kill();

  const categories = result?.lhr.categories;
  const seoScore = categories?.seo?.score;
  const performanceScore = categories?.performance?.score;
  const accessibilityScore = categories?.accessibility?.score;

  return {
    seoScore: seoScore || undefined,
    performanceScore: performanceScore || undefined,
    accessibilityScore: accessibilityScore || undefined,
  };
};
