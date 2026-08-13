import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import {
  type PlayerReference,
  PlayerReferenceType,
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
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "../explicit";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "./explicitResolve";
import {
  isExplicitPlayerName,
  isObjectReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
  temporaryReferenceKind,
} from "./helpers";

const encodeGlobalPlayerReference = (index: number): PlayerReference => ({
  type: PlayerReferenceType.GlobalPlayer,
  player: enumSlotValue(ExplicitPlayer, "Global", index),
});

export const resolvePlayerReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): PlayerReference => {
  const { base, member, baseSymbol, location } = splitParameterMember(
    node,
    ctx.symbolTable
  );
  const slot =
    baseSymbol?.type === VariableType.Player
      ? baseSymbol
      : ctx.symbolTable.findVariableByName(base);

  if (slot?.type === VariableType.Player && !member && !isBuiltInVariable(slot)) {
    const resolved = requireResolvedVariableSlot(ctx.variableSlots, slot.id);
    if (resolved.scope === VariableScope.Global) {
      return encodeGlobalPlayerReference(resolved.index);
    }
    if (resolved.scope === VariableScope.Temporary) {
      return {
        type: PlayerReferenceType.GlobalPlayer,
        player: enumSlotValue(ExplicitPlayer, "Temporary", resolved.index),
      };
    }
    return {
      type: PlayerReferenceType.PlayerPlayer,
      player: ExplicitPlayer.Current,
      variableIndex: resolved.index,
    };
  }

  const globalPlayerIndex = parseIndexSuffix(base, "global_player");
  if (globalPlayerIndex !== undefined && !member) {
    return encodeGlobalPlayerReference(globalPlayerIndex);
  }

  const qualifiedPlayer = parseQualifiedTemporaryName(base);
  if (qualifiedPlayer?.storage === "player" && !member) {
    return {
      type: PlayerReferenceType.GlobalPlayer,
      player: resolveExplicitPlayerForBase(
        ctx,
        `temporary_${qualifiedPlayer.index}`
      ),
    };
  }

  if (isExplicitPlayerName(base) && !member) {
    const tempKind = temporaryReferenceKind(ctx, base);
    if (tempKind !== "object" && tempKind !== "team") {
      return {
        type: PlayerReferenceType.GlobalPlayer,
        player: resolveExplicitPlayerForBase(ctx, base),
      };
    }
  }

  if (isTeamReferenceBase(ctx, base, member)) {
    const teamPlayerIndex = member
      ? resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Team,
          VariableType.Player,
          member,
          "number"
        )
      : undefined;
    return {
      type: PlayerReferenceType.TeamPlayer,
      team: resolveExplicitTeamForBase(ctx, base, baseSymbol, location),
      variableIndex: teamPlayerIndex ?? 0,
    };
  }

  if (
    base !== "none" &&
    (base === "current_object" ||
      baseSymbol?.type === VariableType.Object ||
      ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object ||
      isObjectReferenceBase(ctx, base, member))
  ) {
    const objectPlayerIndex = member
      ? resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Object,
          VariableType.Player,
          member,
          "number"
        )
      : undefined;
    if (!member || objectPlayerIndex !== undefined || isObjectReferenceBase(ctx, base, member)) {
      if (
        member === undefined ||
        objectPlayerIndex !== undefined ||
        baseSymbol?.type === VariableType.Object ||
        ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object ||
        base === "current_object"
      ) {
        if (
          base === "current_object" ||
          baseSymbol?.type === VariableType.Object ||
          ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object
        ) {
          return {
            type: PlayerReferenceType.ObjectPlayer,
            object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
            variableIndex: objectPlayerIndex ?? 0,
          };
        }
      }
    }
  }

  if (member) {
    const objectPlayerIndex = resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      VariableScope.Object,
      VariableType.Player,
      member,
      "number"
    );
    if (
      objectPlayerIndex !== undefined &&
      isObjectReferenceBase(ctx, base, member)
    ) {
      return {
        type: PlayerReferenceType.ObjectPlayer,
        object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
        variableIndex: objectPlayerIndex,
      };
    }
  }

  if (member) {
    return {
      type: PlayerReferenceType.PlayerPlayer,
      player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
      variableIndex:
        resolveScopedVariableMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Player,
          VariableType.Player,
          member,
          "number"
        ) ?? (Number(member.replace("number_", "")) || 0),
    };
  }

  return {
    type: PlayerReferenceType.GlobalPlayer,
    player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
  };
};
