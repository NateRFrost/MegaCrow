import {
  type CompileSourceOptions,
  type AnalysisSnapshot,
  ALL_MEGACROW_EXTENSIONS,
  analyzeDocument,
  type CompiledMegaloMetadata,
  compileSource,
  type Diagnostic as MegaloDiagnostic,
  DiagnosticSeverity as MegaloSeverity,
  encodeSemanticTokens,
  getSemanticTokens,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type ObjectLists,
  SourceLocationType,
  type SupportedMegaloVersion,
} from "@megacrow/megalo";
import {
  type Diagnostic,
  DiagnosticSeverity,
  type SemanticTokensLegend,
} from "vscode-languageserver/browser";

export const MEGACROW_COMPILE_METHOD = "megacrow/compile";
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";

export const SEMANTIC_TOKENS_LEGEND: SemanticTokensLegend = {
  tokenTypes: [...SEMANTIC_TOKEN_TYPES],
  tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
};

export interface MegacrowCompileParams {
  objectLists?: ObjectLists;
  /** When omitted, the server uses the last synced document text for the URI. */
  text?: string;
  textDocument: { uri: string };
}

export interface MegacrowCompileResult {
  /** Base64-encoded `.mglo` bytes when compilation succeeded. */
  dataBase64?: string;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: CompiledMegaloMetadata;
  ok: boolean;
}

export interface MegacrowResolveIncludeParams {
  fromUri?: string;
  kind: "include" | "localized_include";
  path: string;
}

export type MegacrowResolveIncludeResult =
  | { text: string; uri: string }
  | { error: string };

export interface MegacrowResolveBaseFileParams {
  fromUri?: string;
  path: string;
}

export type MegacrowResolveBaseFileResult =
  | { dataBase64: string }
  | { error: string };

export type CompileResolvers = Pick<
  CompileSourceOptions,
  "resolveInclude" | "resolveBaseFile"
>;

export const toLspDiagnostics = (
  diagnostics: MegaloDiagnostic[]
): Diagnostic[] =>
  diagnostics.flatMap((d) => {
    const severity =
      d.severity === MegaloSeverity.Error
        ? DiagnosticSeverity.Error
        : d.severity === MegaloSeverity.Warning
          ? DiagnosticSeverity.Warning
          : DiagnosticSeverity.Information;

    if (d.location.type === SourceLocationType.SOURCE_CODE) {
      const { start, end } = d.location;
      return [
        {
          severity,
          message: d.message,
          range: {
            start: {
              line: Math.max(0, start.line - 1),
              character: Math.max(0, start.column - 1),
            },
            end: {
              line: Math.max(0, end.line - 1),
              character: Math.max(0, end.column - 1),
            },
          },
        },
      ];
    }

    if (d.location.type === SourceLocationType.INCLUDE) {
      const { start, end } = d.location.declaration;
      return [
        {
          severity,
          message: d.message,
          range: {
            start: {
              line: Math.max(0, start.line - 1),
              character: Math.max(0, start.column - 1),
            },
            end: {
              line: Math.max(0, end.line - 1),
              character: Math.max(0, end.column - 1),
            },
          },
        },
      ];
    }

    // UNKNOWN / BUILT_IN / OBJECT_LIST: no document span — omit from LSP publish.
    return [];
  });

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

export const analyzeAndCompile = async (
  source: string,
  options: {
    version: SupportedMegaloVersion;
    objectLists?: ObjectLists;
    fromUri?: string;
    resolvers?: CompileResolvers;
  }
): Promise<MegacrowCompileResult> => {
  const result = await compileSource(source, {
    version: options.version,
    objectLists: options.objectLists,
    fromUri: options.fromUri,
    resolveInclude: options.resolvers?.resolveInclude,
    resolveBaseFile: options.resolvers?.resolveBaseFile,
    megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
  });
  const diagnostics = toLspDiagnostics(result.diagnostics);
  if (!result.bytes) {
    return {
      ok: false,
      diagnostics,
      error: diagnostics.some((d) => d.severity === DiagnosticSeverity.Error)
        ? "Compilation failed"
        : "No output produced",
    };
  }

  return {
    ok: true,
    diagnostics,
    dataBase64: bytesToBase64(result.bytes),
    metadata: result.metadata,
  };
};

export const analyzeOnly = async (
  source: string,
  options: {
    version: SupportedMegaloVersion;
    objectLists?: ObjectLists;
    fromUri?: string;
    resolvers?: CompileResolvers;
  }
): Promise<Diagnostic[]> => {
  const result = await compileSource(source, {
    version: options.version,
    objectLists: options.objectLists,
    fromUri: options.fromUri,
    resolveInclude: options.resolvers?.resolveInclude,
    resolveBaseFile: options.resolvers?.resolveBaseFile,
    megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
  });
  return toLspDiagnostics(result.diagnostics);
};

export const classifySemanticTokens = async (
  source: string,
  options: {
    version: SupportedMegaloVersion;
    objectLists?: ObjectLists;
    fromUri?: string;
    resolvers?: CompileResolvers;
  }
): Promise<number[]> => {
  const snapshot = await analyzeDocumentSnapshot(source, options);
  return encodeSemanticTokens(getSemanticTokens(snapshot));
};

export const analyzeDocumentSnapshot = async (
  source: string,
  options: {
    version: SupportedMegaloVersion;
    objectLists?: ObjectLists;
    fromUri?: string;
    resolvers?: CompileResolvers;
  }
): Promise<AnalysisSnapshot> =>
  analyzeDocument(source, {
    version: options.version,
    objectLists: options.objectLists,
    fromUri: options.fromUri,
    resolveInclude: options.resolvers?.resolveInclude,
  });

export const semanticTokensFromSnapshot = (
  snapshot: AnalysisSnapshot
): number[] => encodeSemanticTokens(getSemanticTokens(snapshot));

export type { AnalysisSnapshot };
