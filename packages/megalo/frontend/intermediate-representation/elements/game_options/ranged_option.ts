import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import { LowerError } from "../../error";
import type {
  RangedUserDefinedOption,
  UserDefinedOptionValue,
} from "../../game/megalogamengine/megalogamengine_user_defined_options";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerConstantNumber } from "../../parameters/constantNumber";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { unwrapNumber } from "./shared";

const lowerRangedOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  ctx: ElementLowerContext
): ValueWithLocation<UserDefinedOptionValue> => {
  const value = lowerConstantNumber(valueNode.value, ctx);
  return valueWithLocation({ value }, valueNode.location);
};

export const lowerRangedOption = (
  entry: UserDefinedOptionNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);

    if (entry.values.length < 2) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "ranged min/max",
          String(entry.values.length)
        ),
        entry.location
      );
    }

    const name = valueWithLocation(
      resolveScriptStringTableReference(
        entry.displayName,
        ctx.ir,
        ctx.symbolTable
      ),
      entry.displayName.location
    );
    const description = valueWithLocation(
      resolveScriptStringTableReference(
        entry.description,
        ctx.ir,
        ctx.symbolTable
      ),
      entry.description.location
    );
    const locked = entry.modifiers.lock
      ? valueWithLocation(true, entry.location)
      : undefined;
    const hidden = entry.modifiers.hide
      ? valueWithLocation(true, entry.location)
      : undefined;

    const minValue = lowerRangedOptionValue(entry.values[0]!, ctx);
    const maxValue = lowerRangedOptionValue(entry.values[1]!, ctx);
    const defaultNumeric = lowerConstantNumber(entry.defaultValue, ctx);
    const defaultValue = valueWithLocation(
      { value: defaultNumeric },
      entry.defaultValue.location
    );
    const option: RangedUserDefinedOption = {
      name,
      description,
      locked,
      hidden,
      defaultValue,
      minValue,
      maxValue,
      currentValue: valueWithLocation(
        unwrapNumber(defaultNumeric),
        entry.defaultValue.location
      ),
    };
    ctx.ir.gameVariant.userDefinedOptions.push(option);
  });
};
