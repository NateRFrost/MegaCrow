import { SyntaxKind } from "../../../../abstract-syntax-tree";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import { located } from "../../..";
import { LowerError } from "../../../error";
import type { PlayerTraits } from "../../../game/game_engine_player_traits";
import { lowerBooleanParam, lowerConstantInteger } from "../../../parameters";
import { setField } from "../../../setField";
import { resolveKeyword, type TraitOptionArgs } from "./helpers";

/** Returns true if `identifier` was handled as a shield/vitality trait. */
export const lowerShieldVitalityOption = (
  identifier: string,
  traits: PlayerTraits,
  args: TraitOptionArgs
): boolean => {
  const { parameters, first, ctx, location } = args;
  const { diagnostics, ir } = ctx;

  switch (identifier) {
    case "damage_resistance": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      let value;
      if (resolveKeyword(first) === "invulnerable") {
        value = located("invulnerable" as const, first.location);
      } else if (first.kind === SyntaxKind.INTEGER) {
        value = located(first.value, first.location);
      } else {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          first.location
        );
      }
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "damageResistancePercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "body_recharge": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "bodyRechargeRatePercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "shield_recharge": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "shieldRechargeRatePercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "vampirism": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "vampirismPercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "headshot_immunity": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "headshotImmunity",
        value.value,
        value.location
      );
      return true;
    }
    case "body_multiplier": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "bodyMultiplierPercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "shield_multiplier": {
      if (first === undefined) {
        throw new LowerError(
          diagnosticMessages.expectedParameterType("percentage", ""),
          location
        );
      }
      const value = lowerConstantInteger(first, ctx, "percentage", location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "shieldMultiplierPercentage",
        value.value,
        value.location
      );
      return true;
    }
    case "assassination_immunity": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "assasinationImmunity",
        value.value,
        value.location
      );
      return true;
    }
    case "deathless": {
      const value = lowerBooleanParam(parameters, ctx, location);
      setField(
        ir.locations,
        diagnostics,
        traits.shieldVitality,
        "deathless",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
