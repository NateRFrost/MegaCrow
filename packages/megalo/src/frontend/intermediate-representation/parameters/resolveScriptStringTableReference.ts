import type { MegaloCompilerContext } from "src/context";
import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import type { IR } from "src/frontend/intermediate-representation";
import { assertSymbolKind } from "src/frontend/intermediate-representation/diagnostics/assertSymbolKind";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  literalStringTableEntry,
  type StringTable,
  type StringTableReference,
} from "src/frontend/intermediate-representation/game/string_table";
import { SymbolKind, type SymbolTable } from "src/frontend/symbol-table";

export interface StringTableResolveContext {
  frontend: MegaloCompilerContext;
  symbolTable: SymbolTable;
}

/**
 * Resolve a quoted string literal or string-symbol reference and add it to the
 * given string table.
 */
export const resolveStringTableEntry = (
  node: ASTParameterNode,
  table: StringTable,
  ctx: StringTableResolveContext
): StringTableReference => {
  assertSyntaxKind(node, [SyntaxKind.QUOTED_STRING, SyntaxKind.REFERENCE]);
  switch (node.kind) {
    case SyntaxKind.QUOTED_STRING:
      if (ctx.frontend.compilerSettings.strictStringLiterals) {
        throw new LowerError(
          diagnosticMessages.stringLiteralNotAllowedWhenStrict(),
          node.location
        );
      }
      return table.addEntry(literalStringTableEntry(node.value));
    case SyntaxKind.REFERENCE: {
      const symbol = ctx.symbolTable.getSymbol(node.symbolId);
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
  ctx: StringTableResolveContext
): StringTableReference =>
  resolveStringTableEntry(node, ir.gameVariant.scriptStrings, ctx);
