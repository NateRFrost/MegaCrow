import {
  GameOptionEntryKind,
  type GameOptionEntryNode,
  type GameOptionsElementNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { ElementLowerer } from "..";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerOption } from "./option";
import { lowerOverride } from "./override";
import { lowerPlayerTraits } from "./player_traits";
import { lowerRangedOption } from "./ranged_option";

const lowerEntry = (entry: GameOptionEntryNode, ctx: ElementLowerContext) => {
  switch (entry.kind) {
    case GameOptionEntryKind.OVERRIDE:
      lowerOverride(entry, ctx);
      break;
    case GameOptionEntryKind.OPTION:
      lowerOption(entry, ctx);
      break;
    case GameOptionEntryKind.RANGED_OPTION:
      lowerRangedOption(entry, ctx);
      break;
    case GameOptionEntryKind.PLAYER_TRAITS:
      lowerPlayerTraits(entry, ctx);
      break;
  }
};

export const gameOptionsLowerer: ElementLowerer<GameOptionsElementNode> = (
  element,
  ctx
) => {
  for (const entry of element.entries) {
    lowerEntry(entry, ctx);
  }
};
