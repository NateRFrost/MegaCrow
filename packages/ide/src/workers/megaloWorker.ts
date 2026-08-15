/**
 * Legacy worker kept for App compatibility. Compile uses @megacrow/megalo.
 */
import {
  ALL_MEGACROW_EXTENSIONS,
  compileSource,
  DiagnosticSeverity,
  MEGALO_VERSIONS,
  SourceLocationType,
  summarizeIncludeDiagnostics,
} from "@megacrow/megalo";
import type { SourceAnalysis } from "../lib/analyzeSource";
import type { MegaloIncludeFileCache } from "../lib/includeDiagnostics";
import { resolveIncludeFromCache } from "../lib/includeDiagnostics";
import type { MegaCrowCompilerSettings } from "../lib/megaloCompilerSettings";
import {
  formatMegaloCompileTiming,
  type MegaloProgram,
  tryParse,
} from "../lib/megaloShim";
import type { WorkspaceContext } from "../lib/workspace";
import type {
  MegaloWorkerRequest,
  MegaloWorkerResponse,
} from "./megaloWorkerTypes";

let originalBytes: Uint8Array | null = null;
let baseProgram: MegaloProgram | null = null;
let baselineSource: string | null = null;
let _workspaceContext: WorkspaceContext | null = null;
let _compilerSettings: MegaCrowCompilerSettings = {
  creatorGamertag: "",
  strictStringLiterals: false,
};

function compileResultToAnalysis(
  compileState: SourceAnalysis["compileState"],
  message: string,
  diagnostics: SourceAnalysis["diagnostics"],
  bytes: Uint8Array | null = null,
  compileTiming: SourceAnalysis["compileTiming"] = null,
  compiledMetadata: SourceAnalysis["compiledMetadata"] = null
): SourceAnalysis {
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  return {
    compileState,
    errorCount,
    message,
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: bytes?.length ?? null,
    mgloBytes: bytes,
    compiledMetadata,
    compileTiming,
    diagnostics,
  };
}

async function compileToBytes(
  source: string,
  options?: {
    includeCache?: MegaloIncludeFileCache;
    resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  }
): Promise<{
  bytes: Uint8Array | null;
  diagnostics: SourceAnalysis["diagnostics"];
  timing: SourceAnalysis["compileTiming"];
  metadata: SourceAnalysis["compiledMetadata"];
}> {
  const includeCache = options?.includeCache;
  const baseBytes = options?.resolvedBaseCustomVariantMgloBytes;
  const started = performance.now();
  const result = await compileSource(source, {
    version: MEGALO_VERSIONS["107-mcc"],
    megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
    fromUri: includeCache?.sourceDir
      ? `${includeCache.sourceDir.replace(/\\/g, "/")}/.`
      : undefined,
    resolveInclude: includeCache
      ? resolveIncludeFromCache(includeCache)
      : undefined,
    resolveBaseFile: baseBytes?.length
      ? async () => baseBytes
      : async () => null,
  });
  const totalMs = performance.now() - started;
  const timing = {
    parseMs: 0,
    compileMs: totalMs,
    totalMs,
  };
  const diagnostics: SourceAnalysis["diagnostics"] =
    summarizeIncludeDiagnostics(result.diagnostics, source).map((d) => {
      const severity =
        d.severity === DiagnosticSeverity.Error ? "error" : "warning";
      if (d.location.type === SourceLocationType.SOURCE_CODE) {
        const { start, end } = d.location;
        return {
          line: start.line,
          column: start.column,
          endColumn: end.column,
          offset: start.localOffset,
          length: Math.max(0, end.localOffset - start.localOffset),
          message: d.message,
          severity,
        };
      }
      if (d.location.type === SourceLocationType.INCLUDE) {
        const { start, end } = d.location.declaration;
        return {
          line: start.line,
          column: start.column,
          endColumn: end.column,
          offset: start.localOffset,
          length: Math.max(0, end.localOffset - start.localOffset),
          message: d.message,
          severity,
        };
      }
      return {
        line: 0,
        column: 0,
        message: d.message,
        severity,
        trayOnly: true,
      };
    });
  return {
    bytes: result.bytes ?? null,
    diagnostics,
    timing,
    metadata: result.metadata ?? null,
  };
}

self.onmessage = (event: MessageEvent<MegaloWorkerRequest>) => {
  void handleMessage(event.data);
};

async function handleMessage(message: MegaloWorkerRequest): Promise<void> {
  switch (message.kind) {
    case "init":
      originalBytes = message.originalBytes;
      baseProgram = message.baseProgram;
      baselineSource = message.baselineSource;
      break;

    case "setWorkspace":
      _workspaceContext = message.workspace;
      break;

    case "setCompilerSettings":
      _compilerSettings = message.compilerSettings;
      break;

    case "compile":
    case "parse": {
      const parsed = tryParse(message.source);
      const { bytes, diagnostics, timing, metadata } = await compileToBytes(
        message.source,
        {
          includeCache: message.includeCache,
          resolvedBaseCustomVariantMgloBytes:
            message.resolvedBaseCustomVariantMgloBytes,
        }
      );
      const mergedDiagnostics = [
        ...(message.baseJitDiagnostics ?? []),
        ...diagnostics,
      ];
      const analysis = bytes
        ? compileResultToAnalysis(
            mergedDiagnostics.some((d) => d.severity === "warning")
              ? "warn"
              : "ok",
            formatMegaloCompileTiming(timing),
            mergedDiagnostics,
            bytes,
            timing,
            metadata
          )
        : compileResultToAnalysis(
            "error",
            mergedDiagnostics[0]?.message ?? "Compilation failed",
            mergedDiagnostics.length
              ? mergedDiagnostics
              : [
                  {
                    line: 1,
                    column: 1,
                    message: "Compilation failed",
                    severity: "error",
                  },
                ],
            null,
            timing
          );
      if (message.kind === "compile") {
        self.postMessage({
          kind: "compile",
          id: message.id,
          source: message.source,
          analysis,
        } satisfies MegaloWorkerResponse);
      } else {
        self.postMessage({
          kind: "parse",
          id: message.id,
          program: parsed.ok ? parsed.program : null,
          analysis,
        } satisfies MegaloWorkerResponse);
      }
      break;
    }

    case "completions": {
      self.postMessage({
        kind: "completions",
        id: message.id,
        items: [],
      } satisfies MegaloWorkerResponse);
      break;
    }

    case "compileDownload": {
      const { bytes, diagnostics, timing, metadata } = await compileToBytes(
        message.source,
        {
          includeCache: message.includeCache,
          resolvedBaseCustomVariantMgloBytes:
            message.resolvedBaseCustomVariantMgloBytes,
        }
      );
      if (!bytes) {
        self.postMessage({
          kind: "compileDownload",
          id: message.id,
          output: null,
          analysis: compileResultToAnalysis(
            "error",
            diagnostics[0]?.message ?? "Compilation failed",
            diagnostics,
            null,
            timing
          ),
        } satisfies MegaloWorkerResponse);
        break;
      }
      self.postMessage({
        kind: "compileDownload",
        id: message.id,
        output: bytes,
        analysis: compileResultToAnalysis(
          diagnostics.some((d) => d.severity === "warning") ? "warn" : "ok",
          formatMegaloCompileTiming(timing),
          diagnostics,
          bytes,
          timing,
          metadata
        ),
      } satisfies MegaloWorkerResponse);
      break;
    }

    default:
      break;
  }
}

void originalBytes;
void baseProgram;
void baselineSource;
void _workspaceContext;
void _compilerSettings;
