import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  type ObjectReference,
  ObjectReferenceType,
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
import { LowerError } from "../../error";
import type { ParameterLoweringContext } from "../context";
import {
  enumSlotValue,
  parseExplicitObject,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "../explicit";
import {
  resolveExplicitObjectForBase,
  resolveExplicitPlayerForBase,
  resolveExplicitTeamForBase,
} from "./explicitResolve";
import {
  isPlayerReferenceBase,
  isTeamReferenceBase,
  resolveScopedObjectMemberIndex,
  resolveScopedVariableMemberIndex,
  splitParameterMember,
} from "./helpers";

export const encodeNoObjectReference = (): ObjectReference => ({
  type: ObjectReferenceType.GlobalObject,
  object: ExplicitObject.None,
});

const encodeGlobalObjectReference = (index: number): ObjectReference => ({
  type: ObjectReferenceType.GlobalObject,
  object: enumSlotValue(ExplicitObject, "Global", index),
});

const encodeTemporaryObjectReference = (index: number): ObjectReference => ({
  type: ObjectReferenceType.GlobalObject,
  object: enumSlotValue(ExplicitObject, "Temporary", index),
});

const encodeObjectVariableReference = (
  slot: SymbolTableVariableEntry,
  slots: VariableSlotMap
): ObjectReference => {
  const resolved = requireResolvedVariableSlot(slots, slot.id);
  const variableIndex = resolved.index;
  switch (resolved.scope) {
    case VariableScope.Global:
      return encodeGlobalObjectReference(variableIndex);
    case VariableScope.Temporary:
      return encodeTemporaryObjectReference(variableIndex);
    case VariableScope.Object:
      return {
        type: ObjectReferenceType.ObjectObject,
        object: ExplicitObject.Current,
        variableIndex,
      };
    case VariableScope.Player:
      return {
        type: ObjectReferenceType.PlayerObject,
        player: ExplicitPlayer.Current,
        variableIndex,
      };
    case VariableScope.Team:
      return {
        type: ObjectReferenceType.TeamObject,
        team: ExplicitTeam.CurrentTeam,
        variableIndex,
      };
  }
};

const encodeNamedGlobalObjectReference = (
  ctx: ParameterLoweringContext,
  base: string
): ObjectReference | undefined => {
  const objectSlot = /^object_(\d+)$/.exec(base);
  if (objectSlot) {
    const slotIndex = Number(objectSlot[1]) - 1;
    if (slotIndex >= 0) {
      const byIndex = findVariableBySlot(
        ctx.symbolTable,
        ctx.variableSlots,
        VariableScope.Global,
        VariableType.Object,
        slotIndex
      );
      if (byIndex) {
        return encodeObjectVariableReference(byIndex, ctx.variableSlots);
      }
      return encodeGlobalObjectReference(slotIndex);
    }
  }

  const slot = ctx.symbolTable.findVariableByName(base);
  if (slot?.type === VariableType.Object && !isBuiltInVariable(slot)) {
    return encodeObjectVariableReference(slot, ctx.variableSlots);
  }

  const globalObjectIndex = parseIndexSuffix(base, "global_object");
  if (globalObjectIndex !== undefined) {
    const byIndex = findVariableBySlot(
      ctx.symbolTable,
      ctx.variableSlots,
      VariableScope.Global,
      VariableType.Object,
      globalObjectIndex
    );
    if (byIndex) {
      return encodeObjectVariableReference(byIndex, ctx.variableSlots);
    }
    return encodeGlobalObjectReference(globalObjectIndex);
  }

  return undefined;
};

export type ObjectReferenceSubtype = ObjectReferenceType;

export const resolveObjectReference = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  acceptedSubtypes?: readonly ObjectReferenceType[]
): ObjectReference => {
  const ref = resolveObjectReferenceUnchecked(node, ctx);
  if (
    acceptedSubtypes !== undefined &&
    acceptedSubtypes.length > 0 &&
    !acceptedSubtypes.includes(ref.type)
  ) {
    throw new LowerError(
      `Object reference type ${ObjectReferenceType[ref.type]} is not accepted`,
      node.location
    );
  }
  return ref;
};

