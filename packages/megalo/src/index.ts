export {
  type CompiledMegaloFileType,
  type CompiledMegaloMetadata,
  EngineIcon,
  getCompilerForVersion,
  packMgloBytesForVersion,
  type WriteMegaloFileOptions,
  type WriteMegaloFileResult,
} from "src/backend/compile";
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
export { decodeMglo, readMgloEncodingVersion } from "src/decode-mglo";
export {
  type Diagnostic,
  DiagnosticSeverity,
  isObjectListDiagnosticData,
  OBJECT_LIST_DIAGNOSTIC_KIND,
  type ObjectListDiagnosticData,
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
  defaultGameBuildNumber,
  hasMultipleKnownGameBuilds,
  knownGameBuildsFor,
  resolveGameBuildNumber,
} from "src/game-builds";
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
  type CompiledEngineStats,
  collectCompiledEngineStats,
  formatVariantLimitUsage,
  type VariantLimitItem,
  type VariantLimitSection,
  type VariantLimitUsage,
} from "src/variant-limit-usage";
export {
  getFullDescription,
  getGameName,
  getLabel,
  getShortDescription,
  isMccMegaloVersion,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  type MegaloVersionId,
  type SupportedMegaloVersion,
} from "src/version";
