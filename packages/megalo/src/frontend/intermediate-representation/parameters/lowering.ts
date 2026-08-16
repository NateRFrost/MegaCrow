/**
 * Declarative parameter-signature matcher.
 *
 * Production element lowerers should use explicit helpers (`lowerConstantInteger`,
 * `resolvePlayerReference`, etc.) instead. This module remains for unit tests
 * and as a reference for the parse-time `parameterParserBuilder` twin.
 */

import { type SourceLocation, SourceLocationType } from "src/diagnostics";
import {
  isAstErrorNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  type Located,
  located,
} from "src/frontend/intermediate-representation";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ObjectReferenceType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import { lowerConstantNumber } from "src/frontend/intermediate-representation/parameters/constantNumber";
import type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
import {
  type CustomVariableKind,
  resolveCustomTimerReference,
  resolveCustomVariableReference,
  resolveObjectReference,
  resolveObjectTypeReference,
  resolvePlayerReference,
  resolveTeamReference,
  resolveVariantVariable,
} from "src/frontend/intermediate-representation/parameters/references";
import { resolveScriptStringTableReference } from "src/frontend/intermediate-representation/parameters/resolveScriptStringTableReference";
import type { ObjectListType } from "src/frontend/object-lists";
import {
  isBuiltInVariable,
  SymbolKind,
  VariableType,
} from "src/frontend/symbol-table";

export type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
export { CustomVariableKind } from "src/frontend/intermediate-representation/parameters/references";

export enum LoweringSpecKind {
  Number = 0,
  Float = 1,
  String = 2,
  CustomVariable = 3,
  CustomTimer = 4,
  Object = 5,
  ObjectType = 6,
  Player = 7,
  Team = 8,
  VariantVariable = 9,
  Keyword = 10,
}

interface NumberLoweringSpec {
  readonly kind: LoweringSpecKind.Number;
  readonly name: string;
}

interface FloatLoweringSpec {
  readonly kind: LoweringSpecKind.Float;
  readonly name: string;
}

interface StringLoweringSpec {
  readonly kind: LoweringSpecKind.String;
  readonly name: string;
}

interface CustomVariableLoweringSpec {
  readonly acceptedKinds?: readonly CustomVariableKind[];
  readonly kind: LoweringSpecKind.CustomVariable;
  readonly name: string;
}

interface CustomTimerLoweringSpec {
  readonly kind: LoweringSpecKind.CustomTimer;
  readonly name: string;
}

interface ObjectLoweringSpec {
  readonly acceptedSubtypes?: readonly ObjectReferenceType[];
  readonly kind: LoweringSpecKind.Object;
  readonly name: string;
}

interface ObjectTypeLoweringSpec {
  readonly acceptedObjectTypes?: readonly ObjectListType[];
  readonly kind: LoweringSpecKind.ObjectType;
  readonly name: string;
}

interface PlayerLoweringSpec {
  readonly kind: LoweringSpecKind.Player;
  readonly name: string;
}

interface TeamLoweringSpec {
  readonly kind: LoweringSpecKind.Team;
  readonly name: string;
}

interface VariantVariableLoweringSpec {
  readonly kind: LoweringSpecKind.VariantVariable;
  readonly name: string;
}

interface KeywordLoweringSpec {
  readonly kind: LoweringSpecKind.Keyword;
  readonly name: string;
  readonly value: string;
}

export type LoweringSpec =
  | NumberLoweringSpec
  | FloatLoweringSpec
  | StringLoweringSpec
  | CustomVariableLoweringSpec
  | CustomTimerLoweringSpec
  | ObjectLoweringSpec
  | ObjectTypeLoweringSpec
  | PlayerLoweringSpec
  | TeamLoweringSpec
  | VariantVariableLoweringSpec
  | KeywordLoweringSpec;

export interface OptionalLoweringSlot {
  readonly kind: "optional";
  readonly name: string;
  readonly specs?: readonly LoweringSpec[];
}

export type LoweringSlot =
  | LoweringSpec
  | readonly LoweringSpec[]
  | OptionalLoweringSlot;

