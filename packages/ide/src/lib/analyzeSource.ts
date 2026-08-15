import type { CompiledMegaloMetadata } from "@megacrow/megalo";
import type { MegaloDiagnostic } from "./diagnostics";
import type { MegaloIncludeFileCache } from "./includeDiagnostics";
import {
  includeFailureAnalysis,
  megaloCompileOptionsFromCache,
} from "./includeDiagnostics";
import {
  type MegaCrowCompilerSettings,
  mergeMegaloCompileOptions,
} from "./megaloCompilerSettings";
import {
  analyzeProgram,
  compileGvarFromEditedSource,
  compileMgloFromEditedProgram,
  compileMgloFromMegaloSource,
  compileMgloFromMegaloSourceAsync,
  decodeCustomVariantMglo,
  enrichCompileErrorLocation,
  exportMgloFromBlf,
  formatMegaloCompileTiming,
  logCompileStringTablesDebug,
  type MegaloCompileOptions,
  type MegaloCompileTiming,
  type MegaloProgram,
  megaloErrorLocation,
  type ParseWarning,
  remapIncludeDiagnostic,
  sourceHasIncludeDirectives,
  tryExpandMegaloIncludes,
  tryParse,
  unresolvedIncludeErrors,
} from "./megaloShim";

export type CompileState = "idle" | "parsing" | "ok" | "warn" | "error";

export interface SourceAnalysis {
  byteDiffCount: number | null;
  byteIdentical: boolean | null;
  compiledByteLength: number | null;
  /** Name / description / icon from a successful compile. */
  compiledMetadata?: CompiledMegaloMetadata | null;
  compileState: CompileState;
  compileTiming: MegaloCompileTiming | null;
  diagnostics: MegaloDiagnostic[];
  errorCount: number;
  message: string;
  /** MCC hot-reload `.mglo` bytes when compile succeeded. */
  mgloBytes: Uint8Array | null;
}

function parseWarningDiagnostics(warnings: ParseWarning[]): MegaloDiagnostic[] {
  return warnings.map((warning) => ({
    line: warning.line,
    column: warning.column,
    message: warning.message,
    severity: "warning" as const,
    ...(warning.offset === undefined ? {} : { offset: warning.offset }),
    ...(warning.length !== undefined && warning.length > 0
      ? { length: warning.length }
      : {}),
  }));
}

function compileErrorLocation(
  error: unknown,
  editorSource?: string,
  compileOptions?: MegaloCompileOptions,
  program?: MegaloProgram
): MegaloDiagnostic {
  const enriched =
    editorSource === undefined
      ? error
      : enrichCompileErrorLocation(
          error,
          editorSource,
          program?.flatActions,
          program,
          compileOptions?.includes
        );
  const { message, line, column, offset, length } =
    megaloErrorLocation(enriched);
  let diagnostic: MegaloDiagnostic = {
    line,
    column,
    message: formatGvarSizeMismatchMessage(message),
    ...(offset === undefined ? {} : { offset }),
    ...(length !== undefined && length > 0 ? { length } : {}),
  };
  if (editorSource && compileOptions?.includes) {
    diagnostic = remapIncludeDiagnostic(
      editorSource,
      compileOptions.includes,
      diagnostic
    );
  }
  return diagnostic;
}

function formatGvarSizeMismatchMessage(message: string): string {
  const sizes = parseGvarBodyLengthMismatch(message);
  if (!sizes) {
    return message;
  }
  const delta = sizes.compiled - sizes.original;
  const sign = delta > 0 ? "+" : "";
  const kind = message.includes("mpvr") ? "mpvr" : "gvar";
  return `Compiled ${kind} size mismatch: ${sizes.compiled} bytes vs original ${sizes.original} (${sign}${delta}). Symbolic compile may be incomplete for this gametype.`;
}

