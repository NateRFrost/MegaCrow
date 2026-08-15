/**
 * IDE compatibility layer over @megacrow/megalo (minimal compile path).
 * Language-service features are stubbed where the full compiler is unavailable.
 */

import type { CompileSourceOptions } from "@megacrow/megalo";
import {
  ALL_MEGACROW_EXTENSIONS,
  DiagnosticSeverity,
  isMegaloVersionId,
  MEGACROW_BUILD_STRING,
  MEGACROW_SHOW_WATERMARK,
  MEGALO_VERSIONS,
  type MegaloVersionId,
  compileSource as megaloCompileSource,
  SourceLocationType,
  type SupportedMegaloVersion,
} from "@megacrow/megalo";

export { MEGACROW_BUILD_STRING, MEGACROW_SHOW_WATERMARK };

const DEFAULT_COMPILE_VERSION = MEGALO_VERSIONS["107-mcc"];

export type GametypeSaveFormat = "mglo" | "gvar" | "mpvr" | "asq";
export type { MegaloVersionId };
export { isMegaloVersionId };

export interface MegaloCompileTiming {
  compileMs: number;
  parseMs: number;
  totalMs: number;
}

export interface VariantLimitItem {
  max: number;
  name: string;
  used: number;
}
export interface VariantLimitUsage {
  items: VariantLimitItem[];
}

export interface ParseWarning {
  column: number;
  length?: number;
  line: number;
  message: string;
  offset?: number;
}

export type MegaloExpr =
  | { kind: "identifier"; name: string }
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "member"; base: MegaloExpr; member: string };

export interface MegaloCondition {
  executeBeforeAction: number;
  executionMode?: string;
  keyword: string;
  negated: boolean;
  operands: MegaloExpr[];
  unionGroup: number;
  unionOr: boolean;
}

export interface MegaloAction {
  executionMode?: string;
  opcode: string;
  operands: MegaloExpr[];
}

export interface MegaloTrigger {
  actions: MegaloStatement[];
  conditions: MegaloStatement[];
  kind: string;
  name: string;
  objectFilter?: string;
}

export type MegaloStatement =
  | { type: "condition"; condition: MegaloCondition }
  | { type: "action"; action: MegaloAction }
  | { type: "trigger"; trigger: MegaloTrigger };

export interface MegaloEngineData {
  category?: string;
  description: string;
  icon?: string;
  name: string;
}

export interface MegaloStringTableEntry {
  column?: number;
  line?: number;
  symbol: string;
  value: string;
}

export interface MegaloStringTableElement {
  entries: MegaloStringTableEntry[];
  language: string;
  type: "string_table";
}

export type MegaloElement =
  | { type: "include"; path: string }
  | { type: "localized_include"; path: string }
  | { type: "base"; path: string }
  | MegaloStringTableElement
  | { type: "engine_data"; data: MegaloEngineData }
  | { type: "trigger"; trigger: MegaloTrigger }
  | { type: "unknown"; keyword: string };

export interface MegaloTriggerBinding {
  actionCount: number;
  conditionCount: number;
  kind: string;
  name: string;
}

export interface MegaloProgram {
  buildNumber: number;
  elements: MegaloElement[];
  encodingVersion: number;
  flatActions: MegaloAction[];
  flatConditions: MegaloCondition[];
  specialTriggers: {
    initialization: number;
    localInitialization: number;
    hostMigration: number;
    doubleMigration: number;
    objectDeathEvent: number;
    local: number;
    pregame: number;
  };
  stringSymbolOrder?: string[];
  triggerTable: MegaloTriggerBinding[];
}

export interface CompletionItem {
  detail?: string;
  documentation?: string;
  kind?: string;
  label: string;
}

export interface SourceTokenSpan {
  column: number;
  length: number;
  line: number;
  type: MegaloSyntaxItemType;
}

export enum MegaloSyntaxItemType {
  None = 0,
  Comment = 1,
  Keyword = 2,
  Action = 3,
  Condition = 4,
  Number = 5,
  String = 6,
  GameOption = 7,
  VariableType = 8,
  NumericConstant = 9,
  Identifier = 10,
  OverrideOption = 11,
  MapObjectProperty = 12,
}

export interface FileProvider {
  readBytes?(path: string): Promise<Uint8Array | null>;
  readText(path: string): Promise<string | null>;
  resolvePath(relativePath: string, fromDir: string): string;
}

export interface MegaloIncludeError {
  column: number;
  length?: number;
  line: number;
  message: string;
  offset?: number;
  path: string;
}

export interface MegaloCompileOptions {
  creatorGamertag?: string;
  includes?: {
    inputDir?: string;
    sourceDir?: string;
    outputDir?: string;
    readFile?: (path: string) => string | Promise<string>;
    exists?: (path: string) => boolean | Promise<boolean>;
  };
  strictStringLiterals?: boolean;
}

