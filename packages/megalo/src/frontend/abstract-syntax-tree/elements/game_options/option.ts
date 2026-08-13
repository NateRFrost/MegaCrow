import { diagnosticMessages } from "../../../../diagnostics/messages";
import { VariableType } from "../../../symbol-table";
import { type Token, TokenKind } from "../../../tokens";
import { SyntaxKind } from "../..";
import type { ParserContext } from "../../context";
import {
  parseStringLiteralOrReference,
  stringLiteralOrReferenceLocation,
} from "../../parameters/string_literal_or_reference";
import { parseIntegerInitialValue } from "../constants";
import { isEndToken, locationSpan } from "./shared";
import {
  GameOptionEntryKind,
  type GameOptionModifiers,
  type UserDefinedOptionNode,
  type UserDefinedOptionOverrideNode,
  type UserDefinedOptionValueNode,
} from "./types";

const parseUserDefinedOptionValue = (
  ctx: ParserContext,
  ranged: boolean,
  anchor: Token
): UserDefinedOptionValueNode => {
  const value = parseIntegerInitialValue(ctx, anchor);
  if (ranged) {
    return {
      value,
      location: value.location,
    };
  }

  const name = parseStringLiteralOrReference(ctx, anchor);
  const description = parseStringLiteralOrReference(ctx, anchor);

  return {
    value,
    name,
    description,
    location: locationSpan(
      anchor.location,
      stringLiteralOrReferenceLocation(description)
    ),
  };
};

const parseOptionOverrideShorthand = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  targetToken: Token
): UserDefinedOptionOverrideNode => {
  const target =
    targetToken.kind === TokenKind.QuotedString
      ? {
          kind: "name" as const,
          value: targetToken.value,
          location: targetToken.location,
        }
      : {
          kind: "index" as const,
          value: Number.parseInt(targetToken.value, 10),
          location: targetToken.location,
        };

  const value = parseIntegerInitialValue(ctx, targetToken);
  return {
    kind: GameOptionEntryKind.OPTION_OVERRIDE,
    modifiers,
    target,
    value,
    location: locationSpan(keywordToken.location, value.location),
  };
};

export function parseUserDefinedOption(
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  ranged: true
): UserDefinedOptionNode;
export function parseUserDefinedOption(
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  ranged: false
): UserDefinedOptionNode | UserDefinedOptionOverrideNode;
export function parseUserDefinedOption(
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  ranged: boolean
): UserDefinedOptionNode | UserDefinedOptionOverrideNode {
  const nameToken = ctx.peekToken();
  // Base-derived shorthand: option "Display Name" <value>  |  option <index> <value>
  if (
    !ranged &&
    nameToken &&
    (nameToken.kind === TokenKind.QuotedString ||
      nameToken.kind === TokenKind.Integer)
  ) {
    ctx.getToken();
    return parseOptionOverrideShorthand(
      ctx,
      keywordToken,
      modifiers,
      nameToken
    );
  }

  const consumedName = ctx.getToken();
  let name: UserDefinedOptionNode["name"];
  if (consumedName.kind === TokenKind.Identifier) {
    ctx.symbolParser.addGameOptionToScope({
      name: consumedName.value,
      declaration: consumedName.location,
      type: VariableType.Number,
    });
    name = {
      value: consumedName.value,
      location: consumedName.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        consumedName.kind,
        consumedName.value
      ),
      consumedName.location
    );
    name = {
      kind: SyntaxKind.INVALID,
      location: consumedName.location,
    };
  }

  const displayName = parseStringLiteralOrReference(ctx, consumedName);
  const description = parseStringLiteralOrReference(ctx, consumedName);
  const defaultValue = parseIntegerInitialValue(ctx, consumedName);
  const values: UserDefinedOptionValueNode[] = [];

  while (ctx.hasMore()) {
    const peek = ctx.peekToken()!;
    if (isEndToken(peek)) {
      ctx.getToken();
      break;
    }

    if (ranged && values.length >= 2) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedGameOptionElement("end"),
        peek.location
      );
      ctx.getToken();
      continue;
    }

    values.push(parseUserDefinedOptionValue(ctx, ranged, consumedName));
  }

  const lastLocation = values.at(-1)?.location ?? defaultValue.location;

  return {
    kind: ranged
      ? GameOptionEntryKind.RANGED_OPTION
      : GameOptionEntryKind.OPTION,
    modifiers,
    name,
    displayName,
    description,
    defaultValue,
    values,
    location: locationSpan(keywordToken.location, lastLocation),
  };
}

export const optionParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): UserDefinedOptionNode | UserDefinedOptionOverrideNode =>
  parseUserDefinedOption(ctx, keywordToken, modifiers, false);
