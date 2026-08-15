import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import { highlightConditionParametersDefault } from "src/language-service/highlighting/conditions/default";
import { highlightPlayerDied } from "src/language-service/highlighting/conditions/player_died";
import type { SemanticToken } from "src/language-service/highlighting/types";

export type ConditionParameterHighlighter = (
  out: SemanticToken[],
  statement: ConditionStatementNode
) => void;

/**
 * Per-condition overrides for operand highlighting.
 * Most conditions use {@link highlightConditionParametersDefault}.
 */
const CONDITION_PARAMETER_HIGHLIGHTERS: Record<
  string,
  ConditionParameterHighlighter
> = {
  player_died: highlightPlayerDied,
};

/** Dispatch parameter highlighting for a condition statement. */
export const highlightConditionParameters = (
  out: SemanticToken[],
  statement: ConditionStatementNode
): void => {
  const override = CONDITION_PARAMETER_HIGHLIGHTERS[statement.name.value];
  if (override !== undefined) {
    override(out, statement);
    return;
  }
  highlightConditionParametersDefault(out, statement);
};
