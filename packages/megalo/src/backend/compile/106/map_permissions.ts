import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import { BUILT_IN_LOCATION, type Diagnostics } from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { IR } from "src/frontend/intermediate-representation";

const MAX_MAP_PERMISSION_EXCEPTIONS = 32;
/** Signed 16-bit map id range used by ManagedMegalo (`num + 0x8000 <= 0xffff`). */
const MIN_MAP_ID = -0x8000;
const MAX_MAP_ID = 0x7fff;

export const compileMapPermissions = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant,
  diagnostics: Diagnostics
): void => {
  const mapPermissions = ir.gameVariant.mapPermissions;
  if (mapPermissions === undefined) {
    return;
  }

  if (mapPermissions.exceptMapIds.length > MAX_MAP_PERMISSION_EXCEPTIONS) {
    diagnostics.addError(
      diagnosticMessages.tooManyMapPermissionExceptions(),
      BUILT_IN_LOCATION
    );
  }

  for (const mapId of mapPermissions.exceptMapIds) {
    if (mapId < MIN_MAP_ID || mapId > MAX_MAP_ID) {
      diagnostics.addError(
        diagnosticMessages.mapIdOutOfRange(),
        BUILT_IN_LOCATION
      );
    }
  }

  gameVariant.m_map_permissions.m_except_map_ids =
    mapPermissions.exceptMapIds.slice(0, MAX_MAP_PERMISSION_EXCEPTIONS);
  gameVariant.m_map_permissions.m_allow_by_default =
    mapPermissions.allowByDefault;
};
