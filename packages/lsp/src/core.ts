import {
  ALL_MEGACROW_EXTENSIONS,
  type AnalysisSnapshot,
  analyzeDocument,
  analyzeObjectListSource,
  type CompiledMegaloMetadata,
  type CompilerSettings,
  type CompileSourceOptions,
  compileFromSnapshot,
  completeQuotedPath,
  completionsAtPosition,
  DEFAULT_MEGACROW_EXTENSIONS,
  type DefinitionTarget,
  definitionAtPosition,
  encodeSemanticTokens,
  getConfigurationForVersion,
  getQuotedPathCompletionQuery,
  getSemanticTokens,
  hoverAtPosition,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  type MegacrowExtensions,
  type CompletionItem as MegaloCompletionItem,
  type CompletionKind as MegaloCompletionKind,
  type Diagnostic as MegaloDiagnostic,
  type HoverResult as MegaloHoverResult,
  DiagnosticSeverity as MegaloSeverity,
  type MegaloVersionId,
  type ObjectLists,
  type PathDirectoryEntry,
  type QuotedPathCompletionQuery,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  SourceLocationType,
  type SupportedMegaloVersion,
  summarizeIncludeDiagnostics,
} from "@megacrow/megalo";
import {
  type CompletionItem,
  CompletionItemKind,
  type Diagnostic,
  DiagnosticSeverity,
  InsertTextFormat,
  type LocationLink,
  type SemanticTokensLegend,
} from "vscode-languageserver-types";

export const MEGACROW_COMPILE_METHOD = "megacrow/compile";
export const MEGACROW_REQUEST_ARTIFACTS_METHOD = "megacrow/requestArtifacts";
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";
export const MEGACROW_LIST_DIRECTORY_METHOD = "megacrow/listDirectory";
export const MEGACROW_VERSION_CONFIGURATION_METHOD =
  "megacrow/versionConfiguration";
export const MEGACROW_ANALYZE_OBJECT_LIST_METHOD = "megacrow/analyzeObjectList";
export const MEGACROW_SET_OBJECT_LISTS_METHOD = "megacrow/setObjectLists";
export const MEGACROW_SET_RESOLVE_BASE_FILE_METHOD =
  "megacrow/setResolveBaseFile";
export const MEGACROW_SET_LOCALE_METHOD = "megacrow/setLocale";
export const MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD =
  "megacrow/setMegacrowExtensions";
export const MEGACROW_SET_COMPILER_SETTINGS_METHOD =
  "megacrow/setCompilerSettings";
/** Active Megalo engine profile for analysis / hover / completion. */
export const MEGACROW_SET_MEGALO_VERSION_METHOD = "megacrow/setMegaloVersion";
/** Drop all open documents, caches, and pending analysis (workspace / session switch). */
export const MEGACROW_RESET_SESSION_METHOD = "megacrow/resetSession";

export const SEMANTIC_TOKENS_LEGEND: SemanticTokensLegend = {
  tokenTypes: [...SEMANTIC_TOKEN_TYPES],
  tokenModifiers: [...SEMANTIC_TOKEN_MODIFIERS],
};

let sessionMegacrowExtensions: MegacrowExtensions = ALL_MEGACROW_EXTENSIONS;
let sessionCompilerSettings: Partial<CompilerSettings> = {};
let sessionMegaloVersion: SupportedMegaloVersion = MEGALO_VERSIONS["107-mcc"];

export const getSessionMegacrowExtensions = (): MegacrowExtensions =>
  sessionMegacrowExtensions;

export const setSessionMegacrowExtensions = (
  extensions: MegacrowExtensions
): void => {
  sessionMegacrowExtensions = extensions;
};

export const getSessionCompilerSettings = (): Partial<CompilerSettings> =>
  sessionCompilerSettings;

export const setSessionCompilerSettings = (
  settings: Partial<CompilerSettings>
): void => {
  sessionCompilerSettings = settings;
};

export const getSessionMegaloVersion = (): SupportedMegaloVersion =>
  sessionMegaloVersion;

export const setSessionMegaloVersion = (versionId: string): boolean => {
  if (!isMegaloVersionId(versionId)) {
    return false;
  }
  sessionMegaloVersion = MEGALO_VERSIONS[versionId];
  return true;
};

export const megacrowExtensionsForProfile = (
  profile: "megacrow" | "megaloedit"
): MegacrowExtensions =>
  profile === "megaloedit"
    ? DEFAULT_MEGACROW_EXTENSIONS
    : ALL_MEGACROW_EXTENSIONS;

