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
import type { AnalysisSnapshot } from "../core";
import {
  analyzeAndCompile,
  analyzeDocumentSnapshot,
  type CompileResolvers,
  MEGACROW_COMPILE_METHOD,
  MEGACROW_REQUEST_ARTIFACTS_METHOD,
  MEGACROW_RESOLVE_BASE_FILE_METHOD,
  MEGACROW_RESOLVE_INCLUDE_METHOD,
  type MegacrowCompileParams,
  type MegacrowCompileResult,
  type MegacrowRequestArtifactsParams,
  type MegacrowRequestArtifactsResult,
  type MegacrowResolveBaseFileParams,
  type MegacrowResolveBaseFileResult,
  type MegacrowResolveIncludeParams,
  type MegacrowResolveIncludeResult,
  parseDiagnosticsFromSnapshot,
  requestArtifactsFromSnapshot,
  SEMANTIC_TOKENS_LEGEND,
  semanticTokensFromSnapshot,
} from "../core";

const DEFAULT_VERSION = MEGALO_VERSIONS["107-mcc"];

const reader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const writer = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connection = createConnection(reader, writer);

const documents = new Map<string, TextDocument>();

interface SnapshotCacheEntry {
  semanticTokens: number[];
  snapshot: AnalysisSnapshot;
  version: number;
}

const snapshotCache = new Map<string, SnapshotCacheEntry>();
const snapshotInflight = new Map<string, Promise<SnapshotCacheEntry>>();

/** Coalesce didChange analyzes: one in flight; always process the newest pending. */
let publishPending: { uri: string; text: string; version: number } | null =
  null;
let publishBusy = false;

/** Coalesce requestArtifacts: one in flight; newest params win. */
let artifactsPending: {
  params: MegacrowRequestArtifactsParams;
  resolve: (value: MegacrowRequestArtifactsResult) => void;
  reject: (reason: unknown) => void;
} | null = null;
let artifactsBusy = false;

const staleArtifactsResult = (
  version: number
): MegacrowRequestArtifactsResult => ({
  version,
  ok: false,
  error: "superseded",
  diagnostics: [],
});

