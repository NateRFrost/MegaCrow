import type { MegaloCompilerContext } from "src/context";
import {
  BUILT_IN_POSITION,
  type Diagnostics,
  OPEN_ENDED_POSITION,
  type SourceCodeLocation,
  type SourceLocation,
  SourceLocationType,
  type SourcePosition,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import {
  type StringTableEntry,
  stringTableEntry,
} from "src/frontend/intermediate-representation/game/string_table";
import type { StringTableLanguage } from "src/frontend/language-configuration/omni/strings";
import type { ObjectListType } from "src/frontend/object-lists";

export enum SymbolKind {
  Constant = 0,
  Variable = 1,
  String = 2,
  GameOption = 3,
  HudWidget = 4,
  Loadout = 5,
  LoadoutPalette = 6,
  RequisitionPalette = 7,
  ObjectListItem = 8,
  ObjectFilter = 9,
  PlayerTraits = 10,
  GameStat = 11,
}

// Modelled based on Bungie.Megalo.VariableType
export enum VariableType {
  Timer = 0,
  Number = 1,
  Team = 2,
  Player = 3,
  Object = 4,
}

export enum VariableScope {
  Global = 0,
  Team = 1,
  Player = 2,
  Object = 3,
  Temporary = 4,
}

export type SymbolId = number;

export interface SymbolTableEntryBase {
  id: SymbolId;
  name: string;

  /**
   * Lexical scope range.
   * `start` is the declaration position (built-ins use {@link BUILT_IN_POSITION}).
   * `end` is the exclusive end of visibility; open-ended symbols (globals, built-ins)
   * keep `end` as {@link OPEN_ENDED_POSITION} until EOF / {@link SymbolTable.setScopeEnd}.
   */
  range: SourceCodeLocation;

  references: SourceCodeLocation[];
}

const openEndedRange = (start: SourcePosition): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start,
  end: OPEN_ENDED_POSITION,
});

const declarationRange = (declaration: SourceLocation): SourceCodeLocation => {
  switch (declaration.type) {
    case SourceLocationType.BUILT_IN:
      return openEndedRange(BUILT_IN_POSITION);
    case SourceLocationType.OBJECT_LIST:
      return openEndedRange(declaration.source);
    case SourceLocationType.INCLUDE:
      // Prefer the span inside the included file (absolute offsets are rebased
      // on the unfurled program); the include directive is on `declaration`.
      return openEndedRange(declaration.source.start);
    case SourceLocationType.SOURCE_CODE:
      return openEndedRange(declaration.start);
    case SourceLocationType.UNKNOWN:
      return openEndedRange(OPEN_ENDED_POSITION);
    default: {
      const _exhaustive: never = declaration;
      return _exhaustive;
    }
  }
};

export type SymbolTableVariableEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Variable;
  type: VariableType;
  declaration: SourceLocation;
  scope: VariableScope;
};

/** True when the variable was injected by the compiler (not user-declared). */
export const isBuiltInVariable = (symbol: SymbolTableVariableEntry): boolean =>
  symbol.declaration.type === SourceLocationType.BUILT_IN;

export type SymbolTableGameOptionEntry = SymbolTableEntryBase & {
  kind: SymbolKind.GameOption;
  type: VariableType.Number;
  declaration: SourceLocation;
  // Undefined for built-in game options
  index?: number;
};

export type SymbolTableConstantEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Constant;
  type: VariableType.Number;
  declaration: SourceLocation;
  value: number;
};

export type SymbolTableStringEntry = SymbolTableEntryBase & {
  kind: SymbolKind.String;
  languageDeclarations: Partial<Record<StringTableLanguage, SourceLocation>>;
  languageContents: StringTableEntry;
};

export type SymbolTableHudWidgetEntry = SymbolTableEntryBase & {
  kind: SymbolKind.HudWidget;
  declaration: SourceLocation;
};

export type SymbolTableLoadoutEntry = SymbolTableEntryBase & {
  kind: SymbolKind.Loadout;
  declaration: SourceLocation;
};

export type SymbolTableLoadoutPaletteEntry = SymbolTableEntryBase & {
  kind: SymbolKind.LoadoutPalette;
  declaration: SourceLocation;
};

