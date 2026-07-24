import { ExplicitObject } from "../../game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "../../game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "../../game/megalogamengine/megalogamengine_explicit_team";
import {
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "../../../symbol-table";
import {
  findVariableBySlot,
  requireResolvedVariableSlot,
  requireVariableSlot,
} from "../../preprocessing/symbols";
import type { ParameterLoweringContext } from "../context";
import {
  enumSlotValue,
  parseExplicitObject,
  parseExplicitPlayer,
  parseExplicitTeam,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "../explicit";

const normalizeExplicitTemporaryBase = (base: string): string => {
  const qualified = parseQualifiedTemporaryName(base);
  if (!qualified) {
    return base;
  }
  return `temporary_${qualified.index}`;
};

export const resolveExplicitPlayerForBase = (
  ctx: ParameterLoweringContext,
  base: string
): ExplicitPlayer => {
  const engineBase = normalizeExplicitTemporaryBase(base);
  const slot = ctx.symbolTable.findVariableByName(engineBase);
  if (slot?.type === VariableType.Player && !isBuiltInVariable(slot)) {
    const resolved = requireResolvedVariableSlot(ctx.variableSlots, slot.id);
    if (resolved.scope === VariableScope.Global) {
      return enumSlotValue(ExplicitPlayer, "Global", resolved.index);
    }
    if (resolved.scope === VariableScope.Temporary) {
      return enumSlotValue(
        ExplicitPlayer,
        "Temporary",
        resolved.index
      );
    }
    return enumSlotValue(ExplicitPlayer, "Temporary", resolved.index);
  }

  const globalPlayerIndex = parseIndexSuffix(engineBase, "global_player");
  if (globalPlayerIndex !== undefined) {
    return enumSlotValue(
      ExplicitPlayer,
      "Global",
      globalPlayerIndex
    );
  }

  return parseExplicitPlayer(engineBase);
};

export const resolveExplicitTeamForBase = (
  ctx: ParameterLoweringContext,
  base: string
): ExplicitTeam => {
  const engineBase = normalizeExplicitTemporaryBase(base);
  const slot = ctx.symbolTable.findVariableByName(engineBase);
  if (slot?.type === VariableType.Team && !isBuiltInVariable(slot)) {
    const resolved = requireResolvedVariableSlot(ctx.variableSlots, slot.id);
    if (resolved.scope === VariableScope.Global) {
      return enumSlotValue(
        ExplicitTeam,
        "Global",
        resolved.index
      );
    }
    if (resolved.scope === VariableScope.Temporary) {
      return enumSlotValue(
        ExplicitTeam,
        "Temporary",
        resolved.index
      );
    }
    return ExplicitTeam.CurrentTeam;
  }
  return parseExplicitTeam(engineBase);
};

export const resolveExplicitObjectForBase = (
  ctx: ParameterLoweringContext,
  base: string
): ExplicitObject => {
  const qualified = parseQualifiedTemporaryName(base);
  if (qualified?.storage === "object") {
    return parseExplicitObject(`temporary_${qualified.index}`);
  }

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
        return enumSlotValue(
          ExplicitObject,
          "Global",
          requireVariableSlot(ctx.variableSlots, byIndex.id)
        );
      }
      return enumSlotValue(ExplicitObject, "Global", slotIndex);
    }
  }

  const slot = ctx.symbolTable.findVariableByName(base);
  if (slot?.type === VariableType.Object && !isBuiltInVariable(slot)) {
    const resolved = requireResolvedVariableSlot(ctx.variableSlots, slot.id);
    if (resolved.scope === VariableScope.Global) {
      return enumSlotValue(
        ExplicitObject,
        "Global",
        resolved.index
      );
    }
    if (resolved.scope === VariableScope.Temporary) {
      return enumSlotValue(
        ExplicitObject,
        "Temporary",
        resolved.index
      );
    }
    return ExplicitObject.Current;
  }

  const globalObjectIndex = parseIndexSuffix(base, "global_object");
  if (globalObjectIndex !== undefined) {
    return enumSlotValue(
      ExplicitObject,
      "Global",
      globalObjectIndex
    );
  }

  return parseExplicitObject(base);
};
