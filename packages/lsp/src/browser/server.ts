import { MEGALO_VERSIONS } from "@megacrow/megalo";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  type DidChangeTextDocumentParams,
  type InitializeParams,
  type InitializeResult,
  TextDocumentSyncKind,
} from "vscode-languageserver/browser";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  analyzeAndCompile,
  analyzeDocumentSnapshot,
  analyzeOnly,
  type CompileResolvers,
  MEGACROW_COMPILE_METHOD,
  MEGACROW_RESOLVE_BASE_FILE_METHOD,
  MEGACROW_RESOLVE_INCLUDE_METHOD,
  type MegacrowCompileParams,
  type MegacrowCompileResult,
  type MegacrowResolveBaseFileParams,
  type MegacrowResolveBaseFileResult,
  type MegacrowResolveIncludeParams,
  type MegacrowResolveIncludeResult,
  SEMANTIC_TOKENS_LEGEND,
  semanticTokensFromSnapshot,
} from "../core";
import type { AnalysisSnapshot } from "../core";

const DEFAULT_VERSION = MEGALO_VERSIONS["107-mcc"];

const reader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const writer = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connection = createConnection(reader, writer);

const documents = new Map<string, TextDocument>();

type SnapshotCacheEntry = {
  snapshot: AnalysisSnapshot;
  semanticTokens: number[];
  version: number;
};

const snapshotCache = new Map<string, SnapshotCacheEntry>();

const decodeBase64 = (dataBase64: string): Uint8Array => {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const createResolvers = (): CompileResolvers => ({
  resolveInclude: async (path, ctx) => {
    const result = (await connection.sendRequest(
      MEGACROW_RESOLVE_INCLUDE_METHOD,
      {
        path,
        kind: ctx.kind,
        fromUri: ctx.fromUri,
      } satisfies MegacrowResolveIncludeParams
    )) as MegacrowResolveIncludeResult;

    if ("error" in result) {
      throw new Error(result.error);
    }
    return { text: result.text, uri: result.uri };
  },
  resolveBaseFile: async (path, ctx) => {
    const result = (await connection.sendRequest(
      MEGACROW_RESOLVE_BASE_FILE_METHOD,
      {
        path,
        fromUri: ctx.fromUri,
      } satisfies MegacrowResolveBaseFileParams
    )) as MegacrowResolveBaseFileResult;

    if ("error" in result) {
      throw new Error(result.error);
    }
    return decodeBase64(result.dataBase64);
  },
});

const refreshSnapshot = async (
  uri: string,
  text: string,
  version: number
): Promise<SnapshotCacheEntry> => {
  const snapshot = await analyzeDocumentSnapshot(text, {
    version: DEFAULT_VERSION,
    fromUri: uri,
    resolvers: createResolvers(),
  });
  const entry: SnapshotCacheEntry = {
    snapshot,
    semanticTokens: semanticTokensFromSnapshot(snapshot),
    version,
  };
  snapshotCache.set(uri, entry);
  return entry;
};

const getCachedSnapshot = async (
  uri: string,
  doc: TextDocument
): Promise<SnapshotCacheEntry> => {
  const cached = snapshotCache.get(uri);
  if (cached && cached.version === doc.version) {
    return cached;
  }
  return refreshSnapshot(uri, doc.getText(), doc.version);
};

const publishFor = async (
  uri: string,
  text: string,
  version: number
): Promise<void> => {
  const resolvers = createResolvers();
  const [diagnostics] = await Promise.all([
    analyzeOnly(text, {
      version: DEFAULT_VERSION,
      fromUri: uri,
      resolvers,
    }),
    refreshSnapshot(uri, text, version),
  ]);
  connection.sendDiagnostics({ uri, diagnostics });
};

connection.onInitialize(
  (_params: InitializeParams): InitializeResult => ({
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      semanticTokensProvider: {
        legend: SEMANTIC_TOKENS_LEGEND,
        full: true,
        range: false,
      },
    },
    serverInfo: {
      name: "megacrow-lsp",
      version: "0.1.0",
    },
  })
);

connection.onDidOpenTextDocument((params) => {
  const { uri, languageId, version, text } = params.textDocument;
  const doc = TextDocument.create(uri, languageId, version, text);
  documents.set(uri, doc);
  void publishFor(uri, text, version);
});

connection.onDidChangeTextDocument((params: DidChangeTextDocumentParams) => {
  const uri = params.textDocument.uri;
  const existing = documents.get(uri);
  const change = params.contentChanges.at(-1);
  if (!(change && "text" in change) || typeof change.text !== "string") {
    return;
  }
  const version = params.textDocument.version;
  const doc = TextDocument.create(
    uri,
    existing?.languageId ?? "megalo",
    version,
    change.text
  );
  documents.set(uri, doc);
  void publishFor(uri, change.text, version);
});

connection.onDidCloseTextDocument((params) => {
  documents.delete(params.textDocument.uri);
  snapshotCache.delete(params.textDocument.uri);
  connection.sendDiagnostics({
    uri: params.textDocument.uri,
    diagnostics: [],
  });
});

connection.languages.semanticTokens.on(async (params) => {
  const uri = params.textDocument.uri;
  const doc = documents.get(uri);
  if (!doc) {
    return { data: [] };
  }
  const entry = await getCachedSnapshot(uri, doc);
  return { data: entry.semanticTokens };
});

connection.onRequest(
  MEGACROW_COMPILE_METHOD,
  async (params: MegacrowCompileParams): Promise<MegacrowCompileResult> => {
    const text =
      params.text ?? documents.get(params.textDocument.uri)?.getText() ?? "";
    const result = await analyzeAndCompile(text, {
      version: DEFAULT_VERSION,
      objectLists: params.objectLists,
      fromUri: params.textDocument.uri,
      resolvers: createResolvers(),
    });
    connection.sendDiagnostics({
      uri: params.textDocument.uri,
      diagnostics: result.diagnostics,
    });
    return result;
  }
);

connection.listen();
