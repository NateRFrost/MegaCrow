import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createMessageConnection,
  type MessageConnection,
} from "vscode-jsonrpc/browser";
import type {
  Diagnostic,
  InitializeParams,
  PublishDiagnosticsParams,
} from "vscode-languageserver-protocol";
import { createPlatformFileProvider } from "./fileProvider";
import { listPathDirectoryEntries } from "./listPathDirectory";
import { getActiveWorkspace, type Workspace } from "./workspace";

const DEFAULT_DOC_URI = "file:///megalo/editor.megalo";

export const MEGACROW_COMPILE_METHOD = "megacrow/compile";
export const MEGACROW_REQUEST_ARTIFACTS_METHOD = "megacrow/requestArtifacts";
export const MEGACROW_RESOLVE_INCLUDE_METHOD = "megacrow/resolveInclude";
export const MEGACROW_RESOLVE_BASE_FILE_METHOD = "megacrow/resolveBaseFile";
export const MEGACROW_LIST_DIRECTORY_METHOD = "megacrow/listDirectory";
export const MEGACROW_VERSION_CONFIGURATION_METHOD =
  "megacrow/versionConfiguration";
export const MEGACROW_ANALYZE_OBJECT_LIST_METHOD = "megacrow/analyzeObjectList";
export const MEGACROW_SET_OBJECT_LISTS_METHOD = "megacrow/setObjectLists";
export const MEGACROW_SET_MEGALO_VERSION_METHOD = "megacrow/setMegaloVersion";
export const MEGACROW_SET_RESOLVE_BASE_FILE_METHOD =
  "megacrow/setResolveBaseFile";
export const MEGACROW_SET_LOCALE_METHOD = "megacrow/setLocale";
export const MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD =
  "megacrow/setMegacrowExtensions";
export const MEGACROW_SET_COMPILER_SETTINGS_METHOD =
  "megacrow/setCompilerSettings";
export const MEGACROW_RESET_SESSION_METHOD = "megacrow/resetSession";

export type MegacrowArtifactKind =
  | "semanticTokens"
  | "diagnostics"
  | "mglo"
  | "mpvr"
  | "gvar";

export interface MegacrowCompileResult {
  dataBase64?: string;
  diagnostics: Diagnostic[];
  error?: string;
  limitUsage?: import("@megacrow/megalo").VariantLimitUsage;
  metadata?: import("@megacrow/megalo").CompiledMegaloMetadata;
  ok: boolean;
  /** Raw `.mglo` bitstream length (excludes BLF framing). */
  variantByteLength?: number;
}

export interface MegacrowRequestArtifactsResult {
  dataBase64?: string;
  diagnostics?: Diagnostic[];
  error?: string;
  limitUsage?: import("@megacrow/megalo").VariantLimitUsage;
  metadata?: MegacrowCompileResult["metadata"];
  ok?: boolean;
  semanticTokens?: number[];
  /** Raw `.mglo` bitstream length (excludes BLF framing). */
  variantByteLength?: number;
  version: number;
}

type DiagnosticsListener = (diagnostics: Diagnostic[]) => void;

interface ResolveIncludeParams {
  fromUri?: string;
  kind: "include" | "localized_include";
  path: string;
}

type ResolveIncludeResult = { text: string; uri: string } | { error: string };

interface ResolveBaseFileParams {
  fromUri?: string;
  path: string;
}

type ResolveBaseFileResult = { dataBase64: string } | { error: string };

interface ListDirectoryParams {
  directory: string;
  fromUri?: string;
}

type ListDirectoryResult =
  | { entries: Array<{ name: string; directory: boolean }> }
  | { error: string };

let connectionPromise: Promise<MessageConnection> | null = null;
let documentVersion = 1;
let documentOpen = false;
let documentUri = DEFAULT_DOC_URI;
/** Last text successfully sent to the LSP (avoid re-versioning on every completion). */
let lastSyncedText: string | null = null;
/** Absolute filesystem / OPFS path of the active editor file (for relative resolve). */
let activeFilePath: string | null = null;
let configuredWorkspace: Workspace | null = null;
const diagnosticsListeners = new Set<DiagnosticsListener>();

