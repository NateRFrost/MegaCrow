import type {
  PlayerTraitOptionNode,
  PlayerTraitsElementNode,
  PlayerTraitsOverrideNode,
} from "../../../../abstract-syntax-tree/elements/game_options/player_traits";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { dxAssertionScope } from "../../../diagnostics";
import { assertNotErrorNode } from "../../../diagnostics/assertNotErrorNode";
import { LowerError } from "../../../error";
import type { PlayerTraits } from "../../../game/game_engine_player_traits";
import type { PlayerTraitOption } from "../../../game/game_engine_traits";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
  type ParameterLoweringContext,
} from "../../../parameters";
import { resolveScriptStringTableReference } from "../../../parameters/resolveScriptStringTableReference";
import { emptyPlayerTraits } from "../shared";
import { lowerAppearanceOption } from "./appearance";
import { parameterLocation } from "./helpers";
import { lowerMovementOption } from "./movement";
import { lowerSensorsOption } from "./sensors";
import { lowerShieldVitalityOption } from "./shieldVitality";
import { lowerWeaponsOption } from "./weapons";

export const lowerPlayerTraitOptions = (
  options: PlayerTraitOptionNode[],
  ctx: ParameterLoweringContext,
  fallbackLocation: SourceCodeLocation
): PlayerTraits => {
  const traits = emptyPlayerTraits();

  for (const option of options) {
    const { identifier, parameters } = option;
    const location = parameterLocation(parameters, fallbackLocation);
    const args = {
      parameters,
      first: parameters[0],
      ctx,
      location,
    };

    const handled =
      lowerShieldVitalityOption(identifier, traits, args) ||
      lowerWeaponsOption(identifier, traits, args) ||
      lowerMovementOption(identifier, traits, args) ||
      lowerAppearanceOption(identifier, traits, args) ||
      lowerSensorsOption(identifier, traits, args);

    if (!handled) {
      throw new LowerError(
        diagnosticMessages.unknownPlayerTrait(identifier),
        location
      );
    }
  }

  return traits;
};

export const lowerPlayerTraits = (
  entry: PlayerTraitsElementNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    assertNotErrorNode(entry.name);
    const traits = lowerPlayerTraitOptions(
      entry.options,
      asParameterLoweringContext(ctx),
      entry.location
    );
    const option: PlayerTraitOption = {
      name: resolveScriptStringTableReference(
        entry.displayName,
        ctx.ir,
        ctx.symbolTable
      ),
      description: resolveScriptStringTableReference(
        entry.description,
        ctx.ir,
        ctx.symbolTable
      ),
      traits,
    };
    ctx.ir.locations.record(option, "name", entry.displayName.location);
    ctx.ir.locations.record(
      option,
      "description",
      entry.description.location
    );
    ctx.ir.locations.record(option, "traits", entry.location);
    ctx.ir.gameVariant.playerTraits.push(option);
  });
};

export const lowerPlayerTraitsOptionOverride = (
  entry: PlayerTraitsOverrideNode,
  ctx: ElementLowerContext
) => {
  dxAssertionScope(ctx.diagnostics, () => {
    if (entry.modifiers.lock || entry.modifiers.hide) {
      throw new LowerError(
        diagnosticMessages.lockingHidingPlayerTraitsNotSupported(),
        entry.location
      );
    }
    const traits = lowerPlayerTraitOptions(
      entry.options,
      asParameterLoweringContext(ctx),
      entry.location
    );
    const override = {
      target:
        entry.target.kind === "name"
          ? { kind: "name" as const, value: entry.target.value }
          : { kind: "index" as const, value: entry.target.value },
      traits,
      location: entry.location,
    };
    ctx.ir.baseOverrides.playerTraits.push(override);
    ctx.ir.locations.record(override, "traits", entry.location);
  });
};