export type MegacrowArtifactKind =
  | "semanticTokens"
  | "diagnostics"
  | "mglo"
  | "mpvr"
  | "gvar";

export interface MegacrowCompileParams {
  objectLists?: ObjectLists;
  /** When omitted, the server uses the last synced document text for the URI. */
  text?: string;
  textDocument: { uri: string };
}

export interface MegacrowCompileResult {
  /** Base64-encoded output bytes when compilation succeeded. */
  dataBase64?: string;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: CompiledMegaloMetadata;
  ok: boolean;
  /** Raw `.mglo` bitstream length (excludes BLF framing). */
  variantByteLength?: number;
}

export interface MegacrowRequestArtifactsParams {
  artifacts: MegacrowArtifactKind[];
  objectLists?: ObjectLists;
  /** When omitted, the server uses the last synced document text for the URI. */
  text?: string;
  textDocument: { uri: string };
}

export interface MegacrowRequestArtifactsResult {
  /** Base64-encoded output bytes when a binary artifact was requested and compilation succeeded. */
  dataBase64?: string;
  diagnostics?: Diagnostic[];
  error?: string;
  metadata?: CompiledMegaloMetadata;
  /** Present when a binary artifact was requested. */
  ok?: boolean;
  semanticTokens?: number[];
  /** Raw `.mglo` bitstream length (excludes BLF framing). */
  variantByteLength?: number;
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

export interface MegacrowListDirectoryParams {
  /** Relative directory under the document (or search root). Empty = document dir. */
  directory: string;
  fromUri?: string;
}

export type MegacrowListDirectoryResult =
  | { entries: PathDirectoryEntry[] }
  | { error: string };

export interface MegacrowVersionConfigurationResult {
  objectListNames: readonly string[];
}

export interface MegacrowAnalyzeObjectListParams {
  text: string;
}

export interface MegacrowAnalyzeObjectListResult {
  diagnostics: Diagnostic[];
}

export interface MegacrowSetObjectListsParams {
  /** Workspace object lists, or omit/`null` to use bundled defaults. */
  objectLists?: ObjectLists | null;
}

export interface MegacrowSetResolveBaseFileParams {
  /** When false, compile omits `resolveBaseFile` (silent sibling-source JIT). */
  enabled: boolean;
}

export interface MegacrowSetLocaleParams {
  /** Diagnostics / hover locale (`en` or `ja`). */
  locale: "en" | "ja";
}

export interface MegacrowSetMegacrowExtensionsParams {
  megacrowExtensions: MegacrowExtensions;
}

export interface MegacrowSetCompilerSettingsParams {
  compilerSettings: Partial<CompilerSettings>;
}

export interface MegacrowSetMegaloVersionParams {
  /** Engine profile id (e.g. `107-mcc`, `106`). */
  megaloVersion: MegaloVersionId;
}

/** Params for {@link MEGACROW_RESET_SESSION_METHOD} (currently unused; reserved). */
export type MegacrowResetSessionParams = Record<string, never>;

export type CompileResolvers = Pick<
  CompileSourceOptions,
  "resolveInclude" | "resolveBaseFile"
>;

export const versionConfigurationFor = (
  version: SupportedMegaloVersion
): MegacrowVersionConfigurationResult => {
  const configuration = getConfigurationForVersion(version);
  return {
    objectListNames: [...configuration.objectListNames],
  };
};

export const analyzeObjectListFor = (
  source: string,
  version: SupportedMegaloVersion
): MegacrowAnalyzeObjectListResult => ({
  diagnostics: toLspDiagnostics(analyzeObjectListSource(source, { version })),
});

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

