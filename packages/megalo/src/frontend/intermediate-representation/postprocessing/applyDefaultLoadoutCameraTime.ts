import { BUILT_IN_LOCATION } from "src/diagnostics";
import type { IR } from "src/frontend/intermediate-representation";
import { ActionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";

export function applyDefaultLoadoutCameraTime(ir: IR) {
  // If we're in a base variant, we don't need to apply the default loadout camera time.
  if (ir.baseFilePath) {
    return ir;
  }

  const loadoutCamLocation = ir.locations.get(
    ir.gameVariant.baseVariant.respawnOptions,
    "loadoutCamTime"
  );
  const hasAuthoredLoadoutCamTime =
    loadoutCamLocation !== undefined &&
    loadoutCamLocation.type !== BUILT_IN_LOCATION.type;

  const usesSetLoadoutPalette = ir.gameVariant.gameEngine.actions.some(
    (action) => action.type === ActionType.SetLoadoutPalette
  );

  if (hasAuthoredLoadoutCamTime || usesSetLoadoutPalette) {
    return ir;
  }

  ir.gameVariant.baseVariant.respawnOptions.loadoutCamTime = 0;
  ir.locations.record(
    ir.gameVariant.baseVariant.respawnOptions,
    "loadoutCamTime",
    BUILT_IN_LOCATION
  );
  return ir;
}
