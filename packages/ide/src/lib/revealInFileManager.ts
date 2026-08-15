import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { isTauriRuntime } from "./tauriRuntime";

/** Platform-appropriate label for “show this path in the system file manager”. */
export function fileManagerRevealLabel(): string {
  const platform =
    (
      navigator as Navigator & {
        userAgentData?: { platform?: string };
      }
    ).userAgentData?.platform ?? navigator.platform;

  if (/mac/i.test(platform)) {
    return "Reveal in Finder";
  }
  if (/win/i.test(platform)) {
    return "Reveal in Explorer";
  }
  return "Reveal in Files";
}

/** Open the system file manager with `path` selected (desktop / Tauri only). */
export async function revealInFileManager(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("Reveal in file manager requires the desktop app.");
  }
  await revealItemInDir(path);
}
