// seo-crawler.ts
import axios from "axios";
import { Dataset, PlaywrightCrawler } from "crawlee";
import type { Page } from "playwright";
import * as xml2js from "xml2js";

// --------------------
// 1. Sitemap Utilities
// --------------------
async function findSitemap(url: string): Promise<string | null> {
  const sitemapUrls = [`${url}/sitemap.xml`, `${url}/sitemap_index.xml`];
  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await axios.get(sitemapUrl);
      if (res.status === 200) return sitemapUrl;
    } catch (err) {
      // Ensure we log as string
      console.log(
        "Sitemap fetch failed:",
        err instanceof Error ? err.message : JSON.stringify(err)
      );
    }
  }
  return null;
}

async function parseSitemapXml(xml: string): Promise<string[]> {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xml);

  // Handle sitemap index or urlset
  if (result.urlset?.url) {
    return result.urlset.url.map((u: any) => u.loc[0]);
  } else if (result.sitemapindex?.sitemap) {
    return result.sitemapindex.sitemap.map((s: any) => s.loc[0]);
  }
  return [];
}

// --------------------
// 2. SEO Rule System
// --------------------
export type SeoRule = {
  name: string;
  weight: number;
  check: (page: Page) => Promise<{ success: boolean; message?: string }>;
};

// Example rules
const titleRule: SeoRule = {
  name: "Title Tag",
  weight: 3,
  check: async (page) => {
    const title = await page.title();
    if (title && title.length > 0) return { success: true };
    return { success: false, message: "Missing title tag" };
  },
};

const metaDescriptionRule: SeoRule = {
  name: "Meta Description",
  weight: 2,
  check: async (page) => {
    const description = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content"))
      .catch(() => null);
    if (description) return { success: true };
    return { success: false, message: "Missing meta description" };
  },
};

const seoRules: SeoRule[] = [titleRule, metaDescriptionRule];

// --------------------
// 3. Rule Evaluation
// --------------------
async function evaluateRules(page: any, rules: SeoRule[]) {
  let score = 0;
  let maxScore = 0;
  const results = [];

  for (const rule of rules) {
    const result = await rule.check(page);
    results.push({ rule: rule.name, ...result });
    maxScore += rule.weight;
    if (result.success) score += rule.weight;
  }

  const weightedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return { results, weightedScore };
}

// --------------------
// 4. Main Crawler
// --------------------
(async () => {
  const baseUrl = "https://www.toddproductions.com";

  // 4a. Try to discover sitemap
  let startUrls: string[] = [baseUrl];
  const sitemapUrl = await findSitemap(baseUrl);
  if (sitemapUrl) {
    console.log(`Found sitemap: ${sitemapUrl}`);
    const res = await axios.get(sitemapUrl);
    const urlsFromSitemap = await parseSitemapXml(res.data);
    startUrls = urlsFromSitemap.length ? urlsFromSitemap : [baseUrl];
  }

  // 4b. Initialize crawler
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 50,
    maxConcurrency: 5,
    async requestHandler({ request, page, enqueueLinks }) {
      const seoReport = await evaluateRules(page, seoRules);

      await Dataset.pushData({
        url: request.loadedUrl,
        seoReport,
      });

      // enqueue internal links
      await enqueueLinks();
    },
    async failedRequestHandler({ request, error }) {
      await Dataset.pushData({
        url: request.loadedUrl,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
    },
  });

  // 4c. Start crawling
  await crawler.run(startUrls);

  // 4d. Output dataset
  const data = await Dataset.getData();
  data.items.forEach((item) => {
    console.log(JSON.stringify(item, null, 2));
  });
})();
