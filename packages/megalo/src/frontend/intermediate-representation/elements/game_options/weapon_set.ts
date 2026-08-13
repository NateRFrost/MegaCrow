import { SyntaxKind } from "../../../abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "../../../abstract-syntax-tree/elements/game_options";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { SymbolKind, type SymbolTable } from "../../../symbol-table";
import { type Located, located } from "../..";
import { assertSyntaxKind } from "../../diagnostics/assertSyntaxKind";
import { LowerError } from "../../error";
import type { WeaponSet } from "../../game/game_engine_default";

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