const EMPTY_SPECIAL = {
  initialization: -1,
  localInitialization: -1,
  hostMigration: -1,
  doubleMigration: -1,
  objectDeathEvent: -1,
  local: -1,
  pregame: -1,
};

export const MEGALO_ACTIONS: string[] = [];
export const MEGALO_CONDITIONS: string[] = [];
export const MEGALO_KEYWORDS: string[] = [];
export const MEGALO_BUILTIN_GLOBALS: string[] = [];
export const MEGALO_BUILTIN_OVERRIDE_OPTIONS: string[] = [];
export const MEGALO_COMPARISON_OPS = ["==", "!=", ">=", "<=", ">", "<", "="];
export const MEGALO_MATH_OPS = [
  "set_to",
  "add",
  "subtract",
  "multiply",
  "divide",
  "modulo",
];
export const MEGALO_HIGHLIGHT_RESERVED_KEYWORDS = MEGALO_KEYWORDS;
export const MEGALO_MAP_OBJECT_FILTER_PROPERTIES: string[] = [];
export const MEGALO_TRIGGER_KINDS = [
  "general",
  "player",
  "team",
  "object",
  "initialization",
];
export const MEGALO_VARIABLE_TYPES = [
  "number",
  "timer",
  "object",
  "team",
  "player",
];
export const MEGALO_STRING_TABLE_LANGUAGES = [
  "english",
  "french",
  "german",
  "spanish",
  "italian",
  "japanese",
  "korean",
  "chinese",
  "portuguese",
  "polish",
  "russian",
  "dutch",
];

function emptyProgram(): MegaloProgram {
  return {
    elements: [],
    flatConditions: [],
    flatActions: [],
    triggerTable: [],
    specialTriggers: { ...EMPTY_SPECIAL },
    encodingVersion: 107,
    buildNumber: -1,
  };
}

async function compileOrThrow(
  source: string,
  options?: Pick<
    CompileSourceOptions,
    "fromUri" | "resolveInclude" | "resolveBaseFile" | "onCompileProgress"
  >
): Promise<Uint8Array> {
  const result = await megaloCompileSource(source, {
    version: DEFAULT_COMPILE_VERSION,
    megacrowExtensions: ALL_MEGACROW_EXTENSIONS,
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

export function tryParse(
  _source: string
):
  | { ok: true; program: MegaloProgram; warnings: ParseWarning[] }
  | { ok: false; line: number; column: number; message: string } {
  return { ok: true, program: emptyProgram(), warnings: [] };
}

export function sourceHasIncludeDirectives(source: string): boolean {
  return /^\s*(include|localized_include)\s+"/m.test(source);
}

export function expandIncludeTokens(
  source: string,
  _options?: MegaloCompileOptions
): unknown {
  return source;
}

export function tryExpandMegaloIncludes(
  source: string,
  _options?: MegaloCompileOptions
): { ok: true; source: string } | { ok: false; errors: MegaloIncludeError[] } {
  return { ok: true, source };
}

export async function expandMegaloIncludesAsync(
  source: string,
  _options?: MegaloCompileOptions
): Promise<
  { ok: true; source: string } | { ok: false; errors: MegaloIncludeError[] }
> {
  return tryExpandMegaloIncludes(source, _options);
}

export function findMegaloIncludeDirectives(source: string): string[] {
  const paths: string[] = [];
  const re = /^\s*(?:include|localized_include)\s+"([^"]+)"/gm;
  for (const match of source.matchAll(re)) {
    if (match[1]) {
      paths.push(match[1]);
    }
  }
  return paths;
}

export function unresolvedIncludeErrors(
  source: string,
  message: string
): MegaloIncludeError[] {
  const errors: MegaloIncludeError[] = [];
  const lines = source.split(/\r?\n/);
  const re = /^\s*(include|localized_include)\s+"([^"]*)"/;
  for (let i = 0; i < lines.length; i++) {
    const match = re.exec(lines[i] ?? "");
    if (!match) {
      continue;
    }
    errors.push({
      path: match[2] ?? "",
      message,
      line: i + 1,
      column: 1,
    });
  }
  if (errors.length === 0) {
    errors.push({
      path: "",
      message,
      line: 1,
      column: 1,
    });
  }
  return errors;
}

export function analyzeProgram(_program: MegaloProgram) {
  return { diagnostics: [] as never[] };
}

export function computeVariantLimitUsage(
  _program: MegaloProgram
): VariantLimitUsage {
  return { items: [] };
}

function getVersionLabel(info: SupportedMegaloVersion) {
  switch (info.version) {
    case 107:
      switch (info.flavour) {
        case "mcc":
          return "MCC";
        default:
          return "360 TU1";
      }
    default:
      return String(info.version);
  }
}

export function getVersionInfo(version: MegaloVersionId = "107-mcc") {
  const info = MEGALO_VERSIONS[version];
  return {
    id: version,
    label: getVersionLabel(info),
    encoding: info.version,
  };
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
    return `Compiled in ${rounded}s`;
  }
  return `Compiled in ${Math.max(0, Math.round(ms))}ms`;
}

