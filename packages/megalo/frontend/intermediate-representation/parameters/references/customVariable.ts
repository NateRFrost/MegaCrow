import { SyntaxKind } from "../../../abstract-syntax-tree/kinds";
import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  type CustomVariableReference,
  CustomVariableType,
} from "../../game/megalogamengine/megalogamengine_references";
import {
  SymbolKind,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../symbol-table";
import {
  requireResolvedVariableSlot,
  type VariableSlotMap,
} from "../../preprocessing/symbols";
import { LowerError } from "../../error";
import type { ParameterLoweringContext } from "../context";
import { parseIndexSuffix } from "../explicit";
import { resolveGameOptionCustomVariableType } from "../gameOptionTypes";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "./explicitResolve";
import {
  isExplicitPlayerName,
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
  type SplitMember,
} from "./helpers";

/** Simplified kind selector used by the lowering signature system. */
export enum CustomVariableKind {
  Constant = 0,
  Number = 1,
  Option = 2,
  GameOption = 3,
  SpawnObject = 4,
  Score = 5,
  Money = 6,
  Rating = 7,
  Stat = 8,
}

const encodeNumberVariable = (
  slot: SymbolTableVariableEntry,
  slots: VariableSlotMap
): CustomVariableReference => {
  const resolved = requireResolvedVariableSlot(slots, slot.id);
  const variableIndex = resolved.index;
  switch (resolved.scope) {
    case VariableScope.Global:
      return { type: CustomVariableType.GlobalNumber, variableIndex };
    case VariableScope.Temporary:
      return { type: CustomVariableType.TemporaryNumber, variableIndex };
    case VariableScope.Object:
      return {
        type: CustomVariableType.ObjectNumber,
        object: ExplicitObject.Current,
        variableIndex,
      };
    case VariableScope.Player:
      return {
        type: CustomVariableType.PlayerNumber,
        player: ExplicitPlayer.Current,
        variableIndex,
      };
    case VariableScope.Team:
      return {
        type: CustomVariableType.TeamNumber,
        team: ExplicitTeam.CurrentTeam,
        variableIndex,
      };
  }
};

const encodeScopedNumber = (
  ctx: ParameterLoweringContext,
  base: string,
  scope: VariableScope,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomVariableReference | undefined => {
  const index = resolveScopedVariableMemberIndex(
    ctx.symbolTable,
    ctx.variableSlots,
    scope,
    VariableType.Number,
    member,
    "number"
  );
  if (index === undefined) {
    return undefined;
  }
  switch (scope) {
    case VariableScope.Team:
      return {
        type: CustomVariableType.TeamNumber,
        team: resolveExplicitTeamForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    case VariableScope.Player:
      return {
        type: CustomVariableType.PlayerNumber,
        player: resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    case VariableScope.Object:
      return {
        type: CustomVariableType.ObjectNumber,
        object: resolveExplicitObjectForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    default:
      return undefined;
  }
};

const classifyCustomVariable = (
  ref: CustomVariableReference
): CustomVariableKind => {
  switch (ref.type) {
    case CustomVariableType.Constant:
      return CustomVariableKind.Constant;
    case CustomVariableType.PlayerNumber:
    case CustomVariableType.ObjectNumber:
    case CustomVariableType.TeamNumber:
    case CustomVariableType.GlobalNumber:
    case CustomVariableType.TemporaryNumber:
      return CustomVariableKind.Number;
    case CustomVariableType.Option:
      return CustomVariableKind.Option;
    case CustomVariableType.SpawnObject:
      return CustomVariableKind.SpawnObject;
    case CustomVariableType.TeamScore:
    case CustomVariableType.PlayerScore:
      return CustomVariableKind.Score;
    case CustomVariableType.PlayerMoney:
      return CustomVariableKind.Money;
    case CustomVariableType.PlayerRating:
      return CustomVariableKind.Rating;
    case CustomVariableType.PlayerStat:
    case CustomVariableType.TeamStat:
      return CustomVariableKind.Stat;
    default:
      return CustomVariableKind.GameOption;
  }
};

export const resolveCustomVariableReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  acceptedKinds?: readonly CustomVariableKind[]
): CustomVariableReference => {
  const ref = resolveCustomVariableReferenceUnchecked(node, ctx);
  if (acceptedKinds !== undefined && acceptedKinds.length > 0) {
    const kind = classifyCustomVariable(ref);
    if (!acceptedKinds.includes(kind)) {
      throw new LowerError(
        `Custom variable kind ${CustomVariableKind[kind]} is not accepted`,
        node.location
      );
    }
  }
  return ref;
};

/** Immediate numeric literal → Constant. */
const tryImmediateConstant = (
  node: ASTParameterNode
): CustomVariableReference | undefined => {
  if (node.kind === SyntaxKind.INTEGER) {
    return {
      type: CustomVariableType.Constant,
      immediateValue: node.value,
    };
  }
  return undefined;
};

/** Compiled name `global_number_N`. */
const tryCompiledGlobalNumber = (
  name: string
): CustomVariableReference | undefined => {
  const globalIndex = parseIndexSuffix(name, "global_number");
  if (globalIndex === undefined) {
    return undefined;
  }
  return {
    type: CustomVariableType.GlobalNumber,
    variableIndex: globalIndex,
  };
};

/** Bare option / game-option / constant / number-variable name (no member). */
const tryBareName = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  name: string,
  baseSymbol: SymbolTableVariableEntry | undefined
): CustomVariableReference | undefined => {
  const optionByName = ctx.symbolTable.lookupUserDefinedOptionIndex(name);
  if (optionByName !== undefined) {
    return { type: CustomVariableType.Option, optionIndex: optionByName };
  }

  const gameOptionType = resolveGameOptionCustomVariableType(
    name,
    ctx.inPregameTrigger
  );
  if (gameOptionType !== undefined) {
    return { type: gameOptionType };
  }

  if (node.kind === SyntaxKind.REFERENCE) {
    const symbol = ctx.symbolTable.getSymbol(node.symbolId);
    if (symbol?.kind === SymbolKind.Constant) {
      return {
        type: CustomVariableType.Constant,
        immediateValue: symbol.value,
      };
    }
    if (symbol?.kind === SymbolKind.GameOption) {
      const mapped = resolveGameOptionCustomVariableType(
        symbol.name,
        ctx.inPregameTrigger
      );
      if (mapped !== undefined) {
        return { type: mapped };
      }
      const userOption = ctx.symbolTable.lookupUserDefinedOptionIndex(
        symbol.name
      );
      if (userOption !== undefined) {
        return { type: CustomVariableType.Option, optionIndex: userOption };
      }
    }
    if (
      symbol?.kind === SymbolKind.Variable &&
      symbol.type === VariableType.Number &&
      !isBuiltInVariable(symbol)
    ) {
      return encodeNumberVariable(symbol, ctx.variableSlots);
    }
  }

  if (
    baseSymbol?.type === VariableType.Number &&
    !isBuiltInVariable(baseSymbol)
  ) {
    return encodeNumberVariable(baseSymbol, ctx.variableSlots);
  }

  return undefined;
};

/** `player.stat` / `team.stat` via declared stat name or `stat_N`. */
const tryStatMember = (
  ctx: ParameterLoweringContext,
  base: string,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomVariableReference | undefined => {
  const fromMap = ctx.symbolTable.lookupGameStatIndex(member);
  const fromPrefix = member.startsWith("stat_")
    ? (fromMap ?? Number(member.replace(/^stat_/, "")) ?? 0)
    : fromMap;
  if (fromPrefix === undefined) {
    return undefined;
  }

  if (isPlayerReferenceBase(ctx, base)) {
    return {
      type: CustomVariableType.PlayerStat,
      player: resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable),
      statisticIndex: fromPrefix,
    };
  }
  if (isTeamReferenceBase(ctx, base)) {
    return {
      type: CustomVariableType.TeamStat,
      team: resolveExplicitTeamForBase(ctx, base, resolvedBaseVariable),
      statisticIndex: fromPrefix,
    };
  }
  return undefined;
};

/** Compiled member `number_N` on player/team/object bases. */
const tryCompiledNumberMember = (
  ctx: ParameterLoweringContext,
  base: string,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomVariableReference | undefined => {
  if (!member.startsWith("number_")) {
    return undefined;
  }
  const rawIndex = Number(member.replace(/^number_/, ""));
  const globalObjectSlot = /^object_\d+$/.test(base);

  if (base.startsWith("player_") || base === "current_player") {
    const index =
      resolveScopedVariableMemberIndex(
        ctx.symbolTable,
        ctx.variableSlots,
        VariableScope.Player,
        VariableType.Number,
        member,
        "number"
      ) ?? rawIndex;
    return {
      type: CustomVariableType.PlayerNumber,
      player: resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable),
      variableIndex: index,
    };
  }
  if (isTeamReferenceBase(ctx, base, member)) {
    const index =
      resolveScopedVariableMemberIndex(
        ctx.symbolTable,
        ctx.variableSlots,
        VariableScope.Team,
        VariableType.Number,
        member,
        "number"
      ) ?? rawIndex;
    return {
      type: CustomVariableType.TeamNumber,
      team: resolveExplicitTeamForBase(ctx, base, resolvedBaseVariable),
      variableIndex: index,
    };
  }
  if (isObjectReferenceBase(ctx, base, member)) {
    const index = globalObjectSlot
      ? rawIndex
      : resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Object,
          VariableType.Number,
          member,
          "number"
        ) ?? rawIndex;
    return {
      type: CustomVariableType.ObjectNumber,
      object: resolveExplicitObjectForBase(ctx, base, resolvedBaseVariable),
      variableIndex: index,
    };
  }
  return undefined;
};

/** Named number member on a scoped player/team/object (user variable name). */
const tryNamedScopedNumber = (
  ctx: ParameterLoweringContext,
  base: string,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomVariableReference | undefined => {
  if (isTeamReferenceBase(ctx, base, member)) {
    const scoped = encodeScopedNumber(
      ctx,
      base,
      VariableScope.Team,
      member,
      resolvedBaseVariable
    );
    if (scoped) return scoped;
  }
  if (
    isExplicitPlayerName(base) ||
    resolvedBaseVariable?.type === VariableType.Player ||
    ctx.symbolTable.findVariableByName(base)?.type === VariableType.Player
  ) {
    const scoped = encodeScopedNumber(
      ctx,
      base,
      VariableScope.Player,
      member,
      resolvedBaseVariable
    );
    if (scoped) return scoped;
  }
  if (isObjectReferenceBase(ctx, base, member)) {
    const scoped = encodeScopedNumber(
      ctx,
      base,
      VariableScope.Object,
      member,
      resolvedBaseVariable
    );
    if (scoped) return scoped;
  }
  return undefined;
};

/** `.score`, `.user_data`, `.player_score` / money / rating. */
const tryBuiltinMember = (
  ctx: ParameterLoweringContext,
  base: string,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomVariableReference | undefined => {
  if (member === "score") {
    if (isPlayerReferenceBase(ctx, base)) {
      return {
        type: CustomVariableType.PlayerScore,
        player: resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable),
      };
    }
    return {
      type: CustomVariableType.TeamScore,
      team: resolveExplicitTeamForBase(ctx, base, resolvedBaseVariable),
    };
  }

  if (member === "user_data" && isObjectReferenceBase(ctx, base, member)) {
    return {
      type: CustomVariableType.SpawnObject,
      object: resolveExplicitObjectForBase(ctx, base, resolvedBaseVariable),
    };
  }

  if (
    member === "player_score" ||
    member === "player_money" ||
    member === "player_rating" ||
    member === "rating"
  ) {
    const player = resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable);
    if (member === "player_score") {
      return { type: CustomVariableType.PlayerScore, player };
    }
    if (member === "player_money") {
      return { type: CustomVariableType.PlayerMoney, player };
    }
    return { type: CustomVariableType.PlayerRating, player };
  }

  return undefined;
};

/** `option` / `option_N` name forms. */
const tryOptionName = (
  ctx: ParameterLoweringContext,
  name: string
): CustomVariableReference | undefined => {
  const optionByName = ctx.symbolTable.lookupUserDefinedOptionIndex(name);
  if (optionByName !== undefined) {
    return { type: CustomVariableType.Option, optionIndex: optionByName };
  }
  const optionIndex = parseIndexSuffix(name, "option");
  if (optionIndex !== undefined) {
    return { type: CustomVariableType.Option, optionIndex };
  }
  return undefined;
};

const resolveCustomVariableReferenceUnchecked = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): CustomVariableReference => {
  const immediate = tryImmediateConstant(node);
  if (immediate) return immediate;

  const split: SplitMember = splitParameterMember(node, ctx.symbolTable);
  const { base, member, baseSymbol } = split;
  const name = member ? `${base}.${member}` : base;

  const compiledGlobal = tryCompiledGlobalNumber(name);
  if (compiledGlobal) return compiledGlobal;

  if (!member) {
    const bare = tryBareName(node, ctx, name, baseSymbol);
    if (bare) return bare;
  }

  if (member) {
    const stat = tryStatMember(ctx, base, member, baseSymbol);
    if (stat) return stat;

    const compiledNumber = tryCompiledNumberMember(
      ctx,
      base,
      member,
      baseSymbol
    );
    if (compiledNumber) return compiledNumber;

    const namedScoped = tryNamedScopedNumber(ctx, base, member, baseSymbol);
    if (namedScoped) return namedScoped;

    const builtin = tryBuiltinMember(ctx, base, member, baseSymbol);
    if (builtin) return builtin;
  }

  const option = tryOptionName(ctx, name);
  if (option) return option;

  // Fallback: treat identifier as constant numeric (0 if non-numeric)
  return {
    type: CustomVariableType.Constant,
    immediateValue: Number(name) || 0,
  };
};
