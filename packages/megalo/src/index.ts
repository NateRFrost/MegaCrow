export { MegaloCompiler as Frontend, MegaloCompilerContext } from "./megalo-compiler";
export {
  DiagnosticSeverity,
  SourceLocationType,
  type Diagnostic,
} from "./diagnostics";
export type { ObjectLists } from "./frontend/object-lists";
export { MEGALO_VERSIONS, type SupportedMegaloVersion } from "./version";
export {
  compileSource,
  type CompileSourceOptions,
  type CompileSourceResult,
  type ResolveBaseFileFn,
} from "./compile-source";
export { decodeMglo, readMgloEncodingVersion } from "./decode-mglo";
export { loadObjectListsForVersion } from "./load-object-lists";
export type { ResolveIncludeFn } from "./frontend/abstract-syntax-tree";
export {
  DEFAULT_MEGACROW_EXTENSIONS,
  resolveMegacrowExtensions,
  type MegacrowExtensions,
} from "./megacrow-extensions";
export {
  DEFAULT_COMPILER_SETTINGS,
  resolveCompilerSettings,
  type CompilerSettings,
} from "./compiler-settings";
