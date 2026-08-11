import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  type TeamReference,
  TeamReferenceType,
} from "../../game/megalogamengine/megalogamengine_references";
import {
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../symbol-table";
import { requireResolvedVariableSlot } from "../../preprocessing/symbols";
import type { ParameterLoweringContext } from "../context";
import {
  enumSlotValue,
  parseExplicitTeam,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "../explicit";
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

const encodeGlobalTeamReference = (index: number): TeamReference => ({
  type: TeamReferenceType.GlobalTeam,
  team: enumSlotValue(ExplicitTeam, "Global", index),
});

export const resolveTeamReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): TeamReference => {
  const { base, member } = splitParameterMember(node, ctx.symbolTable);

  if (member === "team" && isPlayerReferenceBase(ctx, base)) {
    return {
      type: TeamReferenceType.PlayerOwnerTeam,
      player: resolveExplicitPlayerForBase(ctx, base),
      variableIndex: 0,
    };
  }
  if (member === "team" && isObjectReferenceBase(ctx, base, member)) {
    return {
      type: TeamReferenceType.ObjectOwnerTeam,
      object: resolveExplicitObjectForBase(ctx, base),
      variableIndex: 0,
    };
  }
  if (member === "team" && isTeamReferenceBase(ctx, base)) {
    const teamSlot = ctx.symbolTable.findVariableByName(base);
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
      team: resolveExplicitTeamForBase(ctx, base),
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
        object: resolveExplicitObjectForBase(ctx, base),
        variableIndex: objectTeamIndex,
      };
    }
  }

  if (!member && (base === "none" || base === "no_player")) {
    return {
      type: TeamReferenceType.GlobalTeam,
      team: ExplicitTeam.None,
    };
  }

  const qualifiedTeam = parseQualifiedTemporaryName(base);
  if (qualifiedTeam?.storage === "team" && !member) {
    return {
      type: TeamReferenceType.GlobalTeam,
      team: parseExplicitTeam(`temporary_${qualifiedTeam.index}`),
    };
  }

  const slot = ctx.symbolTable.findVariableByName(base);
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
      team: resolveExplicitTeamForBase(ctx, base),
    };
  }

  const globalTeamIndex = parseIndexSuffix(base, "global_team");
  if (globalTeamIndex !== undefined) {
    return encodeGlobalTeamReference(globalTeamIndex);
  }

  return {
    type: TeamReferenceType.GlobalTeam,
    team: parseExplicitTeam(base),
  };
};
