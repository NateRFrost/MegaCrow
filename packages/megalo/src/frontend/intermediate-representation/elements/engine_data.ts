import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { EngineDataElementNode } from "src/frontend/abstract-syntax-tree/elements/engine_data";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { assertSymbolKind } from "src/frontend/intermediate-representation/diagnostics/assertSymbolKind";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { expectParameterCount } from "src/frontend/intermediate-representation/diagnostics/expectParameterCount";
import type { ElementLowerer } from "src/frontend/intermediate-representation/elements";
import { parseEnumCategory as parseEngineCategory } from "src/frontend/intermediate-representation/engine-categories";
import { StringTable } from "src/frontend/intermediate-representation/game/string_table";
import { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
import { resolveStringTableEntry } from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";
import { setField } from "src/frontend/intermediate-representation/setField";
import { ENGINE_CATEGORY_STRING_PREFIX } from "src/frontend/language-configuration/omni/engine_data";
import { SymbolKind } from "src/frontend/symbol-table";

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
          if (ir.baseFilePath === undefined) {
            const titleIndex = resolveStringTableEntry(
              parameter,
              ir.gameVariant.scriptStrings,
              ctx
            );
            // 1-based into scriptStrings (0 = none).
            setField(
              ir.locations,
              diagnostics,
              ir.gameVariant,
              "baseNameStringIndex",
              titleIndex + 1,
              parameter.location,
              "name"
            );
          } else {
            const localizedName = new StringTable();
            resolveStringTableEntry(parameter, localizedName, ctx);
            setField(
              ir.locations,
              diagnostics,
              ir.gameVariant,
              "localizedName",
              localizedName,
              parameter.location,
              "name"
            );
          }
        });
        break;
      case "description":
        expectParameterCount(1, property.parameters);
        dxAssertionScope(diagnostics, () => {
          const parameter = property.parameters[0]!;
          const localizedDescription = new StringTable();
          resolveStringTableEntry(parameter, localizedDescription, ctx);
          setField(
            ir.locations,
            diagnostics,
            ir.gameVariant,
            "localizedDescription",
            localizedDescription,
            parameter.location,
            "description"
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
            icon.location,
            "icon"
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
            parameter.location,
            "category"
          );
          // engine_data category is weird, it maps to a string table entry and an enum
          // the symbol name has the prefix "engine_category_" so we need to remove it to get the enum member name
          const enumValueKey = symbol.name.replace(
            new RegExp(`^${ENGINE_CATEGORY_STRING_PREFIX}`),
            ""
          );
          const enumValue = parseEngineCategory(enumValueKey);
          if (enumValue !== undefined) {
            // Same authoring site as localizedCategory — don't double-warn on override.
            ir.gameVariant.engineCategory = enumValue;
            ir.locations.record(
              ir.gameVariant,
              "engineCategory",
              parameter.location
            );
          }
        });
        break;
    }
  }
};