export type SymbolTableRequisitionPaletteEntry = SymbolTableEntryBase & {
  kind: SymbolKind.RequisitionPalette;
  declaration: SourceLocation;
};

export type SymbolTableObjectListItemEntry = SymbolTableEntryBase & {
  kind: SymbolKind.ObjectListItem;
  objectType: ObjectListType;
  index: number;
  declaration: SourceLocation;
};

export type SymbolTableObjectFilterEntry = SymbolTableEntryBase & {
  kind: SymbolKind.ObjectFilter;
  index: number;
  declaration: SourceLocation;
};

export type SymbolTablePlayerTraitsEntry = SymbolTableEntryBase & {
  kind: SymbolKind.PlayerTraits;
  index: number;
  declaration: SourceLocation;
};

export type SymbolTableGameStatEntry = SymbolTableEntryBase & {
  kind: SymbolKind.GameStat;
  index: number;
  declaration: SourceLocation;
};

export type SymbolTableEntry =
  | SymbolTableVariableEntry
  | SymbolTableConstantEntry
  | SymbolTableStringEntry
  | SymbolTableGameOptionEntry
  | SymbolTableHudWidgetEntry
  | SymbolTableLoadoutEntry
  | SymbolTableLoadoutPaletteEntry
  | SymbolTableRequisitionPaletteEntry
  | SymbolTableObjectListItemEntry
  | SymbolTableObjectFilterEntry
  | SymbolTablePlayerTraitsEntry
  | SymbolTableGameStatEntry;

export class SymbolTable {
  private readonly table: SymbolTableEntry[] = [];

  public constructor(table: SymbolTableEntry[]) {
    this.table = table;
  }

  public getSymbol(symbolId: SymbolId): SymbolTableEntry | undefined {
    return this.table.find((symbol) => symbol.id === symbolId);
  }

  public toArray(): readonly SymbolTableEntry[] {
    return this.table;
  }

  public findVariableByName(
    name: string
  ): SymbolTableVariableEntry | undefined {
    const matches = this.table.filter(
      (symbol): symbol is SymbolTableVariableEntry =>
        symbol.kind === SymbolKind.Variable && symbol.name === name
    );
    if (matches.length === 0) {
      return;
    }
    if (matches.length === 1) {
      return matches[0];
    }

    // MegaloEdit Headache #1
    const last = matches.at(-1)!;
    const sameList = matches.filter(
      (symbol) => symbol.scope === last.scope && symbol.type === last.type
    );
    if (sameList.length > 1) {
      const resolvesLastDeclared =
        last.scope === VariableScope.Temporary ||
        (last.scope === VariableScope.Global &&
          last.type !== VariableType.Timer);
      return resolvesLastDeclared ? sameList.at(-1) : sameList[0];
    }

    return matches[0];
  }

  public lookupUserDefinedOptionIndex(name: string): number | undefined {
    for (const symbol of this.table) {
      if (
        symbol.kind === SymbolKind.GameOption &&
        symbol.index !== undefined &&
        symbol.name === name
      ) {
        return symbol.index;
      }
    }
    return;
  }

  public lookupGameStatIndex(name: string): number | undefined {
    for (const symbol of this.table) {
      if (symbol.kind === SymbolKind.GameStat && symbol.name === name) {
        return symbol.index;
      }
    }
    return;
  }

  public variablesOf(
    scope: VariableScope,
    type: VariableType
  ): readonly SymbolTableVariableEntry[] {
    return this.table.filter(
      (symbol): symbol is SymbolTableVariableEntry =>
        symbol.kind === SymbolKind.Variable &&
        !isBuiltInVariable(symbol) &&
        symbol.scope === scope &&
        symbol.type === type
    );
  }
}

