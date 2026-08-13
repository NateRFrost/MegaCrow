import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { diagnosticMessages } from "src/diagnostics/messages";
import { LowerError } from "src/frontend/intermediate-representation/error";

type ASTParameterNodeOfKind<K extends SyntaxKind> = Extract<
  ASTParameterNode,
  { kind: K }
>;

const syntaxKindName = (kind: SyntaxKind): string => {
  const name = SyntaxKind[kind];
  return typeof name === "string" ? name.toLowerCase() : String(kind);
};

function assertSyntaxKind<K extends SyntaxKind>(
  parameter: ASTParameterNode,
  kind: K
): asserts parameter is ASTParameterNodeOfKind<K>;
function assertSyntaxKind<K extends SyntaxKind>(
  parameter: ASTParameterNode,
  kinds: readonly K[]
): asserts parameter is ASTParameterNodeOfKind<K>;
function assertSyntaxKind(
  parameter: ASTParameterNode,
  kinds: SyntaxKind | readonly SyntaxKind[]
): asserts parameter is ASTParameterNode {
  const allowed = Array.isArray(kinds) ? kinds : [kinds];
  if (allowed.includes(parameter.kind)) {
    return;
  }
  throw new LowerError(
    diagnosticMessages.expectedOneOf(
      allowed.map((k) => `'${syntaxKindName(k)}'`),
      syntaxKindName(parameter.kind)
    ),
    parameter.location
  );
}

export { assertSyntaxKind };
