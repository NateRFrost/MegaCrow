export {
  type AnalyzeDocumentOptions,
  analyzeDocument,
} from "src/language-service/analyze";
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
