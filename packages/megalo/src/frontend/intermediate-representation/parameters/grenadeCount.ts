import { diagnosticMessages } from "src/diagnostics/messages";
import type { ASTGrenadeCountNode } from "src/frontend/abstract-syntax-tree/parameters";
import {
  type Located,
  located,
} from "src/frontend/intermediate-representation";
import { LowerError } from "src/frontend/intermediate-representation/error";
import {
  grenadeCountSetting,
  type GrenadeCountSetting,
} from "src/frontend/intermediate-representation/game/game_engine_player_traits";

export const lowerGrenadeCount = (
  node: ASTGrenadeCountNode
): Located<GrenadeCountSetting> => {
  const grenadeCountString =
    node.form === "preset"
      ? node.value.value
      : `${node.count.value} ${node.grenadeType.value}`;

  const setting = grenadeCountSetting.parse(grenadeCountString);
  if (setting === undefined) {
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
