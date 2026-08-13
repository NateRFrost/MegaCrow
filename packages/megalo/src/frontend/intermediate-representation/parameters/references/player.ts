import type { ASTParameterNode } from "src/frontend/abstract-syntax-tree/parameters";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import {
  type PlayerReference,
  PlayerReferenceType,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
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
  isExplicitPlayerName,
  isObjectReferenceBase,
  isTeamReferenceBase,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
  temporaryReferenceKind,
} from "src/frontend/intermediate-representation/parameters/references/helpers";
import { requireResolvedVariableSlot } from "src/frontend/intermediate-representation/preprocessing/symbols";
import {
  isBuiltInVariable,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";

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

  if (
    slot?.type === VariableType.Player &&
    !member &&
    !isBuiltInVariable(slot)
  ) {
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
    if (
      (!member ||
        objectPlayerIndex !== undefined ||
        isObjectReferenceBase(ctx, base, member)) &&
      (member === undefined ||
        objectPlayerIndex !== undefined ||
        baseSymbol?.type === VariableType.Object ||
        ctx.symbolTable.findVariableByName(base)?.type ===
          VariableType.Object ||
        base === "current_object") &&
      (member === undefined ||
        objectPlayerIndex !== undefined ||
        baseSymbol?.type === VariableType.Object ||
        ctx.symbolTable.findVariableByName(base)?.type ===
          VariableType.Object ||
        base === "current_object") &&
      (base === "current_object" ||
        baseSymbol?.type === VariableType.Object ||
        ctx.symbolTable.findVariableByName(base)?.type === VariableType.Object)
    ) {
      return {
        type: PlayerReferenceType.ObjectPlayer,
        object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
        variableIndex: objectPlayerIndex ?? 0,
      };
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
        ) ??
        (Number(member.replace("number_", "")) || 0),
    };
  }

  return {
    type: PlayerReferenceType.GlobalPlayer,
    player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
  };
};
