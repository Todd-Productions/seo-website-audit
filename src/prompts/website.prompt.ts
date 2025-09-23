import prompts from "prompts";

import { getFullUrlWithProtocol } from "../lib/http.js";
import { getUrlStatus } from "../lib/url.js";

export async function promptForWebsite() {
  let { website } = await prompts({
    type: "text",
    name: "website",
    message: "Enter the website URL",
  });

  // Strip HTTP or HTTPS if present
  if (website.startsWith("http://")) {
    website = website.replace("http://", "");
  } else if (website.startsWith("https://")) {
    website = website.replace("https://", "");
  }

  // Get Proper HTTP or HTTPS protocol
  website = await getFullUrlWithProtocol(website);

  // Check the website status
  const status = await getUrlStatus(website);

  // Redirecting Website
  if (status.isRedirect) {
    let { redirect } = await prompts({
      type: "confirm",
      name: "redirect",
      message: `The website redirects to ${status.location}. Do you want to continue?`,
    });

    // Not Redirecting
    if (!redirect) {
      console.error("Cancelled");
      process.exit(0);
    }

    return status.location;
  }

  return website;
}
