import type { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { type ValueWithLocation, valueWithLocation } from "..";
import { LowerError } from "../error";
import type { ParameterLoweringContext } from "./context";
import { buildParameterLowerer, numberParam } from "./lowering";

const numberParamLowerer = buildParameterLowerer([numberParam("value")]);

/**
 * Lower a flat parameter list as a number.
 * Accepts literals, constants, and number variables (trigger/trait style).
 */
export const lowerNumberParam = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  expected: string,
  location: SourceCodeLocation
): ValueWithLocation<number> => {
  const result = numberParamLowerer(parameters, ctx);
  const value = result.byName("value") as ValueWithLocation<number> | undefined;
  if (value === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(expected, ""),
      location
    );
  }
  return value;
};

/**
 * Lower a boolean from a number parameter (0 = false, non-zero = true).
 * Same acceptance rules as {@link lowerNumberParam}.
 */
export const lowerBooleanParam = (
  parameters: ASTParameterNode[],
  ctx: ParameterLoweringContext,
  location: SourceCodeLocation
): ValueWithLocation<boolean> => {
  const value = lowerNumberParam(parameters, ctx, "boolean", location);
  return valueWithLocation(value.value !== 0, value.location);
};
