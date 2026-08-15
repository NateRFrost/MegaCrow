import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { loadoutPaletteType } from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import {
  highlightEnumKeyword,
  highlightTeamOrPlayerTarget,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

export const highlightSetLoadoutPalette = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  const i = highlightTeamOrPlayerTarget(out, p, 0);
  highlightEnumKeyword(out, p[i], loadoutPaletteType);
};
