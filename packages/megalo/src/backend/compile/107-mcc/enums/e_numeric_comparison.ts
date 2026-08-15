import { e_numeric_comparison } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  NumericComparison,
  type NumericComparison as NumericComparisonName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

const NUMERIC_COMPARISON_TO_BLF = {
  [NumericComparison.less_than]: e_numeric_comparison.less_than,
  [NumericComparison.greater_than]: e_numeric_comparison.greater_than,
  [NumericComparison.equal_to]: e_numeric_comparison.equal_to,
  [NumericComparison.less_than_or_equal_to]:
    e_numeric_comparison.less_than_or_equal_to,
  [NumericComparison.greater_than_or_equal_to]:
    e_numeric_comparison.greater_than_or_equal_to,
  [NumericComparison.not_equal_to]: e_numeric_comparison.not_equal_to,
} as const satisfies Record<NumericComparisonName, e_numeric_comparison>;

export const encodeNumericComparison = (
  value: NumericComparisonName
): e_numeric_comparison => mapMegaloEnum(value, NUMERIC_COMPARISON_TO_BLF);
