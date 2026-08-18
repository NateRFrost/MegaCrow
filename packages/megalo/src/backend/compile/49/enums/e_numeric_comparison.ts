import { e_numeric_comparison } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import {
  NumericComparison,
  type NumericComparison as NumericComparisonName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

const NUMERIC_COMPARISON_TO_BLF = {
  [NumericComparison.less_than]: e_numeric_comparison.less_than,
  [NumericComparison.greater_than]: e_numeric_comparison.greater_than,
  [NumericComparison.equal_to]: e_numeric_comparison.equal_to,
} as const satisfies Partial<
  Record<NumericComparisonName, e_numeric_comparison>
>;

export const encodeNumericComparison = (
  value: NumericComparisonName
): e_numeric_comparison => {
  const mapped = (
    NUMERIC_COMPARISON_TO_BLF as Partial<
      Record<
        string,
        (typeof NUMERIC_COMPARISON_TO_BLF)[keyof typeof NUMERIC_COMPARISON_TO_BLF]
      >
    >
  )[value as string];
  if (mapped === undefined) {
    throw new Error(`Comparison ${value} is not supported on this version`);
  }
  return mapped;
};
