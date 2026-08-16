import { completeConditionDefault } from "src/language-service/completion/conditions/default";
import { completeIf } from "src/language-service/completion/conditions/if";
import { completeObjectIsType } from "src/language-service/completion/conditions/object_is_type";
import { completePlayerDied } from "src/language-service/completion/conditions/player_died";
import type {
  CompletionItem,
  ConditionCompleter,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

export type { ConditionCompleter };

const CONDITION_COMPLETERS: Record<string, ConditionCompleter> = {
  if: completeIf,
  object_is_type: completeObjectIsType,
  player_died: completePlayerDied,
};

/** Dispatch operand completion for a condition statement. */
export const completeConditionOperands = (
  ctx: ConditionCompletionContext
): CompletionItem[] => {
  const completer = CONDITION_COMPLETERS[ctx.statement.name.value];
  if (completer !== undefined) {
    return completer(ctx);
  }
  return completeConditionDefault(ctx);
};
