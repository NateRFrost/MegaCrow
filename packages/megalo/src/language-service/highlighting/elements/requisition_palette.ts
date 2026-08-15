import type { RequisitionPaletteElementNode } from "src/frontend/abstract-syntax-tree/elements/requisition_palette";
import { emitElementKeyword } from "src/language-service/highlighting/emit";
import { highlightEnumKeyword } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const REQUISITION_BASELINE_KEYWORDS = ["enabled", "disabled"] as const;
const REQUISITION_ITEM_STATE_KEYWORDS = [
  "available",
  "unavailable",
  "disabled",
] as const;

export const highlightRequisitionPalette = (
  out: SemanticToken[],
  element: RequisitionPaletteElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (element.baseline !== undefined) {
    highlightEnumKeyword(out, element.baseline, REQUISITION_BASELINE_KEYWORDS);
  }
  for (const item of element.items) {
    highlightEnumKeyword(out, item.state, REQUISITION_ITEM_STATE_KEYWORDS);
  }
};
