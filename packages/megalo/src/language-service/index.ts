export {
  analyzeDocument,
  type AnalyzeDocumentOptions,
} from "src/language-service/analyze";
export {
  computeLineStarts,
  isRootDocumentLocation,
  locationContainsOffset,
  offsetToPosition,
  positionAtOffset,
  positionToOffset,
  singleLineSpanLength,
} from "src/language-service/position";
export {
  encodeSemanticTokens,
  getSemanticTokens,
  SEMANTIC_TOKEN_MODIFIERS,
  SEMANTIC_TOKEN_TYPES,
  type SemanticToken,
  type SemanticTokenModifier,
  type SemanticTokenType,
} from "src/language-service/highlighting";
export type { AnalysisSnapshot } from "src/language-service/snapshot";
