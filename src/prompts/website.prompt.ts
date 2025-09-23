import prompts from "prompts";

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

  return website;
}
