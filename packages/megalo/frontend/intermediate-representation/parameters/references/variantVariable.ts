import type { ASTParameterNode } from "../../../abstract-syntax-tree/parameters";
import {
  type VariantVariable,
  VariableType as VariantVariableType,
} from "../../game/megalogamengine/megalogamengine_variant_variable";
import { VariableType } from "../../../symbol-table";
import type { ParameterLoweringContext } from "../context";
import { resolveCustomTimerReference } from "./customTimer";
import { resolveCustomVariableReference } from "./customVariable";
import {
  isObjectReferenceBase,
  isPlayerReferenceBase,
  isTeamReferenceBase,
  isTemporaryCompiledNameExport as isTemporaryCompiledName,
  splitParameterMember,
  temporaryReferenceKind,
} from "./helpers";
import { encodeNoObjectReference, resolveObjectReference } from "./object";
import { resolvePlayerReference } from "./player";
import { resolveTeamReference } from "./team";

export const resolveVariantVariable = (
  node: ASTParameterNode,
  ctx: ParameterLoweringContext,
  preferredType?: VariantVariableType
): VariantVariable => {
  const { base, member } = splitParameterMember(node, ctx.symbolTable);
  const name = member ? `${base}.${member}` : base;

  if (preferredType === VariantVariableType.CustomTimer || name.includes("timer")) {
    return {
      type: VariantVariableType.CustomTimer,
      customTimer: resolveCustomTimerReference(node, ctx),
    };
  }

  if (preferredType === VariantVariableType.CustomVariable) {
    return {
      type: VariantVariableType.CustomVariable,
      customVariable: resolveCustomVariableReference(node, ctx),
    };
  }

  if (preferredType === VariantVariableType.Player) {
    return {
      type: VariantVariableType.Player,
      player: resolvePlayerReference(node, ctx),
    };
  }

  if (preferredType === VariantVariableType.Team) {
    return {
      type: VariantVariableType.Team,
      team: resolveTeamReference(node, ctx),
    };
  }

  if (preferredType === VariantVariableType.Object) {
    if (base === "none" && !member) {
      return {
        type: VariantVariableType.Object,
        object: encodeNoObjectReference(),
      };
    }
    return {
      type: VariantVariableType.Object,
      object: resolveObjectReference(node, ctx),
    };
  }

  // Infer from symbol / shape when no preference is given.
  if (!member) {
    if (ctx.optionIndexByName.has(name)) {
      return {
        type: VariantVariableType.CustomVariable,
        customVariable: resolveCustomVariableReference(node, ctx),
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

  return {
    type: VariantVariableType.CustomVariable,
    customVariable: resolveCustomVariableReference(node, ctx),
  };
};
