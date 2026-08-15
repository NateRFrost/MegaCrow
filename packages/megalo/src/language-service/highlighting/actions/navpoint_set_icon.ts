import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  highlightEnumKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/**
 * Local closed vocab — not shared with IR because of special cases:
 * - `num` takes a following custom number variable
 * - `coop spawning` is a joined multi-word keyword (Megalo Headache #3)
 */
const NAVPOINT_ICON_KEYWORDS = [
  "none",
  "speaker",
  "dead_teammate",
  "unused",
  "target",
  "destination",
  "bomb",
  "flag",
  "skull",
  "king",
  "vip",
  "lock",
  "num",
  "ordnance",
  "interface",
  "recon",
  "ammunition",
  "recover",
  "defend",
  "neutralize",
  "coop spawning",
] as const;

/**
 * `navpoint_set_icon <object> <icon>`
 * `navpoint_set_icon <object> num <number>`
 * `navpoint_set_icon <object> coop spawning` (extension)
 */
export const highlightNavpointSetIcon = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);
  highlightEnumKeyword(out, p[1], NAVPOINT_ICON_KEYWORDS);
  const icon = p[1];
  if (
    icon !== undefined &&
    icon.kind === SyntaxKind.KEYWORD &&
    icon.value === "num"
  ) {
    highlightStructural(out, p[2]);
  }
};
