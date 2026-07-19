import {
  GameOptionEntryKind,
  type GameOptionEntryNode,
  type GameOptionsElementNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { Diagnostics } from "../../../diagnostics";
import type { SymbolTable } from "../../../symbol-table";
import type { ElementLowerer } from "..";
import type { IR } from "../..";
import { lowerOption } from "./option";
import { lowerOverride } from "./override";
import { lowerPlayerTraits } from "./player_traits";
import { lowerRangedOption } from "./ranged_option";

const lowerEntry = (
  entry: GameOptionEntryNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  switch (entry.kind) {
    case GameOptionEntryKind.OVERRIDE:
      lowerOverride(entry, symbolTable, ir, diagnostics);
      break;
    case GameOptionEntryKind.OPTION:
      lowerOption(entry, symbolTable, ir, diagnostics);
      break;
    case GameOptionEntryKind.RANGED_OPTION:
      lowerRangedOption(entry, symbolTable, ir, diagnostics);
      break;
    case GameOptionEntryKind.PLAYER_TRAITS:
      lowerPlayerTraits(entry, symbolTable, ir, diagnostics);
      break;
  }
};

export const gameOptionsLowerer: ElementLowerer<GameOptionsElementNode> = (
  element,
  symbolTable,
  ir,
  diagnostics
) => {
  for (const entry of element.entries) {
    lowerEntry(entry, symbolTable, ir, diagnostics);
  }
};
