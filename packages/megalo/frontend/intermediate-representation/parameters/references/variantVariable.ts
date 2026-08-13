import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "../../game/megalogamengine/megalogamengine_variant_variable";
import { VariableScope, VariableType } from "../../../symbol-table";
import type { ParameterLoweringContext } from "../context";
import { resolveGameOptionCustomVariableType } from "../gameOptionTypes";
import { resolveCustomTimerReference } from "./customTimer";
import { resolveCustomVariableReference } from "./customVariable";
import {
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  isTemporaryCompiledNameExport as isTemporaryCompiledName,
  resolveScopedObjectMemberIndex,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
  temporaryReferenceKind,
} from "./helpers";
import { encodeNoObjectReference, resolveObjectReference } from "./object";
import { resolvePlayerReference } from "./player";
import { resolveTeamReference } from "./team";

const memberSubjectScope = (
  ctx: ParameterLoweringContext,
  base: string,
  member: string
): VariableScope.Player | VariableScope.Team | VariableScope.Object | undefined => {
  if (isPlayerReferenceBase(ctx, base)) {
    return VariableScope.Player;
  }
  if (isTeamReferenceBase(ctx, base, member)) {
    return VariableScope.Team;
  }
  if (isObjectReferenceBase(ctx, base, member)) {
    return VariableScope.Object;
  }
  return undefined;
};

const tryScopedNonNumberMember = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  base: string,
  member: string
): VariantVariable | undefined => {
  const scope = memberSubjectScope(ctx, base, member);
  if (scope === undefined) {
    return undefined;
  }

  if (
    resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      VariableType.Timer,
      member
    ) !== undefined
  ) {
    return {
      type: VariantVariableType.CustomTimer,
      customTimer: resolveCustomTimerReference(node, ctx),
    };
  }
  if (
    resolveScopedObjectMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      member
    ) !== undefined
  ) {
    return {
      type: VariantVariableType.Object,
      object: resolveObjectReference(node, ctx),
    };
  }
  if (
    resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      VariableType.Player,
      member,
      "number"
    ) !== undefined
  ) {
    return {
      type: VariantVariableType.Player,
      player: resolvePlayerReference(node, ctx),
    };
  }
  if (
    resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      scope,
      VariableType.Team,
      member,
      "number"
    ) !== undefined
  ) {
    return {
      type: VariantVariableType.Team,
      team: resolveTeamReference(node, ctx),
    };
  }
  return undefined;
};

export const resolveVariantVariable = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): VariantVariable => {
  const { base, member } = splitParameterMember(node, ctx.symbolTable);
  const name = member ? `${base}.${member}` : base;

  if (!member) {
    if (ctx.symbolTable.lookupUserDefinedOptionIndex(name) !== undefined) {
      return {
        type: VariantVariableType.CustomVariable,
        customVariable: resolveCustomVariableReference(node, ctx),
      };
    }

    if (
      name.includes("timer") &&
      resolveGameOptionCustomVariableType(name, ctx.inPregameTrigger) === undefined
    ) {
      return {
        type: VariantVariableType.CustomTimer,
        customTimer: resolveCustomTimerReference(node, ctx),
      };
    }

    if (isTemporaryCompiledName(name)) {
      const tempKind = temporaryReferenceKind(ctx, name);
      if (tempKind === "object") {
        return {
          type: VariantVariableType.Object,
          object: resolveObjectReference(node, ctx),
        };
      }
      if (tempKind === "player") {
        return {
          type: VariantVariableType.Player,
          player: resolvePlayerReference(node, ctx),
        };
      }
      if (tempKind === "team") {
        return {
          type: VariantVariableType.Team,
          team: resolveTeamReference(node, ctx),
        };
      }
    }

    if (name === "none") {
      return {
        type: VariantVariableType.Object,
        object: encodeNoObjectReference(),
      };
    }

    if (isPlayerReferenceBase(ctx, name)) {
      return {
        type: VariantVariableType.Player,
        player: resolvePlayerReference(node, ctx),
      };
    }
    if (isTeamReferenceBase(ctx, name)) {
      return {
        type: VariantVariableType.Team,
        team: resolveTeamReference(node, ctx),
      };
    }
    if (isObjectReferenceBase(ctx, name)) {
      return {
        type: VariantVariableType.Object,
        object: resolveObjectReference(node, ctx),
      };
    }

    const slot = ctx.symbolTable.findVariableByName(name);
    if (slot?.type === VariableType.Timer) {
      return {
        type: VariantVariableType.CustomTimer,
        customTimer: resolveCustomTimerReference(node, ctx),
      };
    }
  }

  if (member === "team") {
    return {
      type: VariantVariableType.Team,
      team: resolveTeamReference(node, ctx),
    };
  }

  if (member) {
    const scoped = tryScopedNonNumberMember(node, ctx, base, member);
    if (scoped) {
      return scoped;
    }
  }

  return {
    type: VariantVariableType.CustomVariable,
    customVariable: resolveCustomVariableReference(node, ctx),
  };
};
