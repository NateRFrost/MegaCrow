import { SyntaxKind } from "../../../abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import type { SourceLocation } from "../../../diagnostics";
import {
  SymbolKind,
  type SymbolTable,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
} from "../../../symbol-table";
import {
  findVariableBySlot,
  getVariableSlot,
  type VariableSlotMap,
} from "../../preprocessing/symbols";
import { LowerError } from "../../error";
import type { ParameterLoweringContext } from "../context";
import {
  isTemporaryCompiledName,
  parseQualifiedTemporaryName,
  tryParseExplicitObject,
  tryParseExplicitPlayer,
  tryParseExplicitTeam,
} from "../explicit";

export type SplitMember = {
  readonly base: string;
  readonly member?: string;
  readonly baseSymbol?: SymbolTableVariableEntry;
  readonly location: SourceLocation;
};

export const splitParameterMember = (
  node: ASTParameterNode,
  symbolTable: SymbolTable
): SplitMember => {
  if (node.kind === SyntaxKind.MEMBER_REFERENCE) {
    const baseSymbol =
      node.rootSymbolId !== undefined
        ? (() => {
            const entry = symbolTable.getSymbol(node.rootSymbolId);
            return entry?.kind === SymbolKind.Variable ? entry : undefined;
          })()
        : symbolTable.findVariableByName(node.root);
    return {
      base: node.root,
      member: node.member.value,
      baseSymbol,
      location: node.location,
    };
  }

  if (node.kind === SyntaxKind.REFERENCE) {
    const entry = symbolTable.getSymbol(node.symbolId);
    return {
      base: node.identifier,
      baseSymbol: entry?.kind === SymbolKind.Variable ? entry : undefined,
      location: node.location,
    };
  }

  if (node.kind === SyntaxKind.KEYWORD) {
    return {
      base: node.value,
      baseSymbol: symbolTable.findVariableByName(node.value),
      location: node.location,
    };
  }

  if (
    node.kind === SyntaxKind.INTEGER ||
    node.kind === SyntaxKind.FLOATING_POINT
  ) {
    return {
      base: String(node.value),
      location: node.location,
    };
  }

  throw new LowerError(
    `Expected a referenceable parameter, got ${node.kind}`,
    node.location
  );
};

export const temporaryReferenceKind = (
  ctx: ParameterLoweringContext,
  name: string
): "player" | "object" | "team" | undefined => {
  const qualified = parseQualifiedTemporaryName(name);
  if (qualified) {
    return qualified.storage;
  }
  if (!/^temporary_\d+$/.test(name)) {
    return undefined;
  }
  switch (ctx.triggerExecutionMode) {
    case "object":
      return "object";
    case "player":
      return "player";
    case "team":
      return "team";
    default:
      return "player";
  }
};

export const isExplicitPlayerName = (name: string): boolean =>
  tryParseExplicitPlayer(name) !== undefined ||
  name === "none" ||
  name === "local_player" ||
  name === "object_death_killing_player";

export const isExplicitTeamName = (name: string): boolean =>
  name === "neutral" ||
  name === "current_team" ||
  name.startsWith("team_") ||
  tryParseExplicitTeam(name) !== undefined;

export const isGlobalObjectVariableName = (name: string): boolean =>
  /^object_\d+$/.test(name);

export const isExplicitObjectName = (name: string): boolean => {
  if (
    name === "none" ||
    name === "current_object" ||
    name.startsWith("global_object_") ||
    isGlobalObjectVariableName(name)
  ) {
    return false;
  }
  return tryParseExplicitObject(name) !== undefined;
};

export const isPlayerReferenceBase = (
  ctx: ParameterLoweringContext,
  base: string
): boolean => {
  if (/^global_\d+$/.test(base)) {
    return false;
  }
  if (parseQualifiedTemporaryName(base)?.storage === "player") {
    return true;
  }
  const tempKind = temporaryReferenceKind(ctx, base);
  if (tempKind === "player") {
    return true;
  }
  if (tempKind === "object" || tempKind === "team") {
    return false;
  }
  if (isExplicitPlayerName(base)) {
    return true;
  }
  const slot = ctx.symbolTable.findVariableByName(base);
  return slot?.type === VariableType.Player;
};

