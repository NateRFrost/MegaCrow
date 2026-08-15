import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { highlightOperand } from "src/language-service/highlighting/helpers";
import type { SemanticToken } from "src/language-service/highlighting/types";

/**
 * Shared operand walk: member accessors, comparison ops, booleans.
 * Per-condition closed vocab still needs dedicated highlighters.
 */
export const highlightConditionParametersDefault = (
  out: SemanticToken[],
  statement: ConditionStatementNode
): void => {
  for (const operand of statement.operands) {
    highlightOperand(out, operand as ASTParameterNode);
  }
};
