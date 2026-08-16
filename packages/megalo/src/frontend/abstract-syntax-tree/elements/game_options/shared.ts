import {
  type SourceCodeLocation,
  spanSourceCodeLocations,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  type ASTReferenceNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import { type Token, TokenKind } from "src/frontend/tokens";

export const isEndToken = (token: Token | undefined): boolean =>
  token?.kind === TokenKind.Identifier && token.value === "end";

export const locationSpan = spanSourceCodeLocations;

/**
 * Tokens that start (or close) the next `game_options` entry in the parent
 * production — FOLLOW set for entry operands. Not a claim that these names
 * are reserved globally; they just belong to the parent here.
 */
export const isGameOptionsEntryBoundary = (
  token: Token | undefined
): boolean => {
  if (token === undefined || token.kind !== TokenKind.Identifier) {
    return false;
  }
  switch (token.value) {
    case "end":
    case "override":
    case "option":
    case "ranged_option":
    case "player_traits":
    case "lock":
    case "hide":
      return true;
    default:
      return false;
  }
};

/**
 * True when `token` can be taken as an open identifier operand even though it
 * is also a parent boundary: LL(2) — another boundary still follows, so this
 * one can be the value (e.g. palette named `end` before the block `end`).
 */
export const canTakeBoundaryAsIdentifierOperand = (
  ctx: ParserContext,
  token: Token
): boolean =>
  isGameOptionsEntryBoundary(token) &&
  isGameOptionsEntryBoundary(ctx.peekToken(1));

export const parseIdentifier = (
  ctx: ParserContext,
  anchor: Token
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
  const token = ctx.getToken();
  if (token.kind === TokenKind.Identifier) {
    return {
      value: token.value,
      location: token.location,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedTokenKind(
      TokenKind.Identifier,
      token.kind,
      token.value
    ),
    token.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

const missingIdentifierAfter = (
  ctx: ParserContext,
  previousLocation: SourceCodeLocation,
  peek: Token | undefined
): ASTErrorNode => {
  const end =
    peek !== undefined &&
    peek.location.start.localOffset >= previousLocation.end.localOffset
      ? peek.location.start
      : previousLocation.end;
  const location: SourceCodeLocation = {
    type: previousLocation.type,
    start: previousLocation.end,
    end,
  };
  ctx.diagnostics.addError(
    diagnosticMessages.expectedTokenKind(
      TokenKind.Identifier,
      peek?.kind ?? TokenKind.None,
      peek?.value ?? ""
    ),
    location
  );
  return {
    kind: SyntaxKind.INVALID,
    location,
  };
};

/**
 * Required identifier operand inside a `game_options` entry.
 * Leaves parent FOLLOW tokens alone unless LL(2) shows this token is the value
 * (boundary followed by another boundary).
 */
export const parseGameOptionsIdentifierOperand = (
  ctx: ParserContext,
  previousLocation: SourceCodeLocation
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
  const peek = ctx.peekToken();
  if (!peek || peek.kind !== TokenKind.Identifier) {
    return missingIdentifierAfter(ctx, previousLocation, peek);
  }
  if (
    isGameOptionsEntryBoundary(peek) &&
    !canTakeBoundaryAsIdentifierOperand(ctx, peek)
  ) {
    return missingIdentifierAfter(ctx, previousLocation, peek);
  }
  const token = ctx.getToken();
  return {
    value: token.value,
    location: token.location,
  };
};

export const parseGameOptionReference = (
  ctx: ParserContext,
  nameToken: Token
): ASTReferenceNode | ASTErrorNode => {
  if (nameToken.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        nameToken.kind,
        nameToken.value
      ),
      nameToken.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: nameToken.location,
    };
  }

  const symbolId = ctx.symbolParser.lookupSymbol(nameToken.value);
  if (symbolId === undefined) {
    return {
      kind: SyntaxKind.INVALID,
      location: nameToken.location,
    };
  }

  ctx.symbolParser.recordReference(symbolId, nameToken.location);
  return {
    kind: SyntaxKind.REFERENCE,
    identifier: nameToken.value,
    symbolId,
    location: nameToken.location,
  };
};
