import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { weaponSlot } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  highlightEnumKeyword,
  highlightOptionalEnum,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightBipedDropWeapon = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightEnumKeyword(out, p[1], weaponSlot);
  highlightOptionalEnum(out, p, 2, "delete_on_drop");
};