export const resolveScopedVariableMemberIndex = (
  symbolTable: SymbolTable,
  slots: VariableSlotMap,
  scope: VariableScope,
  type: VariableType,
  member: string,
  indexPrefix?: string
): number | undefined => {
  const named = symbolTable
    .variablesOf(scope, type)
    .find((s: SymbolTableVariableEntry) => s.name === member);
  if (named) {
    return getVariableSlot(slots, named.id);
  }
  if (indexPrefix) {
    const indexMatch = new RegExp(`^${indexPrefix}_(\\d+)$`).exec(member);
    if (indexMatch) {
      const compiledNum = Number(indexMatch[1]);
      if (findVariableBySlot(symbolTable, slots, scope, type, compiledNum)) {
        return compiledNum;
      }
      if (scope !== VariableScope.Global && compiledNum > 0) {
        const storageIndex = compiledNum - 1;
        if (findVariableBySlot(symbolTable, slots, scope, type, storageIndex)) {
          return storageIndex;
        }
      }
    }
  }
  return undefined;
};

export const resolveScopedObjectMemberIndex = (
  symbolTable: SymbolTable,
  slots: VariableSlotMap,
  scope: VariableScope,
  member: string
): number | undefined =>
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    scope,
    VariableType.Object,
    member,
    "number"
  );

export const memberResolvesOnObjectScope = (
  symbolTable: SymbolTable,
  slots: VariableSlotMap,
  member: string
): boolean =>
  resolveScopedObjectMemberIndex(
    symbolTable,
    slots,
    VariableScope.Object,
    member
  ) !== undefined ||
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    VariableScope.Object,
    VariableType.Number,
    member,
    "number"
  ) !== undefined ||
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    VariableScope.Object,
    VariableType.Timer,
    member
  ) !== undefined;

export const memberResolvesOnTeamScope = (
  symbolTable: SymbolTable,
  slots: VariableSlotMap,
  member: string
): boolean =>
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    VariableScope.Team,
    VariableType.Number,
    member,
    "number"
  ) !== undefined ||
  resolveScopedObjectMemberIndex(
    symbolTable,
    slots,
    VariableScope.Team,
    member
  ) !== undefined ||
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    VariableScope.Team,
    VariableType.Player,
    member,
    "number"
  ) !== undefined ||
  resolveScopedVariableMemberIndex(
    symbolTable,
    slots,
    VariableScope.Team,
    VariableType.Timer,
    member
  ) !== undefined;

export const isObjectReferenceBase = (
  ctx: ParameterLoweringContext,
  base: string,
  member?: string
): boolean => {
  if (parseQualifiedTemporaryName(base)?.storage === "object") {
    return true;
  }
  if (parseQualifiedTemporaryName(base)?.storage === "player") {
    return false;
  }
  if (isPlayerReferenceBase(ctx, base)) {
    return false;
  }
  if (
    isExplicitTeamName(base) ||
    parseQualifiedTemporaryName(base)?.storage === "team" ||
    ctx.symbolTable.findVariableByName(base)?.type === VariableType.Team
  ) {
    return false;
  }
  if (
    member &&
    memberResolvesOnObjectScope(ctx.symbolTable, ctx.variableSlots, member)
  ) {
    return true;
  }
  const tempKind = temporaryReferenceKind(ctx, base);
  if (tempKind === "object") {
    return true;
  }
  if (tempKind === "player" || tempKind === "team") {
    return false;
  }
  if (isExplicitPlayerName(base)) {
    const slot = ctx.symbolTable.findVariableByName(base);
    if (slot?.type !== VariableType.Object) {
      return false;
    }
  }
  if (
    base === "none" ||
    base === "current_object" ||
    base.startsWith("global_object_") ||
    isGlobalObjectVariableName(base)
  ) {
    return true;
  }
  if (ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object) {
    return true;
  }
  return isExplicitObjectName(base);
};

export const isTeamReferenceBase = (
  ctx: ParameterLoweringContext,
  base: string,
  member?: string
): boolean => {
  if (parseQualifiedTemporaryName(base)?.storage === "team") {
    return true;
  }
  if (member && /^global_(\d+)$/.test(base)) {
    if (
      memberResolvesOnTeamScope(ctx.symbolTable, ctx.variableSlots, member)
    ) {
      return true;
    }
  }
  if (isPlayerReferenceBase(ctx, base)) {
    return false;
  }
  if (parseQualifiedTemporaryName(base)?.storage === "object") {
    return false;
  }
  if (
    base === "current_object" ||
    base === "none" ||
    isGlobalObjectVariableName(base) ||
    ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object ||
    isExplicitObjectName(base)
  ) {
    return false;
  }
  if (
    member &&
    memberResolvesOnTeamScope(ctx.symbolTable, ctx.variableSlots, member)
  ) {
    return true;
  }
  if (isExplicitPlayerName(base)) {
    const slot = ctx.symbolTable.findVariableByName(base);
    if (slot?.type !== VariableType.Team) {
      return false;
    }
  }
  if (isExplicitTeamName(base)) {
    return true;
  }
  return ctx.symbolTable.findVariableByName(base)?.type === VariableType.Team;
};

export const isTemporaryCompiledNameExport = isTemporaryCompiledName;