function decodeBase64(dataBase64: string): Uint8Array {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parentDirectory(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return ".";
  }
  // Slice the normalized form so `\` vs `/` index math stays consistent.
  const parent = normalized.slice(0, index);
  return /\\/.test(filePath) ? parent.replace(/\//g, "\\") : parent;
}

function pathToDocumentUri(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  if (normalized.startsWith("/")) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

function isPlaceholderDocumentUri(uri: string): boolean {
  return uri === DEFAULT_DOC_URI || uri.startsWith("file:///megalo/");
}

function uriToPath(uri: string | undefined): string | null {
  if (!uri || isPlaceholderDocumentUri(uri)) {
    return null;
  }
  if (uri.startsWith("file:///")) {
    const rest = uri.slice("file:///".length);
    // Windows: file:///C:/path → C:/path
    if (/^[A-Za-z]:\//.test(rest)) {
      return rest.replace(/\//g, "\\");
    }
    return `/${rest}`;
  }
  if (uri.startsWith("file://")) {
    return uri.slice("file://".length);
  }
  // Already a filesystem / OPFS path
  if (
    /^[A-Za-z]:[\\/]/.test(uri) ||
    uri.startsWith("/") ||
    uri.startsWith("workspace/")
  ) {
    return uri;
  }
  return null;
}

/** Directories to try for relative include / base resolution (same idea as compile). */
function resolveSearchDirs(fromUri: string | undefined): string[] {
  const dirs: string[] = [];
  const seen = new Set<string>();
  const add = (dir: string | null | undefined) => {
    if (!dir || dir === ".") {
      return;
    }
    const key = dir.replace(/\\/g, "/").toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    dirs.push(dir);
  };

  const fromPath = uriToPath(fromUri);
  if (fromPath) {
    add(parentDirectory(fromPath));
  }
  if (activeFilePath) {
    add(parentDirectory(activeFilePath));
  }
  const workspace = configuredWorkspace ?? getActiveWorkspace();
  add(workspace?.outputPath);
  add(workspace?.inputPath);

  return dirs.length > 0 ? dirs : ["."];
}

/** Configure workspace + active file used by resolveInclude / resolveBaseFile. */
export function lspConfigureResolveContext(options: {
  workspace?: Workspace | null;
  filePath?: string | null;
}): void {
  let textToResync: string | null = null;

  if (options.workspace !== undefined) {
    configuredWorkspace = options.workspace;
    const enabled = !!options.workspace?.outputPath?.trim();
    void getConnection().then((connection) => {
      connection.sendNotification(MEGACROW_SET_RESOLVE_BASE_FILE_METHOD, {
        enabled,
      });
    });
  }
  if (options.filePath !== undefined) {
    const nextPath = options.filePath;
    const nextUri = nextPath ? pathToDocumentUri(nextPath) : DEFAULT_DOC_URI;
    if (nextPath !== activeFilePath || nextUri !== documentUri) {
      const previousUri = documentUri;
      const wasOpen = documentOpen;
      // Editor often syncs before includeRoot is applied; reopen under the real URI.
      textToResync = lastSyncedText;
      activeFilePath = nextPath;
      documentUri = nextUri;
      documentOpen = false;
      lastSyncedText = null;
      // Drop markers immediately — late publishes for the previous URI are ignored.
      for (const listener of diagnosticsListeners) {
        listener([]);
      }
      if (wasOpen && previousUri !== nextUri) {
        void getConnection().then((connection) => {
          connection.sendNotification("textDocument/didClose", {
            textDocument: { uri: previousUri },
          });
        });
      }
    }
  }

  if (textToResync !== null) {
    void lspSyncDocument(textToResync);
  }
}

/**
 * Drop all LSP document / snapshot / pending-analysis state (workspace switch,
 * clear editor). Immediately clears client-side diagnostic listeners.
 */
export async function lspResetSession(): Promise<void> {
  const connection = await getConnection();
  const previousUri = documentUri;
  const wasOpen = documentOpen;
  documentOpen = false;
  lastSyncedText = null;
  documentUri = DEFAULT_DOC_URI;
  activeFilePath = null;
  for (const listener of diagnosticsListeners) {
    listener([]);
  }
  if (wasOpen) {
    connection.sendNotification("textDocument/didClose", {
      textDocument: { uri: previousUri },
    });
  }
  connection.sendNotification(MEGACROW_RESET_SESSION_METHOD, {});
}

async function handleResolveInclude(
  params: ResolveIncludeParams
): Promise<ResolveIncludeResult> {
  const workspace = configuredWorkspace ?? getActiveWorkspace();
  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    return { error: "No file provider available for include resolution" };
  }

  const tried: string[] = [];
  for (const dir of resolveSearchDirs(params.fromUri)) {
    const absolute = fileProvider.resolvePath(params.path, dir);
    tried.push(absolute);
    const text = await fileProvider.readText(absolute);
    if (text !== null) {
      return { text, uri: absolute };
    }
  }
  return {
    error: `Include file not found: ${params.path} (tried ${tried.join(", ")})`,
  };
}

async function handleResolveBaseFile(
  params: ResolveBaseFileParams
): Promise<ResolveBaseFileResult> {
  const workspace = configuredWorkspace ?? getActiveWorkspace();
  if (!workspace?.outputPath?.trim()) {
    return {
      error: "Base file resolution disabled (no workspace output folder)",
    };
  }
  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    return { error: "No file provider available for base file resolution" };
  }

  const tried: string[] = [];
  for (const dir of resolveSearchDirs(params.fromUri)) {
    const absolute = fileProvider.resolvePath(params.path, dir);
    tried.push(absolute);
    const bytes = fileProvider.readBytes
      ? await fileProvider.readBytes(absolute)
      : null;
    if (bytes !== null) {
      return { dataBase64: encodeBase64(bytes) };
    }
  }
  return {
    error: `Base file not found: ${params.path} (tried ${tried.join(", ")})`,
  };
}

async function handleListDirectory(
  params: ListDirectoryParams
): Promise<ListDirectoryResult> {
  const workspace = configuredWorkspace ?? getActiveWorkspace();
  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    return { error: "No file provider available for path completion" };
  }

  const relative = (params.directory ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const searchDirs = resolveSearchDirs(params.fromUri);
  const baseDir = searchDirs[0];
  if (!baseDir || baseDir === ".") {
    return { error: "No directory available for path completion" };
  }
  const absolute = relative
    ? fileProvider.resolvePath(relative, baseDir)
    : baseDir;
  const entries = await listPathDirectoryEntries(absolute);
  return { entries };
}

async function getConnection(): Promise<MessageConnection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const worker = new Worker(
        new URL("../workers/megaloLspWorker.ts", import.meta.url),
        { type: "module" }
      );
      const reader = new BrowserMessageReader(worker);
      const writer = new BrowserMessageWriter(worker);
      const connection = createMessageConnection(reader, writer);
      connection.listen();

      connection.onNotification(
        "textDocument/publishDiagnostics",
        (params: PublishDiagnosticsParams) => {
          // Ignore late publishes for closed / previous document URIs.
          if (params.uri !== documentUri) {
            return;
          }
          for (const listener of diagnosticsListeners) {
            listener(params.diagnostics);
          }
        }
      );

      connection.onRequest(
        MEGACROW_RESOLVE_INCLUDE_METHOD,
        (params: ResolveIncludeParams) => handleResolveInclude(params)
      );
      connection.onRequest(
        MEGACROW_RESOLVE_BASE_FILE_METHOD,
        (params: ResolveBaseFileParams) => handleResolveBaseFile(params)
      );
      connection.onRequest(
        MEGACROW_LIST_DIRECTORY_METHOD,
        (params: ListDirectoryParams) => handleListDirectory(params)
      );

      const initParams: InitializeParams = {
        processId: null,
        rootUri: null,
        capabilities: {
          textDocument: {
            semanticTokens: {
              requests: { full: true },
              tokenTypes: [],
              tokenModifiers: [],
              formats: ["relative"],
              overlappingTokenSupport: false,
              multilineTokenSupport: false,
            },
          },
        },
        workspaceFolders: null,
      };
      await connection.sendRequest("initialize", initParams);
      connection.sendNotification("initialized", {});
      return connection;
    })();
  }
  return connectionPromise;
}

