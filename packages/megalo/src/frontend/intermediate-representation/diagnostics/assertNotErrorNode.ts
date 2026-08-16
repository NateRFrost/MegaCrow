import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  isAstErrorNode,
} from "src/frontend/abstract-syntax-tree";
import { LowerError } from "src/frontend/intermediate-representation/error";

export function assertNotErrorNode<T extends { location: SourceCodeLocation }>(
  node: T
): asserts node is Exclude<T, ASTErrorNode> {
  if (isAstErrorNode(node)) {
    throw new LowerError(
      diagnosticMessages.expectedOneOf(["identifier"], "invalid"),
      node.location
    );
  }
}