function parseGvarBodyLengthMismatch(
  message: string
): { compiled: number; original: number } | null {
  const bodyMatch = /body length (\d+) does not match original (\d+)/.exec(
    message
  );
  if (bodyMatch) {
    return {
      compiled: Number(bodyMatch[1]),
      original: Number(bodyMatch[2]),
    };
  }
  const formattedMatch = /size mismatch: (\d+) bytes vs original (\d+)/.exec(
    message
  );
  if (formattedMatch) {
    return {
      compiled: Number(formattedMatch[1]),
      original: Number(formattedMatch[2]),
    };
  }
  return null;
}

function isGvarSizeMismatchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return parseGvarBodyLengthMismatch(message) !== null;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function countByteDiffs(a: Uint8Array, b: Uint8Array): number {
  const _length = Math.max(a.length, b.length);
  let diff = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      diff++;
    }
  }
  return diff;
}

function firstByteDiffOffset(a: Uint8Array, b: Uint8Array): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return i;
    }
  }
  if (a.length !== b.length) {
    return Math.min(a.length, b.length);
  }
  return -1;
}

function resolveCompileOptions(
  compileOptions?: MegaloCompileOptions,
  includeCache?: MegaloIncludeFileCache,
  compilerSettings?: MegaCrowCompilerSettings
): MegaloCompileOptions | undefined {
  const fromIncludes = includeCache?.sourceDir
    ? megaloCompileOptionsFromCache(includeCache)
    : compileOptions;
  return mergeMegaloCompileOptions(fromIncludes, compilerSettings);
}

function needsAsyncMegaloCompile(options?: MegaloCompileOptions): boolean {
  return options?.base?.fileProvider !== undefined;
}

async function compileMegaloSourceForAnalysis(
  source: string,
  resolvedOptions?: MegaloCompileOptions
) {
  if (needsAsyncMegaloCompile(resolvedOptions)) {
    return compileMgloFromMegaloSourceAsync(source, resolvedOptions);
  }
  return compileMgloFromMegaloSource(source, resolvedOptions);
}

