import type {
  MegaloWorkerRequest,
  MegaloWorkerResponse,
} from "../workers/megaloWorkerTypes";
import type { SourceAnalysis } from "./analyzeSource";
import { analyzeMegaloSource } from "./analyzeSource";
import type { MegaloIncludeFileCache } from "./includeDiagnostics";
import { megaloCompileOptionsFromCache } from "./includeDiagnostics";
import {
  type MegaCrowCompilerSettings,
  mergeMegaloCompileOptions,
} from "./megaloCompilerSettings";
import {
  compileGametypeForSave,
  formatMegaloCompileTiming,
  type GametypeSaveFormat,
  type MegaloProgram,
  tryParse,
} from "./megaloShim";
import { type Workspace, workspaceContext } from "./workspace";

export interface WorkerCompileContext {
  baseJitDiagnostics?: import("./diagnostics").MegaloDiagnostic[];
  includeCache?: MegaloIncludeFileCache;
  resolvedBaseCustomVariant?: import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant;
  resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  resolvedBaseProgram?: MegaloProgram | null;
}

function gametypeSaveFormatLabel(format: GametypeSaveFormat): string {
  switch (format) {
    case "mglo":
      return ".mglo";
    case "gvar":
      return "gvar";
    case "mpvr":
      return "mpvr";
    case "asq":
      return "Autosave Queue";
  }
}

type Listener = (response: MegaloWorkerResponse) => void;

let worker: Worker | null = null;
const listeners = new Set<Listener>();
let currentCompilerSettings: MegaCrowCompilerSettings = {
  creatorGamertag: "",
  strictStringLiterals: false,
};

const pendingParses = new Map<
  number,
  {
    resolve: (value: {
      program: MegaloProgram | null;
      analysis: SourceAnalysis;
    }) => void;
  }
>();

const pendingCompileDownloads = new Map<
  number,
  {
    resolve: (value: {
      output: Uint8Array | null;
      analysis: SourceAnalysis;
    }) => void;
  }
>();

const pendingCompletions = new Map<
  number,
  { resolve: (value: import("./megaloShim").CompletionItem[]) => void }
>();

/** Eagerly spawn the Megalo worker so first file open avoids cold-start latency. */
export function preloadMegaloWorker(): void {
  ensureWorker();
}

