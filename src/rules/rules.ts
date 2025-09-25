import { RuleLevel } from "../types/rules.js";

/**
 * Centralize list of rules here
 */
export const rules = {
  hasTitle: {
    name: "has_title_tag",
    level: RuleLevel.ERROR,
  },
  hasMetaDescription: {
    name: "has_description_tag",
    level: RuleLevel.ERROR,
  },
};
