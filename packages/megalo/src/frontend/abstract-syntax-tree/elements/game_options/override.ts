import { diagnosticMessages } from "src/diagnostics/messages";
import { isAstErrorNode, SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import { parseNumericInitialValue } from "src/frontend/abstract-syntax-tree/elements/constants";
import { parsePlayerTraitOptions } from "src/frontend/abstract-syntax-tree/elements/game_options/player_traits";
import {
  isEndToken,
  locationSpan,
  parseIdentifier,
} from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  GameOptionEntryKind,
  type GameOptionModifiers,
  type OverrideEntryNode,
  type OverrideNameNode,
  type OverrideSimpleValueNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";
import { isPlayerTraitsOverrideOption } from "src/frontend/language-configuration/omni/game_options";
import { SymbolKind } from "src/frontend/symbol-table";
import { type Token, TokenKind } from "src/frontend/tokens";

const parseOverrideName = (
  ctx: ParserContext,
  nameToken: Token
): OverrideNameNode => {
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

  if (nameToken.value === "loadout_palette") {
    return {
      kind: "loadout_palette",
      location: nameToken.location,
    };
  }

  if (isPlayerTraitsOverrideOption(nameToken.value)) {
    return {
      kind: "player_traits_override",
      option: nameToken.value,
      location: nameToken.location,
    };
  }

  const symbolId = ctx.symbolParser.lookupSymbol(nameToken.value);
  if (symbolId !== undefined) {
    const entry = ctx.symbolParser.getSymbolEntry(symbolId);
    if (entry?.kind === SymbolKind.GameOption) {
      ctx.symbolParser.recordReference(symbolId, nameToken.location);
      return {
        kind: SyntaxKind.REFERENCE,
        identifier: nameToken.value,
        symbolId,
        location: nameToken.location,
      };
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedParameterType("game option", nameToken.value),
    nameToken.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: nameToken.location,
  };
};

const isNestedPlayerTraitsOverride = (
  name: OverrideNameNode,
  peek: Token | undefined
): boolean =>
  name.kind === "player_traits_override" &&
  peek !== undefined &&
  peek.location.start.line !== name.location.start.line;

const parseOverrideSimpleValue = (
  ctx: ParserContext,
  anchor: Token
): OverrideSimpleValueNode["value"] => {
  const token = ctx.peekToken();
  if (
    token?.kind === TokenKind.Integer ||
    token?.kind === TokenKind.FloatingPoint
  ) {
    return parseNumericInitialValue(ctx, anchor);
  }

  if (token?.kind === TokenKind.Identifier) {
    const valueToken = ctx.getToken();
    const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
    if (symbolId !== undefined) {
      ctx.symbolParser.recordReference(symbolId, valueToken.location);
      return {
        kind: SyntaxKind.REFERENCE,
        identifier: valueToken.value,
        symbolId,
        location: valueToken.location,
      };
    }

    return {
      kind: SyntaxKind.KEYWORD,
      value: valueToken.value,
      location: valueToken.location,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedConstantValue(token?.value ?? ""),
    token?.location ?? anchor.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

export const overrideParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): OverrideEntryNode => {
  const nameToken = ctx.getToken();
  const name = parseOverrideName(ctx, nameToken);

  let value: OverrideEntryNode["value"];
  const peek = ctx.peekToken();

  if (name.kind === "loadout_palette") {
    const tier = parseIdentifier(ctx, nameToken);
    const palette = parseIdentifier(ctx, nameToken);
    value = {
      kind: OverrideValueKind.LOADOUT_PALETTE,
      tier,
      palette,
    };
  } else if (isNestedPlayerTraitsOverride(name, peek)) {
    const body = parsePlayerTraitOptions(ctx, nameToken);
    value = {
      kind: OverrideValueKind.NESTED,
      body,
    };
  } else if (
    peek &&
    (peek.kind === TokenKind.Integer ||
      peek.kind === TokenKind.FloatingPoint ||
      (peek.kind === TokenKind.Identifier && peek.value !== "end"))
  ) {
    value = {
      kind: OverrideValueKind.SIMPLE,
      value: parseOverrideSimpleValue(ctx, nameToken),
    };
  } else if (isEndToken(peek)) {
    value = {
      kind: SyntaxKind.INVALID,
      location: nameToken.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedParameterType(
        "override value",
        peek?.value ?? ""
      ),
      peek?.location ?? nameToken.location
    );
    value = {
      kind: SyntaxKind.INVALID,
      location: nameToken.location,
    };
  }

  const valueLocation =
    value.kind === SyntaxKind.INVALID
      ? value.location
      : value.kind === OverrideValueKind.SIMPLE
        ? value.value.location
        : value.kind === OverrideValueKind.LOADOUT_PALETTE
          ? isAstErrorNode(value.palette)
            ? value.palette.location
            : value.palette.location
          : value.body.location;

  return {
    kind: GameOptionEntryKind.OVERRIDE,
    keywordLocation: keywordToken.location,
    modifiers,
    name,
    value,
    location: locationSpan(keywordToken.location, valueLocation),
  };
};
