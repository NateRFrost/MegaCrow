import type { FrontendContext } from "../context";
import {
  type Diagnostics,
  type SourceCodeLocation,
  type SourceLocation,
  SourceLocationType,
  type SourcePosition,
} from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { FrontendError } from "../error";
import {
  OBJECT_LIST_TYPES,
  type ObjectLists,
  type ObjectListType,
  objectListLocation,
} from "../object-lists";
import {
  type SymbolBinder,
  type SymbolId,
  SymbolKind,
  type SymbolTableEntry,
  VariableScope,
  VariableType,
} from "../symbol-table";
import {
  addBuiltInConstants,
  addBuiltInGameOptions,
  addBuiltInVariables,
} from "../symbol-table/built-in";
import {
  addBuiltInScopeVariables,
  type ParserScope,
  ParserScopeKind,
} from "../symbol-table/scope";
import { VARIABLE_TYPE_NAMES } from "../language-configuration/omni/variables";

/**
 * SymbolParser is used by the parser to refer to variables in scope.
 * We do a shallow Symbol Binder pass at parse to provide a subset of
 * symbol resolution as required for context-aware parsing.
 */
// Analysis lifecycle - we build a new one each analysis pass.
export class ParserSymbolContext {
  private readonly frontend: FrontendContext;
  public diagnostics: Diagnostics;

  private readonly symbolScopes: Map<string, SymbolId>[] = [new Map()];
  private readonly scopeSymbolIds: SymbolId[][] = [[]];
  // we store strings separately to everything else because Megalo supports variables
  // and strings with the same name, they dont shadow.
  private readonly declaredStrings: Map<string, SymbolId> = new Map();
  // MegaloEdit Headache #1 — FindIndex name lists (first declaration wins).
  private readonly declaredHudWidgets: Map<string, SymbolId[]> = new Map();
  private readonly declaredLoadouts: Map<string, SymbolId[]> = new Map();
  private readonly declaredLoadoutPalettes: Map<string, SymbolId[]> = new Map();
  private readonly declaredRequisitionPalettes: Map<string, SymbolId[]> =
    new Map();
  private readonly declaredObjectFilters: Map<string, SymbolId[]> = new Map();
  private readonly declaredUserDefinedOptions: Map<string, SymbolId[]> =
    new Map();
  private readonly declaredPlayerTraits: Map<string, SymbolId[]> = new Map();
  private readonly declaredGameStats: Map<string, SymbolId[]> = new Map();
  private readonly declaredObjectListItems = new Map<
    ObjectListType,
    Map<string, SymbolId>
  >();
  private readonly symbolBinder: SymbolBinder;

  public constructor(
    frontend: FrontendContext,
    diagnostics: Diagnostics,
    symbolTable: SymbolBinder,
    objectLists: ObjectLists = {}
  ) {
    this.frontend = frontend;
    this.diagnostics = diagnostics;
    this.symbolBinder = symbolTable;

    this.registerObjectListItems(objectLists, diagnostics);
    addBuiltInConstants(this.frontend.megaloVersion, this);
    addBuiltInVariables(this.frontend, this);
    addBuiltInGameOptions(this.frontend.megaloVersion, this);
  }

  private registerObjectListItems(
    objectLists: ObjectLists,
    diagnostics: Diagnostics
  ): void {
    for (const objectType of OBJECT_LIST_TYPES) {
      const entries = objectLists[objectType] ?? [];
      const byName = new Map<string, SymbolId>();
      for (let i = 0; i < entries.length; i++) {
        const name = entries[i]!;
        // object list files contain empty lines
        // they affect the object list indices,
        // but obviously we dont declare them as symbols
        if (name.trim() === "") {
          continue;
        }
        // First occurrence wins if duplicates exist.
        if (byName.has(name)) {
          diagnostics.addError(
            `Duplicate object "${name}" in ${objectType} object list`,
            objectListLocation(objectType, i)
          );
          continue;
        }

        const id = this.symbolBinder.addObjectListItem({
          name,
          objectType,
          index: i,
          declaration: objectListLocation(objectType, i),
        });
        byName.set(name, id);
      }
      this.declaredObjectListItems.set(objectType, byName);
    }
  }

  public currentScopeIsGlobal(): boolean {
    return this.symbolScopes.length === 1;
  }

  public addStringToScope(
    entry: Parameters<SymbolBinder["addString"]>[0]
  ): SymbolId | undefined {
    // string_table is only valid at top-level, so a string declaration not at global scope should be impossible.
    if (!this.currentScopeIsGlobal()) {
      throw new FrontendError(
        "Strings can only be declared in global scope.",
        entry.declaration
      );
    }

    const id = this.symbolBinder.addString(entry);
    if (id !== undefined) {
      this.declaredStrings.set(entry.name, id);
    }

    return id;
  }

  public addConstantToScope(
    entry: Parameters<SymbolBinder["addConstant"]>[0]
  ): SymbolId {
    // constants is only valid at top-level, so a constant declaration not at global scope should be impossible.
    if (!this.currentScopeIsGlobal()) {
      throw new FrontendError(
        "Constants can only be declared in global scope.",
        entry.declaration
      );
    }

    const id = this.symbolBinder.addConstant(entry);
    this.registerInCurrentScope(entry.name, id);
    return id;
  }