export function subscribeLspDiagnostics(
  listener: DiagnosticsListener
): () => void {
  diagnosticsListeners.add(listener);
  return () => {
    diagnosticsListeners.delete(listener);
  };
}

export async function lspSyncDocument(text: string): Promise<void> {
  const connection = await getConnection();
  if (documentOpen && lastSyncedText === text) {
    return;
  }
  documentVersion += 1;
  lastSyncedText = text;
  if (!documentOpen) {
    documentOpen = true;
    connection.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri: documentUri,
        languageId: "megalo",
        version: documentVersion,
        text,
      },
    });
    return;
  }
  connection.sendNotification("textDocument/didChange", {
    textDocument: {
      uri: documentUri,
      version: documentVersion,
    },
    contentChanges: [{ text }],
  });
}

export async function lspCompileSource(
  text: string,
  fileType: "mglo" | "mpvr" | "gvar" = "mglo"
): Promise<{
  ok: boolean;
  bytes?: Uint8Array;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: MegacrowCompileResult["metadata"];
  variantByteLength?: number;
  limitUsage?: MegacrowCompileResult["limitUsage"];
}> {
  const artifacts = await lspRequestArtifacts(text, ["diagnostics", fileType]);
  if (!(artifacts.ok && artifacts.bytes)) {
    return {
      ok: false,
      diagnostics: artifacts.diagnostics ?? [],
      error: artifacts.error,
    };
  }
  return {
    ok: true,
    bytes: artifacts.bytes,
    diagnostics: artifacts.diagnostics ?? [],
    metadata: artifacts.metadata,
    variantByteLength: artifacts.variantByteLength,
    limitUsage: artifacts.limitUsage,
  };
}

