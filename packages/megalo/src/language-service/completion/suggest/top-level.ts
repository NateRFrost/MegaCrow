import {
  snippetTabstop,
  suggestKeywords,
  withBlockEndSnippet,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TopLevelCompletionContext,
} from "src/language-service/completion/types";
import { hoverDocumentationForId } from "src/language-service/hover";

/** Top-level element keywords (parser registry names). */
export const TOP_LEVEL_KEYWORDS = [
  "base",
  "include",
  "localized_include",
  "string_table",
  "constants",
  "variables",
  "game_options",
  "hud_widgets",
  "loadout",
  "loadout_palette",
  "teams",
  "engine_data",
  "player_rating",
  "map_permissions",
  "game_stats",
  "map_object",
  "requisition_palette",
  "trigger",
] as const;

/** Directives that do not open an `end`-closed block. */
const TOP_LEVEL_WITHOUT_END = new Set(["base", "include", "localized_include"]);

/** Block elements that take a required same-line name / scope before the body. */
const TOP_LEVEL_NAMED_HEADER: Record<string, string> = {
  trigger: snippetTabstop(1, "general"),
  variables: snippetTabstop(1, "global"),
  loadout: snippetTabstop(1, "name"),
  loadout_palette: snippetTabstop(1, "name"),
  map_object: snippetTabstop(1, "name"),
  requisition_palette: snippetTabstop(1, "name"),
  string_table: snippetTabstop(1, "english"),
};

export const suggestTopLevel = (
  ctx: TopLevelCompletionContext
): CompletionItem[] =>
  suggestKeywords(ctx, TOP_LEVEL_KEYWORDS).map((entry) => {
    const documentation =
      hoverDocumentationForId("element", entry.label) ??
      hoverDocumentationForId("keyword", entry.label);
    const withDocs =
      documentation === undefined ? entry : { ...entry, documentation };
    if (TOP_LEVEL_WITHOUT_END.has(withDocs.label)) {
      return withContinueCompletion(withDocs);
    }
    const headerSuffix = TOP_LEVEL_NAMED_HEADER[withDocs.label];
    if (headerSuffix !== undefined) {
      return withBlockEndSnippet(withDocs, headerSuffix);
    }
    return withBlockEndSnippet(withDocs);
  });
