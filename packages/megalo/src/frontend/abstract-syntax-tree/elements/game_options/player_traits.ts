import type { MegaloVersion } from "../../../../version";
import type { MegaloCompilerContext } from "../../../../context";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { type Token, TokenKind } from "../../../tokens";
import type { ParserContext } from "../../context";
import {
  type ASTErrorNode,
  type ASTNode,
  isAstErrorNode,
  type SyntaxKind,
} from "../../kinds";
import {
  type ASTParameterNode,
  KeywordParameter,
  ObjectListParameter,
  parameterParserBuilder as buildParameterParser,
  type ParameterParser,
  ParameterType,
} from "../../parameters";
import {
  type ASTStringLiteralOrReference,
  parseStringLiteralOrReference,
} from "../../parameters/string_literal_or_reference";
import { grenadeCountParser } from "../../parameters/types/grenade-count";
import { locationSpan, parseIdentifier } from "./shared";
import {
  GameOptionEntryKind,
  type GameOptionModifiers,
} from "./types";

export type PlayerTraitOptionNode = {
  identifier: string;
  parameters: ASTParameterNode[];
};

export const parsePlayerTraitOptions = (
  ctx: ParserContext,
  anchor: Token
): { options: PlayerTraitOptionNode[]; location: SourceCodeLocation } => {
  const options: PlayerTraitOptionNode[] = [];

  while (ctx.hasMore()) {
    const optionIdentifier = parseIdentifier(ctx, anchor);

    if (isAstErrorNode(optionIdentifier)) {
      continue;
    }

    if (optionIdentifier.value === "end") {
      return {
        options,
        location: locationSpan(anchor.location, optionIdentifier.location),
      };
    }

    const parser = ctx.playerTraitParserRepository.getParser(
      optionIdentifier.value
    );
    if (parser) {
      options.push({
        identifier: optionIdentifier.value,
        parameters: parser(ctx, optionIdentifier.location),
      });
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.unknownPlayerTrait(optionIdentifier.value),
        optionIdentifier.location
      );
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    anchor.location
  );
  return {
    options,
    location: anchor.location,
  };
};

export type PlayerTraitsElementNode = {
  kind: GameOptionEntryKind.PLAYER_TRAITS;
  modifiers: GameOptionModifiers;
  name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
  displayName: ASTStringLiteralOrReference;
  description: ASTStringLiteralOrReference;
  location: SourceCodeLocation;
  options: PlayerTraitOptionNode[];
};

export type PlayerTraitsOverrideNode = {
  kind: GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE;
  modifiers: GameOptionModifiers;
  target:
    | { kind: "name"; value: string; location: SourceCodeLocation }
    | { kind: "index"; value: number; location: SourceCodeLocation };
  options: PlayerTraitOptionNode[];
  location: SourceCodeLocation;
};

const parsePlayerTraitsOverride = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  targetToken: Token
): PlayerTraitsOverrideNode => {
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

  const { options, location } = parsePlayerTraitOptions(ctx, keywordToken);
  return {
    kind: GameOptionEntryKind.PLAYER_TRAITS_OVERRIDE,
    modifiers,
    target,
    options,
    location: locationSpan(keywordToken.location, location),
  };
};

export const playerTraitsParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): PlayerTraitsElementNode | PlayerTraitsOverrideNode => {
  const peek = ctx.peekToken();
  // Base-derived shorthand: player_traits "Display Name" … end
  //                        | player_traits <index> … end
  if (
    peek &&
    (peek.kind === TokenKind.QuotedString || peek.kind === TokenKind.Integer)
  ) {
    ctx.getToken();
    return parsePlayerTraitsOverride(ctx, keywordToken, modifiers, peek);
  }

  const name = parseIdentifier(ctx, keywordToken);
  if (!isAstErrorNode(name)) {
    ctx.symbolParser.addPlayerTraitsToScope(name.value, name.location);
  }
  const displayName = parseStringLiteralOrReference(ctx, keywordToken);
  const description = parseStringLiteralOrReference(ctx, keywordToken);
  const { options, location } = parsePlayerTraitOptions(ctx, keywordToken);

  return {
    kind: GameOptionEntryKind.PLAYER_TRAITS,
    modifiers,
    name,
    displayName,
    description,
    location,
    options,
  };
};

export type ASTPlayerTraitNode = {
  identifier: Token;
  parameters: ASTNode<
    SyntaxKind.KEYWORD | SyntaxKind.INTEGER | SyntaxKind.REFERENCE
  >;
};

export class PlayerTraitParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: string, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(megaloVersion: MegaloVersion) {
    this.registerParser(
      "damage_resistance",
      buildParameterParser([ParameterType.Keyword], [ParameterType.Integer])
    );
    this.registerParser(
      "body_recharge",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "shield_recharge",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "vampirism",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "headshot_immunity",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "body_multiplier",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "shield_multiplier",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "assassination_immunity",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "damage_modifier",
      buildParameterParser([ParameterType.Keyword], [ParameterType.Integer])
    );
    this.registerParser(
      "melee_damage_modifier",
      buildParameterParser([ParameterType.Keyword], [ParameterType.Integer])
    );
    this.registerParser(
      "initial_primary_weapon",
      buildParameterParser(
        [KeywordParameter("none")],
        [KeywordParameter("default")],
        [KeywordParameter("random")],
        [ObjectListParameter(ObjectListType.Weapons)]
      )
    );
    this.registerParser(
      "initial_secondary_weapon",
      buildParameterParser(
        [KeywordParameter("none")],
        [KeywordParameter("default")],
        [KeywordParameter("random")],
        [ObjectListParameter(ObjectListType.Weapons)]
      )
    );
    this.registerParser(
      "initial_equipment",
      buildParameterParser(
        [KeywordParameter("none")],
        [KeywordParameter("default")],
        [KeywordParameter("random")],
        [ObjectListParameter(ObjectListType.Equipment)]
      )
    );
    this.registerParser("initial_grenades", grenadeCountParser);
    this.registerParser(
      "recharging_grenades",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "infinite_ammo",
      buildParameterParser(
        [ParameterType.Integer]
      )
    );
    this.registerParser(
      "bottomless_clip",
      buildParameterParser(
        [ParameterType.Integer]
      )
    );
    this.registerParser(
      "weapon_pickup",
      buildParameterParser(
        [ParameterType.Integer]
      )
    );
    this.registerParser(
      "drop_equipment",
      buildParameterParser(
        [ParameterType.Integer]
      )
    );
    this.registerParser(
      "infinite_equipment",
      buildParameterParser(
        [ParameterType.Integer]
      )
    );
    this.registerParser("speed", buildParameterParser([ParameterType.Integer]));
    this.registerParser(
      "gravity",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "vehicle_usage",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "jump_modifier",
      buildParameterParser([ParameterType.Integer])
    );
    this.registerParser(
      "sprinting",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "equipment_usage",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "active_camo",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "waypoint",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "gamertag_visibility",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "color",
      buildParameterParser(
        [ParameterType.Keyword],
        [ParameterType.Integer, ParameterType.Integer, ParameterType.Integer]
      )
    );
    this.registerParser(
      "tracker_mode",
      buildParameterParser([ParameterType.Keyword])
    );
    this.registerParser(
      "tracker_range",
      buildParameterParser([ParameterType.Integer])
    );
  }

  public constructor(frontend: MegaloCompilerContext) {
    this.registerParsers(frontend.megaloVersion);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}
