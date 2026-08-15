import type { SourceCodeLocation, SourceLocation } from "src/diagnostics";
import { SourceLocationType } from "src/diagnostics";
import {
  isBuiltInVariable,
  SymbolKind,
  type SymbolTableEntry,
} from "src/frontend/symbol-table";
import { emitLocation } from "src/language-service/highlighting/emit";
import type {
  SemanticToken,
  SemanticTokenModifier,
  SemanticTokenType,
} from "src/language-service/highlighting/types";

const asSourceCode = (
  location: SourceLocation
): SourceCodeLocation | undefined =>
  location.type === SourceLocationType.SOURCE_CODE ? location : undefined;

const symbolTokenType = (
  entry: SymbolTableEntry
): { type: SemanticTokenType; modifiers: SemanticTokenModifier[] } => {
  const modifiers: SemanticTokenModifier[] = [];
  switch (entry.kind) {
    case SymbolKind.Constant:
      return { type: "variable", modifiers: ["readonly"] };
    case SymbolKind.Variable: {
      if (isBuiltInVariable(entry)) {
        modifiers.push("readonly", "defaultLibrary");
      }
      return { type: "variable", modifiers };
    }
    case SymbolKind.GameOption:
      return { type: "variable", modifiers };
    case SymbolKind.String:
      return { type: "variable", modifiers: ["readonly"] };
    case SymbolKind.HudWidget:
    case SymbolKind.Loadout:
    case SymbolKind.LoadoutPalette:
    case SymbolKind.RequisitionPalette:
    case SymbolKind.ObjectFilter:
    case SymbolKind.PlayerTraits:
    case SymbolKind.GameStat:
      return { type: "variable", modifiers };
    case SymbolKind.ObjectListItem:
      return { type: "enumMember", modifiers: ["defaultLibrary"] };
    default: {
      const _exhaustive: never = entry;
      return _exhaustive;
    }
  }
};

export const highlightSymbol = (
  out: SemanticToken[],
  entry: SymbolTableEntry
): void => {
  const { type, modifiers } = symbolTokenType(entry);

  if (entry.kind === SymbolKind.String) {
    for (const decl of Object.values(entry.languageDeclarations)) {
      if (decl === undefined) {
        continue;
      }
      const sourceDecl = asSourceCode(decl);
      if (sourceDecl !== undefined) {
        emitLocation(out, sourceDecl, type, [...modifiers, "declaration"]);
      }
    }
  } else {
    const sourceDecl = asSourceCode(entry.declaration);
    if (sourceDecl !== undefined) {
      emitLocation(out, sourceDecl, type, [...modifiers, "declaration"]);
    }
  }

  for (const reference of entry.references) {
    emitLocation(out, reference, type, modifiers);
  }
};
