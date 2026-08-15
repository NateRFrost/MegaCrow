import {
  ALL_MEGACROW_EXTENSIONS,
  type AnalysisSnapshot,
  analyzeDocument,
  type CompiledMegaloMetadata,
  type CompileSourceOptions,
  compileFromSnapshot,
  encodeSemanticTokens,
  getSemanticTokens,
  type Diagnostic as MegaloDiagnostic,
  DiagnosticSeverity as MegaloSeverity,
  type ObjectLists,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  SourceLocationType,
  type SupportedMegaloVersion,
  summarizeIncludeDiagnostics,
} from "@megacrow/megalo";
import {
  type Diagnostic,
  DiagnosticSeverity,
  type SemanticTokensLegend,
} from "vscode-languageserver/browser";

export const MEGACROW_COMPILE_METHOD = "megacrow/compile";
export const MEGACROW_REQUEST_ARTIFACTS_METHOD = "megacrow/requestArtifacts";
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";

export const SEMANTIC_TOKENS_LEGEND: SemanticTokensLegend = {
  tokenTypes: [...SEMANTIC_TOKEN_TYPES],
  tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
};

export type MegacrowArtifactKind = "semanticTokens" | "diagnostics" | "mglo";

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

export interface MegacrowRequestArtifactsParams {
  artifacts: MegacrowArtifactKind[];
  objectLists?: ObjectLists;
  /** When omitted, the server uses the last synced document text for the URI. */
  text?: string;
  textDocument: { uri: string };
}

export interface MegacrowRequestArtifactsResult {
  /** Base64-encoded `.mglo` bytes when `mglo` was requested and compilation succeeded. */
  dataBase64?: string;
  diagnostics?: Diagnostic[];
  error?: string;
  metadata?: CompiledMegaloMetadata;
  /** Present when `mglo` was requested. */
  ok?: boolean;
  semanticTokens?: number[];
  /** Document version the artifacts were computed for (server-side). */
  version: number;
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
  diagnostics: MegaloDiagnostic[],
  source?: string
): Diagnostic[] =>
  summarizeIncludeDiagnostics(diagnostics, source).flatMap(
    (d: MegaloDiagnostic) => {
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
    }
  );

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
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

export const parseDiagnosticsFromSnapshot = (
  snapshot: AnalysisSnapshot
): Diagnostic[] =>
  toLspDiagnostics(
    snapshot.parseDiagnostics as MegaloDiagnostic[],
    snapshot.source
  );

/**
 * Derive requested editor/compile artifacts from a single analysis snapshot.
 * When `snapshot` is provided, lex/parse is skipped.
 */
export const requestArtifactsFromSnapshot = async (
  snapshot: AnalysisSnapshot,
  options: {
    artifacts: readonly MegacrowArtifactKind[];
    documentVersion: number;
    fromUri?: string;
    objectLists?: ObjectLists;
    resolvers?: CompileResolvers;
  }
): Promise<MegacrowRequestArtifactsResult> => {
  const wantsTokens = options.artifacts.includes("semanticTokens");
  const wantsDiagnostics = options.artifacts.includes("diagnostics");
  const wantsMglo = options.artifacts.includes("mglo");

  const result: MegacrowRequestArtifactsResult = {
    version: options.documentVersion,
  };

  if (wantsTokens) {
    result.semanticTokens = semanticTokensFromSnapshot(snapshot);
  }

  if (wantsDiagnostics || wantsMglo) {
    const compiled = await compileFromSnapshot(snapshot, {
      version: snapshot.version,
      objectLists: options.objectLists,
      fromUri: options.fromUri,
      resolveInclude: options.resolvers?.resolveInclude,
      resolveBaseFile: options.resolvers?.resolveBaseFile,
      megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    });
    const diagnostics = toLspDiagnostics(compiled.diagnostics, snapshot.source);

    if (wantsDiagnostics || wantsMglo) {
      result.diagnostics = diagnostics;
    }

    if (wantsMglo) {
      if (compiled.bytes) {
        result.ok = true;
        result.dataBase64 = bytesToBase64(compiled.bytes);
        result.metadata = compiled.metadata;
      } else {
        result.ok = false;
        result.error = diagnostics.some(
          (d) => d.severity === DiagnosticSeverity.Error
        )
          ? "Compilation failed"
          : "No output produced";
      }
    }
  }

  return result;
};

export const requestArtifacts = async (
  source: string,
  options: {
    artifacts: readonly MegacrowArtifactKind[];
    documentVersion: number;
    version: SupportedMegaloVersion;
    objectLists?: ObjectLists;
    fromUri?: string;
    resolvers?: CompileResolvers;
    /** Reuse an existing snapshot instead of lexing/parsing again. */
    snapshot?: AnalysisSnapshot;
  }
): Promise<MegacrowRequestArtifactsResult> => {
  const snapshot =
    options.snapshot ??
    (await analyzeDocumentSnapshot(source, {
      version: options.version,
      objectLists: options.objectLists,
      fromUri: options.fromUri,
      resolvers: options.resolvers,
    }));

  return requestArtifactsFromSnapshot(snapshot, {
    artifacts: options.artifacts,
    documentVersion: options.documentVersion,
    fromUri: options.fromUri,
    objectLists: options.objectLists,
    resolvers: options.resolvers,
  });
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
  const artifacts = await requestArtifacts(source, {
    artifacts: ["diagnostics", "mglo"],
    documentVersion: 0,
    version: options.version,
    objectLists: options.objectLists,
    fromUri: options.fromUri,
    resolvers: options.resolvers,
  });
  return {
    ok: artifacts.ok === true,
    diagnostics: artifacts.diagnostics ?? [],
    dataBase64: artifacts.dataBase64,
    metadata: artifacts.metadata,
    error: artifacts.error,
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
  const artifacts = await requestArtifacts(source, {
    artifacts: ["diagnostics"],
    documentVersion: 0,
    version: options.version,
    objectLists: options.objectLists,
    fromUri: options.fromUri,
    resolvers: options.resolvers,
  });
  return artifacts.diagnostics ?? [];
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

export type { AnalysisSnapshot };
