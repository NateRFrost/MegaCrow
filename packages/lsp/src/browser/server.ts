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
} from "../core";

const DEFAULT_VERSION = MEGALO_VERSIONS["107-mcc"];

const reader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const writer = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connection = createConnection(reader, writer);

const documents = new Map<string, TextDocument>();

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
      return null;
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
      return null;
    }
    return decodeBase64(result.dataBase64);
  },
});

const publishFor = async (uri: string, text: string): Promise<void> => {
  const diagnostics = await analyzeOnly(text, {
    version: DEFAULT_VERSION,
    fromUri: uri,
    resolvers: createResolvers(),
  });
  connection.sendDiagnostics({ uri, diagnostics });
};

connection.onInitialize(
  (_params: InitializeParams): InitializeResult => ({
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
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
  void publishFor(uri, text);
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
  void publishFor(uri, change.text);
});

connection.onDidCloseTextDocument((params) => {
  documents.delete(params.textDocument.uri);
  connection.sendDiagnostics({
    uri: params.textDocument.uri,
    diagnostics: [],
  });
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
