import {
  type ASTErrorNode,
  isAstErrorNode,
} from "src/frontend/abstract-syntax-tree";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";

type NamedNode = { value: string; location: SourceCodeLocation };

export function assertNotErrorNode(
  node: NamedNode | ASTErrorNode
): asserts node is NamedNode {
  if (isAstErrorNode(node)) {
    throw new LowerError(
      diagnosticMessages.expectedOneOf(["identifier"], "invalid"),
      node.location
    );
  }
}