  public addVariableToScope(
    entry: Parameters<SymbolBinder["addVariable"]>[0]
  ): SymbolId {
    const id = this.symbolBinder.addVariable(entry);
    // MegaloEdit Headache #1: FindIndex (first wins) for global timers and all
    // member-scope vars; FindLastIndex (last wins) for other globals / temps.
    if (this.variableNameUsesFindIndex(entry.scope, entry.type)) {
      const existing = this.symbolScopes.at(-1)?.get(entry.name);
      if (existing !== undefined) {
        this.diagnostics.addWarning(
          diagnosticMessages.duplicateDeclarationNameIgnored(
            VARIABLE_TYPE_NAMES[entry.type],
            entry.name
          ),
          entry.declaration
        );
        this.scopeSymbolIds.at(-1)!.push(id);
        return id;
      }
    }
    this.registerInCurrentScope(entry.name, id);
    return id;
  }

  /** MegaloEdit Headache #1 — name lists resolved with FindIndex. */
  private variableNameUsesFindIndex(
    scope: VariableScope,
    type: VariableType
  ): boolean {
    if (scope === VariableScope.Temporary) {
      return false;
    }
    if (scope === VariableScope.Global) {
      return type === VariableType.Timer;
    }
    // player / team / object member variables
    return true;
  }

