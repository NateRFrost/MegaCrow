import {
  ALL_MEGACROW_EXTENSIONS,
  compileSource,
  DiagnosticSeverity,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  type ObjectLists,
  SourceLocationType,
  setLocale,
  summarizeIncludeDiagnostics,
} from "@megacrow/megalo";
import type { SourceAnalysis } from "../lib/analyzeSource";
import type { MegaloIncludeFileCache } from "../lib/includeDiagnostics";
import { resolveIncludeFromCache } from "../lib/includeDiagnostics";
import { formatMegaloCompileTiming } from "../lib/megaloCompile";
import type { MegaCrowCompilerSettings } from "../lib/megaloCompilerSettings";
import type { MegaloProgram } from "../lib/megaloProgram";
import { tryParse } from "../lib/megaloProgram";
import type { WorkspaceContext } from "../lib/workspace";
import { failedToCompileStatus, setIdeLocale } from "../localization";
import type {
  MegaloWorkerRequest,
  MegaloWorkerResponse,
} from "./megaloWorkerTypes";

let originalBytes: Uint8Array | null = null;
let baseProgram: MegaloProgram | null = null;
let baselineSource: string | null = null;
let _workspaceContext: WorkspaceContext | null = null;
let workspaceObjectLists: ObjectLists | undefined;
let _compilerSettings: MegaCrowCompilerSettings = {
  creatorGamertag: "MegaCrow",
  locale: "en",
  megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
  strictStringLiterals: false,
};

function compileVersion() {
  const id = _workspaceContext?.megaloVersion;
  if (id && isMegaloVersionId(id)) {
    return MEGALO_VERSIONS[id];
  }
  return MEGALO_VERSIONS["107-mcc"];
}

function compileResultToAnalysis(
  compileState: SourceAnalysis["compileState"],
  message: string,
  diagnostics: SourceAnalysis["diagnostics"],
  bytes: Uint8Array | null = null,
  compileTiming: SourceAnalysis["compileTiming"] = null,
  compiledMetadata: SourceAnalysis["compiledMetadata"] = null,
  variantByteLength: number | null = null,
  limitUsage: SourceAnalysis["limitUsage"] = null
): SourceAnalysis {
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  return {
    compileState,
    errorCount,
    message,
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: variantByteLength ?? bytes?.length ?? null,
    mgloBytes: bytes,
    compiledMetadata,
    compileTiming,
    diagnostics,
    limitUsage,
  };
}

async function compileToBytes(
  source: string,
  options?: {
    fileType?: "mglo" | "mpvr" | "gvar";
    includeCache?: MegaloIncludeFileCache;
    resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  }
): Promise<{
  bytes: Uint8Array | null;
  diagnostics: SourceAnalysis["diagnostics"];
  timing: SourceAnalysis["compileTiming"];
  metadata: SourceAnalysis["compiledMetadata"];
  variantByteLength: number | null;
  limitUsage: SourceAnalysis["limitUsage"];
}> {
  const includeCache = options?.includeCache;
  const baseBytes = options?.resolvedBaseCustomVariantMgloBytes;
  const started = performance.now();
  const result = await compileSource(source, {
    version: compileVersion(),
    fileType: options?.fileType ?? "mglo",
    megacrowExtensions: _compilerSettings.megacrowExtensions,
    compilerSettings: {
      strictStringLiterals: _compilerSettings.strictStringLiterals,
      creatorGamertag:
        _compilerSettings.creatorGamertag.trim().slice(0, 16) || "MegaCrow",
    },
    objectLists: workspaceObjectLists,
    fromUri: includeCache?.sourceDir
      ? `${includeCache.sourceDir.replace(/\\/g, "/")}/.`
      : undefined,
    resolveInclude: includeCache
      ? resolveIncludeFromCache(includeCache)
      : undefined,
    // Prefer pre-resolved base bytes; otherwise omit so sibling `.txt` JIT
    // runs without a "compiled from source" DX (no output-folder lookup).
    resolveBaseFile: baseBytes?.length ? async () => baseBytes : undefined,
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
          endLine: end.line,
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
          endLine: end.line,
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
    variantByteLength: result.variantByteLength ?? null,
    limitUsage: result.limitUsage ?? null,
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

    case "setCompilerSettings": {
      _compilerSettings = message.compilerSettings;
      const locale = message.compilerSettings.locale === "ja" ? "ja" : "en";
      setLocale(locale);
      setIdeLocale(locale);
      break;
    }

    case "setObjectLists":
      workspaceObjectLists = message.objectLists ?? undefined;
      break;

    case "compile":
    case "parse": {
      const parsed = tryParse(message.source);
      const {
        bytes,
        diagnostics,
        timing,
        metadata,
        variantByteLength,
        limitUsage,
      } = await compileToBytes(message.source, {
        includeCache: message.includeCache,
        resolvedBaseCustomVariantMgloBytes:
          message.resolvedBaseCustomVariantMgloBytes,
      });
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
            metadata,
            variantByteLength,
            limitUsage
          )
        : compileResultToAnalysis(
            "error",
            failedToCompileStatus(
              mergedDiagnostics.filter((d) => d.severity === "error").length
            ),
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
            timing,
            null,
            null,
            limitUsage
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
      const { compiledFileTypeForSaveFormat } = await import(
        "../lib/gametypeSaveFormat"
      );
      const fileType = compiledFileTypeForSaveFormat(message.format);
      const {
        bytes,
        diagnostics,
        timing,
        metadata,
        variantByteLength,
        limitUsage,
      } = await compileToBytes(message.source, {
        fileType,
        includeCache: message.includeCache,
        resolvedBaseCustomVariantMgloBytes:
          message.resolvedBaseCustomVariantMgloBytes,
      });
      if (!bytes) {
        self.postMessage({
          kind: "compileDownload",
          id: message.id,
          output: null,
          analysis: compileResultToAnalysis(
            "error",
            failedToCompileStatus(
              diagnostics.filter((d) => d.severity === "error").length
            ),
            diagnostics,
            null,
            timing,
            null,
            null,
            limitUsage
          ),
        } satisfies MegaloWorkerResponse);
        break;
      }
      const analysis = compileResultToAnalysis(
        diagnostics.some((d) => d.severity === "warning") ? "warn" : "ok",
        formatMegaloCompileTiming(timing),
        diagnostics,
        fileType === "mglo" ? bytes : null,
        timing,
        metadata,
        variantByteLength,
        limitUsage
      );
      self.postMessage({
        kind: "compileDownload",
        id: message.id,
        output: bytes,
        analysis,
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
