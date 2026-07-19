import type { SourceCodeLocation } from "../../../diagnostics";
import type { PlayerTraitsOverrideOption } from "../../../language-configuration/omni/game_options";
import type { ASTErrorNode, ASTReferenceNode } from "../..";
import type { ASTKeywordParameterNode } from "../../parameters";
import type { ASTStringLiteralOrReference } from "../../parameters/string_literal_or_reference";
import type { ASTElementBase, ElementKind } from "..";
import type { IntegerInitialValue, NumericInitialValue } from "../constants";
import type {
  PlayerTraitOptionNode,
  PlayerTraitsElementNode,
} from "./player_traits";

export type { ASTStringLiteralOrReference } from "../../parameters/string_literal_or_reference";

export enum GameOptionEntryKind {
  OVERRIDE = 0,
  OPTION = 1,
  RANGED_OPTION = 2,
  PLAYER_TRAITS = 3,
}

export enum OverrideValueKind {
  SIMPLE = 0,
  LOADOUT_PALETTE = 1,
  NESTED = 2,
}

export type GameOptionModifiers = {
  lock: boolean;
  hide: boolean;
};

export type UserDefinedOptionValueNode = {
  value: IntegerInitialValue;
  name?: ASTStringLiteralOrReference;
  description?: ASTStringLiteralOrReference;
  location: SourceCodeLocation;
};

export type UserDefinedOptionNode = {
  kind: GameOptionEntryKind.OPTION | GameOptionEntryKind.RANGED_OPTION;
  modifiers: GameOptionModifiers;
  name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
  displayName: ASTStringLiteralOrReference;
  description: ASTStringLiteralOrReference;
  defaultValue: IntegerInitialValue;
  values: UserDefinedOptionValueNode[];
  location: SourceCodeLocation;
};

export type OverrideSimpleValueNode = {
  kind: OverrideValueKind.SIMPLE;
  value: NumericInitialValue | ASTKeywordParameterNode;
};

export type OverrideLoadoutPaletteNode = {
  kind: OverrideValueKind.LOADOUT_PALETTE;
  tier: { value: string; location: SourceCodeLocation } | ASTErrorNode;
  palette: { value: string; location: SourceCodeLocation } | ASTErrorNode;
};

export type OverrideNestedBodyNode = {
  kind: OverrideValueKind.NESTED;
  body: {
    options: PlayerTraitOptionNode[];
    location: SourceCodeLocation;
  };
};

/** `override loadout_palette <tier> <palette>` — not a GameOption symbol. */
export type OverrideLoadoutPaletteNameNode = {
  kind: "loadout_palette";
  location: SourceCodeLocation;
};

/** Nested player-traits override target — not a GameOption symbol. */
export type OverridePlayerTraitsNameNode = {
  kind: "player_traits_override";
  option: PlayerTraitsOverrideOption;
  location: SourceCodeLocation;
};

export type OverrideNameNode =
  | ASTReferenceNode
  | OverrideLoadoutPaletteNameNode
  | OverridePlayerTraitsNameNode
  | ASTErrorNode;

export type OverrideEntryNode = {
  kind: GameOptionEntryKind.OVERRIDE;
  modifiers: GameOptionModifiers;
  name: OverrideNameNode;
  value:
    | OverrideSimpleValueNode
    | OverrideLoadoutPaletteNode
    | OverrideNestedBodyNode
    | ASTErrorNode;
  location: SourceCodeLocation;
};

export type GameOptionEntryNode =
  | OverrideEntryNode
  | UserDefinedOptionNode
  | PlayerTraitsElementNode;

export type GameOptionsElementNode =
  ASTElementBase<ElementKind.GAME_OPTIONS> & {
    entries: GameOptionEntryNode[];
  };
