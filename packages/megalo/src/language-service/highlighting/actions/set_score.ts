import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  highlightOperatorKeyword,
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `set_score <math_operation> <value> <team_or_player_target>` */
export const highlightSetScore = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightOperatorKeyword(out, p[0]);
  highlightStructural(out, p[1]);
  highlightTeamOrPlayerTarget(out, p, 2);
};
