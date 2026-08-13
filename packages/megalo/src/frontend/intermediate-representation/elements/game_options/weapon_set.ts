import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import type { SourceCodeLocation } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import { ObjectListType } from "src/frontend/object-lists";
import { SymbolKind, type SymbolTable } from "src/frontend/symbol-table";
import { type Located, located } from "src/frontend/intermediate-representation";
import { assertSyntaxKind } from "src/frontend/intermediate-representation/diagnostics/assertSyntaxKind";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { WeaponSet } from "src/frontend/intermediate-representation/game/game_engine_default";

export const lowerWeaponSet = (
  node: OverrideEntryNode["value"],
  symbolTable: SymbolTable
): Located<WeaponSet> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(ObjectListType.WeaponSets, ""),
      (node as { location: SourceCodeLocation }).location
    );
  }
  assertSyntaxKind(node.value, [SyntaxKind.KEYWORD, SyntaxKind.REFERENCE]);
  const name =
    node.value.kind === SyntaxKind.KEYWORD
      ? node.value.value
      : node.value.identifier;
  const { location } = node.value;

  if (name === "none" || name === "default" || name === "random") {
    return located(name, location);
  }

  if (node.value.kind === SyntaxKind.REFERENCE) {
    const symbol = symbolTable.getSymbol(node.value.symbolId);
    if (
      symbol?.kind === SymbolKind.ObjectListItem &&
      symbol.objectType === ObjectListType.WeaponSets
    ) {
      return located(symbol.index, location);
    }
  }

  const match = symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === ObjectListType.WeaponSets &&
        entry.name === name
    );
  if (match === undefined || match.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(ObjectListType.WeaponSets, name),
      location
    );
  }
  return located(match.index, location);
};
