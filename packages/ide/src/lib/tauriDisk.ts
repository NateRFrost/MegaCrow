import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readFile,
  remove,
  rename,
  stat,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { decodeTextFile } from "./decodeTextFile";
import type { LocalDiskNode } from "./localFolder";
import { allocateNumberedName } from "./uniqueFileName";

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

/** Reject path separators and reserved names for directories. */
export function normalizeDirectoryName(name: string): string | null {
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
  return trimmed;
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
      nodes.push({
        type: "directory",
        name: entry.name,
        path: childPath,
        children,
      });
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

export interface BuildOutputEntry {
  name: string;
  updatedAt: number;
}

function isBuildOutputFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".mglo") || lower.endsWith(".blf");
}

/** Flat list of compiled gametype files in a workspace output folder. */
export async function listTauriBuildOutputs(
  outputPath: string
): Promise<BuildOutputEntry[]> {
  const entries = await readDir(outputPath);
  const outputs: BuildOutputEntry[] = [];

  for (const entry of entries) {
    if (!(entry.isFile && entry.name && isBuildOutputFile(entry.name))) {
      continue;
    }
    const filePath = await join(outputPath, entry.name);
    let updatedAt = 0;
    try {
      const info = await stat(filePath);
      updatedAt = info.mtime?.getTime() ?? 0;
    } catch {
      // ignore stat failures
    }
    outputs.push({ name: entry.name, updatedAt });
  }

  return outputs.sort((a, b) => a.name.localeCompare(b.name));
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

async function allocateNewFolderName(directoryPath: string): Promise<string> {
  const base = "new_folder";
  let name = base;
  let n = 2;
  while (await exists(await join(directoryPath, name))) {
    name = `${base}_${n}`;
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

/**
 * Create an empty directory under `parentSegments` (empty = workspace root).
 * Returns the new relative path segments.
 */
export async function createTauriMegaloDirectory(
  rootPath: string,
  parentSegments: string[] = []
): Promise<string[]> {
  const directoryPath =
    parentSegments.length === 0
      ? rootPath
      : await join(rootPath, ...parentSegments);
  const folderName = await allocateNewFolderName(directoryPath);
  const folderPath = await join(directoryPath, folderName);
  await mkdir(folderPath);
  return [...parentSegments, folderName];
}

/** Rename a file or directory in place (same parent). */
export async function renameTauriMegaloFile(
  rootPath: string,
  fromSegments: string[],
  newName: string
): Promise<string[]> {
  if (fromSegments.length === 0) {
    throw new Error("Cannot rename the workspace root");
  }
  const fromPath = await join(rootPath, ...fromSegments);
  const info = await stat(fromPath);
  const normalized = info.isDirectory
    ? normalizeDirectoryName(newName)
    : normalizeMegaloTextFileName(newName);
  if (normalized === null) {
    throw new Error(
      info.isDirectory ? "Invalid folder name" : "Invalid file name"
    );
  }
  const parent = fromSegments.slice(0, -1);
  const parentPath =
    parent.length === 0 ? rootPath : await join(rootPath, ...parent);
  const samePath = (left: string, right: string): boolean =>
    left.replace(/\\/g, "/").toLowerCase() ===
    right.replace(/\\/g, "/").toLowerCase();
  const uniqueName = await allocateNumberedName(
    normalized,
    async (name) => {
      const candidate = await join(parentPath, name);
      if (samePath(candidate, fromPath)) {
        return false;
      }
      return exists(candidate);
    },
    { directory: info.isDirectory === true }
  );
  const toSegments = [...parent, uniqueName];
  const toPath = await join(rootPath, ...toSegments);
  if (fromPath === toPath) {
    return toSegments;
  }
  await rename(fromPath, toPath);
  return toSegments;
}

function isPathPrefix(prefix: string[], path: string[]): boolean {
  if (prefix.length === 0 || prefix.length > path.length) {
    return prefix.length === 0;
  }
  return prefix.every((segment, index) => segment === path[index]);
}

export type MoveTauriMegaloResult =
  | { status: "moved"; path: string[] }
  | { status: "noop"; path: string[] }
  | { status: "needs_replace"; path: string[]; displayName: string };

/**
 * Move a file or directory into `toParentSegments` (empty = workspace root).
 * When the destination name exists, returns `needs_replace` unless `replace` is true.
 */
export async function moveTauriMegaloEntry(
  rootPath: string,
  fromSegments: string[],
  toParentSegments: string[],
  options?: { replace?: boolean }
): Promise<MoveTauriMegaloResult> {
  if (fromSegments.length === 0) {
    throw new Error("Cannot move the workspace root");
  }
  const name = fromSegments.at(-1)!;
  const toSegments = [...toParentSegments, name];
  if (
    fromSegments.length === toSegments.length &&
    fromSegments.every((segment, index) => segment === toSegments[index])
  ) {
    return { status: "noop", path: fromSegments };
  }

  const fromParent = fromSegments.slice(0, -1);
  if (
    fromParent.length === toParentSegments.length &&
    fromParent.every((segment, index) => segment === toParentSegments[index])
  ) {
    return { status: "noop", path: fromSegments };
  }

  // Moving a folder into itself or a descendant is invalid.
  if (isPathPrefix(fromSegments, toSegments)) {
    throw new Error("Cannot move a folder into itself");
  }

  const fromPath = await join(rootPath, ...fromSegments);
  const toPath = await join(rootPath, ...toSegments);
  if (await exists(toPath)) {
    if (!options?.replace) {
      return { status: "needs_replace", path: toSegments, displayName: name };
    }
    const destInfo = await stat(toPath);
    await remove(toPath, { recursive: destInfo.isDirectory === true });
  }

  await rename(fromPath, toPath);
  return { status: "moved", path: toSegments };
}

export async function deleteTauriMegaloFile(
  rootPath: string,
  pathSegments: string[]
): Promise<void> {
  if (pathSegments.length === 0) {
    throw new Error("Cannot delete the workspace root");
  }
  const filePath = await join(rootPath, ...pathSegments);
  const info = await stat(filePath);
  await remove(filePath, { recursive: info.isDirectory === true });
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