/**
 * Request selected language-service artifacts for the active document.
 * Lex/parse runs at most once (reuses the LSP snapshot cache when possible).
 */
export async function lspRequestArtifacts(
  text: string,
  artifacts: MegacrowArtifactKind[]
): Promise<{
  ok?: boolean;
  bytes?: Uint8Array;
  diagnostics: Diagnostic[];
  error?: string;
  metadata?: MegacrowCompileResult["metadata"];
  semanticTokens?: number[];
  version: number;
  variantByteLength?: number;
  limitUsage?: MegacrowCompileResult["limitUsage"];
}> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = (await connection.sendRequest(
    MEGACROW_REQUEST_ARTIFACTS_METHOD,
    {
      textDocument: { uri: documentUri },
      text,
      artifacts,
    }
  )) as MegacrowRequestArtifactsResult;

  return {
    ok: result.ok,
    bytes: result.dataBase64 ? decodeBase64(result.dataBase64) : undefined,
    diagnostics: result.diagnostics ?? [],
    error: result.error,
    metadata: result.metadata,
    semanticTokens: result.semanticTokens,
    version: result.version,
    variantByteLength: result.variantByteLength,
    limitUsage: result.limitUsage,
  };
}

/** Request full semantic tokens for the active document (after syncing text). */
export async function lspSemanticTokens(text: string): Promise<number[]> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = (await connection.sendRequest(
    "textDocument/semanticTokens/full",
    {
      textDocument: { uri: documentUri },
    }
  )) as { data?: number[] } | null;
  return result?.data ?? [];
}

export async function lspHover(
  text: string,
  position: { line: number; character: number }
): Promise<{
  contents: { kind: string; value: string } | string;
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
} | null> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  return (await connection.sendRequest("textDocument/hover", {
    textDocument: { uri: documentUri },
    position,
  })) as {
    contents: { kind: string; value: string } | string;
    range?: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  } | null;
}

export interface LspDefinitionLocation {
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  uri: string;
}

