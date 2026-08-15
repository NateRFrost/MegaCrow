import { suggestKeywords } from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TopLevelCompletionContext,
} from "src/language-service/completion/types";

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

export const suggestTopLevel = (
  ctx: TopLevelCompletionContext
): CompletionItem[] => suggestKeywords(ctx, TOP_LEVEL_KEYWORDS);
