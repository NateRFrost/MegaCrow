import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import { KILLER_TYPE_KEYWORDS } from "src/frontend/language-configuration/omni/conditions";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `player_died <player> <killer_type>` */
export const highlightPlayerDied = (
  out: SemanticToken[],
  statement: ConditionStatementNode
): void => {
  const [player, killerType] = statement.operands;
  highlightStructural(out, player);
  highlightEnumKeyword(out, killerType, KILLER_TYPE_KEYWORDS);
};