  public addGameOptionToScope(
    entry: Parameters<SymbolBinder["addGameOption"]>[0]
  ): SymbolId {
    // game_options is only valid at top-level, so a game option declaration not at global scope should be impossible.
    if (!this.currentScopeIsGlobal()) {
      throw new FrontendError(
        "Game options can only be declared in global scope.",
        entry.declaration
      );
    }

    const isBuiltIn = entry.declaration.type === SourceLocationType.BUILT_IN;
    if (isBuiltIn) {
      const id = this.symbolBinder.addGameOption({
        ...entry,
        index: undefined,
      });
      this.registerInCurrentScope(entry.name, id);
      return id;
    }

    // MegaloEdit Headache #1: UserDefinedOptionNames.FindIndex — first wins.
    const declarations =
      this.declaredUserDefinedOptions.get(entry.name) ?? [];
    const id = this.symbolBinder.addGameOption({
      ...entry,
      index: this.declarationCount(this.declaredUserDefinedOptions),
    });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored(
          "option",
          entry.name
        ),
        entry.declaration
      );
    } else {
      this.registerInCurrentScope(entry.name, id);
    }
    declarations.push(id);
    this.declaredUserDefinedOptions.set(entry.name, declarations);
    return id;
  }

  public lookupSymbol(symbolName: string): SymbolId | undefined {
    for (let i = this.symbolScopes.length - 1; i >= 0; i--) {
      const id = this.symbolScopes[i].get(symbolName);
      if (id !== undefined) {
        return id;
      }
    }

    return;
  }

  public getSymbolEntry(symbolId: SymbolId): SymbolTableEntry | undefined {
    return this.symbolBinder.getSymbolEntry(symbolId);
  }

  public recordReference(
    symbolId: SymbolId,
    reference: SourceCodeLocation
  ): void {
    this.symbolBinder.addReference(symbolId, reference);
  }

  public addHudWidgetToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: HudWidgetNames.FindIndex — first wins.
    const declarations = this.declaredHudWidgets.get(name) ?? [];
    const id = this.symbolBinder.addHudWidget({ name, declaration });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored("hud_widget", name),
        declaration
      );
    }
    declarations.push(id);
    this.declaredHudWidgets.set(name, declarations);
    return id;
  }

  public lookupHudWidget(name: string): SymbolId | undefined {
    return this.declaredHudWidgets.get(name)?.[0];
  }

  public addObjectFilterToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: mapObjectFilterNames.FindIndex — first wins.
    const declarations = this.declaredObjectFilters.get(name) ?? [];
    const id = this.symbolBinder.addObjectFilter({
      name,
      index: this.declarationCount(this.declaredObjectFilters),
      declaration,
    });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored("map_object", name),
        declaration
      );
    }
    declarations.push(id);
    this.declaredObjectFilters.set(name, declarations);
    return id;
  }

  public lookupObjectFilter(name: string): SymbolId | undefined {
    return this.declaredObjectFilters.get(name)?.[0];
  }

  public addPlayerTraitsToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: PlayerTraitRecipientNames.FindIndex — first wins.
    const declarations = this.declaredPlayerTraits.get(name) ?? [];
    const id = this.symbolBinder.addPlayerTraits({
      name,
      index: this.declarationCount(this.declaredPlayerTraits),
      declaration,
    });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored(
          "player_traits",
          name
        ),
        declaration
      );
    }
    declarations.push(id);
    this.declaredPlayerTraits.set(name, declarations);
    return id;
  }

  public lookupPlayerTraits(name: string): SymbolId | undefined {
    return this.declaredPlayerTraits.get(name)?.[0];
  }

  public addGameStatToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: GameStatisticNames.FindIndex — first wins.
    const declarations = this.declaredGameStats.get(name) ?? [];
    const id = this.symbolBinder.addGameStat({
      name,
      index: this.declarationCount(this.declaredGameStats),
      declaration,
    });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored("game_stats", name),
        declaration
      );
    }
    declarations.push(id);
    this.declaredGameStats.set(name, declarations);
    return id;
  }

  public lookupGameStat(name: string): SymbolId | undefined {
    return this.declaredGameStats.get(name)?.[0];
  }

  public addLoadoutToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: LoadoutNames.FindIndex — first wins.
    const declarations = this.declaredLoadouts.get(name) ?? [];
    const id = this.symbolBinder.addLoadout({ name, declaration });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored("loadout", name),
        declaration
      );
    }
    declarations.push(id);
    this.declaredLoadouts.set(name, declarations);
    return id;
  }

  public lookupLoadout(name: string): SymbolId | undefined {
    return this.declaredLoadouts.get(name)?.[0];
  }

  public addLoadoutPaletteToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: LoadoutPaletteNames.FindIndex — first wins.
    const declarations = this.declaredLoadoutPalettes.get(name) ?? [];
    const id = this.symbolBinder.addLoadoutPalette({ name, declaration });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored(
          "loadout_palette",
          name
        ),
        declaration
      );
    }
    declarations.push(id);
    this.declaredLoadoutPalettes.set(name, declarations);
    return id;
  }

  public lookupLoadoutPalette(name: string): SymbolId | undefined {
    return this.declaredLoadoutPalettes.get(name)?.[0];
  }

  public addRequisitionPaletteToScope(
    name: string,
    declaration: SourceLocation
  ): SymbolId {
    // MegaloEdit Headache #1: requisition palette names.FindIndex — first wins.
    const declarations = this.declaredRequisitionPalettes.get(name) ?? [];
    const id = this.symbolBinder.addRequisitionPalette({ name, declaration });
    if (declarations.length > 0) {
      this.diagnostics.addWarning(
        diagnosticMessages.duplicateDeclarationNameIgnored(
          "requisition_palette",
          name
        ),
        declaration
      );
    }
    declarations.push(id);
    this.declaredRequisitionPalettes.set(name, declarations);
    return id;
  }

  public lookupRequisitionPalette(name: string): SymbolId | undefined {
    return this.declaredRequisitionPalettes.get(name)?.[0];
  }

  public lookupObjectListItem(
    objectType: ObjectListType,
    name: string
  ): SymbolId | undefined {
    return this.declaredObjectListItems.get(objectType)?.get(name);
  }

  public lookupString(name: string): SymbolId | undefined {
    return this.declaredStrings.get(name);
  }

  /** Prefer english content; otherwise the first declared language's text. */
  public lookupStringContent(name: string): string | undefined {
    const id = this.declaredStrings.get(name);
    if (id === undefined) {
      return;
    }

    const entry = this.symbolBinder.getSymbolEntry(id);
    if (entry === undefined || entry.kind !== SymbolKind.String) {
      return;
    }

    const english = entry.languageContents.english;
    if (english !== undefined) {
      return english;
    }

    for (const content of Object.values(entry.languageContents)) {
      if (content !== undefined) {
        return content;
      }
    }

    return;
  }

  public pushScope(scope: ParserScope = { kind: ParserScopeKind.Block }): void {
    this.symbolScopes.push(new Map());
    this.scopeSymbolIds.push([]);
    addBuiltInScopeVariables(this.frontend.megaloVersion, this, scope);
  }

  /**
   * Pop the current (non-global) scope and mark its symbols as ending at `endPosition`.
   * Built-in declarations keep an open range.
   */
  public popScope(endPosition?: SourcePosition): void {
    if (this.symbolScopes.length <= 1) {
      throw new FrontendError("Cannot pop global scope.", {
        type: SourceLocationType.SOURCE_CODE,
        start: {
          localOffset: 0,
          absoluteOffset: 0,
          line: 1,
          column: 1,
        },
        end: {
          localOffset: 0,
          absoluteOffset: 0,
          line: 1,
          column: 1,
        },
      });
    }

    const ids = this.scopeSymbolIds.pop()!;
    this.symbolScopes.pop();

    if (endPosition !== undefined) {
      for (const id of ids) {
        const entry = this.symbolBinder.getSymbolEntry(id);
        if (entry !== undefined && entry.range.start.localOffset !== -1) {
          this.symbolBinder.setScopeEnd(id, endPosition);
        }
      }
    }
  }

  private registerInCurrentScope(name: string, id: SymbolId): void {
    this.symbolScopes.at(-1)!.set(name, id);
    this.scopeSymbolIds.at(-1)!.push(id);
  }

  private declarationCount(map: Map<string, SymbolId[]>): number {
    let count = 0;
    for (const ids of map.values()) {
      count += ids.length;
    }
    return count;
  }
}
