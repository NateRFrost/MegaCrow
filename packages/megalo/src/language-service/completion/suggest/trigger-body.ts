import {
  suggestKeywords,
  withBlockEndSnippet,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TriggerBodyCompletionContext,
} from "src/language-service/completion/types";
import { hoverDocumentationForId } from "src/language-service/hover";

export const TRIGGER_BODY_KEYWORDS = [
  "action",
  "condition",
  "temporary",
  "begin",
  "end",
] as const;

/** Keywords that introduce a same-line continuation (name / operands). */
const TRIGGER_BODY_CONTINUE = new Set(["action", "condition", "temporary"]);

export const suggestTriggerBody = (
  ctx: TriggerBodyCompletionContext
): CompletionItem[] =>
  suggestKeywords(ctx, TRIGGER_BODY_KEYWORDS).map((entry) => {
    const documentation = hoverDocumentationForId("keyword", entry.label);
    const withDocs =
      documentation === undefined ? entry : { ...entry, documentation };
    if (withDocs.label === "begin") {
      return withBlockEndSnippet(withDocs);
    }
    if (TRIGGER_BODY_CONTINUE.has(withDocs.label)) {
      return withContinueCompletion(withDocs);
    }
    return withDocs;
  });
