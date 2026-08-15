import { readDir } from "@tauri-apps/plugin-fs";
import { isOpfsSupported, listOpfsWorkspaceDirectory } from "./opfsStorage";
import { isTauriRuntime } from "./tauriRuntime";

export interface PathDirectoryEntry {
  directory: boolean;
  name: string;
}

/**
 * List immediate children of an absolute (Tauri) or logical (OPFS) directory.
 */
export async function listPathDirectoryEntries(
  absoluteOrLogicalDir: string
): Promise<PathDirectoryEntry[]> {
  if (isTauriRuntime()) {
    try {
      const entries = await readDir(absoluteOrLogicalDir);
      const result: PathDirectoryEntry[] = [];
      for (const entry of entries) {
        if (!entry.name) {
          continue;
        }
        if (entry.isDirectory) {
          result.push({ name: entry.name, directory: true });
        } else if (entry.isFile) {
          result.push({ name: entry.name, directory: false });
        }
      }
      return result;
    } catch (error) {
      console.warn(
        `[megacrow] listPathDirectoryEntries failed: ${absoluteOrLogicalDir}`,
        error
      );
      return [];
    }
  }

  if (isOpfsSupported()) {
    return listOpfsWorkspaceDirectory(absoluteOrLogicalDir);
  }

  return [];
}
