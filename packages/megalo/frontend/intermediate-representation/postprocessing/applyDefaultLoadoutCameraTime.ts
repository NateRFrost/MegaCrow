import { BUILT_IN_LOCATION } from "../../diagnostics";
import type { IR } from "..";
import { ActionType } from "../game/megalogamengine/megalogamengine_actions";

export function applyDefaultLoadoutCameraTime(ir: IR) {
  const hasNoBaseFilePath = !ir.baseFilePath;
  const hasNoLoadoutCamTime =
    ir.gameVariant.baseVariant.respawnOptions?.loadoutCamTime == undefined;
  const usesSetLoadoutPalette = ir.gameVariant.gameEngine.actions.some(
    (action) => action.type === ActionType.SetLoadoutPalette
  );
  if (hasNoBaseFilePath && hasNoLoadoutCamTime && usesSetLoadoutPalette) {
    ir.gameVariant.baseVariant.respawnOptions.loadoutCamTime = 10.0;
    ir.locations.record(
      ir.gameVariant.baseVariant.respawnOptions,
      "loadoutCamTime",
      BUILT_IN_LOCATION
    );
  }
  return ir;
}
