import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { bipedGiveWeaponMode } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightBipedGiveWeapon = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightStructural(out, p[1]);
  highlightEnumKeyword(out, p[2], bipedGiveWeaponMode);
};