function ensureWorker(): Worker | null {
  if (worker) {
    return worker;
  }
  try {
    worker = new Worker(
      new URL("../workers/megaloWorker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (event: MessageEvent<MegaloWorkerResponse>) => {
      const response = event.data;
      if (response.kind === "parse") {
        const pending = pendingParses.get(response.id);
        if (pending) {
          pendingParses.delete(response.id);
          pending.resolve({
            program: response.program,
            analysis: response.analysis,
          });
        }
      }
      if (response.kind === "compileDownload") {
        const pending = pendingCompileDownloads.get(response.id);
        if (pending) {
          pendingCompileDownloads.delete(response.id);
          pending.resolve({
            output: response.output,
            analysis: response.analysis,
          });
        }
      }
      if (response.kind === "completions") {
        const pending = pendingCompletions.get(response.id);
        if (pending) {
          pendingCompletions.delete(response.id);
          pending.resolve(response.items);
        }
      }
      for (const listener of listeners) {
        listener(response);
      }
    };
    return worker;
  } catch {
    return null;
  }
}

export function subscribeMegaloWorker(listener: Listener): () => void {
  ensureWorker();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function postMegaloWorker(message: MegaloWorkerRequest): boolean {
  const active = ensureWorker();
  if (!active) {
    return false;
  }
  active.postMessage(message);
  return true;
}

export function syncMegaloWorkspace(workspace: Workspace | null): void {
  postMegaloWorker({
    kind: "setWorkspace",
    workspace: workspace ? workspaceContext(workspace) : null,
  });
  void import("./lspClient").then(({ lspConfigureResolveContext }) => {
    lspConfigureResolveContext({ workspace });
  });
}

export function syncMegaloCompilerSettings(
  compilerSettings: MegaCrowCompilerSettings
): void {
  currentCompilerSettings = compilerSettings;
  postMegaloWorker({
    kind: "setCompilerSettings",
    compilerSettings,
  });
}

export function initMegaloWorkerContext(
  originalBytes: Uint8Array | null,
  baseProgram: MegaloProgram | null,
  baselineSource: string | null
): void {
  postMegaloWorker({
    kind: "init",
    originalBytes,
    baseProgram,
    baselineSource,
  });
}

/**
 * Source-only compile via LSP requestArtifacts (one lex/parse shared with highlighting).
 * Overlapping calls coalesce: only the newest source runs; older waiters get a
 * discarded stub (App ignores via compile run id). No cancellation token needed.
 */
interface SourceOnlyCompileJob {
  reject: (reason: unknown) => void;
  resolve: (value: SourceAnalysis) => void;
  source: string;
}

let sourceOnlyPending: SourceOnlyCompileJob | null = null;
let sourceOnlyBusy = false;

const supersededSourceAnalysis = (): SourceAnalysis => ({
  compileState: "parsing",
  errorCount: 0,
  message: "Compiling…",
  byteIdentical: null,
  byteDiffCount: null,
  compiledByteLength: null,
  mgloBytes: null,
  compileTiming: null,
  diagnostics: [],
});

async function runSourceOnlyCompileOnce(
  source: string
): Promise<SourceAnalysis> {
  const { lspRequestArtifacts } = await import("./lspClient");
  const started = performance.now();
  const result = await lspRequestArtifacts(source, [
    "semanticTokens",
    "diagnostics",
    "mglo",
  ]);
  if (result.error === "superseded") {
    return supersededSourceAnalysis();
  }
  const totalMs = performance.now() - started;
  const timing = { parseMs: 0, compileMs: totalMs, totalMs };
  const diagnostics = result.diagnostics.map((d) => ({
    line: d.range.start.line + 1,
    column: d.range.start.character + 1,
    endColumn: d.range.end.character + 1,
    message: d.message,
    severity: d.severity === 1 ? ("error" as const) : ("warning" as const),
  }));
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  if (!(result.ok && result.bytes) || errorCount > 0) {
    return {
      compileState: "error",
      errorCount: Math.max(errorCount, 1),
      message: result.error ?? diagnostics[0]?.message ?? "Compilation failed",
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: timing,
      diagnostics,
    };
  }
  return {
    compileState: diagnostics.some((d) => d.severity === "warning")
      ? "warn"
      : "ok",
    errorCount: 0,
    message: formatMegaloCompileTiming(timing) || "Compiled",
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: result.bytes.length,
    mgloBytes: result.bytes,
    compiledMetadata: result.metadata ?? null,
    compileTiming: timing,
    diagnostics,
  };
}

export function requestSourceOnlyCompileViaLsp(
  source: string
): Promise<SourceAnalysis> {
  return new Promise((resolve, reject) => {
    if (sourceOnlyPending) {
      sourceOnlyPending.resolve(supersededSourceAnalysis());
    }
    sourceOnlyPending = { source, resolve, reject };
    void drainSourceOnlyCompile();
  });
}

async function drainSourceOnlyCompile(): Promise<void> {
  if (sourceOnlyBusy) {
    return;
  }
  sourceOnlyBusy = true;
  try {
    while (sourceOnlyPending) {
      const job = sourceOnlyPending;
      sourceOnlyPending = null;
      try {
        const analysis = await runSourceOnlyCompileOnce(job.source);
        if (sourceOnlyPending) {
          job.resolve(supersededSourceAnalysis());
        } else {
          job.resolve(analysis);
        }
      } catch (error) {
        if (sourceOnlyPending) {
          job.resolve(supersededSourceAnalysis());
        } else {
          job.reject(error);
        }
      }
    }
  } finally {
    sourceOnlyBusy = false;
    if (sourceOnlyPending) {
      void drainSourceOnlyCompile();
    }
  }
}

function parseMegaloSourceFallback(source: string): {
  program: MegaloProgram | null;
  analysis: SourceAnalysis;
} {
  const parsed = tryParse(source);
  if (!parsed.ok) {
    const message = `Parse error at line ${parsed.line}: ${parsed.message}`;
    return {
      program: null,
      analysis: {
        compileState: "error",
        errorCount: 1,
        message,
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength: null,
        mgloBytes: null,
        compileTiming: null,
        diagnostics: [
          {
            line: parsed.line,
            column: parsed.column,
            message: parsed.message,
            ...(parsed.offset === undefined ? {} : { offset: parsed.offset }),
            ...(parsed.length !== undefined && parsed.length > 0
              ? { length: parsed.length }
              : {}),
          },
        ],
      },
    };
  }

  const warningDiagnostics = parsed.warnings.map((warning) => ({
    line: warning.line,
    column: warning.column,
    message: warning.message,
    severity: "warning" as const,
    ...(warning.offset === undefined ? {} : { offset: warning.offset }),
    ...(warning.length !== undefined && warning.length > 0
      ? { length: warning.length }
      : {}),
  }));

  return {
    program: parsed.program,
    analysis: {
      compileState: "parsing",
      errorCount: 0,
      message:
        warningDiagnostics.length > 0
          ? `Parsed with ${warningDiagnostics.length} warning(s) — compiling…`
          : "Parsed — compiling…",
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: warningDiagnostics,
    },
  };
}

export function requestParseInWorker(
  source: string,
  id: number,
  compileContext?: WorkerCompileContext
): Promise<{
  program: MegaloProgram | null;
  analysis: SourceAnalysis;
}> {
  const posted = postMegaloWorker({
    kind: "parse",
    id,
    source,
    includeCache: compileContext?.includeCache,
    resolvedBaseProgram: compileContext?.resolvedBaseProgram,
    resolvedBaseCustomVariant: compileContext?.resolvedBaseCustomVariant,
    resolvedBaseCustomVariantMgloBytes:
      compileContext?.resolvedBaseCustomVariantMgloBytes,
    baseJitDiagnostics: compileContext?.baseJitDiagnostics,
  });
  if (!posted) {
    return Promise.resolve(parseMegaloSourceFallback(source));
  }
  return new Promise((resolve) => {
    pendingParses.set(id, { resolve });
  });
}

async function compileDownloadFallback(
  source: string,
  format: GametypeSaveFormat,
  originalBytes: Uint8Array | null,
  baseProgram: MegaloProgram | null,
  baselineSource: string | null,
  includeCache?: MegaloIncludeFileCache
): Promise<{ output: Uint8Array | null; analysis: SourceAnalysis }> {
  if (!baseProgram) {
    return {
      output: null,
      analysis: {
        compileState: "error",
        errorCount: 1,
        message: "Load a gametype first",
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength: null,
        mgloBytes: null,
        compileTiming: null,
        diagnostics: [],
      },
    };
  }
  try {
    const output = compileGametypeForSave(
      source,
      format,
      originalBytes,
      baseProgram,
      mergeMegaloCompileOptions(
        includeCache?.sourceDir
          ? megaloCompileOptionsFromCache(includeCache)
          : undefined,
        currentCompilerSettings
      )
    );
    const identical =
      format !== "mglo" &&
      format !== "asq" &&
      originalBytes !== null &&
      output.length === originalBytes.length &&
      output.every((b, i) => b === originalBytes[i]);
    const formatLabel = gametypeSaveFormatLabel(format);
    return {
      output,
      analysis: {
        compileState: "ok",
        errorCount: 0,
        message: identical
          ? `Saved ${formatLabel} — byte-identical to original`
          : `Saved ${formatLabel} gametype`,
        byteIdentical: originalBytes ? identical : null,
        byteDiffCount: identical ? 0 : null,
        compiledByteLength: output.length,
        mgloBytes: null,
        compileTiming: null,
        diagnostics: [],
      },
    };
  } catch {
    const analysis = await analyzeMegaloSource(
      source,
      originalBytes,
      baseProgram,
      baselineSource,
      undefined,
      includeCache,
      currentCompilerSettings
    );
    return {
      output: null,
      analysis: { ...analysis, compileState: "error" },
    };
  }
}

export async function requestCompileDownloadInWorker(
  source: string,
  id: number,
  format: GametypeSaveFormat,
  originalBytes: Uint8Array | null,
  baseProgram: MegaloProgram | null,
  baselineSource: string | null,
  compileContext?: WorkerCompileContext
): Promise<{ output: Uint8Array | null; analysis: SourceAnalysis }> {
  try {
    const { lspCompileSource } = await import("./lspClient");
    const started = performance.now();
    const result = await lspCompileSource(source);
    const totalMs = performance.now() - started;
    const timing = { parseMs: 0, compileMs: totalMs, totalMs };
    const diagnostics = result.diagnostics.map((d) => ({
      line: d.range.start.line + 1,
      column: d.range.start.character + 1,
      endColumn: d.range.end.character + 1,
      message: d.message,
      severity: d.severity === 1 ? ("error" as const) : ("warning" as const),
    }));
    if (!(result.ok && result.bytes)) {
      return {
        output: null,
        analysis: {
          compileState: "error",
          errorCount: diagnostics.filter((d) => d.severity === "error").length,
          message: result.error ?? "Compilation failed",
          byteIdentical: null,
          byteDiffCount: null,
          compiledByteLength: null,
          mgloBytes: null,
          compileTiming: timing,
          diagnostics,
        },
      };
    }
    return {
      output: result.bytes,
      analysis: {
        compileState: diagnostics.some((d) => d.severity === "warning")
          ? "warn"
          : "ok",
        errorCount: 0,
        message: formatMegaloCompileTiming(timing),
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength: result.bytes.length,
        mgloBytes: result.bytes,
        compiledMetadata: result.metadata ?? null,
        compileTiming: timing,
        diagnostics,
      },
    };
  } catch {
    // Fall through to legacy worker path.
  }

  const posted = postMegaloWorker({
    kind: "compileDownload",
    id,
    source,
    format,
    includeCache: compileContext?.includeCache,
    resolvedBaseProgram: compileContext?.resolvedBaseProgram,
    resolvedBaseCustomVariant: compileContext?.resolvedBaseCustomVariant,
    resolvedBaseCustomVariantMgloBytes:
      compileContext?.resolvedBaseCustomVariantMgloBytes,
    baseJitDiagnostics: compileContext?.baseJitDiagnostics,
  });
  if (!posted) {
    return compileDownloadFallback(
      source,
      format,
      originalBytes,
      baseProgram,
      baselineSource,
      compileContext?.includeCache
    );
  }
  return new Promise((resolve) => {
    pendingCompileDownloads.set(id, { resolve });
  });
}

let completionRequestId = 0;

export function requestCompletionsInWorker(
  source: string,
  line: number,
  column: number
): Promise<import("./megaloShim").CompletionItem[]> {
  const id = ++completionRequestId;
  const posted = postMegaloWorker({
    kind: "completions",
    id,
    source,
    line,
    column,
  });
  if (!posted) {
    return Promise.resolve([]);
  }
  return new Promise((resolve) => {
    pendingCompletions.set(id, { resolve });
  });
}
