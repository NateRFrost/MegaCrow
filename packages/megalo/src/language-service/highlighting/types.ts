/** LSP-friendly semantic token types. */
export const SEMANTIC_TOKEN_TYPES = [
  "comment",
  "string",
  "number",
  "operator",
  "keyword",
  "function",
  "variable",
  "parameter",
  "property",
  "class",
  "type",
  "enumMember",
  "modifier",
] as const;

export type SemanticTokenType = (typeof SEMANTIC_TOKEN_TYPES)[number];

export const SEMANTIC_TOKEN_MODIFIERS = [
  "readonly",
  "defaultLibrary",
  "declaration",
] as const;

export type SemanticTokenModifier = (typeof SEMANTIC_TOKEN_MODIFIERS)[number];

export interface SemanticToken {
  length: number;
  /** 0-based line */
  line: number;
  modifiers: SemanticTokenModifier[];
  /** 0-based UTF-16 start character */
  startChar: number;
  type: SemanticTokenType;
}

export const TYPE_INDEX = Object.fromEntries(
  SEMANTIC_TOKEN_TYPES.map((type, index) => [type, index])
) as Record<SemanticTokenType, number>;

export const MODIFIER_INDEX = Object.fromEntries(
  SEMANTIC_TOKEN_MODIFIERS.map((modifier, index) => [modifier, index])
) as Record<SemanticTokenModifier, number>;

export const TYPE_PRIORITY: Record<SemanticTokenType, number> = {
  comment: 100,
  string: 100,
  number: 100,
  operator: 100,
  function: 80,
  parameter: 80,
  property: 80,
  class: 80,
  type: 80,
  enumMember: 80,
  modifier: 70,
  variable: 60,
  keyword: 40,
};
