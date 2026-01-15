import prompts from "prompts";
import { OutputFormat } from "../types/audit.js";

export async function promptForOutputFormat(): Promise<OutputFormat> {
  const { format } = await prompts({
    type: "select",
    name: "format",
    message: "Choose output format:",
    choices: [
      {
        title: "By Page - Groups results by URL with nested rule violations",
        value: OutputFormat.BY_PAGE,
      },
      {
        title: "By Rule - Groups results by rule type with nested URL violations",
        value: OutputFormat.BY_RULE,
      },
    ],
    initial: 0,
  });

  return format || OutputFormat.BY_PAGE;
}

