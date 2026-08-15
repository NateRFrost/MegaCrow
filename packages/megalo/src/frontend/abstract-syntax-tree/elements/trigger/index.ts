import type { SourceCodeLocation, SourcePosition } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import {
  isEndToken,
  locationSpan,
} from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  type ActionStatementNode,
  parseAction,
} from "src/frontend/abstract-syntax-tree/elements/trigger/action";
import {
  type ConditionStatementNode,
  parseCondition,
} from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
import {
  parseTemporary,
  type TemporaryStatementNode,
} from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";
import {
  type ASTNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import { TRIGGER_EXECUTION_KINDS } from "src/frontend/language-configuration/omni/triggers";
import type { SymbolId } from "src/frontend/symbol-table";
import {
  normalizeTriggerHeader,
  type ParserScope,
  ParserScopeKind,
} from "src/frontend/symbol-table/scope";
import { type Token, TokenKind } from "src/frontend/tokens";

export {
  ActionParserRepository,
  type ActionStatementNode,
  parseAction,
  type TriggerActionStatementNode,
} from "src/frontend/abstract-syntax-tree/elements/trigger/action";
export {
  ConditionParserRepository,
  type ConditionStatementNode,
  parseCondition,
} from "src/frontend/abstract-syntax-tree/elements/trigger/condition";
export {
  parseTemporary,
  type TemporaryStatementNode,
  type TemporaryStorageName,
} from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";

export type BeginStatementNode = ASTNode<SyntaxKind.BEGIN> & {
  /**
   * Opening keyword span: bare `begin`, or `action begin` when written with
   * the optional `action` prefix.
   */
  keywordLocation: SourceCodeLocation;
  statements: TriggerStatementNode[];
};

export type ForEachStatementNode = ASTNode<SyntaxKind.FOR_EACH> & {
  target: {
    value: string;
    location: SourceCodeLocation;
    symbolId?: SymbolId;
  };
  statements: TriggerStatementNode[];
};

export type TriggerStatementNode =
  | ConditionStatementNode
  | ActionStatementNode
  | BeginStatementNode
  | TemporaryStatementNode
  | ForEachStatementNode;

export type TriggerElementNode = ASTElementBase<ElementKind.TRIGGER> & {
  name: {
    value: string;
    location: SourceCodeLocation;
    symbolId?: SymbolId;
  };
  statements: TriggerStatementNode[];
};

const lookupObjectFilterReference = (
  ctx: ParserContext,
  name: string,
  location: SourceCodeLocation
): SymbolId | undefined => {
  if (
    (TRIGGER_EXECUTION_KINDS as readonly string[]).includes(name.toLowerCase())
  ) {
    return;
  }

  const symbolId = ctx.symbolParser.lookupObjectFilter(name);
  if (symbolId !== undefined) {
    ctx.symbolParser.recordReference(symbolId, location);
  }
  return symbolId;
};

const withScope = <T extends { location: SourceCodeLocation }>(
  ctx: ParserContext,
  scope: ParserScope,
  fn: () => T,
  start?: SourcePosition
): T => {
  ctx.symbolParser.pushScope(scope, start);
  try {
    const result = fn();
    ctx.symbolParser.popScope(result.location.end);
    return result;
  } catch (error) {
    ctx.symbolParser.popScope();
    throw error;
  }
};

const isStatementKeyword = (
  token: Token | undefined,
  keyword: string
): boolean => token?.kind === TokenKind.Identifier && token.value === keyword;

const parseTriggerName = (
  ctx: ParserContext,
  anchor: Token
): TriggerElementNode["name"] => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return {
      value: "",
      location: anchor.location,
    };
  }

  const nameToken = ctx.getToken();
  return {
    value: nameToken.value,
    location: nameToken.location,
    symbolId: lookupObjectFilterReference(
      ctx,
      nameToken.value,
      nameToken.location
    ),
  };
};