/**
 * SymbolBinder is responsible for binding symbols to their declarations and adding references to them.
 * It handles diagnostics for things related to symbol declarations, like duplicate declarations or scope issues.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class SymbolBinder {
  private readonly table: SymbolTableEntry[] = [];
  private readonly diagnostics: Diagnostics;

  public constructor(
    frontend: MegaloCompilerContext,
    diagnostics: Diagnostics
  ) {
    void frontend;
    this.diagnostics = diagnostics;
  }

  public addString(
    entry: Pick<SymbolTableStringEntry, "name"> & {
      language: StringTableLanguage;
      content: string;
      declaration: SourceLocation;
    }
  ): SymbolId | undefined {
    const existingString = this.table.find(
      (symbol): symbol is SymbolTableStringEntry =>
        symbol.kind === SymbolKind.String && symbol.name === entry.name
    );

    // if the string has already been declared for this language, error
    if (existingString?.languageDeclarations[entry.language] !== undefined) {
      if (entry.declaration.type === SourceLocationType.SOURCE_CODE) {
        this.diagnostics.addError(
          diagnosticMessages.stringAlreadyDefined(entry.language, entry.name),
          entry.declaration
        );
      }
      return;
    }

    // if the string has already been declared but not for this language, add the new language declaration
    if (existingString) {
      existingString.languageDeclarations[entry.language] = entry.declaration;
      existingString.languageContents[entry.language] = entry.content;
      return existingString.id;
    }

    // if the string is entirely new, declare it
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.String,
      languageDeclarations: { [entry.language]: entry.declaration },
      languageContents: stringTableEntry(entry.language, entry.content),
    });
    return id;
  }

  public addVariable(
    entry: Pick<
      SymbolTableVariableEntry,
      "name" | "type" | "declaration" | "scope"
    >
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Variable,
      type: entry.type,
      declaration: entry.declaration,
      scope: entry.scope,
    });
    return id;
  }

  public addGameOption(
    entry: Pick<
      SymbolTableGameOptionEntry,
      "name" | "type" | "declaration" | "index"
    >
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.GameOption,
      type: entry.type,
      declaration: entry.declaration,
      index: entry.index,
    });
    return id;
  }

  public addConstant(
    entry: Pick<SymbolTableConstantEntry, "name" | "declaration" | "value">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Constant,
      type: VariableType.Number,
      declaration: entry.declaration,
      value: entry.value,
    });
    return id;
  }

  public addHudWidget(
    entry: Pick<SymbolTableHudWidgetEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.HudWidget,
      declaration: entry.declaration,
    });
    return id;
  }

  public addLoadout(
    entry: Pick<SymbolTableLoadoutEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.Loadout,
      declaration: entry.declaration,
    });
    return id;
  }

  public addLoadoutPalette(
    entry: Pick<SymbolTableLoadoutPaletteEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.LoadoutPalette,
      declaration: entry.declaration,
    });
    return id;
  }

  public addRequisitionPalette(
    entry: Pick<SymbolTableRequisitionPaletteEntry, "name" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.RequisitionPalette,
      declaration: entry.declaration,
    });
    return id;
  }

  public addObjectListItem(
    entry: Pick<
      SymbolTableObjectListItemEntry,
      "name" | "objectType" | "index" | "declaration"
    >
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.ObjectListItem,
      objectType: entry.objectType,
      index: entry.index,
      declaration: entry.declaration,
    });
    return id;
  }

  public addObjectFilter(
    entry: Pick<SymbolTableObjectFilterEntry, "name" | "index" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.ObjectFilter,
      index: entry.index,
      declaration: entry.declaration,
    });
    return id;
  }

  public addPlayerTraits(
    entry: Pick<SymbolTablePlayerTraitsEntry, "name" | "index" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.PlayerTraits,
      index: entry.index,
      declaration: entry.declaration,
    });
    return id;
  }

  public addGameStat(
    entry: Pick<SymbolTableGameStatEntry, "name" | "index" | "declaration">
  ): SymbolId {
    const id = this.table.length;
    this.table.push({
      id,
      range: declarationRange(entry.declaration),
      references: [],
      name: entry.name,
      kind: SymbolKind.GameStat,
      index: entry.index,
      declaration: entry.declaration,
    });
    return id;
  }

  public addReference(symbolId: SymbolId, reference: SourceCodeLocation): void {
    this.table[symbolId].references.push(reference);
  }

  public setScopeEnd(symbolId: SymbolId, position: SourcePosition): void {
    const entry = this.table[symbolId];
    if (entry !== undefined) {
      entry.range = {
        ...entry.range,
        end: position,
      };
    }
  }

  public getSymbolEntry(symbolId: SymbolId): SymbolTableEntry | undefined {
    return this.table[symbolId];
  }

  public getSymbolTable(): SymbolTable {
    return new SymbolTable(this.table);
  }
}
