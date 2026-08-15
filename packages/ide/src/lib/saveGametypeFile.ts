import { join } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { GametypeSaveFormat } from "./megaloShim";
import { autosaveQueueFileName } from "./megaloShim";
import { isTauriRuntime } from "./tauriRuntime";
import type { Workspace } from "./workspace";

export function gametypeSaveFileName(
  fileName: string | null,
  format: GametypeSaveFormat
): string {
  if (format === "asq") {
    return autosaveQueueFileName();
  }
  const stem = fileName
    ? fileName.replace(/\.(txt|bin|blf|mglo|game)$/i, "")
    : "gametype";
  return format === "mglo" ? `${stem}.mglo` : `${stem}.bin`;
}

function saveDialogFilters(format: GametypeSaveFormat) {
  if (format === "mglo") {
    return [{ name: "Megalo variant", extensions: ["mglo"] }];
  }
  if (format === "asq") {
    return [{ name: "Autosave queue", extensions: ["game"] }];
  }
  return [{ name: "Reach gametype", extensions: ["bin", "blf"] }];
}

export type SaveGametypeResult =
  | { saved: true; path: string | null }
  | { saved: false; cancelled: true };

/** Save compiled gametype bytes via native dialog (desktop) or browser download (web). */
export async function saveGametypeBytes(
  bytes: Uint8Array,
  format: GametypeSaveFormat,
  suggestedName: string
): Promise<SaveGametypeResult> {
  if (isTauriRuntime()) {
    const path = await save({
      title: "Save gametype",
      defaultPath: suggestedName,
      filters: saveDialogFilters(format),
    });
    if (!path) {
      return { saved: false, cancelled: true };
    }
    await writeFile(path, bytes);
    return { saved: true, path };
  }

  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedName;
  anchor.click();
  URL.revokeObjectURL(url);
  return { saved: true, path: null };
}

/** Write a compiled `.mglo` to the workspace output folder, overwriting if present. */
export async function writeMgloToWorkspaceOutput(
  workspace: Workspace,
  fileName: string | null,
  bytes: Uint8Array
): Promise<string> {
  if (workspace.type !== "tauri") {
    throw new Error("Build requires the desktop app with an active workspace.");
  }
  const outputName = gametypeSaveFileName(fileName, "mglo");
  const outputPath = await join(workspace.outputPath, outputName);
  await writeFile(outputPath, bytes);
  return outputPath;
}
