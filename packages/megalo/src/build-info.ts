/** MegaCrow app build identity (Bungie-style). Overwritten by CI via scripts/write-build-info.mjs. */
export const MEGACROW_BUILD_STRING = "untracked version";

/** Pre-release watermark; false only for CI builds on the `release` branch. */
export const MEGACROW_SHOW_WATERMARK = true;

/** Windows/Tauri-safe package version (`0.{seq}.0` or `0.0.1` when untracked). */
export const MEGACROW_PACKAGE_VERSION = "0.0.1";
