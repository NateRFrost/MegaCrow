import { ExplicitObject } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_object";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";
import {
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
  isBuiltInVariable,
} from "src/frontend/symbol-table";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { SourceLocation } from "src/diagnostics";
import { BUILT_IN_LOCATION } from "src/diagnostics";
import {
  findVariableBySlot,
  requireResolvedVariableSlot,
  requireVariableSlot,
} from "src/frontend/intermediate-representation/preprocessing/symbols";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ParameterLoweringContext } from "src/frontend/intermediate-representation/parameters/context";
import {
  enumSlotValue,
  parseExplicitObject,
  parseExplicitPlayer,
  parseExplicitTeam,
  parseIndexSuffix,
  parseQualifiedTemporaryName,
} from "src/frontend/intermediate-representation/parameters/explicit";

const normalizeExplicitTemporaryBase = (base: string): string => {
  const qualified = parseQualifiedTemporaryName(base);
  if (!qualified) {
    return base;
  }
  return `temporary_${qualified.index}`;
};

const assertMegacrowTeamExtensions = (
  team: ExplicitTeam,
  ctx: ParameterLoweringContext,
  location: SourceLocation
): void => {
  // Megalo Headache #2
  if (team === ExplicitTeam.TargetTeam && !ctx.frontend.megacrowExtensions.targetTeam) {
    throw new LowerError(
      diagnosticMessages.megacrowExtensionRequired("targetTeam", "target_team"),
      location
    );
  }
};

export const resolveExplicitPlayerForBase = (
  ctx: ParameterLoweringContext,
  base: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
): ExplicitPlayer => {
  const engineBase = normalizeExplicitTemporaryBase(base);
  const slot =
    resolvedBaseVariable?.type === VariableType.Player && !isBuiltInVariable(resolvedBaseVariable)
      ? resolvedBaseVariable
      : ctx.symbolTable.findVariableByName(engineBase);
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
  base: string,
  resolvedBaseVariable?: SymbolTableVariableEntry,
  location: SourceLocation = BUILT_IN_LOCATION
): ExplicitTeam => {
  const engineBase = normalizeExplicitTemporaryBase(base);
  const slot =
    resolvedBaseVariable?.type === VariableType.Team && !isBuiltInVariable(resolvedBaseVariable)
      ? resolvedBaseVariable
      : ctx.symbolTable.findVariableByName(engineBase);
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
  const team = parseExplicitTeam(engineBase);
  assertMegacrowTeamExtensions(team, ctx, location);
  return team;
};

export const resolveExplicitObjectForBase = (
  ctx: ParameterLoweringContext,
  base: string,
  resolvedBaseVariable?: SymbolTableVariableEntry
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

  const slot =
    resolvedBaseVariable?.type === VariableType.Object && !isBuiltInVariable(resolvedBaseVariable)
      ? resolvedBaseVariable
      : ctx.symbolTable.findVariableByName(base);
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
