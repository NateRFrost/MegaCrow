import type {
  UserDefinedOptionNode,
  UserDefinedOptionOverrideNode,
  UserDefinedOptionValueNode,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertNotErrorNode } from "src/frontend/intermediate-representation/diagnostics/assertNotErrorNode";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type {
  SelectUserDefinedOption,
  UserDefinedOptionValue,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_user_defined_options";
import { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { resolveScriptStringTableReference } from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";

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

    // Proto pool walk: option display name + description, then value rows.
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
    const values = entry.values.map((value) => lowerOptionValue(value, ctx));
    const defaultNumber = lowerConstantNumber(entry.defaultValue, ctx).value;
    let defaultValueIndex = values.findIndex(
      (value) => value.value === defaultNumber
    );
    if (defaultValueIndex < 0) {
      defaultValueIndex = 0;
    }

    const option: SelectUserDefinedOption = {
      name,
      description,
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
    const { userDefinedOptions: maxOptions } =
      ctx.frontend.versionConfiguration.limits;
    if (ctx.ir.gameVariant.userDefinedOptions.length >= maxOptions) {
      throw new LowerError("Too many user defined options!", entry.location);
    }
    ctx.ir.gameVariant.userDefinedOptions.push(option);
  });
};

export const lowerOptionOverride = (
  entry: UserDefinedOptionOverrideNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    const value = lowerConstantNumber(entry.value, ctx).value;
    const override = {
      target:
        entry.target.kind === "name"
          ? { kind: "name" as const, value: entry.target.value }
          : { kind: "index" as const, value: entry.target.value },
      value,
      locked: entry.modifiers.lock ? true : undefined,
      hidden: entry.modifiers.hide ? true : undefined,
      location: entry.location,
    };
    ctx.ir.baseOverrides.userDefinedOptions.push(override);
    ctx.ir.locations.record(override, "value", entry.value.location);
  });
};