export type LoweringSignature = readonly LoweringSlot[];

export const numberParam = (name: string): NumberLoweringSpec => ({
  kind: LoweringSpecKind.Number,
  name,
});

export const floatParam = (name: string): FloatLoweringSpec => ({
  kind: LoweringSpecKind.Float,
  name,
});

export const stringParam = (name: string): StringLoweringSpec => ({
  kind: LoweringSpecKind.String,
  name,
});

export const customVariableParam = (
  name: string,
  ...kinds: CustomVariableKind[]
): CustomVariableLoweringSpec => ({
  kind: LoweringSpecKind.CustomVariable,
  name,
  acceptedKinds: kinds.length > 0 ? kinds : undefined,
});

export const customTimerParam = (name: string): CustomTimerLoweringSpec => ({
  kind: LoweringSpecKind.CustomTimer,
  name,
});

export const objectParam = (
  name: string,
  ...subtypes: ObjectReferenceType[]
): ObjectLoweringSpec => ({
  kind: LoweringSpecKind.Object,
  name,
  acceptedSubtypes: subtypes.length > 0 ? subtypes : undefined,
});

export const objectTypeParam = (
  name: string,
  ...objectTypes: ObjectListType[]
): ObjectTypeLoweringSpec => ({
  kind: LoweringSpecKind.ObjectType,
  name,
  acceptedObjectTypes: objectTypes.length > 0 ? objectTypes : undefined,
});

export const playerParam = (name: string): PlayerLoweringSpec => ({
  kind: LoweringSpecKind.Player,
  name,
});

export const teamParam = (name: string): TeamLoweringSpec => ({
  kind: LoweringSpecKind.Team,
  name,
});

export const variantVariableParam = (
  name: string
): VariantVariableLoweringSpec => ({
  kind: LoweringSpecKind.VariantVariable,
  name,
});

export const keywordParam = (
  name: string,
  value: string
): KeywordLoweringSpec => ({
  kind: LoweringSpecKind.Keyword,
  name,
  value,
});

export const OptionalParam = (
  name: string,
  ...specs: LoweringSpec[]
): OptionalLoweringSlot => ({
  kind: "optional",
  name,
  specs: specs.length > 0 ? specs : undefined,
});

export interface LoweredParameter {
  readonly name: string;
  readonly value: Located<unknown> | undefined;
}

export type LoweredResult = LoweredParameter[] & {
  byName: (name: string) => Located<unknown> | undefined;
};

const isOptionalSlot = (slot: LoweringSlot): slot is OptionalLoweringSlot =>
  typeof slot === "object" &&
  !Array.isArray(slot) &&
  "kind" in slot &&
  slot.kind === "optional";

const isUnionSlot = (slot: LoweringSlot): slot is readonly LoweringSpec[] =>
  Array.isArray(slot);

const makeResult = (parameters: LoweredParameter[]): LoweredResult => {
  const result = parameters as LoweredResult;
  result.byName = (name: string) =>
    parameters.find((p) => p.name === name)?.value;
  return result;
};

const looksLikeCustomVariable = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.INTEGER) {
    return true;
  }
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    return true;
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  if (symbol === undefined) {
    return false;
  }
  return (
    symbol.kind === SymbolKind.Constant ||
    symbol.kind === SymbolKind.GameOption ||
    (symbol.kind === SymbolKind.Variable &&
      (symbol.type === VariableType.Number || isBuiltInVariable(symbol)))
  );
};

const looksLikeTimer = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    return node.member.value.includes("timer");
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return (
    symbol?.kind === SymbolKind.Variable && symbol.type === VariableType.Timer
  );
};

const looksLikePlayer = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    return true;
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return (
    symbol?.kind === SymbolKind.Variable && symbol.type === VariableType.Player
  );
};

const looksLikeTeam = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    return node.member.value === "team";
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return (
    symbol?.kind === SymbolKind.Variable && symbol.type === VariableType.Team
  );
};

