import { SyntaxKind } from "../../../abstract-syntax-tree";
import type { OverrideEntryNode } from "../../../abstract-syntax-tree/elements/game_options";
import { OverrideValueKind } from "../../../abstract-syntax-tree/elements/game_options";
import type { SourceCodeLocation } from "../../../../diagnostics";
import { diagnosticMessages } from "../../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { SymbolKind, type SymbolTable } from "../../../symbol-table";
import { type Located, located } from "../..";
import { assertSyntaxKind } from "../../diagnostics/assertSyntaxKind";
import { LowerError } from "../../error";
import type { VehicleSet } from "../../game/game_engine_default";

export const lowerVehicleSet = (
  node: OverrideEntryNode["value"],
  symbolTable: SymbolTable
): Located<VehicleSet> => {
  if (node.kind !== OverrideValueKind.SIMPLE) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(ObjectListType.VehicleSets, ""),
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
      symbol.objectType === ObjectListType.VehicleSets
    ) {
      return located(symbol.index, location);
    }
  }

  const match = symbolTable
    .toArray()
    .find(
      (entry) =>
        entry.kind === SymbolKind.ObjectListItem &&
        entry.objectType === ObjectListType.VehicleSets &&
        entry.name === name
    );
  if (match === undefined || match.kind !== SymbolKind.ObjectListItem) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        ObjectListType.VehicleSets,
        name
      ),
      location
    );
  }
  return located(match.index, location);
};
