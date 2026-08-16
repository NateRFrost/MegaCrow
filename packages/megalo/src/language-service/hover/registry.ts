import { renderContributionMarkdown } from "src/language-service/hover/render";
import type {
  HoverContribution,
  HoverContributionKind,
} from "src/language-service/hover/types";

const contributions = new Map<string, HoverContribution>();

const keyFor = (kind: HoverContributionKind, id: string): string =>
  `${kind}:${id}`;

export const registerHover = (contribution: HoverContribution): void => {
  contributions.set(keyFor(contribution.kind, contribution.id), contribution);
};

export const registerHovers = (entries: readonly HoverContribution[]): void => {
  for (const entry of entries) {
    registerHover(entry);
  }
};

export const lookupHoverContribution = (
  kind: HoverContributionKind,
  id: string
): HoverContribution | undefined => contributions.get(keyFor(kind, id));

/** Markdown documentation for completions / hover by registry id. */
export const hoverDocumentationForId = (
  kind: HoverContributionKind,
  id: string
): string | undefined => {
  const contribution = lookupHoverContribution(kind, id);
  if (contribution === undefined) {
    return;
  }
  return renderContributionMarkdown(contribution);
};

interface HoverStructure {
  grammar?: string;
  params?: readonly string[];
}

export const defineActionHover = (
  id: string,
  structure: HoverStructure = {}
): HoverContribution => ({ kind: "action", id, ...structure });

export const defineConditionHover = (
  id: string,
  structure: HoverStructure = {}
): HoverContribution => ({ kind: "condition", id, ...structure });

export const defineElementHover = (
  id: string,
  structure: HoverStructure = {}
): HoverContribution => ({ kind: "element", id, ...structure });

export const defineKeywordHover = (
  id: string,
  structure: HoverStructure = {}
): HoverContribution => ({ kind: "keyword", id, ...structure });

/** Element-body property/keyword; `id` should be `elementName.paramName`. */
export const defineParamHover = (
  id: string,
  structure: HoverStructure = {}
): HoverContribution => ({ kind: "param", id, ...structure });