/** Resolve go-to-definition (Ctrl+click) via the Megalo LSP. */
export async function lspDefinition(
  text: string,
  position: { line: number; character: number }
): Promise<LspDefinitionLocation[]> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  const result = await connection.sendRequest("textDocument/definition", {
    textDocument: { uri: documentUri },
    position,
  });

  const asLocation = (value: unknown): LspDefinitionLocation | null => {
    if (!(value && typeof value === "object")) {
      return null;
    }
    const record = value as Record<string, unknown>;
    if (
      typeof record.uri === "string" &&
      record.range &&
      typeof record.range === "object"
    ) {
      const range = record.range as LspDefinitionLocation["range"];
      return { uri: record.uri, range };
    }
    if (
      typeof record.targetUri === "string" &&
      record.targetSelectionRange &&
      typeof record.targetSelectionRange === "object"
    ) {
      return {
        uri: record.targetUri,
        range: record.targetSelectionRange as LspDefinitionLocation["range"],
      };
    }
    if (
      typeof record.targetUri === "string" &&
      record.targetRange &&
      typeof record.targetRange === "object"
    ) {
      return {
        uri: record.targetUri,
        range: record.targetRange as LspDefinitionLocation["range"],
      };
    }
    return null;
  };

  if (result === null || result === undefined) {
    return [];
  }
  if (Array.isArray(result)) {
    return result
      .map(asLocation)
      .filter(
        (location): location is LspDefinitionLocation => location !== null
      );
  }
  const single = asLocation(result);
  return single ? [single] : [];
}

export async function lspCompletions(
  text: string,
  position: { line: number; character: number }
): Promise<
  Array<{
    label: string;
    kind?: number;
    detail?: string;
    documentation?: string | { kind: string; value: string };
    filterText?: string;
    insertText?: string;
    insertTextFormat?: number;
    command?: { title: string; command: string; arguments?: unknown[] };
  }>
> {
  const connection = await getConnection();
  await lspSyncDocument(text);
  // Give the server a tick to apply didOpen/didChange before completion.
  await Promise.resolve();
  const result = await connection.sendRequest("textDocument/completion", {
    textDocument: { uri: documentUri },
    position,
  });
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === "object" && "items" in result) {
    return (
      result as {
        items: Array<{
          label: string;
          kind?: number;
          detail?: string;
          documentation?: string | { kind: string; value: string };
          filterText?: string;
          insertText?: string;
          insertTextFormat?: number;
          command?: { title: string; command: string; arguments?: unknown[] };
        }>;
      }
    ).items;
  }
  return [];
}

export function lspDocumentUri(): string {
  return documentUri;
}

export async function lspVersionConfiguration(): Promise<{
  objectListNames: readonly string[];
}> {
  const connection = await getConnection();
  return (await connection.sendRequest(
    MEGACROW_VERSION_CONFIGURATION_METHOD,
    {}
  )) as { objectListNames: readonly string[] };
}

export async function lspAnalyzeObjectList(text: string): Promise<{
  diagnostics: Diagnostic[];
}> {
  const connection = await getConnection();
  return (await connection.sendRequest(MEGACROW_ANALYZE_OBJECT_LIST_METHOD, {
    text,
  })) as { diagnostics: Diagnostic[] };
}

/** Sync workspace object lists into the LSP (null/omit → bundled defaults). */
export async function lspSetObjectLists(
  objectLists: import("@megacrow/megalo").ObjectLists | null
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_OBJECT_LISTS_METHOD, {
    objectLists,
  });
}

/** Switch the LSP session Megalo engine profile. */
export async function lspSetMegaloVersion(
  megaloVersion: import("@megacrow/megalo").MegaloVersionId
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_MEGALO_VERSION_METHOD, {
    megaloVersion,
  });
}

/** Sync diagnostics / hover locale into the LSP worker. */
export async function lspSetLocale(locale: "en" | "ja"): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_LOCALE_METHOD, { locale });
}

/** Sync MegaCrow extension flags (compiler profile) into the LSP worker. */
export async function lspSetMegacrowExtensions(
  megacrowExtensions: import("@megacrow/megalo").MegacrowExtensions
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_MEGACROW_EXTENSIONS_METHOD, {
    megacrowExtensions,
  });
}

/** Sync compiler settings (e.g. strict string literals) into the LSP worker. */
export async function lspSetCompilerSettings(
  compilerSettings: Partial<import("@megacrow/megalo").CompilerSettings>
): Promise<void> {
  const connection = await getConnection();
  connection.sendNotification(MEGACROW_SET_COMPILER_SETTINGS_METHOD, {
    compilerSettings,
  });
}
