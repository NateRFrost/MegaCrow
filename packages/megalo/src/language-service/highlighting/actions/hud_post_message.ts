import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { megaloSound } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_sounds";
import {
  highlightEnumOrStructural,
  highlightStructural,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/** `hud_post_message <team_or_player_target> <sound> <dynamic_string>` */
export const highlightHudPostMessage = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  const i = highlightTeamOrPlayerTarget(out, p, 0);
  highlightEnumOrStructural(out, p[i], megaloSound);
  highlightStructural(out, p[i + 1]);
};
