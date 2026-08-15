export {
  type AnalyzeDocumentOptions,
  type AnalyzeDocumentSyncOptions,
  analyzeDocument,
  analyzeDocumentSync,
} from "src/language-service/analyze";
export {
  type AnalyzeObjectListOptions,
  analyzeObjectListSource,
  objectListEntryCount,
} from "src/language-service/analyze-object-list";
export {
  type DefinitionRange,
  type DefinitionTarget,
  definitionAtPosition,
} from "src/language-service/definition";
export {
  encodeSemanticTokens,
  getSemanticTokens,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticToken,
  type SemanticTokenModifier,
  type SemanticTokenType,
} from "src/language-service/highlighting";
export {
  computeLineStarts,
  isRootDocumentLocation,
  locationContainsOffset,
  offsetToPosition,
  positionAtOffset,
  positionToOffset,
  singleLineSpanLength,
} from "src/language-service/position";
export type { AnalysisSnapshot } from "src/language-service/snapshot";
