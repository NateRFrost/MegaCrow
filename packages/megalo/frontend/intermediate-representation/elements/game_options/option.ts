import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import { type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import type {
  SelectUserDefinedOption,
  UserDefinedOptionValue,
} from "../../game/megalogamengine/megalogamengine_user_defined_options";
import type { ElementLowerContext } from "../../parameters/context";
import { lowerConstantNumber } from "../../parameters/constantNumber";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { unwrapNumber } from "./shared";

const lowerOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  ctx: ElementLowerContext
): ValueWithLocation<UserDefinedOptionValue> => {
  const value = lowerConstantNumber(valueNode.value, ctx);
  const name =
    valueNode.name === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(
            valueNode.name,
            ctx.ir,
            ctx.symbolTable
          ),
          valueNode.name.location
        );
  const description =
    valueNode.description === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(
            valueNode.description,
            ctx.ir,
            ctx.symbolTable
          ),
          valueNode.description.location
        );
  return valueWithLocation({ value, name, description }, valueNode.location);
};

export const lowerOption = (
  entry: UserDefinedOptionNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);

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

    const values = entry.values.map((value) => lowerOptionValue(value, ctx));
    const defaultNumber = unwrapNumber(
      lowerConstantNumber(entry.defaultValue, ctx)
    );
    let defaultValueIndex = values.findIndex(
      (value) => unwrapNumber(value.value.value) === defaultNumber
    );
    if (defaultValueIndex < 0) {
      defaultValueIndex = 0;
    }

    const option: SelectUserDefinedOption = {
      name,
      description,
      locked,
      hidden,
      values,
      defaultValueIndex: valueWithLocation(
        defaultValueIndex,
        entry.defaultValue.location
      ),
      currentValueIndex: valueWithLocation(
        defaultValueIndex,
        entry.defaultValue.location
      ),
    };
    ctx.ir.gameVariant.userDefinedOptions.push(option);
  });
};
