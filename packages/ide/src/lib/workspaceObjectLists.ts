import type { ObjectLists } from "@megacrow/megalo";
import { join } from "@tauri-apps/api/path";
import { exists, readDir, readFile } from "@tauri-apps/plugin-fs";
import { decodeTextFile } from "./decodeTextFile";
import type { LocalDiskNode } from "./localFolder";
import {
  isObjectListsDirectoryName,
  isRecognizedObjectListName,
} from "./objectListsPath";
import { isTauriRuntime } from "./tauriRuntime";

export const OBJECT_LISTS_DEFAULT_HINT =
  "No object lists provided, MegaCrow will use the default lists";

const OBJECT_LISTS_DIR = "object_lists";

function sortNodes(nodes: LocalDiskNode[]): LocalDiskNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

/** Match Megalo object-list parsing: skip blank lines; first occurrence wins. */
function parseObjectListText(text: string): string[] {
  const entries: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") {
      continue;
    }
    if (seen.has(line)) {
      continue;
    }
    seen.add(line);
    entries.push(line);
  }
  return entries;
}

/**
 * Ensure the files tree always shows an `object_lists` folder at the workspace
 * root, even when it is missing on disk.
 */
export function withObjectListsFolder(nodes: LocalDiskNode[]): LocalDiskNode[] {
  const hasFolder = nodes.some(
    (node) => node.type === "directory" && isObjectListsDirectoryName(node.name)
  );
  if (hasFolder) {
    return nodes;
  }
  return sortNodes([
    ...nodes,
    {
      type: "directory",
      name: OBJECT_LISTS_DIR,
      path: [OBJECT_LISTS_DIR],
      children: [],
    },
  ]);
}

export function objectListsFolderIsEmpty(nodes: LocalDiskNode[]): boolean {
  const folder = nodes.find(
    (node) => node.type === "directory" && isObjectListsDirectoryName(node.name)
  );
  return !folder || (folder.children?.length ?? 0) === 0;
}

/**
 * Read recognized object list tables from `<input>/object_lists/`.
 * Returns `null` when the folder is missing or has no recognized lists
 * (caller should keep using bundled defaults).
 */
export async function loadWorkspaceObjectLists(
  inputPath: string,
  recognizedNames: readonly string[]
): Promise<ObjectLists | null> {
  if (!(isTauriRuntime() && inputPath.trim()) || recognizedNames.length === 0) {
    return null;
  }

  const dirPath = await join(inputPath, OBJECT_LISTS_DIR);
  if (!(await exists(dirPath))) {
    return null;
  }

  const entries = await readDir(dirPath);
  const lists: Record<string, readonly string[]> = {};
  let loaded = 0;

  for (const entry of entries) {
    if (!(entry.isFile && entry.name)) {
      continue;
    }
    if (!isRecognizedObjectListName(entry.name, recognizedNames)) {
      continue;
    }
    const stem = entry.name.replace(/\.txt$/i, "").toLowerCase();
    if (!stem) {
      continue;
    }
    const filePath = await join(dirPath, entry.name);
    const text = decodeTextFile(await readFile(filePath));
    lists[stem] = parseObjectListText(text);
    loaded += 1;
  }

  if (loaded === 0) {
    return null;
  }

  return lists as ObjectLists;
}
