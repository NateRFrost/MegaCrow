import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { boundaryShape } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  highlightEnumKeyword,
  highlightStructural,
  highlightTrailingOptionals,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const BOUNDARY_DIMENSION_KEYWORDS = [
  "width",
  "radius",
  "length",
  "depth",
  "neg_height",
  "pos_height",
  "height",
] as const;

/** `set_boundary <object> <shape> [width|radius|…]` */
export const highlightSetBoundary = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightEnumKeyword(out, p[1], boundaryShape);
  highlightTrailingOptionals(out, p, 2, BOUNDARY_DIMENSION_KEYWORDS);
};
