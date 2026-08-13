import type { OverrideEntryNode } from "../../../../abstract-syntax-tree/elements/game_options";
import type { ElementLowerContext } from "../../../parameters/context";
import { setField } from "../../../setField";
import { resolveSimpleNumber } from "./helpers";

/** Returns true if `optionName` was handled as a social override. */
export const tryLowerSocialOverride = (
  optionName: string,
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
): boolean => {
  const { diagnostics, ir } = ctx;
  const social = ir.gameVariant.baseVariant.socialOptions;

  switch (optionName) {
    case "friendly_fire_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        social,
        "friendlyFireEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "betrayal_booting_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        social,
        "betrayalBootingEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "enemy_voice_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        social,
        "enemyVoiceEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "open_channel_voice_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        social,
        "openChannelVoiceEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "dead_player_voice_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        social,
        "deadPlayerVoiceEnabled",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
