import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import type {
  SelectUserDefinedOption,
  UserDefinedOptionValue,
} from "../../game/megalogamengine/megalogamengine_user_defined_options";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerConstantNumber } from "../../parameters/constantNumber";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";

const lowerOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  ctx: ElementLowerContext
): UserDefinedOptionValue => {
  const value = lowerConstantNumber(valueNode.value, ctx);
  const optionValue: UserDefinedOptionValue = {
    value: value.value,
  };
  ctx.ir.locations.record(optionValue, "value", value.location);
  if (valueNode.name !== undefined) {
    optionValue.name = resolveScriptStringTableReference(
      valueNode.name,
      ctx.ir,
      ctx.symbolTable
    );
    ctx.ir.locations.record(optionValue, "name", valueNode.name.location);
  }
  if (valueNode.description !== undefined) {
    optionValue.description = resolveScriptStringTableReference(
      valueNode.description,
      ctx.ir,
      ctx.symbolTable
    );
    ctx.ir.locations.record(
      optionValue,
      "description",
      valueNode.description.location
    );
  }
  return optionValue;
};

/**
 * @link https://blam-network.github.io/megalo/language/elements/game-options#option
 */
export const lowerOption = (
  entry: UserDefinedOptionNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);

    const values = entry.values.map((value) => lowerOptionValue(value, ctx));
    const defaultNumber = lowerConstantNumber(entry.defaultValue, ctx).value;
    let defaultValueIndex = values.findIndex(
      (value) => value.value === defaultNumber
    );
    if (defaultValueIndex < 0) {
      defaultValueIndex = 0;
    }

    const option: SelectUserDefinedOption = {
      name: resolveScriptStringTableReference(
        entry.displayName,
        ctx.ir,
        ctx.symbolTable
      ),
      description: resolveScriptStringTableReference(
        entry.description,
        ctx.ir,
        ctx.symbolTable
      ),
      locked: entry.modifiers.lock ? true : undefined,
      hidden: entry.modifiers.hide ? true : undefined,
      values,
      defaultValueIndex,
      currentValueIndex: defaultValueIndex,
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
      "defaultValueIndex",
      entry.defaultValue.location
    );
    ctx.ir.locations.record(
      option,
      "currentValueIndex",
      entry.defaultValue.location
    );
    ctx.ir.gameVariant.userDefinedOptions.push(option);
  });
};
