import type {
  BeginStatementNode,
  ForEachStatementNode,
  TriggerElementNode,
  TriggerStatementNode,
} from "src/frontend/abstract-syntax-tree/elements/trigger";
import type { ActionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import type { ConditionStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import type { TemporaryStatementNode } from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { TRIGGER_EXECUTION_KINDS } from "src/frontend/language-configuration/omni/triggers";
import { highlightActionParameters } from "src/language-service/highlighting/actions";
import { highlightConditionParameters } from "src/language-service/highlighting/conditions";
import {
  emitElementKeyword,
  emitKeywordRange,
  emitLocation,
} from "src/language-service/highlighting/emit";
import { highlightOperand } from "src/language-service/highlighting/helpers";
import type {
  SemanticToken,
  SemanticTokenType,
} from "src/language-service/highlighting/types";

/** Trigger kinds that mirror variable scopes / types (`variables player`, …). */
const VARIABLE_TYPE_TRIGGER_KINDS = new Set([
  "player",
  "random_player",
  "team",
  "object",
]);

const TRIGGER_EXECUTION_KIND_SET = new Set<string>(TRIGGER_EXECUTION_KINDS);

const highlightAction = (
  out: SemanticToken[],
  statement: ActionStatementNode
): void => {
  if (statement.name.value === "") {
    emitLocation(out, statement.location, "keyword");
    return;
  }
  emitKeywordRange(out, statement.location, statement.name.location);
  emitLocation(out, statement.name.location, "function");
  highlightActionParameters(out, statement);
};

const highlightCondition = (
  out: SemanticToken[],
  statement: ConditionStatementNode
): void => {
  if (statement.name.value === "") {
    emitLocation(out, statement.location, "keyword");
    return;
  }
  emitKeywordRange(out, statement.location, statement.name.location);
  if (statement.notLocation !== undefined) {
    emitLocation(out, statement.notLocation, "keyword");
  }
  emitLocation(out, statement.name.location, "function");
  highlightConditionParameters(out, statement);
  if (statement.orLocation !== undefined) {
    emitLocation(out, statement.orLocation, "keyword");
  }
};

const highlightBegin = (
  out: SemanticToken[],
  statement: BeginStatementNode
): void => {
  emitLocation(out, statement.keywordLocation, "keyword");
  highlightTriggerStatements(out, statement.statements);
};

const highlightForEach = (
  out: SemanticToken[],
  statement: ForEachStatementNode
): void => {
  emitKeywordRange(out, statement.location, statement.target.location);
  if (statement.target.value.length > 0) {
    const tokenType = triggerNameTokenType(
      statement.target.value,
      statement.target.symbolId !== undefined
    );
    if (tokenType !== undefined) {
      emitLocation(out, statement.target.location, tokenType);
    }
  }
  highlightTriggerStatements(out, statement.statements);
};

const highlightTemporary = (
  out: SemanticToken[],
  statement: TemporaryStatementNode
): void => {
  emitKeywordRange(out, statement.location, statement.storage.location);
  emitLocation(out, statement.storage.location, "type");
  emitLocation(out, statement.name.location, "variable", ["declaration"]);
  highlightOperand(out, statement.initial as ASTParameterNode);
};

const highlightTriggerStatements = (
  out: SemanticToken[],
  statements: TriggerStatementNode[]
): void => {
  for (const statement of statements) {
    switch (statement.kind) {
      case SyntaxKind.ACTION:
        highlightAction(out, statement);
        break;
      case SyntaxKind.CONDITION:
        highlightCondition(out, statement);
        break;
      case SyntaxKind.BEGIN:
        highlightBegin(out, statement);
        break;
      case SyntaxKind.FOR_EACH:
        highlightForEach(out, statement);
        break;
      case SyntaxKind.TEMPORARY:
        highlightTemporary(out, statement);
        break;
    }
  }
};

const triggerNameTokenType = (
  name: string,
  hasSymbol: boolean
): SemanticTokenType | undefined => {
  if (hasSymbol) {
    // Object-filter labels (map_object) bind a symbol.
    return "variable";
  }
  const lower = name.toLowerCase();
  if (VARIABLE_TYPE_TRIGGER_KINDS.has(lower)) {
    return "type";
  }
  if (TRIGGER_EXECUTION_KIND_SET.has(lower)) {
    // Event kinds: initialization, host_migration, …
    return "enumMember";
  }
  return;
};

export const highlightTrigger = (
  out: SemanticToken[],
  element: TriggerElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (element.name.value.length > 0) {
    const tokenType = triggerNameTokenType(
      element.name.value,
      element.name.symbolId !== undefined
    );
    if (tokenType !== undefined) {
      emitLocation(out, element.name.location, tokenType);
    }
  }
  highlightTriggerStatements(out, element.statements);
};