const decodeBase64 = (dataBase64: string): Uint8Array => {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const createResolvers = (): CompileResolvers => ({
  resolveInclude: async (
    path: string,
    ctx: { kind: "include" | "localized_include"; fromUri?: string }
  ) => {
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
  resolveBaseFile: async (path: string, ctx: { fromUri?: string }) => {
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

const refreshSnapshot = (
  uri: string,
  text: string,
  version: number
): Promise<SnapshotCacheEntry> => {
  const cached = snapshotCache.get(uri);
  if (cached && cached.version === version) {
    return Promise.resolve(cached);
  }

  const inflightKey = `${uri}:${version}`;
  const existing = snapshotInflight.get(inflightKey);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
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
  })().finally(() => {
    snapshotInflight.delete(inflightKey);
  });

  snapshotInflight.set(inflightKey, promise);
  return promise;
};

const getCachedSnapshot = async (
  uri: string,
  doc: TextDocument
): Promise<SnapshotCacheEntry> => {
  const cached = snapshotCache.get(uri);
  if (cached && cached.version === doc.version) {
    return cached;
  }
  return await refreshSnapshot(uri, doc.getText(), doc.version);
};

/** Lex+parse once on sync; publish parse diagnostics only (full compile is debounced). */
const publishFor = async (
  uri: string,
  text: string,
  version: number
): Promise<void> => {
  const entry = await refreshSnapshot(uri, text, version);
  connection.sendDiagnostics({
    uri,
    diagnostics: parseDiagnosticsFromSnapshot(entry.snapshot),
  });
};

/**
 * One analyze at a time. Intermediate keystrokes are dropped; only the newest
 * pending document is processed after the current run finishes.
 */
const drainPublish = async (): Promise<void> => {
  if (publishBusy) {
    return;
  }
  publishBusy = true;
  try {
    while (publishPending) {
      const job = publishPending;
      publishPending = null;
      const doc = documents.get(job.uri);
      if (doc && doc.version > job.version) {
        continue;
      }
      await publishFor(job.uri, job.text, job.version);
    }
  } finally {
    publishBusy = false;
    if (publishPending) {
      void drainPublish();
    }
  }
};

const schedulePublish = (uri: string, text: string, version: number): void => {
  publishPending = { uri, text, version };
  void drainPublish();
};

const runRequestArtifacts = async (
  params: MegacrowRequestArtifactsParams
): Promise<MegacrowRequestArtifactsResult> => {
  const uri = params.textDocument.uri;
  const existing = documents.get(uri);
  const text = params.text ?? existing?.getText() ?? "";
  const version =
    params.text !== undefined && params.text !== existing?.getText()
      ? (existing?.version ?? 0) + 1
      : (existing?.version ?? 0);

  if (params.text !== undefined) {
    const doc = TextDocument.create(
      uri,
      existing?.languageId ?? "megalo",
      version,
      text
    );
    documents.set(uri, doc);
  }

  const doc = documents.get(uri);
  const entry = doc
    ? await getCachedSnapshot(uri, doc)
    : await refreshSnapshot(uri, text, version);

  const artifacts = await requestArtifactsFromSnapshot(entry.snapshot, {
    artifacts: params.artifacts,
    documentVersion: entry.version,
    fromUri: uri,
    objectLists: params.objectLists,
    resolvers: createResolvers(),
  });

  if (params.artifacts.includes("semanticTokens") && artifacts.semanticTokens) {
    entry.semanticTokens = artifacts.semanticTokens;
    snapshotCache.set(uri, entry);
  }

  if (artifacts.diagnostics) {
    connection.sendDiagnostics({
      uri,
      diagnostics: artifacts.diagnostics,
    });
  }

  return artifacts;
};

/**
 * Serialize artifact requests and keep only the newest. Callers whose work was
 * superseded receive a cheap stub (IDE ignores via run id).
 */
const drainArtifacts = async (): Promise<void> => {
  if (artifactsBusy) {
    return;
  }
  artifactsBusy = true;
  try {
    while (artifactsPending) {
      const job = artifactsPending;
      artifactsPending = null;
      try {
        const result = await runRequestArtifacts(job.params);
        if (artifactsPending) {
          job.resolve(
            staleArtifactsResult(
              documents.get(job.params.textDocument.uri)?.version ?? 0
            )
          );
        } else {
          job.resolve(result);
        }
      } catch (error) {
        if (artifactsPending) {
          job.resolve(
            staleArtifactsResult(
              documents.get(job.params.textDocument.uri)?.version ?? 0
            )
          );
        } else {
          job.reject(error);
        }
      }
    }
  } finally {
    artifactsBusy = false;
    if (artifactsPending) {
      void drainArtifacts();
    }
  }
};

const enqueueRequestArtifacts = (
  params: MegacrowRequestArtifactsParams
): Promise<MegacrowRequestArtifactsResult> =>
  new Promise((resolve, reject) => {
    if (artifactsPending) {
      artifactsPending.resolve(
        staleArtifactsResult(
          documents.get(artifactsPending.params.textDocument.uri)?.version ?? 0
        )
      );
    }
    artifactsPending = { params, resolve, reject };
    void drainArtifacts();
  });

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
  schedulePublish(uri, text, version);
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
  schedulePublish(uri, change.text, version);
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
  MEGACROW_REQUEST_ARTIFACTS_METHOD,
  (
    params: MegacrowRequestArtifactsParams
  ): Promise<MegacrowRequestArtifactsResult> => enqueueRequestArtifacts(params)
);

connection.onRequest(
  MEGACROW_COMPILE_METHOD,
  async (params: MegacrowCompileParams): Promise<MegacrowCompileResult> => {
    const uri = params.textDocument.uri;
    const text = params.text ?? documents.get(uri)?.getText() ?? "";
    const existing = documents.get(uri);
    const version = existing?.version ?? 0;

    // Prefer shared snapshot cache when text matches the synced document.
    const cached = snapshotCache.get(uri);
    if (
      cached &&
      cached.version === version &&
      (params.text === undefined || params.text === cached.snapshot.source)
    ) {
      const artifacts = await requestArtifactsFromSnapshot(cached.snapshot, {
        artifacts: ["diagnostics", "mglo"],
        documentVersion: version,
        fromUri: uri,
        objectLists: params.objectLists,
        resolvers: createResolvers(),
      });
      connection.sendDiagnostics({
        uri,
        diagnostics: artifacts.diagnostics ?? [],
      });
      return {
        ok: artifacts.ok === true,
        diagnostics: artifacts.diagnostics ?? [],
        dataBase64: artifacts.dataBase64,
        metadata: artifacts.metadata,
        error: artifacts.error,
      };
    }

    const result = await analyzeAndCompile(text, {
      version: DEFAULT_VERSION,
      objectLists: params.objectLists,
      fromUri: uri,
      resolvers: createResolvers(),
    });
    connection.sendDiagnostics({
      uri,
      diagnostics: result.diagnostics,
    });
    return result;
  }
);

connection.listen();