const looksLikeObject = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    return true;
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return (
    symbol?.kind === SymbolKind.Variable && symbol.type === VariableType.Object
  );
};

const looksLikeObjectType = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return symbol?.kind === SymbolKind.ObjectListItem;
};

const looksLikeString = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.QUOTED_STRING) {
    return true;
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return symbol?.kind === SymbolKind.String;
};

const looksLikeInteger = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean => {
  if (node.kind === SyntaxKind.INTEGER) {
    return true;
  }
  if (node.kind !== SyntaxKind.REFERENCE) {
    return false;
  }
  const symbol = ctx.symbolTable.getSymbol(node.symbolId);
  return (
    symbol?.kind === SymbolKind.Constant ||
    (symbol?.kind === SymbolKind.Variable &&
      symbol.type === VariableType.Number &&
      !isBuiltInVariable(symbol))
  );
};

const looksLikeFloat = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): boolean =>
  node.kind === SyntaxKind.FLOATING_POINT || looksLikeInteger(node, ctx);

const matchesSpec = (
  node: ASTParameterNode,
  spec: LoweringSpec,
  ctx: ParameterLoweringContext
): boolean => {
  switch (spec.kind) {
    case LoweringSpecKind.Keyword:
      return node.kind === SyntaxKind.KEYWORD && node.value === spec.value;
    case LoweringSpecKind.Number:
      return looksLikeInteger(node, ctx) || looksLikeCustomVariable(node, ctx);
    case LoweringSpecKind.Float:
      return looksLikeFloat(node, ctx) || looksLikeCustomVariable(node, ctx);
    case LoweringSpecKind.String:
      return looksLikeString(node, ctx);
    case LoweringSpecKind.CustomVariable:
      return looksLikeCustomVariable(node, ctx);
    case LoweringSpecKind.CustomTimer:
      return looksLikeTimer(node, ctx);
    case LoweringSpecKind.Object:
      return looksLikeObject(node, ctx);
    case LoweringSpecKind.ObjectType:
      return looksLikeObjectType(node, ctx);
    case LoweringSpecKind.Player:
      return looksLikePlayer(node, ctx);
    case LoweringSpecKind.Team:
      return looksLikeTeam(node, ctx);
    case LoweringSpecKind.VariantVariable:
      return (
        looksLikeCustomVariable(node, ctx) ||
        looksLikeTimer(node, ctx) ||
        looksLikePlayer(node, ctx) ||
        looksLikeTeam(node, ctx) ||
        looksLikeObject(node, ctx)
      );
  }
};

const lowerSpec = (
  node: ASTParameterNode,
  spec: LoweringSpec,
  ctx: ParameterLoweringContext
): LoweredParameter => {
  if (isAstErrorNode(node as Parameters<typeof isAstErrorNode>[0])) {
    throw new LowerError("Invalid parameter node", node.location);
  }

  switch (spec.kind) {
    case LoweringSpecKind.Keyword: {
      if (node.kind !== SyntaxKind.KEYWORD || node.value !== spec.value) {
        throw new LowerError(`Expected keyword '${spec.value}'`, node.location);
      }
      return {
        name: spec.name,
        value: located(node.value, node.location),
      };
    }
    case LoweringSpecKind.Number:
    case LoweringSpecKind.Float: {
      // Prefer constant/literal numeric for number/float specs when possible;
      // otherwise fall through to custom-variable resolution for number refs.
      if (
        node.kind === SyntaxKind.INTEGER ||
        node.kind === SyntaxKind.FLOATING_POINT ||
        (node.kind === SyntaxKind.REFERENCE &&
          ctx.symbolTable.getSymbol(node.symbolId)?.kind ===
            SymbolKind.Constant)
      ) {
        return {
          name: spec.name,
          value: lowerConstantNumber(
            node as Parameters<typeof lowerConstantNumber>[0],
            ctx
          ),
        };
      }
      return {
        name: spec.name,
        value: located(
          resolveCustomVariableReference(node, ctx),
          node.location
        ),
      };
    }
    case LoweringSpecKind.String:
      return {
        name: spec.name,
        value: located(
          resolveScriptStringTableReference(node, ctx.ir, ctx),
          node.location
        ),
      };
    case LoweringSpecKind.CustomVariable:
      return {
        name: spec.name,
        value: located(
          resolveCustomVariableReference(node, ctx, spec.acceptedKinds),
          node.location
        ),
      };
    case LoweringSpecKind.CustomTimer:
      return {
        name: spec.name,
        value: located(resolveCustomTimerReference(node, ctx), node.location),
      };
    case LoweringSpecKind.Object:
      return {
        name: spec.name,
        value: located(
          resolveObjectReference(node, ctx, spec.acceptedSubtypes),
          node.location
        ),
      };
    case LoweringSpecKind.ObjectType:
      return {
        name: spec.name,
        value: located(
          resolveObjectTypeReference(node, ctx, spec.acceptedObjectTypes),
          node.location
        ),
      };
    case LoweringSpecKind.Player:
      return {
        name: spec.name,
        value: located(resolvePlayerReference(node, ctx), node.location),
      };
    case LoweringSpecKind.Team:
      return {
        name: spec.name,
        value: located(resolveTeamReference(node, ctx), node.location),
      };
    case LoweringSpecKind.VariantVariable:
      return {
        name: spec.name,
        value: located(resolveVariantVariable(node, ctx), node.location),
      };
  }
};

