import {
  type ASTErrorNode,
  isAstErrorNode,
} from "../../abstract-syntax-tree";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { LowerError } from "../error";

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
