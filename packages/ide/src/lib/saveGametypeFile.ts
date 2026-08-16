import {
  MEGALO_VERSIONS,
  type MegaloVersionId,
  packMgloBytesForVersion,
} from "@megacrow/megalo";
import { join } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import {
  autosaveQueueFileName,
  finalizeGametypeSaveBytes,
  type GametypeSaveFormat,
} from "./gametypeSaveFormat";
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
  const output = finalizeGametypeSaveBytes(bytes, format);
  if (isTauriRuntime()) {
    const path = await save({
      title: "Save gametype",
      defaultPath: suggestedName,
      filters: saveDialogFilters(format),
    });
    if (!path) {
      return { saved: false, cancelled: true };
    }
    await writeFile(path, output);
    return { saved: true, path };
  }

  const blob = new Blob([output], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedName;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Delay revoke so the browser can start the download before the blob URL is invalidated.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return { saved: true, path: null };
}

/** Write compiled `.mglo` and gvar `.bin` to the workspace output folder. */
export async function writeBuildOutputsToWorkspace(
  workspace: Workspace,
  fileName: string | null,
  mgloBytes: Uint8Array,
  megaloVersionId: MegaloVersionId = "107-mcc"
): Promise<{ mgloPath: string; binPath: string }> {
  if (workspace.type !== "tauri") {
    throw new Error("Build requires the desktop app with an active workspace.");
  }
  if (!workspace.outputPath?.trim()) {
    throw new Error("This workspace has no output folder configured.");
  }
  const mgloName = gametypeSaveFileName(fileName, "mglo");
  const binName = gametypeSaveFileName(fileName, "gvar");
  const mgloPath = await join(workspace.outputPath, mgloName);
  const binPath = await join(workspace.outputPath, binName);
  const gvarBytes = packMgloBytesForVersion(
    mgloBytes,
    MEGALO_VERSIONS[megaloVersionId],
    "gvar"
  );
  await writeFile(mgloPath, mgloBytes);
  await writeFile(binPath, gvarBytes);
  return { mgloPath, binPath };
}
