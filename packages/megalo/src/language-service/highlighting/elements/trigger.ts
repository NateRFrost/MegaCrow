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
import { isRootDocumentLocation } from "src/language-service/position";

/** Trigger kinds that mirror variable scopes / types (`variables player`, …). */
const VARIABLE_TYPE_TRIGGER_KINDS = new Set([
  "player",
  "random_player",
  "team",
  "object",
]);

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
  if (!isRootDocumentLocation(statement.location)) {
    return;
  }
  out.push({
    line: statement.location.start.line - 1,
    startChar: statement.location.start.column - 1,
    length: "begin".length,
    type: "keyword",
    modifiers: [],
  });
  highlightTriggerStatements(out, statement.statements);
};

const highlightForEach = (
  out: SemanticToken[],
  statement: ForEachStatementNode
): void => {
  emitKeywordRange(out, statement.location, statement.target.location);
  emitLocation(out, statement.target.location, "variable");
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
): SemanticTokenType => {
  if (hasSymbol) {
    // Object-filter labels (map_object) bind a symbol.
    return "variable";
  }
  if (VARIABLE_TYPE_TRIGGER_KINDS.has(name.toLowerCase())) {
    return "type";
  }
  // Event kinds: initialization, host_migration, …
  return "enumMember";
};

export const highlightTrigger = (
  out: SemanticToken[],
  element: TriggerElementNode
): void => {
  emitElementKeyword(out, element.keywordLocation);
  if (element.name.value.length > 0) {
    emitLocation(
      out,
      element.name.location,
      triggerNameTokenType(
        element.name.value,
        element.name.symbolId !== undefined
      )
    );
  }
  highlightTriggerStatements(out, element.statements);
};
