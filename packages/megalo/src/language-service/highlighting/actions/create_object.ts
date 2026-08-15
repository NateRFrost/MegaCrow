import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  highlightEnumKeyword,
  highlightParameterKeyword,
  highlightStructural,
} from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

const PARAMETER_INTRODUCERS = new Set([
  "at",
  "set",
  "offset",
  "label",
  "variant",
]);

const CREATE_OBJECT_FLAG_KEYWORDS = [
  "never_garbage",
  "suppress_effect",
  "absolute_orientation",
] as const;

/**
 * `create_object <type> [at …] [set …] [offset …] [label …] [variant …]
 *   [never_garbage] [suppress_effect] [absolute_orientation]`
 */
export const highlightCreateObject = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  const p = statement.parameters;
  highlightStructural(out, p[0]);

  for (let i = 1; i < p.length; i++) {
    const node = p[i]!;
    if (node.kind !== SyntaxKind.KEYWORD) {
      highlightStructural(out, node);
      continue;
    }

    if (PARAMETER_INTRODUCERS.has(node.value)) {
      highlightParameterKeyword(out, node);
      if (node.value === "variant") {
        const value = p[i + 1];
        if (value === undefined) {
          continue;
        }
        i += 1;
        highlightStructural(out, value);
      }
      continue;
    }
    highlightEnumKeyword(out, node, CREATE_OBJECT_FLAG_KEYWORDS);
  }
};
