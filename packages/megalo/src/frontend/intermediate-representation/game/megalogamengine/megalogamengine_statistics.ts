import type { StringTableReference } from "src/frontend/intermediate-representation/game/string_table";
import { megaloEnum, type MegaloEnumNames } from "src/frontend/intermediate-representation/megaloEnum";

export const gameStatisticFormat = megaloEnum([
  "number",
  "delta",
  "percentage",
  "timer",
] as const);
export const GameStatisticFormat = gameStatisticFormat.enum;
export type GameStatisticFormat = MegaloEnumNames<typeof gameStatisticFormat>;

export enum GameStatisticSortOrder {
  None = -1,
  Ascending = 0,
  Descending = 1,
}

export const gameStatisticGrouping = megaloEnum([
  "none",
  "team",
] as const);
export const GameStatisticGrouping = gameStatisticGrouping.enum;
export type GameStatisticGrouping = MegaloEnumNames<typeof gameStatisticGrouping>;

export interface MegaloGameStatistic {
  format: GameStatisticFormat;
  grouping: GameStatisticGrouping;
  nameStringIndex: StringTableReference;
  sortOrder: GameStatisticSortOrder;
}