const tryLowerSpec = (
  node: ASTParameterNode,
  spec: LoweringSpec,
  ctx: ParameterLoweringContext
): LoweredParameter | undefined => {
  if (!matchesSpec(node, spec, ctx)) {
    return;
  }
  try {
    return lowerSpec(node, spec, ctx);
  } catch {
    return;
  }
};

interface MatchCursor {
  index: number;
  parameters: LoweredParameter[];
}

const tryMatchSlot = (
  nodes: ASTParameterNode[],
  cursor: MatchCursor,
  slot: LoweringSlot,
  ctx: ParameterLoweringContext
): boolean => {
  if (isOptionalSlot(slot)) {
    const node = nodes[cursor.index];
    if (
      node === undefined ||
      node.kind !== SyntaxKind.KEYWORD ||
      node.value !== slot.name
    ) {
      // Absent optional — emit placeholder entries with undefined values so
      // callers can still look them up by name.
      cursor.parameters.push({ name: slot.name, value: undefined });
      if (slot.specs !== undefined) {
        for (const spec of slot.specs) {
          cursor.parameters.push({ name: spec.name, value: undefined });
        }
      }
      return true;
    }

    cursor.parameters.push({
      name: slot.name,
      value: located(node.value, node.location),
    });
    cursor.index += 1;

    if (slot.specs !== undefined) {
      for (const spec of slot.specs) {
        const next = nodes[cursor.index];
        if (next === undefined) {
          return false;
        }
        const lowered = tryLowerSpec(next, spec, ctx);
        if (lowered === undefined) {
          return false;
        }
        cursor.parameters.push(lowered);
        cursor.index += 1;
      }
    }
    return true;
  }

  if (isUnionSlot(slot)) {
    const node = nodes[cursor.index];
    if (node === undefined) {
      return false;
    }
    for (const spec of slot) {
      const lowered = tryLowerSpec(node, spec, ctx);
      if (lowered !== undefined) {
        cursor.parameters.push(lowered);
        cursor.index += 1;
        return true;
      }
    }
    return false;
  }

  const node = nodes[cursor.index];
  if (node === undefined) {
    return false;
  }
  const lowered = tryLowerSpec(node, slot, ctx);
  if (lowered === undefined) {
    return false;
  }
  cursor.parameters.push(lowered);
  cursor.index += 1;
  return true;
};

