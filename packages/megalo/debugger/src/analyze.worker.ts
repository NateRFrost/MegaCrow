import { Parser } from "../../frontend/abstract-syntax-tree/index";
import { getCompilerForVersion } from "../../frontend/compile";
import {
  BUILT_IN_LOCATION,
  DiagnosticSeverity,
  Diagnostics,
} from "../../frontend/diagnostics";
import { FrontendError } from "../../frontend/error";
import { Lowerer } from "../../frontend/intermediate-representation";
import { setLocale } from "../../frontend/localization";
import {
  SymbolKind,
  type SymbolTable,
  type SymbolTableConstantEntry,
  type SymbolTableEntry,
  type SymbolTableGameOptionEntry,
  type SymbolTableHudWidgetEntry,
  type SymbolTableLoadoutEntry,
  type SymbolTableLoadoutPaletteEntry,
  type SymbolTableObjectFilterEntry,
  type SymbolTableObjectListItemEntry,
  type SymbolTableRequisitionPaletteEntry,
  type SymbolTableStringEntry,
  type SymbolTableVariableEntry,
} from "../../frontend/symbol-table";
import { Lexer, type Token, TokenKind } from "../../frontend/tokens/index";
import { getConfigurationForVersion } from "../../frontend/version-configuration";
import { MEGALO_VERSIONS } from "../../version";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  SaveGametypeRequest,
  SaveGametypeResponse,
  WorkerRequest,
  WorkerResponse,
} from "./analyze.types";

const MEGALO_VERSION = MEGALO_VERSIONS["107-mcc"];
const lexer = new Lexer(MEGALO_VERSION);
const parser = new Parser(MEGALO_VERSION);
const versionConfiguration = getConfigurationForVersion(MEGALO_VERSION);
const lowerer = new Lowerer(versionConfiguration);
const compiler = getCompilerForVersion(MEGALO_VERSION);

const debugLog = (event: string, details: Record<string, unknown> = {}): void => {
  console.log(`[megalo-worker] ${event}`, {
    at: performance.now().toFixed(1),
    ...details,
  });
};

const formatTokens = (tokens: Token[]): unknown =>
  tokens.map((token) => ({
    kind: TokenKind[token.kind] ?? token.kind,
    value: token.value,
    location: token.location,
  }));

const symbolKindName = (kind: SymbolKind): string => {
  switch (kind) {
    case SymbolKind.Constant:
      return "Constant";
    case SymbolKind.Variable:
      return "Variable";
    case SymbolKind.String:
      return "String";
    case SymbolKind.GameOption:
      return "GameOption";
    case SymbolKind.HudWidget:
      return "HudWidget";
    case SymbolKind.Loadout:
      return "Loadout";
    case SymbolKind.LoadoutPalette:
      return "LoadoutPalette";
    case SymbolKind.RequisitionPalette:
      return "RequisitionPalette";
    case SymbolKind.ObjectListItem:
      return "ObjectListItem";
    case SymbolKind.ObjectFilter:
      return "ObjectFilter";
  }
};

const serializeSymbolTableEntry = (entry: SymbolTableEntry): object => {
  const base = {
    id: entry.id,
    name: entry.name,
    kind: symbolKindName(entry.kind),
    range: entry.range,
    references: entry.references,
  };

  switch (entry.kind) {
    case SymbolKind.String: {
      const stringEntry = entry as SymbolTableStringEntry;
      return {
        ...base,
        languageDeclarations: Object.entries(
          stringEntry.languageDeclarations
        ).map(([language, declaration]) => ({ language, declaration })),
      };
    }
    case SymbolKind.Variable: {
      const variableEntry = entry as SymbolTableVariableEntry;
      return {
        ...base,
        type: variableEntry.type,
        declaration: variableEntry.declaration,
        scope: variableEntry.scope,
      };
    }
    case SymbolKind.Constant: {
      const constantEntry = entry as SymbolTableConstantEntry;
      return {
        ...base,
        type: constantEntry.type,
        declaration: constantEntry.declaration,
      };
    }
    case SymbolKind.GameOption: {
      const gameOptionEntry = entry as SymbolTableGameOptionEntry;
      return {
        ...base,
        type: gameOptionEntry.type,
        declaration: gameOptionEntry.declaration,
      };
    }
    case SymbolKind.HudWidget: {
      const hudWidgetEntry = entry as SymbolTableHudWidgetEntry;
      return {
        ...base,
        declaration: hudWidgetEntry.declaration,
      };
    }
    case SymbolKind.Loadout: {
      const loadoutEntry = entry as SymbolTableLoadoutEntry;
      return {
        ...base,
        declaration: loadoutEntry.declaration,
      };
    }
    case SymbolKind.LoadoutPalette: {
      const loadoutPaletteEntry = entry as SymbolTableLoadoutPaletteEntry;
      return {
        ...base,
        declaration: loadoutPaletteEntry.declaration,
      };
    }
    case SymbolKind.RequisitionPalette: {
      const requisitionPaletteEntry =
        entry as SymbolTableRequisitionPaletteEntry;
      return {
        ...base,
        declaration: requisitionPaletteEntry.declaration,
      };
    }
    case SymbolKind.ObjectListItem: {
      const objectListItemEntry = entry as SymbolTableObjectListItemEntry;
      return {
        ...base,
        objectType: objectListItemEntry.objectType,
        index: objectListItemEntry.index,
        declaration: objectListItemEntry.declaration,
      };
    }
    case SymbolKind.ObjectFilter: {
      const objectFilterEntry = entry as SymbolTableObjectFilterEntry;
      return {
        ...base,
        index: objectFilterEntry.index,
        declaration: objectFilterEntry.declaration,
      };
    }
  }

  return base;
};

