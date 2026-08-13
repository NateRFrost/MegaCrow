export { MegaloCompiler as Frontend, MegaloCompilerContext } from "src/megalo-compiler";
export {
  DiagnosticSeverity,
  SourceLocationType,
  type Diagnostic,
} from "src/diagnostics";
export type { ObjectLists } from "src/frontend/object-lists";
export { MEGALO_VERSIONS, type SupportedMegaloVersion } from "src/version";
export {
  compileSource,
  type CompileSourceOptions,
  type CompileSourceResult,
  type ResolveBaseFileFn,
} from "src/compile-source";
export { decodeMglo, readMgloEncodingVersion } from "src/decode-mglo";
export { loadObjectListsForVersion } from "src/load-object-lists";
export type { ResolveIncludeFn } from "src/frontend/abstract-syntax-tree";
export {
  DEFAULT_MEGACROW_EXTENSIONS,
  resolveMegacrowExtensions,
  type MegacrowExtensions,
} from "src/megacrow-extensions";
export {
  DEFAULT_COMPILER_SETTINGS,
  resolveCompilerSettings,
  type CompilerSettings,
} from "src/compiler-settings";
