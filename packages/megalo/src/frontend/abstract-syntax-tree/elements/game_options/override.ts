import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type ASTErrorNode,
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import { parseNumericInitialValue } from "src/frontend/abstract-syntax-tree/elements/constants";
import { parsePlayerTraitOptions } from "src/frontend/abstract-syntax-tree/elements/game_options/player_traits";
import {
  canTakeBoundaryAsIdentifierOperand,
  isGameOptionsEntryBoundary,
  locationSpan,
  parseGameOptionsIdentifierOperand,
} from "src/frontend/abstract-syntax-tree/elements/game_options/shared";
import {
  GameOptionEntryKind,
  type GameOptionModifiers,
  type OverrideEntryNode,
  type OverrideLoadoutPaletteNode,
  type OverrideNameNode,
  type OverrideSimpleValueNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options/types";
import { loadoutPaletteType } from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import { isPlayerTraitsOverrideOption } from "src/frontend/language-configuration/omni/game_options";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind } from "src/frontend/symbol-table";
import { type Token, TokenKind } from "src/frontend/tokens";

const objectListTypeForOverride = (
  name: OverrideNameNode
): ObjectListType | undefined => {
  if (name.kind !== SyntaxKind.REFERENCE) {
    return;
  }
  switch (name.identifier) {
    case "weapon_set":
      return ObjectListType.WeaponSets;
    case "vehicle_set":
      return ObjectListType.VehicleSets;
    default:
      return;
  }
};

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

const isNestedPlayerTraitsOverride = (name: OverrideNameNode): boolean =>
  name.kind === "player_traits_override";

const missingOperandAfter = (
  ctx: ParserContext,
  previousLocation: SourceCodeLocation,
  peek: Token | undefined,
  expected: string
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
    diagnosticMessages.expectedParameterType(expected, peek?.value ?? ""),
    location
  );
  return {
    kind: SyntaxKind.INVALID,
    location,
  };
};

/** `override loadout_palette <LoadoutPaletteType> <palette>` */
const parseLoadoutPaletteOverrideValue = (
  ctx: ParserContext,
  nameLocation: SourceCodeLocation
): OverrideLoadoutPaletteNode => {
  const tierPeek = ctx.peekToken();
  let tier: OverrideLoadoutPaletteNode["tier"];
  if (
    tierPeek?.kind === TokenKind.Identifier &&
    loadoutPaletteType.has(tierPeek.value)
  ) {
    const token = ctx.getToken();
    tier = { value: token.value, location: token.location };
  } else if (
    tierPeek?.kind === TokenKind.Identifier &&
    !isGameOptionsEntryBoundary(tierPeek)
  ) {
    // Attempted tier name outside the enum — consume so recovery stays here.
    const token = ctx.getToken();
    ctx.diagnostics.addError(
      diagnosticMessages.expectedParameterType(
        "loadout palette type",
        token.value
      ),
      token.location
    );
    tier = { kind: SyntaxKind.INVALID, location: token.location };
  } else {
    tier = missingOperandAfter(
      ctx,
      nameLocation,
      tierPeek,
      "loadout palette type"
    );
  }

  const afterTier = isAstErrorNode(tier) ? tier.location : tier.location;
  const palette = parseGameOptionsIdentifierOperand(ctx, afterTier);

  return {
    kind: OverrideValueKind.LOADOUT_PALETTE,
    tier,
    palette,
  };
};

const canStartSimpleOverrideValue = (
  ctx: ParserContext,
  peek: Token | undefined
): boolean => {
  if (!peek) {
    return false;
  }
  if (
    peek.kind === TokenKind.Integer ||
    peek.kind === TokenKind.FloatingPoint
  ) {
    return true;
  }
  if (peek.kind !== TokenKind.Identifier) {
    return false;
  }
  if (!isGameOptionsEntryBoundary(peek)) {
    return true;
  }
  return canTakeBoundaryAsIdentifierOperand(ctx, peek);
};

const parseOverrideSimpleValue = (
  ctx: ParserContext,
  anchor: Token,
  objectListType?: ObjectListType
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

    if (objectListType !== undefined) {
      const listSymbolId = ctx.symbolParser.lookupObjectListItem(
        objectListType,
        valueToken.value
      );
      if (listSymbolId !== undefined) {
        ctx.symbolParser.recordReference(listSymbolId, valueToken.location);
        return {
          kind: SyntaxKind.REFERENCE,
          identifier: valueToken.value,
          symbolId: listSymbolId,
          location: valueToken.location,
        };
      }
    }

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
    value = parseLoadoutPaletteOverrideValue(ctx, name.location);
  } else if (isNestedPlayerTraitsOverride(name)) {
    const body = parsePlayerTraitOptions(ctx, nameToken);
    value = {
      kind: OverrideValueKind.NESTED,
      body,
    };
  } else if (canStartSimpleOverrideValue(ctx, peek)) {
    value = {
      kind: OverrideValueKind.SIMPLE,
      value: parseOverrideSimpleValue(
        ctx,
        nameToken,
        objectListTypeForOverride(name)
      ),
    };
  } else {
    // Span the gap after the name so completion at `override weapon_set |`
    // stays inside this entry (same pattern as loadout_palette missing operands).
    value = missingOperandAfter(ctx, name.location, peek, "override value");
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