function debugLogCompileStringTables(
  source: string,
  resolvedOptions?: MegaloCompileOptions,
  includeCache?: MegaloIncludeFileCache,
  mgloBytes?: Uint8Array | null
): void {
  let compiledEnglishSlots: Array<string | null> | undefined;
  if (mgloBytes) {
    try {
      compiledEnglishSlots =
        decodeCustomVariantMglo(mgloBytes).m_script_strings.strings[0] ??
        undefined;
    } catch {
      compiledEnglishSlots = undefined;
    }
  }
  const includeFilesInCache = includeCache
    ? new Set(
        Object.entries(includeCache.files)
          .filter(([path]) => path.includes(".txt"))
          .map(([path]) => path.replace(/\//g, "\\").toLowerCase())
      ).size
    : 0;
  logCompileStringTablesDebug(source, resolvedOptions, {
    compiledEnglishSlots,
    includeFilesInCache,
  });
}

function unresolvedIncludeAnalysis(
  source: string,
  message: string
): SourceAnalysis {
  const failure = includeFailureAnalysis(
    unresolvedIncludeErrors(source, message)
  );
  return {
    ...failure,
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: null,
    mgloBytes: null,
    compileTiming: null,
  };
}

function includeErrorAnalysis(
  errors: ReturnType<typeof unresolvedIncludeErrors>
): SourceAnalysis {
  const failure = includeFailureAnalysis(errors);
  return {
    ...failure,
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: null,
    mgloBytes: null,
    compileTiming: null,
  };
}

function strictLiteralDiagnostics(
  source: string,
  compilerSettings?: MegaCrowCompilerSettings
): MegaloDiagnostic[] {
  if (!compilerSettings?.strictStringLiterals) {
    return [];
  }
  return analyzeProgram(source, "107-mcc", {
    strictLocalizedIncludes: false,
    strictStringLiterals: true,
    temporaryOverflow: true,
    creatorGamertag: compilerSettings.creatorGamertag,
    paths: { inputDir: ".", outputDir: "." },
  }).diagnostics.filter((diagnostic) => diagnostic.severity === "error");
}

async function analyzeSourceOnlyCompile(
  source: string,
  compileOptions?: MegaloCompileOptions,
  includeCache?: MegaloIncludeFileCache,
  compilerSettings?: MegaCrowCompilerSettings
): Promise<SourceAnalysis> {
  const resolvedOptions = resolveCompileOptions(
    compileOptions,
    includeCache,
    compilerSettings
  );
  const strictDiagnostics = strictLiteralDiagnostics(source, compilerSettings);
  if (strictDiagnostics.length > 0) {
    return {
      compileState: "error",
      errorCount: strictDiagnostics.length,
      message: strictDiagnostics[0]!.message,
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: strictDiagnostics,
    };
  }

  const parsed = tryParse(source);
  if (!parsed.ok) {
    return {
      compileState: "error",
      errorCount: 1,
      message: `Parse error at line ${parsed.line}: ${parsed.message}`,
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
    };
  }

  try {
    const compiled = await compileMegaloSourceForAnalysis(
      source,
      resolvedOptions
    );
    debugLogCompileStringTables(
      source,
      resolvedOptions,
      includeCache,
      compiled.bytes
    );
    const warningDiagnostics = parseWarningDiagnostics(parsed.warnings);
    return {
      compileState: warningDiagnostics.length > 0 ? "warn" : "ok",
      errorCount: 0,
      message: formatMegaloCompileTiming(compiled.timing) || "Compiled",
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: compiled.bytes.length,
      mgloBytes: compiled.bytes,
      compileTiming: compiled.timing,
      diagnostics: warningDiagnostics,
    };
  } catch (error) {
    debugLogCompileStringTables(source, resolvedOptions, includeCache);
    const diagnostic = compileErrorLocation(
      error,
      source,
      resolvedOptions,
      parsed.program
    );
    try {
      const compiled = await compileMegaloSourceForAnalysis(
        source,
        resolvedOptions
      );
      return {
        compileState: "warn",
        errorCount: 0,
        message: diagnostic.message,
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength: null,
        mgloBytes: compiled.bytes,
        compileTiming: compiled.timing,
        diagnostics: [],
      };
    } catch {
      // Fall through to error response.
    }
    return {
      compileState: "error",
      errorCount: 1,
      message: diagnostic.message,
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: [diagnostic],
    };
  }
}

export async function analyzeMegaloSource(
  source: string,
  originalBytes: Uint8Array | null,
  baseProgram: MegaloProgram | null,
  baselineSource?: string | null,
  compileOptions?: MegaloCompileOptions,
  includeCache?: MegaloIncludeFileCache,
  compilerSettings?: MegaCrowCompilerSettings
): Promise<SourceAnalysis> {
  const resolvedOptions = resolveCompileOptions(
    compileOptions,
    includeCache,
    compilerSettings
  );
  if (sourceHasIncludeDirectives(source)) {
    if (!resolvedOptions?.includes) {
      return unresolvedIncludeAnalysis(
        source,
        "Cannot resolve include — no source file location is available"
      );
    }
    const expanded = tryExpandMegaloIncludes(source, resolvedOptions);
    if (!expanded.ok) {
      return includeErrorAnalysis(expanded.errors);
    }
  }

  const strictDiagnostics = strictLiteralDiagnostics(source, compilerSettings);
  if (strictDiagnostics.length > 0) {
    return {
      compileState: "error",
      errorCount: strictDiagnostics.length,
      message: strictDiagnostics[0]!.message,
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: strictDiagnostics,
    };
  }

  if (!originalBytes) {
    return analyzeSourceOnlyCompile(
      source,
      compileOptions,
      includeCache,
      compilerSettings
    );
  }

  if (!baseProgram) {
    return {
      compileState: "idle",
      errorCount: 0,
      message: "No gametype loaded",
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: [],
    };
  }

  if (
    baselineSource !== undefined &&
    baselineSource !== null &&
    source === baselineSource
  ) {
    let mgloBytes: Uint8Array | null = null;
    try {
      mgloBytes = exportMgloFromBlf(originalBytes);
    } catch {
      mgloBytes = null;
    }
    return {
      compileState: "ok",
      errorCount: 0,
      message: "Loaded — edit source to recompile",
      byteIdentical: true,
      byteDiffCount: 0,
      compiledByteLength: originalBytes.length,
      mgloBytes,
      compileTiming: null,
      diagnostics: [],
    };
  }

  const parsed = tryParse(source);
  if (!parsed.ok) {
    return {
      compileState: "error",
      errorCount: 1,
      message: `Parse error at line ${parsed.line}: ${parsed.message}`,
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
    };
  }

  try {
    const output = compileGvarFromEditedSource(
      originalBytes,
      baseProgram,
      source
    );
    const identical = bytesEqual(output, originalBytes);
    const diffCount = identical ? 0 : countByteDiffs(output, originalBytes);
    const offset = identical ? -1 : firstByteDiffOffset(output, originalBytes);
    let mgloBytes: Uint8Array | null = null;
    let compileTiming: MegaloCompileTiming | null = null;
    try {
      const compiled = compileMgloFromEditedProgram(
        originalBytes,
        baseProgram,
        parsed.program,
        resolvedOptions
      );
      mgloBytes = compiled.bytes;
      compileTiming = compiled.timing;
    } catch {
      mgloBytes = null;
    }
    debugLogCompileStringTables(
      source,
      resolvedOptions,
      includeCache,
      mgloBytes
    );
    const warningDiagnostics = parseWarningDiagnostics(parsed.warnings);
    return {
      compileState: warningDiagnostics.length > 0 ? "warn" : "ok",
      errorCount: 0,
      message:
        formatMegaloCompileTiming(compileTiming) ||
        (identical
          ? warningDiagnostics.length > 0
            ? `Compile OK — byte-identical with ${warningDiagnostics.length} warning(s)`
            : "Compile OK — byte-identical to original"
          : offset >= 0
            ? `Compile OK — ${diffCount} byte(s) differ (first at offset ${offset})`
            : `Compile OK — ${diffCount} byte(s) differ from original`),
      byteIdentical: identical,
      byteDiffCount: diffCount,
      compiledByteLength: output.length,
      mgloBytes,
      compileTiming,
      diagnostics: warningDiagnostics,
    };
  } catch (error) {
    debugLogCompileStringTables(source, resolvedOptions, includeCache);
    if (isGvarSizeMismatchError(error)) {
      const diagnostic = compileErrorLocation(
        error,
        source,
        resolvedOptions,
        parsed.program
      );
      const sizes = parseGvarBodyLengthMismatch(diagnostic.message);
      let mgloBytes: Uint8Array | null = null;
      let compileTiming: MegaloCompileTiming | null = null;
      try {
        const compiled = compileMgloFromEditedProgram(
          originalBytes,
          baseProgram,
          parsed.program,
          resolvedOptions
        );
        mgloBytes = compiled.bytes;
        compileTiming = compiled.timing;
      } catch {
        mgloBytes = null;
      }
      return {
        compileState: "warn",
        errorCount: 0,
        message: diagnostic.message,
        byteIdentical: false,
        byteDiffCount: sizes ? Math.abs(sizes.compiled - sizes.original) : null,
        compiledByteLength: sizes?.compiled ?? null,
        mgloBytes,
        compileTiming,
        diagnostics: [],
      };
    }

    const diagnostic = compileErrorLocation(
      error,
      source,
      resolvedOptions,
      parsed.program
    );
    return {
      compileState: "error",
      errorCount: 1,
      message: diagnostic.message,
      byteIdentical: false,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: [diagnostic],
    };
  }
}
