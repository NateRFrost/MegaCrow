import type { FileProvider } from "../megaloShim";
import { isOpfsSupported } from "../opfsStorage";
import { isTauriRuntime } from "../tauriRuntime";
import type { Workspace } from "../workspace";
import { createOpfsFileProvider } from "./opfsFileProvider";
import { createTauriFileProvider } from "./tauriFileProvider";

/**
 * Platform FileProvider for Megalo includes and `base` resolution.
 * Desktop (Tauri) reads from the real filesystem; browser uses OPFS workspace paths.
 */
export function createPlatformFileProvider(
  workspace?: Pick<Workspace, "type"> | null
): FileProvider | undefined {
  // Tauri/plugin-fs IPC requires `window`; Web Workers must use preloaded bytes/cache.
  if (typeof globalThis.window === "undefined") {
    return;
  }
  if (workspace?.type === "tauri" || isTauriRuntime()) {
    return createTauriFileProvider();
  }
  if (workspace?.type === "opfs" && isOpfsSupported()) {
    return createOpfsFileProvider();
  }
  if (isOpfsSupported() && !isTauriRuntime()) {
    return createOpfsFileProvider();
  }
  return;
}
