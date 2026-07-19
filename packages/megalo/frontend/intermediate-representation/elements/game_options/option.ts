import type {
  UserDefinedOptionNode,
  UserDefinedOptionValueNode,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { Diagnostics } from "../../../diagnostics";
import type { SymbolTable } from "../../../symbol-table";
import { type IR, type ValueWithLocation, valueWithLocation } from "../..";
import { dxAssertionScope } from "../../diagnostics";
import { assertNotErrorNode } from "../../diagnostics/assertNotErrorNode";
import type {
  SelectUserDefinedOption,
  UserDefinedOptionValue,
} from "../../game/megalogamengine/megalogamengine_user_defined_options";
import { resolveScriptStringTableReference } from "../../parameters/resolveScriptStringTableReference";
import { resolveNumericValue, unwrapNumber } from "./shared";

const lowerOptionValue = (
  valueNode: UserDefinedOptionValueNode,
  symbolTable: SymbolTable,
  ir: IR
): ValueWithLocation<UserDefinedOptionValue> => {
  const value = resolveNumericValue(valueNode.value, symbolTable);
  const name =
    valueNode.name === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(valueNode.name, ir, symbolTable),
          valueNode.name.location
        );
  const description =
    valueNode.description === undefined
      ? undefined
      : valueWithLocation(
          resolveScriptStringTableReference(
            valueNode.description,
            ir,
            symbolTable
          ),
          valueNode.description.location
        );
  return valueWithLocation({ value, name, description }, valueNode.location);
};

export const lowerOption = (
  entry: UserDefinedOptionNode,
  symbolTable: SymbolTable,
  ir: IR,
  diagnostics: Diagnostics
) => {
  dxAssertionScope(diagnostics, () => {
    assertNotErrorNode(entry.name);

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

    const values = entry.values.map((value) =>
      lowerOptionValue(value, symbolTable, ir)
    );
    const defaultNumber = unwrapNumber(
      resolveNumericValue(entry.defaultValue, symbolTable)
    );
    let defaultValueIndex = values.findIndex(
      (value) => unwrapNumber(value.value) === defaultNumber
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
    ir.gameVariant.userDefinedOptions.push(option);
  });
};