export function autosaveQueueFileName(name: string): string {
  return name;
}

export function constantNamesFromProgram(_program: MegaloProgram): string[] {
  return [];
}

export function classifySourceTokens(
  _source: string,
  _file = "megalo://editor"
): SourceTokenSpan[] {
  return [];
}

export function getHoverForSource(): string | null {
  return null;
}

export function formatHoverHtml(markdown: string): string {
  return markdown;
}

export function findStringTableGroups(): never[] {
  return [];
}

export function getStringTableFoldLineNumbers(): number[] {
  return [];
}

export function deriveSymbolOrderFromStringElements(
  _elements: MegaloElement[]
): string[] {
  return [];
}

export function formatMegaloStringLiteral(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function mergeStringTableElements(
  elements: MegaloElement[]
): MegaloElement[] {
  return elements;
}

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

export function compileMgloFromEditedProgram(
  _program: MegaloProgram,
  _base?: unknown
): Uint8Array {
  throw new Error("compileMgloFromEditedProgram: use source text compile");
}

export function compileGvarFromEditedSource(): never {
  throw new Error("gvar export not yet implemented");
}

export function compileGvarFromMegaloProgram(): never {
  throw new Error("gvar export not yet implemented");
}

export function compileMgloFromEditedSource(
  source: string,
  _basename = "script"
): Uint8Array {
  void source;
  void _basename;
  throw new Error(
    "compileMgloFromEditedSource is async; use compileMgloFromMegaloSourceAsync"
  );
}

export function decodeCustomVariantMglo(_bytes: Uint8Array): never {
  throw new Error("decodeCustomVariantMglo: not available in minimal build");
}

export function exportMgloFromBlf(): never {
  throw new Error("BLF export not yet implemented");
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

export function createMegaloService() {
  return {
    setSettings() {},
    setVersion() {},
    setFileProvider() {},
    setIncludeOptions() {},
    noteResolvedBase() {},
    analyzeSource() {
      return { diagnostics: [] };
    },
  };
}

export function lookupAction(_name: string): undefined {
  return;
}

export function lookupCondition(_name: string): undefined {
  return;
}

export function normalizeCreatorGamertag(tag: string): string {
  return tag.trim();
}

export interface BaseDirectiveLocation {
  column: number;
  endColumn: number;
  length: number;
  line: number;
  offset: number;
  path: string;
}

/** Line/column (1-based) for a localOffset; skips CR like the megalo lexer. */
function positionAtOffset(
  source: string,
  offset: number
): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const end = Math.min(Math.max(0, offset), source.length);
  for (let i = 0; i < end; i++) {
    const code = source.charCodeAt(i);
    if (code === 10 /* \n */) {
      line++;
      column = 1;
    } else if (code !== 13 /* \r */) {
      column++;
    }
  }
  return { line, column };
}

/** Locate `base "…"`, spanning from `base` through the closing quote. */
export function parseBaseDirective(
  source: string
): BaseDirectiveLocation | null {
  const match = /^\s*base\s+"([^"]+)"/m.exec(source);
  if (!match?.[1] || match.index === undefined) {
    return null;
  }
  const keywordOffset = match[0].search(/base\s+"/);
  if (keywordOffset < 0) {
    return null;
  }
  const offset = match.index + keywordOffset;
  const length = match[0].length - keywordOffset;
  const { line, column } = positionAtOffset(source, offset);
  return {
    path: match[1],
    line,
    column,
    endColumn: column + length,
    offset,
    length,
  };
}

export function baseDirectiveLocation(source: string) {
  return parseBaseDirective(source);
}

export function formatBaseNotFoundMessage(
  path: string,
  _dirs?: string[]
): string {
  return `Base gametype not found: ${path}`;
}

export async function resolveBaseProgramInDirs(
  _path: string,
  _dirs: string[]
): Promise<null> {
  return null;
}

export function encodeCustomVariantMglo(_variant: unknown): Uint8Array {
  throw new Error("encodeCustomVariantMglo: not available in minimal build");
}

export function mergeDerivedWithBase(
  derived: MegaloProgram,
  _base?: MegaloProgram | null
): MegaloProgram {
  return derived;
}

export function rebuildProgramLayout(program: MegaloProgram): MegaloProgram {
  return program;
}

export function extractGvarFromBlf(_bytes: Uint8Array): Uint8Array {
  throw new Error("extractGvarFromBlf: not available in minimal build");
}

export function resolveStringSymbolFromProgram(
  _program: MegaloProgram,
  _symbol: string
): string | null {
  return null;
}

export function compileGametypeForSave(
  source: string,
  _format: GametypeSaveFormat = "mglo"
): Uint8Array {
  void source;
  void _format;
  throw new Error(
    "compileGametypeForSave is async; use compileMgloFromMegaloSourceAsync"
  );
}

export type { MegaloEngineData as MegaloEngineDataExport };
