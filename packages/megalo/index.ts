export { Frontend } from "./frontend";
export {
  DiagnosticSeverity,
  SourceLocationType,
  type Diagnostic,
} from "./frontend/diagnostics";
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
