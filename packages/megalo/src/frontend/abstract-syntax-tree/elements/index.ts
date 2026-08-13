import type { MegaloCompilerContext } from "src/context";
import type { SourceCodeLocation } from "src/diagnostics";
import type { ASTNode, SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ConstantsElementNode,
  constantsParser,
} from "src/frontend/abstract-syntax-tree/elements/constants";
import {
  type GameOptionsElementNode,
  gameOptionsParser,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import type { Token } from "src/frontend/tokens";
import type { MegaloVersion } from "src/version";

export type { BaseElementNode } from "src/frontend/abstract-syntax-tree/elements/base";
export {
  GameOptionEntryKind,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
export type { IncludeElementNode } from "src/frontend/abstract-syntax-tree/elements/include";
export type { LocalizedIncludeElementNode } from "src/frontend/abstract-syntax-tree/elements/localized_include";

import {
  type BaseElementNode,
  baseParser,
} from "src/frontend/abstract-syntax-tree/elements/base";
import {
  type EngineDataElementNode,
  engineDataParser,
} from "src/frontend/abstract-syntax-tree/elements/engine_data";
import {
  type GameStatsElementNode,
  gameStatsParser,
} from "src/frontend/abstract-syntax-tree/elements/game_stats";
import {
  type HudWidgetsElementNode,
  hudWidgetsParser,
} from "src/frontend/abstract-syntax-tree/elements/hud_widgets";
import {
  type IncludeElementNode,
  includeParser,
} from "src/frontend/abstract-syntax-tree/elements/include";
import {
  type LoadoutElementNode,
  loadoutParser,
} from "src/frontend/abstract-syntax-tree/elements/loadout";
import {
  type LoadoutPaletteElementNode,
  loadoutPaletteParser,
} from "src/frontend/abstract-syntax-tree/elements/loadout_palette";
import {
  type LocalizedIncludeElementNode,
  localizedIncludeParser,
} from "src/frontend/abstract-syntax-tree/elements/localized_include";
import {
  type MapObjectElementNode,
  mapObjectParser,
} from "src/frontend/abstract-syntax-tree/elements/map_object";
import {
  type MapPermissionsElementNode,
  mapPermissionsParser,
} from "src/frontend/abstract-syntax-tree/elements/map_permissions";
import {
  type PlayerRatingElementNode,
  playerRatingParser,
} from "src/frontend/abstract-syntax-tree/elements/player_rating";
import {
  type RequisitionPaletteElementNode,
  requisitionPaletteParser,
} from "src/frontend/abstract-syntax-tree/elements/requisition_palette";
import {
  type StringTableElementNode,
  stringTableParser,
} from "src/frontend/abstract-syntax-tree/elements/string_table";
import {
  type TeamsElementNode,
  teamsParser,
} from "src/frontend/abstract-syntax-tree/elements/teams";
import {
  type TriggerElementNode,
  triggerParser,
} from "src/frontend/abstract-syntax-tree/elements/trigger";
import {
  type VariablesElementNode,
  variablesParser,
} from "src/frontend/abstract-syntax-tree/elements/variables";

// REGISTERING NEW ELEMENTS:
// - Add an ElementKind enum value.
// - Create a new parser function and add it to registerParsers.
// - Add the return type of the parser to the ASTElementNode discriminated union.
// (we will probably very rarely do this lol)

export enum ElementKind {
  BASE = 0,
  INCLUDE = 1,
  LOCALIZED_INCLUDE = 2,
  STRING_TABLE = 3,
  CONSTANTS = 4,
  VARIABLES = 5,
  GAME_OPTIONS = 6,
  HUD_WIDGETS = 7,
  LOADOUT = 8,
  LOADOUT_PALETTE = 9,
  TEAMS = 10,
  ENGINE_DATA = 11,
  PLAYER_RATING = 12,
  MAP_PERMISSIONS = 13,
  GAME_STATS = 14,
  MAP_OBJECT = 15,
  REQUISITION_PALETTE = 16,
  TRIGGER = 17,
}

// used by elements
export type ASTElementBase<K extends ElementKind> =
  ASTNode<SyntaxKind.ELEMENT> & {
    elementKind: K;
    /** Keyword token only — preferred for many diagnostics. */
    keywordLocation: SourceCodeLocation;
  };
// only used here to enforce ASTElementNode discrim union members implement ASTElementBase
type ASTElementNodeWithBase<T extends ASTElementBase<ElementKind>> = T;

export type ASTElementNode = ASTElementNodeWithBase<
  | BaseElementNode
  | IncludeElementNode
  | LocalizedIncludeElementNode
  | StringTableElementNode
  | ConstantsElementNode
  | VariablesElementNode
  | GameOptionsElementNode
  | HudWidgetsElementNode
  | LoadoutElementNode
  | LoadoutPaletteElementNode
  | TeamsElementNode
  | EngineDataElementNode
  | PlayerRatingElementNode
  | MapPermissionsElementNode
  | GameStatsElementNode
  | MapObjectElementNode
  | RequisitionPaletteElementNode
  | TriggerElementNode
>;

export type ElementParser<E extends ASTElementNode> = (
  ctx: ParserContext,
  elementToken: Token
) => E;

// ElementParserRepository is Workspace lifecycle - it is instanced per workspace.
export class ElementParserRepository {
  // We could proooobably get away with using a static object here,
  // but building up based on the megalo version allows us to configure
  // alternate parsers for different megalo versions if necessary.
  private readonly parsers = new Map<string, ElementParser<ASTElementNode>>();

  private registerParser(name: string, parser: ElementParser<ASTElementNode>) {
    this.parsers.set(name, parser);
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser("base", baseParser);
    this.registerParser("include", includeParser);
    this.registerParser("localized_include", localizedIncludeParser);
    this.registerParser("string_table", stringTableParser);
    this.registerParser("constants", constantsParser);
    this.registerParser("variables", variablesParser);
    this.registerParser("game_options", gameOptionsParser);
    this.registerParser("hud_widgets", hudWidgetsParser);
    this.registerParser("loadout", loadoutParser);
    this.registerParser("loadout_palette", loadoutPaletteParser);
    this.registerParser("teams", teamsParser);
    this.registerParser("engine_data", engineDataParser);
    this.registerParser("player_rating", playerRatingParser);
    this.registerParser("map_permissions", mapPermissionsParser);
    this.registerParser("game_stats", gameStatsParser);
    this.registerParser("map_object", mapObjectParser);
    this.registerParser("requisition_palette", requisitionPaletteParser);
    this.registerParser("trigger", triggerParser);
  }

  public constructor(frontend: MegaloCompilerContext) {
    this.registerParsers(frontend.megaloVersion);
  }

  public getParser(name: string): ElementParser<ASTElementNode> | undefined {
    return this.parsers.get(name);
  }
}
