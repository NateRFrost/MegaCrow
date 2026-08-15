export {
  type CompiledMegaloMetadata,
  EngineIcon,
} from "src/backend/compile/compiler";
export {
  type CompileProgressFn,
  type CompileSourceOptions,
  type CompileSourceResult,
  baseFileCompileFailedMessage,
  baseFileCompiledFromSourceMessage,
  baseFileNotFoundMessage,
  clearCompiledBaseSourceCache,
  compileSource,
  type ResolveBaseFileFn,
  type ResolveBaseMgloFailureReason,
  type ResolveBaseMgloResult,
  resolveBaseMgloBytes,
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
  UNKNOWN_LOCATION,
} from "src/diagnostics";
export type { ResolveIncludeFn } from "src/frontend/abstract-syntax-tree";
export {
  analyzeDocument,
  type AnalyzeDocumentOptions,
  type AnalysisSnapshot,
  encodeSemanticTokens,
  getSemanticTokens,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticToken,
  type SemanticTokenModifier,
  type SemanticTokenType,
} from "src/language-service";
export type { ObjectLists } from "src/frontend/object-lists";
export { loadObjectListsForVersion } from "src/load-object-lists";
export {
  ALL_MEGACROW_EXTENSIONS,
  DEFAULT_MEGACROW_EXTENSIONS,
  type MegacrowExtensions,
  resolveMegacrowExtensions,
} from "src/megacrow-extensions";
export {
  MegaloCompiler as Frontend,
  MegaloCompilerContext,
} from "src/megalo-compiler";
export {
  MEGALO_VERSIONS,
  getLabel,
  isMegaloVersionId,
  type MegaloVersionId,
  type SupportedMegaloVersion,
} from "src/version";
