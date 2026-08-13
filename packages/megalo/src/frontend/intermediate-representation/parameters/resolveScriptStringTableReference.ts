import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { SymbolKind, type SymbolTable } from "src/frontend/symbol-table";
import type { IR } from "src/frontend/intermediate-representation";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { assertSymbolKind } from "src/frontend/intermediate-representation/diagnostics/assertSymbolKind";
import {
  literalStringTableEntry,
  type StringTable,
  type StringTableReference,
} from "src/frontend/intermediate-representation/game/string_table";

/**
 * Resolve a quoted string literal or string-symbol reference and add it to the
 * given string table.
 */
export const resolveStringTableEntry = (
  node: ASTParameterNode,
  table: StringTable,
  symbolTable: SymbolTable
): StringTableReference => {
  assertSyntaxKind(node, [SyntaxKind.QUOTED_STRING, SyntaxKind.REFERENCE]);
  switch (node.kind) {
    case SyntaxKind.QUOTED_STRING:
      return table.addEntry(literalStringTableEntry(node.value));
    case SyntaxKind.REFERENCE: {
      const symbol = symbolTable.getSymbol(node.symbolId);
      assertSymbolKind(symbol, SymbolKind.String);
      return table.addEntry(symbol.languageContents, node.symbolId);
    }
  }
};

/**
 * Resolve a quoted string literal or string-symbol reference and intern it into
 * the game variant's script string table.
 */
export const resolveScriptStringTableReference = (
  node: ASTParameterNode,
  ir: IR,
  symbolTable: SymbolTable
): StringTableReference =>
  resolveStringTableEntry(node, ir.gameVariant.scriptStrings, symbolTable);
