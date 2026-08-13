import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  type CustomTimerReference,
  CustomTimerType,
} from "../../game/megalogamengine/megalogamengine_references";
import {
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../symbol-table";
import {
  findVariableBySlot,
  requireResolvedVariableSlot,
  type VariableSlotMap,
} from "../../preprocessing/symbols";
import type { ParameterLoweringContext } from "../context";
import { parseIndexSuffix } from "../explicit";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "./explicitResolve";
import {
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
} from "./helpers";

const encodeTimerVariable = (
  slot: SymbolTableVariableEntry,
  slots: VariableSlotMap
): CustomTimerReference => {
  const resolved = requireResolvedVariableSlot(slots, slot.id);
  const variableIndex = resolved.index;
  switch (resolved.scope) {
    case VariableScope.Global:
    case VariableScope.Temporary:
      return {
        type: CustomTimerType.Global,
        variableIndex,
      };
    case VariableScope.Object:
      return {
        type: CustomTimerType.Object,
        object: ExplicitObject.Current,
        variableIndex,
      };
    case VariableScope.Player:
      return {
        type: CustomTimerType.Player,
        player: ExplicitPlayer.Current,
        variableIndex,
      };
    case VariableScope.Team:
      return {
        type: CustomTimerType.Team,
        team: ExplicitTeam.CurrentTeam,
        variableIndex,
      };
  }
};

const resolveScopedTimerMemberIndex = (
  ctx: ParameterLoweringContext,
  scope: VariableScope,
  member: string
): number | undefined => {
  const named = resolveScopedVariableMemberIndex(
    ctx.symbolTable,
    ctx.variableSlots,
    scope,
    VariableType.Timer,
    member,
    "timer"
  );
  if (named !== undefined) {
    return named;
  }
  const indexMatch = /^timer_(\d+)$/.exec(member);
  if (!indexMatch) {
    return undefined;
  }
  const compiledNum = Number(indexMatch[1]);
  const storageIndex = compiledNum > 0 ? compiledNum - 1 : compiledNum;
  if (
    findVariableBySlot(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      VariableType.Timer,
      storageIndex
    )
  ) {
    return storageIndex;
  }
  if (
    findVariableBySlot(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      VariableType.Timer,
      compiledNum
    )
  ) {
    return compiledNum;
  }
  return undefined;
};

const encodeScopedTimerReference = (
  ctx: ParameterLoweringContext,
  base: string,
  scope: VariableScope,
  member: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): CustomTimerReference | undefined => {
  const index = resolveScopedTimerMemberIndex(ctx, scope, member);
  if (index === undefined) {
    return undefined;
  }
  switch (scope) {
    case VariableScope.Team:
      return {
        type: CustomTimerType.Team,
        team: resolveExplicitTeamForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    case VariableScope.Player:
      return {
        type: CustomTimerType.Player,
        player: resolveExplicitPlayerForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    case VariableScope.Object:
      return {
        type: CustomTimerType.Object,
        object: resolveExplicitObjectForBase(ctx, base, resolvedBaseVariable),
        variableIndex: index,
      };
    default:
      return undefined;
  }
};

export const resolveCustomTimerReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): CustomTimerReference => {
  const { base, member, baseSymbol } = splitParameterMember(
    node,
    ctx.symbolTable
  );
  const name = member ? `${base}.${member}` : base;
  const slot =
    !member && baseSymbol?.type === VariableType.Timer
      ? baseSymbol
      : ctx.symbolTable.findVariableByName(name);

  if (slot?.type === VariableType.Timer && !member) {
    if (isBuiltInVariable(slot)) {
      if (name === "round_timer") {
        return { type: CustomTimerType.Round, variableIndex: 0 };
      }
      if (name === "sudden_death_timer") {
        return { type: CustomTimerType.SuddenDeath, variableIndex: 0 };
      }
      if (name === "grace_period_timer") {
        return { type: CustomTimerType.GracePeriod, variableIndex: 0 };
      }
    }
    return encodeTimerVariable(slot, ctx.variableSlots);
  }

  if (name === "round_timer") {
    return { type: CustomTimerType.Round, variableIndex: 0 };
  }
  if (name === "sudden_death_timer") {
    return { type: CustomTimerType.SuddenDeath, variableIndex: 0 };
  }
  if (name === "grace_period_timer") {
    return { type: CustomTimerType.GracePeriod, variableIndex: 0 };
  }

  const globalIndex = parseIndexSuffix(name, "global_timer");
  if (globalIndex !== undefined) {
    return {
      type: CustomTimerType.Global,
      variableIndex: globalIndex,
    };
  }

  if (member) {
    if (isTeamReferenceBase(ctx, base, member)) {
      const scoped = encodeScopedTimerReference(
        ctx,
        base,
        VariableScope.Team,
        member,
        baseSymbol
      );
      if (scoped) {
        return scoped;
      }
    }
    if (isPlayerReferenceBase(ctx, base)) {
      const scoped = encodeScopedTimerReference(
        ctx,
        base,
        VariableScope.Player,
        member,
        baseSymbol
      );
      if (scoped) {
        return scoped;
      }
    }
    if (isObjectReferenceBase(ctx, base, member)) {
      const scoped = encodeScopedTimerReference(
        ctx,
        base,
        VariableScope.Object,
        member,
        baseSymbol
      );
      if (scoped) {
        return scoped;
      }
    }
  }

  return {
    type: CustomTimerType.Global,
    variableIndex: 0,
  };
};
