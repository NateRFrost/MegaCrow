import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  copyFile,
  exists,
  readDir,
  readFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { decodeTextFile } from "./decodeTextFile";
import type { LocalDiskNode } from "./localFolder";

function sortNodes(nodes: LocalDiskNode[]): LocalDiskNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function isMegaloTreeFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".txt");
}

/** Reject path separators and reserved names; ensure `.txt` suffix. */
export function normalizeMegaloTextFileName(name: string): string | null {
  const trimmed = name.trim();
  if (
    !trimmed ||
    trimmed === "." ||
    trimmed === ".." ||
    /[/\\]/.test(trimmed) ||
    trimmed.includes("\0")
  ) {
    return null;
  }
  return trimmed.toLowerCase().endsWith(".txt") ? trimmed : `${trimmed}.txt`;
}

async function scanDirectory(
  rootPath: string,
  pathPrefix: string[] = []
): Promise<LocalDiskNode[]> {
  const currentPath =
    pathPrefix.length === 0 ? rootPath : await join(rootPath, ...pathPrefix);
  const entries = await readDir(currentPath);
  const nodes: LocalDiskNode[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) {
      const childPath = [...pathPrefix, entry.name];
      const children = await scanDirectory(rootPath, childPath);
      if (children.length > 0) {
        nodes.push({
          type: "directory",
          name: entry.name,
          path: childPath,
          children,
        });
      }
      continue;
    }

    if (entry.isFile && isMegaloTreeFile(entry.name)) {
      nodes.push({
        type: "file",
        name: entry.name,
        path: [...pathPrefix, entry.name],
      });
    }
  }

  return sortNodes(nodes);
}

export async function pickTauriFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select folder",
  });
  return typeof selected === "string" ? selected : null;
}

export async function listTauriMegaloTree(
  rootPath: string
): Promise<LocalDiskNode[]> {
  return scanDirectory(rootPath);
}

export async function readTauriMegaloFile(
  rootPath: string,
  path: string[]
): Promise<string> {
  const filePath = await join(rootPath, ...path);
  return decodeTextFile(await readFile(filePath));
}

export function tauriFolderLabel(rootPath: string): string {
  const parts = rootPath.split(/[/\\]/).filter(Boolean);
  return parts.at(-1) ?? rootPath;
}

async function allocateNewScriptName(directoryPath: string): Promise<string> {
  const base = "new_script";
  let name = `${base}.txt`;
  let n = 2;
  while (await exists(await join(directoryPath, name))) {
    name = `${base}_${n}.txt`;
    n += 1;
  }
  return name;
}

/**
 * Create an empty `.txt` under `parentSegments` (empty = workspace root).
 * Returns the new relative path segments.
 */
export async function createTauriMegaloTextFile(
  rootPath: string,
  parentSegments: string[] = []
): Promise<string[]> {
  const directoryPath =
    parentSegments.length === 0
      ? rootPath
      : await join(rootPath, ...parentSegments);
  const fileName = await allocateNewScriptName(directoryPath);
  const filePath = await join(directoryPath, fileName);
  await writeTextFile(filePath, "");
  return [...parentSegments, fileName];
}

/** Rename a file in place (same parent). `newName` may omit `.txt`. */
export async function renameTauriMegaloFile(
  rootPath: string,
  fromSegments: string[],
  newName: string
): Promise<string[]> {
  if (fromSegments.length === 0) {
    throw new Error("Cannot rename the workspace root");
  }
  const normalized = normalizeMegaloTextFileName(newName);
  if (normalized === null) {
    throw new Error("Invalid file name");
  }
  const parent = fromSegments.slice(0, -1);
  const fromPath = await join(rootPath, ...fromSegments);
  const toSegments = [...parent, normalized];
  const toPath = await join(rootPath, ...toSegments);
  if (fromPath === toPath) {
    return toSegments;
  }
  if (await exists(toPath)) {
    throw new Error(`A file named "${normalized}" already exists`);
  }
  await rename(fromPath, toPath);
  return toSegments;
}

export async function deleteTauriMegaloFile(
  rootPath: string,
  pathSegments: string[]
): Promise<void> {
  if (pathSegments.length === 0) {
    throw new Error("Cannot delete the workspace root");
  }
  const filePath = await join(rootPath, ...pathSegments);
  await remove(filePath);
}

/** Allocate `name copy.ext`, then `name copy 2.ext`, … in a directory. */
async function allocateCopyName(
  directoryPath: string,
  originalName: string
): Promise<string> {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot) : "";
  let candidate = `${stem} copy${ext}`;
  let n = 2;
  while (await exists(await join(directoryPath, candidate))) {
    candidate = `${stem} copy ${n}${ext}`;
    n += 1;
  }
  return candidate;
}

/**
 * Duplicate a file into `parentSegments` (default: same parent as source).
 * Returns the new relative path.
 */
export async function duplicateTauriMegaloFile(
  rootPath: string,
  fromSegments: string[],
  parentSegments?: string[]
): Promise<string[]> {
  if (fromSegments.length === 0) {
    throw new Error("Cannot duplicate the workspace root");
  }
  const originalName = fromSegments.at(-1)!;
  const destParent = parentSegments ?? fromSegments.slice(0, -1);
  const directoryPath =
    destParent.length === 0 ? rootPath : await join(rootPath, ...destParent);
  const copyName = await allocateCopyName(directoryPath, originalName);
  const fromPath = await join(rootPath, ...fromSegments);
  const toPath = await join(directoryPath, copyName);
  await copyFile(fromPath, toPath);
  return [...destParent, copyName];
}
