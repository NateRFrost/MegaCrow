import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import { diagnosticMessages } from "../../../diagnostics/messages";
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

const lowerRangedOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  ctx: ElementLowerContext
): UserDefinedOptionValue => {
  const value = lowerConstantNumber(valueNode.value, ctx);
  const optionValue: UserDefinedOptionValue = {
    value: value.value,
  };
  ctx.ir.locations.record(optionValue, "value", value.location);
  return optionValue;
};

export const lowerRangedOption = (
  entry: UserDefinedOptionNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);
    const name = resolveScriptStringTableReference(
      entry.displayName,
      ctx.ir,
      ctx.symbolTable
    );
    const description = resolveScriptStringTableReference(
      entry.description,
      ctx.ir,
      ctx.symbolTable
    );

    if (entry.values.length < 2) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "ranged min/max",
          String(entry.values.length)
        ),
        entry.location
      );
    }

    const minValue = lowerRangedOptionValue(entry.values[0]!, ctx);
    const maxValue = lowerRangedOptionValue(entry.values[1]!, ctx);
    const defaultNumeric = lowerConstantNumber(entry.defaultValue, ctx);
    const defaultValue: UserDefinedOptionValue = {
      value: defaultNumeric.value,
    };
    ctx.ir.locations.record(defaultValue, "value", defaultNumeric.location);

    const option: RangedUserDefinedOption = {
      name,
      description,
      locked: entry.modifiers.lock ? true : undefined,
      hidden: entry.modifiers.hide ? true : undefined,
      defaultValue,
      minValue,
      maxValue,
      currentValue: defaultNumeric.value,
    };
    ctx.ir.locations.record(option, "name", entry.displayName.location);
    ctx.ir.locations.record(option, "description", entry.description.location);
    if (entry.modifiers.lock) {
      ctx.ir.locations.record(option, "locked", entry.location);
    }
    if (entry.modifiers.hide) {
      ctx.ir.locations.record(option, "hidden", entry.location);
    }
    ctx.ir.locations.record(
      option,
      "currentValue",
      entry.defaultValue.location
    );
    const { userDefinedOptions: maxOptions } =
      ctx.frontend.versionConfiguration.limits;
    if (ctx.ir.gameVariant.userDefinedOptions.length >= maxOptions) {
      throw new LowerError("Too many user defined options!", entry.location);
    }
    ctx.ir.gameVariant.userDefinedOptions.push(option);
  });
};
