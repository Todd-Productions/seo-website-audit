import { getSitemapUrl, getUrlsFromSitemap } from "../lib/sitemap.js";
import { promptForWebsite } from "../prompts/website.prompt.js";

(async () => {
  const website = await promptForWebsite();
  const smURL = await getSitemapUrl(website);

  // TODO: Use this to compare to actual pages
  let smPages = [];

  // If website has a sitemap
  if (smURL) {
    smPages = await getUrlsFromSitemap(smURL);
    console.log(smPages);
  }

  // Testing
  console.log({ website });
  console.log({ smURL });
})();
