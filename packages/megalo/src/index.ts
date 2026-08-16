export {
  type CompiledMegaloMetadata,
  EngineIcon,
} from "src/backend/compile/compiler";
export type {
  Limits,
  VariableLimits,
  VersionConfiguration,
} from "src/backend/version-configuration";
export { getConfigurationForVersion } from "src/backend/version-configuration";
export {
  MEGACROW_BUILD_STRING,
  MEGACROW_PACKAGE_VERSION,
  MEGACROW_SHOW_WATERMARK,
} from "src/build-info";
export {
  baseFileCompiledFromSourceMessage,
  baseFileCompileFailedMessage,
  baseFileNotFoundMessage,
  type CompileProgressFn,
  type CompileSourceOptions,
  type CompileSourceResult,
  clearCompiledBaseSourceCache,
  compileFromAst,
  compileFromSnapshot,
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
export {
  type ComputeVariantLimitUsageOptions,
  computeVariantLimitUsage,
} from "src/compute-variant-limit-usage";
export { decodeMglo, readMgloEncodingVersion } from "src/decode-mglo";
export {
  type Diagnostic,
  DiagnosticSeverity,
  SourceLocationType,
  UNKNOWN_LOCATION,
} from "src/diagnostics";
export {
  includeDiagnosticSummaryMessage,
  summarizeIncludeDiagnostics,
} from "src/diagnostics/summarizeInclude";
export type { ResolveIncludeFn } from "src/frontend/abstract-syntax-tree";
export {
  STRING_TABLE_LANGUAGES,
  type StringTableLanguage,
} from "src/frontend/language-configuration/omni/strings";
export type {
  ObjectListData,
  ObjectListEntries,
  ObjectListFileSource,
  ObjectLists,
} from "src/frontend/object-lists";
export {
  isObjectListFileSource,
  ObjectListType,
  objectListEntries,
  objectListSourceFile,
} from "src/frontend/object-lists";
export {
  type AnalysisSnapshot,
  type AnalyzeDocumentOptions,
  type AnalyzeDocumentSyncOptions,
  type AnalyzeObjectListOptions,
  analyzeDocument,
  analyzeDocumentSync,
  analyzeObjectListSource,
  type CompletionItem,
  type CompletionKind,
  completeQuotedPath,
  completionsAtPosition,
  type DefinitionRange,
  type DefinitionTarget,
  definitionAtPosition,
  encodeSemanticTokens,
  getQuotedPathCompletionQuery,
  getSemanticTokens,
  type HoverContribution,
  type HoverContributionKind,
  type HoverResult,
  type HoverTarget,
  hoverAtPosition,
  hoverDocumentationForId,
  objectListEntryCount,
  type PathDirectoryEntry,
  type QuotedPathCompletionQuery,
  resolveHoverTarget,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticToken,
  type SemanticTokenModifier,
  type SemanticTokenType,
  splitPathPrefix,
} from "src/language-service";
export { loadObjectListsForVersion } from "src/load-object-lists";
export {
  getLocale,
  isLocaleWithStringTable,
  LOCALE_TO_STRING_TABLE_LANGUAGE,
  type LocaleWithStringTable,
  pickLocalizedStringTableText,
  pickStringTableText,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  setLocale,
  stringTableLanguageForLocale,
  stringTableLanguageIndex,
} from "src/localization";
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
  buildVariantLimitUsage,
  type VariantLimitItem,
  type VariantLimitSection,
  type VariantLimitUsage,
} from "src/variant-limit-usage";
export {
  getLabel,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  type MegaloVersionId,
  type SupportedMegaloVersion,
} from "src/version";