      // UNKNOWN / BUILT_IN / OBJECT_LIST: no document span — still publish so
      // Problems / compile status aren't empty ("No output produced").
      return [
        {
          severity,
          message: d.message,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
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
    megacrowExtensions: sessionMegacrowExtensions,
    compilerSettings: sessionCompilerSettings,
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
  const fileType = options.artifacts.includes("mpvr")
    ? ("mpvr" as const)
    : options.artifacts.includes("gvar")
      ? ("gvar" as const)
      : options.artifacts.includes("mglo")
        ? ("mglo" as const)
        : undefined;
  const wantsBinary = fileType !== undefined;

  const result: MegacrowRequestArtifactsResult = {
    version: options.documentVersion,
  };

  if (wantsTokens) {
    result.semanticTokens = semanticTokensFromSnapshot(snapshot);
  }

  if (wantsDiagnostics || wantsBinary) {
    const compiled = await compileFromSnapshot(snapshot, {
      version: snapshot.version,
      objectLists: options.objectLists,
      fromUri: options.fromUri,
      resolveInclude: options.resolvers?.resolveInclude,
      resolveBaseFile: options.resolvers?.resolveBaseFile,
      megacrowExtensions: sessionMegacrowExtensions,
      compilerSettings: sessionCompilerSettings,
      fileType,
    });
    const diagnostics = toLspDiagnostics(compiled.diagnostics, snapshot.source);

    if (wantsDiagnostics || wantsBinary) {
      result.diagnostics = diagnostics;
    }

    if (wantsBinary) {
      if (compiled.bytes) {
        result.ok = true;
        result.dataBase64 = bytesToBase64(compiled.bytes);
        result.metadata = compiled.metadata;
        result.variantByteLength = compiled.variantByteLength;
      } else {
        result.ok = false;
        const firstError = diagnostics.find(
          (d) => d.severity === DiagnosticSeverity.Error
        );
        result.error = firstError?.message ?? "No output produced";
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
    variantByteLength: artifacts.variantByteLength,
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

/** URI scheme for definitions that live in another Megalo source file. */
export const MEGACROW_DEFINITION_SCHEME = "megacrow-definition";

export const definitionFromSnapshot = (
  snapshot: AnalysisSnapshot,
  documentUri: string,
  position: { line: number; character: number }
): LocationLink[] => {
  const target = definitionAtPosition(snapshot, position);
  if (!target) {
    return [];
  }

  if (target.kind === "current") {
    return [
      {
        targetUri: documentUri,
        targetRange: target.range,
        targetSelectionRange: target.range,
      },
    ];
  }

  const query = new URLSearchParams({
    file: target.file,
    line: String(target.range.start.line),
    character: String(target.range.start.character),
  });
  const targetUri = `${MEGACROW_DEFINITION_SCHEME}:/goto?${query.toString()}`;
  return [
    {
      targetUri,
      targetRange: target.range,
      targetSelectionRange: target.range,
    },
  ];
};

const toLspCompletionKind = (
  kind: MegaloCompletionKind
): CompletionItemKind => {
  switch (kind) {
    case "keyword":
      return CompletionItemKind.Keyword;
    case "function":
      return CompletionItemKind.Function;
    case "variable":
      return CompletionItemKind.Variable;
    case "enumMember":
      return CompletionItemKind.EnumMember;
    case "constant":
      return CompletionItemKind.Constant;
    case "property":
      return CompletionItemKind.Property;
    case "snippet":
      return CompletionItemKind.Snippet;
    case "file":
      return CompletionItemKind.File;
    case "folder":
      return CompletionItemKind.Folder;
    default:
      return CompletionItemKind.Text;
  }
};

const TRIGGER_SUGGEST_COMMAND = {
  title: "Suggest",
  command: "editor.action.triggerSuggest",
  // Ambient mode so empty results don't show Loading… / "No suggestions".
  arguments: [{ auto: true }],
} as const;

const toLspCompletionItems = (
  items: MegaloCompletionItem[]
): CompletionItem[] =>
  items.map((entry) => ({
    label: entry.label,
    kind: toLspCompletionKind(entry.kind),
    detail: entry.detail,
    insertText: entry.insertText,
    sortText: entry.sortText,
    filterText: entry.filterText,
    ...(entry.insertAsSnippet
      ? { insertTextFormat: InsertTextFormat.Snippet }
      : {}),
    ...(entry.triggerSuggestAfterAccept
      ? { command: TRIGGER_SUGGEST_COMMAND }
      : {}),
    ...(entry.documentation === undefined
      ? {}
      : {
          documentation: {
            kind: "markdown",
            value: entry.documentation,
          },
        }),
  }));

export const completionsFromSnapshot = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): CompletionItem[] =>
  toLspCompletionItems(completionsAtPosition(snapshot, position));

export const hoverFromSnapshot = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): MegaloHoverResult | null => hoverAtPosition(snapshot, position);

export const pathCompletionsFromEntries = (
  query: QuotedPathCompletionQuery,
  entries: readonly PathDirectoryEntry[]
): CompletionItem[] => toLspCompletionItems(completeQuotedPath(query, entries));

export type { AnalysisSnapshot, DefinitionTarget };
export { getQuotedPathCompletionQuery };
