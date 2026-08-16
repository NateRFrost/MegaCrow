import type {
  CompileSourceOptions,
  MegacrowExtensions,
  MegaloVersionId,
} from "@megacrow/megalo";
import {
  ALL_MEGACROW_EXTENSIONS,
  DiagnosticSeverity,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  compileSource as megaloCompileSource,
  SourceLocationType,
} from "@megacrow/megalo";
import { translate } from "../localization";

const DEFAULT_COMPILE_VERSION_ID: MegaloVersionId = "107-mcc";

let compileMegaloVersionId: MegaloVersionId = DEFAULT_COMPILE_VERSION_ID;
let compileMegacrowExtensions: MegacrowExtensions = ALL_MEGACROW_EXTENSIONS;
let compileStrictStringLiterals = false;
let compileCreatorGamertag = "MegaCrow";

/** Used so main-thread compile matches the active workspace Megalo version. */
export function setCompileMegaloVersion(versionId: MegaloVersionId): void {
  compileMegaloVersionId = isMegaloVersionId(versionId)
    ? versionId
    : DEFAULT_COMPILE_VERSION_ID;
}

export function getCompileMegaloVersion(): MegaloVersionId {
  return compileMegaloVersionId;
}

function compileVersion() {
  return (
    MEGALO_VERSIONS[compileMegaloVersionId] ??
    MEGALO_VERSIONS[DEFAULT_COMPILE_VERSION_ID]
  );
}

/** Used by compiler-settings sync so main-thread compile matches the profile. */
export function setCompileMegacrowExtensions(
  extensions: MegacrowExtensions
): void {
  compileMegacrowExtensions = extensions;
}

export function getCompileMegacrowExtensions(): MegacrowExtensions {
  return compileMegacrowExtensions;
}

/** Used by compiler-settings sync so main-thread compile matches strictness. */
export function setCompileStrictStringLiterals(enabled: boolean): void {
  compileStrictStringLiterals = enabled;
}

export function getCompileStrictStringLiterals(): boolean {
  return compileStrictStringLiterals;
}

/** Used by compiler-settings sync so main-thread compile matches author. */
export function setCompileCreatorGamertag(gamertag: string): void {
  compileCreatorGamertag = normalizeCreatorGamertag(gamertag) || "MegaCrow";
}

export interface MegaloCompileTiming {
  compileMs: number;
  parseMs: number;
  totalMs: number;
}

export function formatMegaloCompileTiming(
  t: MegaloCompileTiming | null
): string {
  if (!t) {
    return "";
  }
  const ms = t.totalMs;
  if (ms >= 100) {
    const seconds = ms / 1000;
    const rounded =
      seconds >= 10
        ? seconds.toFixed(0)
        : seconds.toFixed(2).replace(/\.?0+$/, "");
    return translate("status_compiled_in_seconds", { time: rounded });
  }
  return translate("status_compiled_in_ms", {
    time: Math.max(0, Math.round(ms)),
  });
}

export function normalizeCreatorGamertag(tag: string): string {
  return tag.trim().slice(0, 16);
}

export function enrichCompileErrorLocation(
  error: unknown,
  _source?: string
): { line: number; column: number; message: string } {
  const message = error instanceof Error ? error.message : String(error);
  const match = /:(\d+):(\d+):/.exec(message);
  return {
    line: match ? Number(match[1]) : 1,
    column: match ? Number(match[2]) : 1,
    message,
  };
}

export function megaloErrorLocation(error: unknown) {
  return enrichCompileErrorLocation(error);
}

export function remapIncludeDiagnostic(d: {
  line: number;
  column: number;
  message: string;
}) {
  return d;
}

export function logCompileStringTablesDebug(): void {}

async function compileOrThrow(
  source: string,
  options?: Pick<
    CompileSourceOptions,
    "fromUri" | "resolveInclude" | "resolveBaseFile" | "onCompileProgress"
  >
): Promise<Uint8Array> {
  const result = await megaloCompileSource(source, {
    version: compileVersion(),
    megacrowExtensions: compileMegacrowExtensions,
    compilerSettings: {
      strictStringLiterals: compileStrictStringLiterals,
      creatorGamertag: compileCreatorGamertag,
    },
    fromUri: options?.fromUri,
    resolveInclude: options?.resolveInclude,
    resolveBaseFile: options?.resolveBaseFile,
    onCompileProgress: options?.onCompileProgress,
  });
  if (!result.bytes) {
    const firstError = result.diagnostics.find(
      (d) => d.severity === DiagnosticSeverity.Error
    );
    let message = firstError?.message ?? "Compilation failed";
    if (
      firstError &&
      firstError.location.type === SourceLocationType.SOURCE_CODE
    ) {
      const { line, column } = firstError.location.start;
      message = `:${line}:${column}: ${message}`;
    } else if (
      firstError &&
      firstError.location.type === SourceLocationType.INCLUDE
    ) {
      const { line, column } = firstError.location.declaration.start;
      message = `:${line}:${column}: ${message}`;
    }
    throw new Error(message);
  }
  return result.bytes;
}

export async function compileMgloFromMegaloSourceAsync(
  source: string,
  basename = "script",
  baseCustomVariant?: unknown,
  compileOptions?: Pick<
    CompileSourceOptions,
    "fromUri" | "resolveInclude" | "resolveBaseFile" | "onCompileProgress"
  >
): Promise<Uint8Array> {
  void basename;
  void baseCustomVariant;
  return compileOrThrow(source, compileOptions);
}

/** Sync compile entry points are unavailable — use the async compile path. */
export function compileMgloFromMegaloSource(
  _source: string,
  basename = "script",
  baseCustomVariant?: unknown
): Uint8Array {
  void basename;
  void baseCustomVariant;
  throw new Error(
    "compileMgloFromMegaloSource is async; use compileMgloFromMegaloSourceAsync"
  );
}

export function compileMgloFromEditedProgram(
  _program: unknown,
  _base?: unknown
): Uint8Array {
  throw new Error("compileMgloFromEditedProgram: use source text compile");
}

export function compileGvarFromEditedSource(): never {
  throw new Error("gvar export not yet implemented");
}

export function exportMgloFromBlf(): never {
  throw new Error("BLF export not yet implemented");
}

export function decodeCustomVariantMglo(_bytes: Uint8Array): never {
  throw new Error("decodeCustomVariantMglo: not available");
}

export function extractGvarFromBlf(_bytes: Uint8Array): Uint8Array {
  throw new Error("extractGvarFromBlf: not available");
}

export function resolveStringSymbolFromProgram(
  _program: unknown,
  _symbol: string
): string | null {
  return null;
}

export function compileGametypeForSave(
  source: string,
  _format = "mglo"
): Uint8Array {
  void source;
  void _format;
  throw new Error(
    "compileGametypeForSave is async; use compileMgloFromMegaloSourceAsync"
  );
}
