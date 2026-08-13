import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  type TeamReference,
  TeamReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import {
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "src/frontend/symbol-table";
import { requireResolvedVariableSlot } from "src/frontend/intermediate-representation/preprocessing/symbols";
import type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
import {
  enumSlotValue,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "src/frontend/intermediate-representation/parameters/explicit";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "src/frontend/intermediate-representation/parameters/references/explicitResolve";
import {
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
} from "src/frontend/intermediate-representation/parameters/references/helpers";

const encodeGlobalTeamReference = (index: number): TeamReference => ({
  type: TeamReferenceType.GlobalTeam,
  team: enumSlotValue(ExplicitTeam, "Global", index),
});

export const resolveTeamReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): TeamReference => {
  const { base, member, baseSymbol, location } = splitParameterMember(
    node,
    ctx.symbolTable
  );

  if (member === "team" && isPlayerReferenceBase(ctx, base)) {
    return {
      type: TeamReferenceType.PlayerOwnerTeam,
      player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
      variableIndex: 0,
    };
  }
  if (member === "team" && isObjectReferenceBase(ctx, base, member)) {
    return {
      type: TeamReferenceType.ObjectOwnerTeam,
      object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
      variableIndex: 0,
    };
  }
  if (member === "team" && isTeamReferenceBase(ctx, base)) {
    const teamSlot =
      baseSymbol?.type === VariableType.Team
        ? baseSymbol
        : ctx.symbolTable.findVariableByName(base);
    if (teamSlot?.type === VariableType.Team && !isBuiltInVariable(teamSlot)) {
      const resolved = requireResolvedVariableSlot(
        ctx.variableSlots,
        teamSlot.id
      );
      if (resolved.scope === VariableScope.Global) {
        return encodeGlobalTeamReference(resolved.index);
      }
      if (resolved.scope === VariableScope.Temporary) {
        return {
          type: TeamReferenceType.GlobalTeam,
          team: enumSlotValue(ExplicitTeam, "Temporary", resolved.index),
        };
      }
      return {
        type: TeamReferenceType.TeamTeam,
        team: ExplicitTeam.CurrentTeam,
        variableIndex: resolved.index,
      };
    }
    return {
      type: TeamReferenceType.GlobalTeam,
      team: resolveExplicitTeamForBase(ctx, base, baseSymbol, location),
    };
  }

  if (member && member !== "team" && isObjectReferenceBase(ctx, base, member)) {
    const objectTeamIndex = resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      VariableScope.Object,
      VariableType.Team,
      member
    );
    if (objectTeamIndex !== undefined) {
      return {
        type: TeamReferenceType.ObjectTeam,
        object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
        variableIndex: objectTeamIndex,
      };
    }
  }

  if (!member && base === "none") {
    return {
      type: TeamReferenceType.GlobalTeam,
      team: ExplicitTeam.None,
    };
  }

  const qualifiedTeam = parseQualifiedTemporaryName(base);
  if (qualifiedTeam?.storage === "team" && !member) {
    return {
      type: TeamReferenceType.GlobalTeam,
      team: resolveExplicitTeamForBase(
        ctx,
        `temporary_${qualifiedTeam.index}`,
        undefined,
        location
      ),
    };
  }

  const slot =
    baseSymbol?.type === VariableType.Team
      ? baseSymbol
      : ctx.symbolTable.findVariableByName(base);
  if (slot?.type === VariableType.Team) {
    if (!isBuiltInVariable(slot)) {
      const resolved = requireResolvedVariableSlot(ctx.variableSlots, slot.id);
      if (resolved.scope === VariableScope.Global) {
        return encodeGlobalTeamReference(resolved.index);
      }
      if (resolved.scope === VariableScope.Temporary) {
        return {
          type: TeamReferenceType.GlobalTeam,
          team: enumSlotValue(ExplicitTeam, "Temporary", resolved.index),
        };
      }
      return {
        type: TeamReferenceType.TeamTeam,
        team: ExplicitTeam.CurrentTeam,
        variableIndex: resolved.index,
      };
    }
    return {
      type: TeamReferenceType.GlobalTeam,
      team: resolveExplicitTeamForBase(ctx, base, baseSymbol, location),
    };
  }

  const globalTeamIndex = parseIndexSuffix(base, "global_team");
  if (globalTeamIndex !== undefined) {
    return encodeGlobalTeamReference(globalTeamIndex);
  }

  return {
    type: TeamReferenceType.GlobalTeam,
    team: resolveExplicitTeamForBase(ctx, base, undefined, location),
  };
};
