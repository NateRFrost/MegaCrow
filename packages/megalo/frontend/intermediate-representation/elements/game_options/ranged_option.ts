import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { Diagnostics } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import type { SymbolTable } from "../../../symbol-table";
import { type IR, type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import { LowerError } from "../../error";
import type {
  RangedUserDefinedOption,
  UserDefinedOptionValue,
} from "../../game/megalogamengine/megalogamengine_user_defined_options";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { resolveNumericValue, unwrapNumber } from "./shared";

const lowerRangedOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  symbolTable: SymbolTable
): ValueWithLocation<UserDefinedOptionValue> => {
  const value = resolveNumericValue(valueNode.value, symbolTable);
  return valueWithLocation({ value }, valueNode.location);
};

export const lowerRangedOption = (
  entry: UserDefinedOptionNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
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
      resolveScriptStringTableReference(entry.displayName, ir, symbolTable),
      entry.displayName.location
    );
    const description = valueWithLocation(
      resolveScriptStringTableReference(entry.description, ir, symbolTable),
      entry.description.location
    );
    const locked = entry.modifiers.lock
      ? valueWithLocation(true, entry.location)
      : undefined;
    const hidden = entry.modifiers.hide
      ? valueWithLocation(true, entry.location)
      : undefined;

    const minValue = lowerRangedOptionValue(entry.values[0]!, symbolTable);
    const maxValue = lowerRangedOptionValue(entry.values[1]!, symbolTable);
    const defaultNumeric = resolveNumericValue(entry.defaultValue, symbolTable);
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
    ir.gameVariant.userDefinedOptions.push(option);
  });
};