export const parseTriggerStatements = (
  ctx: ParserContext
): TriggerStatementNode[] => {
  const statements: TriggerStatementNode[] = [];

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (!token) {
      break;
    }

    if (isEndToken(token)) {
      break;
    }

    if (isStatementKeyword(token, "condition")) {
      const conditionToken = ctx.getToken();
      statements.push(parseCondition(ctx, conditionToken));
      continue;
    }

    if (isStatementKeyword(token, "action")) {
      const actionToken = ctx.getToken();
      statements.push(parseAction(ctx, actionToken));
      continue;
    }

    if (isStatementKeyword(token, "begin")) {
      const beginToken = ctx.getToken();
      statements.push(parseBegin(ctx, beginToken));
      continue;
    }

    if (isStatementKeyword(token, "temporary")) {
      const temporaryToken = ctx.getToken();
      statements.push(parseTemporary(ctx, temporaryToken));
      continue;
    }

    ctx.diagnostics.addError(
      diagnosticMessages.unknownTriggerStatement(token.value),
      token.location
    );
    ctx.getToken();
  }

  return statements;
};

const parseScopedTriggerBody = (
  ctx: ParserContext,
  openLocation: SourceCodeLocation
): { statements: TriggerStatementNode[]; location: SourceCodeLocation } => {
  const statements = parseTriggerStatements(ctx);

  const endToken = ctx.peekToken();
  if (isEndToken(endToken)) {
    const consumedEnd = ctx.getToken();
    return {
      statements,
      location: locationSpan(openLocation, consumedEnd.location),
    };
  }

  const lastStatement = statements.at(-1);
  const endLocation: SourceCodeLocation =
    lastStatement?.location ?? openLocation;
  return {
    statements,
    location: locationSpan(openLocation, endLocation),
  };
};

export const parseBegin = (
  ctx: ParserContext,
  openToken: Token,
  keywordLocation: SourceCodeLocation = openToken.location
): BeginStatementNode =>
  withScope(
    ctx,
    { kind: ParserScopeKind.Block },
    () => {
      const { statements, location } = parseScopedTriggerBody(
        ctx,
        openToken.location
      );
      return {
        kind: SyntaxKind.BEGIN,
        keywordLocation,
        statements,
        location,
      };
    },
    openToken.location.start
  );

const parseForEachTarget = (
  ctx: ParserContext,
  anchor: Token
): ForEachStatementNode["target"] | undefined => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return;
  }

  const targetToken = ctx.getToken();
  return {
    value: targetToken.value,
    location: targetToken.location,
    symbolId: lookupObjectFilterReference(
      ctx,
      targetToken.value,
      targetToken.location
    ),
  };
};

export const parseForEach = (
  ctx: ParserContext,
  actionToken: Token
): ForEachStatementNode => {
  const target = parseForEachTarget(ctx, actionToken);

  return withScope(
    ctx,
    {
      kind: ParserScopeKind.Trigger,
      trigger: normalizeTriggerHeader(target?.value ?? ""),
    },
    () => {
      const { statements, location } = parseScopedTriggerBody(
        ctx,
        actionToken.location
      );

      return {
        kind: SyntaxKind.FOR_EACH,
        target: target ?? { value: "", location: actionToken.location },
        statements,
        location,
      };
    },
    actionToken.location.start
  );
};

export const triggerParser = (
  ctx: ParserContext,
  elementToken: Token
): TriggerElementNode => {
  const name = parseTriggerName(ctx, elementToken);

  const maybeBegin = ctx.peekToken();
  if (isStatementKeyword(maybeBegin, "begin")) {
    ctx.getToken();
  }

  return withScope(
    ctx,
    {
      kind: ParserScopeKind.Trigger,
      trigger: normalizeTriggerHeader(name.value),
    },
    () => {
      const statements = parseTriggerStatements(ctx);

      const endToken = ctx.peekToken();
      if (endToken === undefined) {
        ctx.diagnostics.addWarning(
          diagnosticMessages.expectedEndBeforeEof(),
          elementToken.location
        );
        const lastStatement = statements.at(-1);
        const endLocation = lastStatement?.location ?? name.location;
        return {
          kind: SyntaxKind.ELEMENT,
          elementKind: ElementKind.TRIGGER,
          keywordLocation: elementToken.location,
          name,
          statements,
          location: locationSpan(elementToken.location, endLocation),
        };
      }

      const consumedEnd = ctx.getToken();
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.TRIGGER,
        keywordLocation: elementToken.location,
        name,
        statements,
        location: locationSpan(elementToken.location, consumedEnd.location),
      };
    },
    elementToken.location.start
  );
};