const formatSymbolTable = (symbolTable: SymbolTable): unknown =>
  symbolTable.toArray().map(serializeSymbolTableEntry);

const jsonReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

/** Structured-clone-safe plain JSON (Maps / bigints / etc. normalized). */
const toPlainJson = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, jsonReplacer));

const analyze = (request: AnalyzeRequest): AnalyzeResponse => {
  const { id, source, locale, objectLists } = request;
  const analyzeStart = performance.now();
  debugLog("analyze-start", {
    generation: id,
    sourceLength: source.length,
    locale,
  });

  setLocale(locale);

  const diagnostics = new Diagnostics();

  const lexStart = performance.now();
  const tokens = lexer.lex(source, diagnostics);
  const lexDuration = performance.now() - lexStart;
  debugLog("lex-complete", {
    generation: id,
    durationMs: lexDuration,
    tokens: tokens.length,
    errors: diagnostics.getErrors().length,
    warnings: diagnostics.getWarnings().length,
  });

  const parseStart = performance.now();
  const ast = parser.parse(tokens, diagnostics, objectLists);
  const parseDuration = performance.now() - parseStart;
  debugLog("parse-complete", {
    generation: id,
    durationMs: parseDuration,
    astFailed: ast.failed,
    errors: diagnostics.getErrors().length,
    warnings: diagnostics.getWarnings().length,
  });

  const lowerStart = performance.now();
  const ir = lowerer.lower(ast, diagnostics, { objectLists });
  const lowerDuration = performance.now() - lowerStart;
  debugLog("lower-complete", {
    generation: id,
    durationMs: lowerDuration,
    errors: diagnostics.getErrors().length,
    warnings: diagnostics.getWarnings().length,
  });

  const dryRunStart = performance.now();
  if (!diagnostics.hasErrors()) {
    try {
      compiler.dryRun(ir, diagnostics);
      debugLog("dry-run-complete", {
        generation: id,
        durationMs: performance.now() - dryRunStart,
        errors: diagnostics.getErrors().length,
        warnings: diagnostics.getWarnings().length,
      });
    } catch (error) {
      // FrontendError is a critical invariant failure — let it escape to the
      // worker boundary. Other unexpected throws still surface as diagnostics.
      if (error instanceof FrontendError) {
        throw error;
      }
      console.error("Compile dry run failed", error);
      diagnostics.addError(
        error instanceof Error ? error.message : String(error),
        BUILT_IN_LOCATION
      );
      debugLog("dry-run-threw", {
        generation: id,
        durationMs: performance.now() - dryRunStart,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    debugLog("dry-run-skipped", {
      generation: id,
      reason: "diagnostics.hasErrors",
      errors: diagnostics.getErrors().length,
    });
  }

  const serializationStart = performance.now();
  const response: AnalyzeResponse = {
    type: "analyze",
    id,
    tokens: formatTokens(tokens),
    ast: toPlainJson(ast),
    symbolTable: formatSymbolTable(ast.symbolTable),
    ir: toPlainJson(ir),
    tokenCount: tokens.length,
    symbolCount: ast.symbolTable.toArray().length,
    lexDuration,
    parseDuration,
    lowerDuration,
    diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
  };
  debugLog("analyze-response-ready", {
    generation: id,
    serializationMs: performance.now() - serializationStart,
    totalMs: performance.now() - analyzeStart,
    diagnostics: response.diagnostics.length,
    errors: diagnostics.getErrors().length,
    warnings: diagnostics.getWarnings().length,
  });
  return response;
};

const saveGametype = (request: SaveGametypeRequest): SaveGametypeResponse => {
  const { id, source, locale, objectLists } = request;

  setLocale(locale);

  const diagnostics = new Diagnostics();

  try {
    const tokens = lexer.lex(source, diagnostics);
    const ast = parser.parse(tokens, diagnostics, objectLists);
    const ir = lowerer.lower(ast, diagnostics, { objectLists });
    if (diagnostics.hasErrors()) {
      return {
        type: "saveGametype",
        id,
        error: "Cannot save gametype while diagnostics have errors",
        diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
      };
    }
    const bytes = compiler.writeMegaloFile(ir, diagnostics);
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    return {
      type: "saveGametype",
      id,
      data,
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
    };
  } catch (error) {
    return {
      type: "saveGametype",
      id,
      error: error instanceof Error ? error.message : String(error),
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
    };
  }
};

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const request = event.data;
  let response: WorkerResponse;

  try {
    if (request.type === "saveGametype") {
      response = saveGametype(request);
      if (response.data !== undefined) {
        self.postMessage(response, [response.data]);
        return;
      }
    } else {
      response = analyze(request);
    }
  } catch (error) {
    console.error("[megalo-worker] unhandled error", error);
    if (request.type === "saveGametype") {
      response = {
        type: "saveGametype",
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
        diagnostics: [],
      };
    } else {
      response = {
        type: "analyze",
        id: request.id,
        tokens: [],
        ast: null,
        symbolTable: [],
        ir: null,
        tokenCount: 0,
        symbolCount: 0,
        lexDuration: 0,
        parseDuration: 0,
        lowerDuration: 0,
        diagnostics: [
          {
            severity: DiagnosticSeverity.Error,
            message: error instanceof Error ? error.message : String(error),
            location: BUILT_IN_LOCATION,
          },
        ],
      };
    }
  }

  debugLog("response-posted", {
    type: response.type,
    generation: response.id,
  });
  self.postMessage(response);
};