const tryMatchSignature = (
  nodes: ASTParameterNode[],
  signature: LoweringSignature,
  ctx: ParameterLoweringContext
): LoweredParameter[] | undefined => {
  const cursor: MatchCursor = { index: 0, parameters: [] };
  for (const slot of signature) {
    if (!tryMatchSlot(nodes, cursor, slot, ctx)) {
      return;
    }
  }
  // Consumed exactly (trailing nodes are allowed only if all remaining
  // signature slots were optionals that already resolved as absent — which
  // tryMatchSlot handles). Reject leftover input nodes.
  if (cursor.index !== nodes.length) {
    return;
  }
  return cursor.parameters;
};

const scoreSignature = (
  nodes: ASTParameterNode[],
  signature: LoweringSignature,
  ctx: ParameterLoweringContext
): number => {
  const cursor: MatchCursor = { index: 0, parameters: [] };
  let score = 0;
  for (const slot of signature) {
    if (!tryMatchSlot(nodes, cursor, slot, ctx)) {
      break;
    }
    score += 1;
  }
  return score;
};

const lowerSignatureStrict = (
  nodes: ASTParameterNode[],
  signature: LoweringSignature,
  ctx: ParameterLoweringContext,
  anchor: SourceLocation
): LoweredParameter[] => {
  const cursor: MatchCursor = { index: 0, parameters: [] };
  for (const slot of signature) {
    if (isOptionalSlot(slot)) {
      const matched = tryMatchSlot(nodes, cursor, slot, ctx);
      if (!matched) {
        throw new LowerError(
          `Failed to lower optional parameter '${slot.name}'`,
          nodes[cursor.index]?.location ?? anchor
        );
      }
      continue;
    }

    if (isUnionSlot(slot)) {
      const node = nodes[cursor.index];
      if (node === undefined) {
        throw new LowerError("Missing parameter", anchor);
      }
      let lowered: LoweredParameter | undefined;
      for (const spec of slot) {
        try {
          if (matchesSpec(node, spec, ctx)) {
            lowered = lowerSpec(node, spec, ctx);
            break;
          }
        } catch {
          // try next
        }
      }
      if (lowered === undefined) {
        // Fall back to first spec to produce a diagnostic
        lowered = lowerSpec(node, slot[0]!, ctx);
      }
      cursor.parameters.push(lowered);
      cursor.index += 1;
      continue;
    }

    const node = nodes[cursor.index];
    if (node === undefined) {
      throw new LowerError(`Missing parameter '${slot.name}'`, anchor);
    }
    cursor.parameters.push(lowerSpec(node, slot, ctx));
    cursor.index += 1;
  }
  return cursor.parameters;
};

export type ParameterLowerer = (
  nodes: ASTParameterNode[],
  ctx: ParameterLoweringContext
) => LoweredResult;

/**
 * Build a reusable parameter lowerer from one or more declarative signatures.
 * Matching follows the same multi-signature / optional / union rules as the
 * AST `parameterParserBuilder`, operating on already-parsed nodes.
 */
export const buildParameterLowerer = (
  ...signatures: LoweringSignature[]
): ParameterLowerer => {
  if (signatures.length === 0) {
    return () => makeResult([]);
  }

  return (nodes, ctx) => {
    let result: LoweredParameter[] = [];

    dxAssertionScope(ctx.diagnostics, () => {
      for (const signature of signatures) {
        const matched = tryMatchSignature(nodes, signature, ctx);
        if (matched !== undefined) {
          result = matched;
          return;
        }
      }

      // Prefer the signature that matched the most leading slots.
      let bestSignature = signatures[0]!;
      let bestScore = -1;
      for (const signature of signatures) {
        const score = scoreSignature(nodes, signature, ctx);
        if (score > bestScore) {
          bestScore = score;
          bestSignature = signature;
        }
      }

      const anchor: SourceLocation = nodes[0]?.location ?? {
        type: SourceLocationType.SOURCE_CODE,
        start: {
          localOffset: 0,
          absoluteOffset: 0,
          line: 1,
          column: 1,
        },
        end: {
          localOffset: 0,
          absoluteOffset: 0,
          line: 1,
          column: 1,
        },
      };

      result = lowerSignatureStrict(nodes, bestSignature, ctx, anchor);
    });

    return makeResult(result);
  };
};
