import { promptForWebsite } from "../prompts/website.prompt.js";

(async () => {
  const website = await promptForWebsite();
  console.log(website);
})();
