import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import { isComparisonOperatorName } from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  playerFilterType,
  teamOrPlayerTarget,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { MegaloEnumDef } from "src/frontend/intermediate-representation/megaloEnum";
import { emitLocation } from "src/language-service/highlighting/emit";
import type { SemanticToken } from "src/language-service/highlighting/types";

const BOOLEAN_KEYWORDS = ["true", "false"] as const;

export type EnumKeywordAllowed =
  | ReadonlySet<string>
  | readonly string[]
  | Pick<MegaloEnumDef<string>, "acceptedNames">;

const isKeyword = (
  node: ASTParameterNode | undefined,
  value?: string
): node is ASTParameterNode & { kind: SyntaxKind.KEYWORD; value: string } =>
  node !== undefined &&
  node.kind === SyntaxKind.KEYWORD &&
  (value === undefined || node.value === value);

const asSet = (allowed: EnumKeywordAllowed): ReadonlySet<string> => {
  if (allowed instanceof Set) {
    return allowed;
  }
  if ("acceptedNames" in allowed) {
    return new Set(allowed.acceptedNames);
  }
  return new Set(allowed);
};

/** Closed-vocab keyword → enumMember only when `value` is in `allowed`. */
export const highlightEnumKeyword = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined,
  allowed: EnumKeywordAllowed
): void => {
  if (!isKeyword(node)) {
    return;
  }
  if (!asSet(allowed).has(node.value)) {
    return;
  }
  emitLocation(out, node.location, "enumMember");
};

/** Free keyword → parameter. */
export const highlightParameterKeyword = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined
): void => {
  if (!isKeyword(node)) {
    return;
  }
  emitLocation(out, node.location, "parameter");
};

/** Keyword in `allowed` → enumMember; otherwise structural (member / grenade / …). */
export const highlightEnumOrStructural = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined,
  allowed: EnumKeywordAllowed
): void => {
  if (isKeyword(node)) {
    highlightEnumKeyword(out, node, allowed);
    return;
  }
  highlightStructural(out, node);
};

/** Keyword → parameter; otherwise structural. */
export const highlightParameterOrStructural = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined
): void => {
  if (isKeyword(node)) {
    highlightParameterKeyword(out, node);
    return;
  }
  highlightStructural(out, node);
};

/** Math-operation: word forms (`set_to`, `add`) → keyword; symbols (`=`, `+=`) → operator. */
export const highlightOperatorKeyword = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined
): void => {
  if (!isKeyword(node)) {
    return;
  }
  const type = /^[A-Za-z_][A-Za-z0-9_]*$/.test(node.value)
    ? "keyword"
    : "operator";
  emitLocation(out, node.location, type);
};

/**
 * Structural highlights for non-symbol tokens:
 * member accessors, grenade-count enums, nested dynamic-string replacements.
 */
export const highlightStructural = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined
): void => {
  if (node === undefined) {
    return;
  }
  switch (node.kind) {
    case SyntaxKind.MEMBER_REFERENCE:
      emitLocation(out, node.member.location, "property");
      break;
    case SyntaxKind.GRENADE_COUNT:
      if (node.form === "preset") {
        highlightEnumKeyword(out, node.value, ["none", "default"]);
      } else {
        highlightEnumKeyword(out, node.grenadeType, ["frag", "plasma", "each"]);
      }
      break;
    case SyntaxKind.DYNAMIC_STRING:
      for (const replacement of node.replacements) {
        highlightStructural(out, replacement);
      }
      break;
    default:
      break;
  }
};

/**
 * Loose operand (condition / temporary initial): members, comparisons, booleans.
 * Refs left to the symbol table.
 */
export const highlightOperand = (
  out: SemanticToken[],
  node: ASTParameterNode | undefined
): void => {
  if (node === undefined) {
    return;
  }
  if (node.kind === SyntaxKind.KEYWORD) {
    if (
      /^[=!<>]+$/.test(node.value) ||
      isComparisonOperatorName(node.value)
    ) {
      highlightOperatorKeyword(out, node);
      return;
    }
    highlightEnumKeyword(out, node, BOOLEAN_KEYWORDS);
    return;
  }
  highlightStructural(out, node);
};

/** `everyone` | `player <ref>` | `team <ref>` → next index. */
export const highlightTeamOrPlayerTarget = (
  out: SemanticToken[],
  parameters: readonly ASTParameterNode[],
  startIndex: number
): number => {
  const first = parameters[startIndex];
  if (!isKeyword(first)) {
    return startIndex;
  }
  if (first.value === teamOrPlayerTarget.enum.everyone) {
    highlightEnumKeyword(out, first, teamOrPlayerTarget);
    return startIndex + 1;
  }
  if (
    first.value === teamOrPlayerTarget.enum.player ||
    first.value === teamOrPlayerTarget.enum.team
  ) {
    highlightParameterKeyword(out, first);
    highlightStructural(out, parameters[startIndex + 1]);
    return startIndex + 2;
  }
  // Unknown keyword: do not color or consume as a valid target.
  return startIndex;
};

/**
 * `no_one` | `everyone` | `allies` | `enemies` | `normal`
 * or `player <player> <bool>` → next index.
 */
export const highlightPlayerFilter = (
  out: SemanticToken[],
  parameters: readonly ASTParameterNode[],
  startIndex: number
): number => {
  const first = parameters[startIndex];
  if (first === undefined || first.kind !== SyntaxKind.KEYWORD) {
    return startIndex;
  }
  if (first.value === playerFilterType.enum.player) {
    highlightParameterKeyword(out, first);
    highlightStructural(out, parameters[startIndex + 1]);
    const visible = parameters[startIndex + 2];
    if (visible !== undefined && visible.kind === SyntaxKind.KEYWORD) {
      highlightEnumKeyword(out, visible, BOOLEAN_KEYWORDS);
    } else {
      highlightStructural(out, visible);
    }
    return startIndex + 3;
  }
  if (playerFilterType.has(first.value)) {
    highlightEnumKeyword(out, first, playerFilterType);
    return startIndex + 1;
  }
  return startIndex;
};

/**
 * If `parameters[index]` is keyword `name`, highlight as enumMember and
 * return index+1; otherwise leave index unchanged.
 */
export const highlightOptionalEnum = (
  out: SemanticToken[],
  parameters: readonly ASTParameterNode[],
  index: number,
  name: string
): number => {
  const node = parameters[index];
  if (!isKeyword(node, name)) {
    return index;
  }
  highlightEnumKeyword(out, node, [name]);
  return index + 1;
};

/**
 * Walk remaining params: known optional markers → enumMember;
 * unknown keywords are left uncolored; else structural only.
 */
export const highlightTrailingOptionals = (
  out: SemanticToken[],
  parameters: readonly ASTParameterNode[],
  startIndex: number,
  optionalNames: EnumKeywordAllowed
): void => {
  for (let i = startIndex; i < parameters.length; i++) {
    const node = parameters[i]!;
    if (isKeyword(node)) {
      highlightEnumKeyword(out, node, optionalNames);
      continue;
    }
    highlightStructural(out, node);
  }
};

/**
 * Schema / element property values: closed keywords in `allowed` → enumMember,
 * members/grenades via structural. Refs left to the symbol table.
 */
export const highlightClosedValueParameters = (
  out: SemanticToken[],
  parameters: readonly ASTParameterNode[],
  allowed: EnumKeywordAllowed
): void => {
  for (const node of parameters) {
    if (isKeyword(node)) {
      highlightEnumKeyword(out, node, allowed);
      continue;
    }
    highlightStructural(out, node);
  }
};

export { isKeyword };
