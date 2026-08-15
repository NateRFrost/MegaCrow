import { actionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { filterByPrefix } from "src/language-service/completion/helpers";
import type {
  ActionNameCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const suggestActionNames = (
  ctx: ActionNameCompletionContext
): CompletionItem[] =>
  filterByPrefix(
    actionType.acceptedNames
      .filter((name) => !actionType.isDeprecated(name))
      .map((label) => ({
        label,
        kind: "function" as const,
        sortText: label,
        detail: "action",
      })),
    ctx.prefix.text
  );
