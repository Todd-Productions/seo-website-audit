import prompts from "prompts";

export async function promptForLighthouse() {
  let { lighthouse } = await prompts({
    type: "confirm",
    name: "lighthouse",
    message: "Do you want to run a Lighthouse audit? (This may take a while)",
  });

  return lighthouse.toString() === "true";
}
