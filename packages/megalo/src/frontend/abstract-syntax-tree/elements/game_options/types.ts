import type { SourceCodeLocation } from "src/diagnostics";
import type {
  ASTErrorNode,
  ASTReferenceNode,
} from "src/frontend/abstract-syntax-tree";
import type {
  ASTElementBase,
  ElementKind,
} from "src/frontend/abstract-syntax-tree/elements";
import type {
  IntegerInitialValue,
  NumericInitialValue,
} from "src/frontend/abstract-syntax-tree/elements/constants";
import type {
  PlayerTraitOptionNode,
  PlayerTraitsElementNode,
  PlayerTraitsOverrideNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options/player_traits";
import type { ASTKeywordParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { ASTStringLiteralOrReference } from "src/frontend/abstract-syntax-tree/parameters/string_literal_or_reference";
import type { PlayerTraitsOverrideOption } from "src/frontend/language-configuration/omni/game_options";

export type { ASTStringLiteralOrReference } from "src/frontend/abstract-syntax-tree/parameters/string_literal_or_reference";

export enum GameOptionEntryKind {
  OVERRIDE = 0,
  OPTION = 1,
  RANGED_OPTION = 2,
  PLAYER_TRAITS = 3,
  // Base-derived
  OPTION_OVERRIDE = 4,
  PLAYER_TRAITS_OVERRIDE = 5,
}

export enum OverrideValueKind {
  SIMPLE = 0,
  LOADOUT_PALETTE = 1,
  NESTED = 2,
}

export interface GameOptionModifiers {
  hide: boolean;
  hideLocation?: SourceCodeLocation;
  lock: boolean;
  lockLocation?: SourceCodeLocation;
}

export interface UserDefinedOptionValueNode {
  description?: ASTStringLiteralOrReference;
  location: SourceCodeLocation;
  name?: ASTStringLiteralOrReference;
  value: IntegerInitialValue;
}

export interface UserDefinedOptionNode {
  defaultValue: IntegerInitialValue;
  description: ASTStringLiteralOrReference;
  displayName: ASTStringLiteralOrReference;
  keywordLocation: SourceCodeLocation;
  kind: GameOptionEntryKind.OPTION | GameOptionEntryKind.RANGED_OPTION;
  location: SourceCodeLocation;
  modifiers: GameOptionModifiers;
  name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
  values: UserDefinedOptionValueNode[];
}

export interface UserDefinedOptionOverrideNode {
  keywordLocation: SourceCodeLocation;
  kind: GameOptionEntryKind.OPTION_OVERRIDE;
  location: SourceCodeLocation;
  modifiers: GameOptionModifiers;
  target:
    | { kind: "name"; value: string; location: SourceCodeLocation }
    | { kind: "index"; value: number; location: SourceCodeLocation };
  value: IntegerInitialValue;
}

export type { PlayerTraitsOverrideNode };

export interface OverrideSimpleValueNode {
  kind: OverrideValueKind.SIMPLE;
  value: NumericInitialValue | ASTKeywordParameterNode;
}

export interface OverrideLoadoutPaletteNode {
  kind: OverrideValueKind.LOADOUT_PALETTE;
  palette: { value: string; location: SourceCodeLocation } | ASTErrorNode;
  tier: { value: string; location: SourceCodeLocation } | ASTErrorNode;
}

export interface OverrideNestedBodyNode {
  body: {
    options: PlayerTraitOptionNode[];
    location: SourceCodeLocation;
  };
  kind: OverrideValueKind.NESTED;
}

/** `override loadout_palette <tier> <palette>` — not a GameOption symbol. */
export interface OverrideLoadoutPaletteNameNode {
  kind: "loadout_palette";
  location: SourceCodeLocation;
}

/** Nested player-traits override target — not a GameOption symbol. */
export interface OverridePlayerTraitsNameNode {
  kind: "player_traits_override";
  location: SourceCodeLocation;
  option: PlayerTraitsOverrideOption;
}

export type OverrideNameNode =
  | ASTReferenceNode
  | OverrideLoadoutPaletteNameNode
  | OverridePlayerTraitsNameNode
  | ASTErrorNode;

export interface OverrideEntryNode {
  keywordLocation: SourceCodeLocation;
  kind: GameOptionEntryKind.OVERRIDE;
  location: SourceCodeLocation;
  modifiers: GameOptionModifiers;
  name: OverrideNameNode;
  value:
    | OverrideSimpleValueNode
    | OverrideLoadoutPaletteNode
    | OverrideNestedBodyNode
    | ASTErrorNode;
}

export type GameOptionEntryNode =
  | OverrideEntryNode
  | UserDefinedOptionNode
  | UserDefinedOptionOverrideNode
  | PlayerTraitsElementNode
  | PlayerTraitsOverrideNode;

export type GameOptionsElementNode =
  ASTElementBase<ElementKind.GAME_OPTIONS> & {
    entries: GameOptionEntryNode[];
  };
