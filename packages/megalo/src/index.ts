export {
  type CompileSourceOptions,
  type CompileSourceResult,
  compileSource,
  type ResolveBaseFileFn,
} from "src/compile-source";
export {
  type CompilerSettings,
  DEFAULT_COMPILER_SETTINGS,
  resolveCompilerSettings,
} from "src/compiler-settings";
export { decodeMglo, readMgloEncodingVersion } from "src/decode-mglo";
export {
  type Diagnostic,
  DiagnosticSeverity,
  SourceLocationType,
} from "src/diagnostics";
export type { ResolveIncludeFn } from "src/frontend/abstract-syntax-tree";
export type { ObjectLists } from "src/frontend/object-lists";
export { loadObjectListsForVersion } from "src/load-object-lists";
export {
  DEFAULT_MEGACROW_EXTENSIONS,
  type MegacrowExtensions,
  resolveMegacrowExtensions,
} from "src/megacrow-extensions";
export {
  MegaloCompiler as Frontend,
  MegaloCompilerContext,
} from "src/megalo-compiler";
export { MEGALO_VERSIONS, type SupportedMegaloVersion } from "src/version";
