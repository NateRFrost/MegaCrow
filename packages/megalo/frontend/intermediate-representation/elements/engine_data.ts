import { ElementLowerer } from ".";
import { assertSyntaxKind } from "../diagnostics/assertSyntaxKind";
import { expectParameterCount } from "../diagnostics/expectParameterCount";
import { SyntaxKind } from "../../abstract-syntax-tree";
import { assertSymbolKind } from "../diagnostics/assertSymbolKind";
import { SymbolKind } from "../../symbol-table";
import { StringTable } from "../game/string_table";
import { dxAssertionScope } from "../diagnostics";
import { EngineDataElementNode } from "../../abstract-syntax-tree/elements/engine_data";
import { parseEnumCategory as parseEngineCategory } from "../engine-categories";
import { ENGINE_CATEGORY_STRING_PREFIX } from "../../language-configuration/omni/engine_data";
import { lowerConstantNumber } from "../parameters/constantNumber";
import { resolveStringTableEntry } from "../parameters/resolveScriptStringTableReference";
import { setField } from "../setField";

export const engineDataLowerer: ElementLowerer<EngineDataElementNode> = (
  element,
  ctx
) => {
  const { symbolTable, ir, diagnostics } = ctx;
  for (const property of element.properties) {
    switch (property.identifier) {
      case "name":
        expectParameterCount(1, property.parameters);
        dxAssertionScope(diagnostics, () => {
          const parameter = property.parameters[0]!;
          const localizedName = new StringTable();
          resolveStringTableEntry(parameter, localizedName, symbolTable);
          setField(
            ir.locations,
            diagnostics,
            ir.gameVariant,
            "localizedName",
            localizedName,
            parameter.location
          );
        });
        break;
      case "description":
        expectParameterCount(1, property.parameters);
        dxAssertionScope(diagnostics, () => {
          const parameter = property.parameters[0]!;
          const localizedDescription = new StringTable();
          resolveStringTableEntry(
            parameter,
            localizedDescription,
            symbolTable
          );
          setField(
            ir.locations,
            diagnostics,
            ir.gameVariant,
            "localizedDescription",
            localizedDescription,
            parameter.location
          );
        });
        break;
      case "icon":
        expectParameterCount(1, property.parameters);
        dxAssertionScope(diagnostics, () => {
          const parameter = property.parameters[0]!;
          assertSyntaxKind(parameter, [
            SyntaxKind.REFERENCE,
            SyntaxKind.INTEGER,
          ]);
          const icon = lowerConstantNumber(parameter, ctx);
          setField(
            ir.locations,
            diagnostics,
            ir.gameVariant,
            "engineIcon",
            icon.value,
            icon.location
          );
        });
        break;
      case "category":
        expectParameterCount(1, property.parameters);
        dxAssertionScope(diagnostics, () => {
          const parameter = property.parameters[0]!;
          assertSyntaxKind(parameter, SyntaxKind.REFERENCE);
          const symbol = symbolTable.getSymbol(parameter.symbolId);
          assertSymbolKind(symbol, SymbolKind.String);
          const localizedCategory = new StringTable();
          localizedCategory.addEntry(
            symbol.languageContents,
            parameter.symbolId
          );
          setField(
            ir.locations,
            diagnostics,
            ir.gameVariant,
            "localizedCategory",
            localizedCategory,
            parameter.location
          );
          // engine_data category is weird, it maps to a string table entry and an enum
          // the symbol name has the prefix "engine_category_" so we need to remove it to get the enum member name
          const enumValueKey = symbol.name.replace(
            new RegExp(`^${ENGINE_CATEGORY_STRING_PREFIX}`),
            ""
          );
          const enumValue = parseEngineCategory(enumValueKey);
          if (enumValue !== undefined) {
            setField(
              ir.locations,
              diagnostics,
              ir.gameVariant,
              "engineCategory",
              enumValue,
              parameter.location
            );
          }
        });
        break;
    }
  }
};