const resolveObjectReferenceUnchecked = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext
): ObjectReference => {
  const { base, member, baseSymbol, location } = splitParameterMember(
    node,
    ctx.symbolTable
  );

  const qualifiedPlayer = parseQualifiedTemporaryName(base);
  if (qualifiedPlayer?.storage === "player" && !member) {
    return {
      type: ObjectReferenceType.PlayerBiped,
      player: resolveExplicitPlayerForBase(
        ctx,
        `temporary_${qualifiedPlayer.index}`
      ),
    };
  }

  const qualified = parseQualifiedTemporaryName(base);
  if (qualified?.storage === "object" && !member) {
    return {
      type: ObjectReferenceType.GlobalObject,
      object: parseExplicitObject(`temporary_${qualified.index}`),
    };
  }

  if (
    baseSymbol?.type === VariableType.Object &&
    !member &&
    !isBuiltInVariable(baseSymbol)
  ) {
    return encodeObjectVariableReference(baseSymbol, ctx.variableSlots);
  }

  if (!member) {
    if (base === "none") {
      return encodeNoObjectReference();
    }
    const named = encodeNamedGlobalObjectReference(ctx, base);
    if (named) {
      return named;
    }
  }

  const slot =
    baseSymbol?.type === VariableType.Object
      ? baseSymbol
      : ctx.symbolTable.findVariableByName(base);
  if (slot?.type === VariableType.Object && !member && !isBuiltInVariable(slot)) {
    return encodeObjectVariableReference(slot, ctx.variableSlots);
  }

  if (isPlayerReferenceBase(ctx, base)) {
    if (member) {
      return {
        type: ObjectReferenceType.PlayerObject,
        player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
        variableIndex:
          resolveScopedObjectMemberIndex(
            ctx.symbolTable,
            ctx.variableSlots,
            VariableScope.Player,
            member
          ) ?? (Number(member.replace("number_", "")) || 0),
      };
    }
    return {
      type: ObjectReferenceType.PlayerBiped,
      player: resolveExplicitPlayerForBase(ctx, base, baseSymbol),
    };
  }

  if (isTeamReferenceBase(ctx, base, member)) {
    const teamObjectIndex = member
      ? resolveScopedObjectMemberIndex(
          ctx.symbolTable,
          ctx.variableSlots,
          VariableScope.Team,
          member
        )
      : undefined;
    return {
      type: ObjectReferenceType.TeamObject,
      team: resolveExplicitTeamForBase(ctx, base, baseSymbol, location),
      variableIndex: teamObjectIndex ?? 0,
    };
  }

  if (member) {
    const objectNumberIndex = resolveScopedVariableMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      VariableScope.Object,
      VariableType.Number,
      member,
      "number"
    );
    if (objectNumberIndex !== undefined) {
      return {
        type: ObjectReferenceType.ObjectObject,
        object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
        variableIndex: objectNumberIndex,
      };
    }
    const objectObjectIndex = resolveScopedObjectMemberIndex(
      ctx.symbolTable,
      ctx.variableSlots,
      VariableScope.Object,
      member
    );
    if (objectObjectIndex !== undefined) {
      return {
        type: ObjectReferenceType.ObjectObject,
        object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
        variableIndex: objectObjectIndex,
      };
    }
  }

  if (member) {
    return {
      type: ObjectReferenceType.ObjectObject,
      object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
      variableIndex: Number(member.replace("number_", "")) || 0,
    };
  }

  // Built-in object names (current_object, none, etc.)
  if (slot && isBuiltInVariable(slot) && slot.type === VariableType.Object) {
    return {
      type: ObjectReferenceType.GlobalObject,
      object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
    };
  }

  return {
    type: ObjectReferenceType.GlobalObject,
    object: resolveExplicitObjectForBase(ctx, base, baseSymbol),
  };
};
