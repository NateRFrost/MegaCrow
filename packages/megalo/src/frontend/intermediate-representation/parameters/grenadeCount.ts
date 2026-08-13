import type { ASTGrenadeCountNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { type Located, located } from "..";
import { LowerError } from "../error";
import { GrenadeCountSetting } from "../game/game_engine_player_traits";

export const lowerGrenadeCount = (
  node: ASTGrenadeCountNode
): Located<GrenadeCountSetting> => {
  let grenadeCountString: string;

  if (node.form === "preset") {
    grenadeCountString = node.value.value;
  } else {
    grenadeCountString = `${node.count.value} ${node.grenadeType.value}`;
  }

  let setting: GrenadeCountSetting | undefined;

  switch (grenadeCountString) {
    case "none":
      setting = GrenadeCountSetting.Zero;
      break;
    case "default":
      setting = GrenadeCountSetting.Default;
      break;
    case "1 frag":
      setting = GrenadeCountSetting.Frag1;
      break;
    case "2 frag":
      setting = GrenadeCountSetting.Frag2;
      break;
    case "3 frag":
      setting = GrenadeCountSetting.Frag3;
      break;
    case "4 frag":
      setting = GrenadeCountSetting.Frag4;
      break;
    case "1 plasma":
      setting = GrenadeCountSetting.Plasma1;
      break;
    case "2 plasma":
      setting = GrenadeCountSetting.Plasma2;
      break;
    case "3 plasma":
      setting = GrenadeCountSetting.Plasma3;
      break;
    case "4 plasma":
      setting = GrenadeCountSetting.Plasma4;
      break;
    case "1 each":
      setting = GrenadeCountSetting.Each1;
      break;
    case "2 each":
      setting = GrenadeCountSetting.Each2;
      break;
    case "3 each":
      setting = GrenadeCountSetting.Each3;
      break;
    case "4 each":
      setting = GrenadeCountSetting.Each4;
      break;
    default:
      throw new LowerError(
        diagnosticMessages.expectedParameterType(
          "grenade_count",
          grenadeCountString
        ),
        node.location
      );
  }

  return located(setting, node.location);
};
