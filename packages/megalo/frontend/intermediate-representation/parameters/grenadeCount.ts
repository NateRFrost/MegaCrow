import type { ASTGrenadeCountNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../diagnostics/messages";
import { type ValueWithLocation, valueWithLocation } from "..";
import { LowerError } from "../error";
import { GrenadeCountSetting } from "../game/game_engine_player_traits";

export const lowerGrenadeCount = (
  node: ASTGrenadeCountNode
): ValueWithLocation<GrenadeCountSetting> => {
  if (node.form === "preset") {
    switch (node.value.value) {
      case "none":
        return valueWithLocation(GrenadeCountSetting.Zero, node.location);
      case "default":
        return valueWithLocation(GrenadeCountSetting.Default, node.location);
      default:
        throw new LowerError(
          diagnosticMessages.expectedParameterType(
            "grenade_count",
            node.value.value
          ),
          node.location
        );
    }
  }

  const count = node.count.value;
  const grenadeType = node.grenadeType.value;
  let setting: GrenadeCountSetting | undefined;

  if (count >= 1 && count <= 4) {
    switch (grenadeType) {
      case "frag":
        setting = [
          GrenadeCountSetting.Frag1,
          GrenadeCountSetting.Frag2,
          GrenadeCountSetting.Frag3,
          GrenadeCountSetting.Frag4,
        ][count - 1];
        break;
      case "plasma":
        setting = [
          GrenadeCountSetting.Plasma1,
          GrenadeCountSetting.Plasma2,
          GrenadeCountSetting.Plasma3,
          GrenadeCountSetting.Plasma4,
        ][count - 1];
        break;
      case "each":
        setting = [
          GrenadeCountSetting.Each1,
          GrenadeCountSetting.Each2,
          GrenadeCountSetting.Each3,
          GrenadeCountSetting.Each4,
        ][count - 1];
        break;
    }
  }

  if (setting === undefined) {
    throw new LowerError(
      diagnosticMessages.expectedParameterType(
        "grenade_count",
        `${count} ${grenadeType}`
      ),
      node.location
    );
  }
  return valueWithLocation(setting, node.location);
};
