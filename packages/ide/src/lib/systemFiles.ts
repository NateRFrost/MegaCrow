import { join } from "@tauri-apps/api/path";
import type { LocalDiskNode } from "./localFolder";
import {
  type BuildOutputEntry,
  createTauriMegaloDirectory,
  createTauriMegaloTextFile,
  deleteTauriMegaloFile,
  duplicateTauriMegaloFile,
  listTauriBuildOutputs,
  listTauriMegaloTree,
  type MoveTauriMegaloResult,
  moveTauriMegaloEntry,
  normalizeMegaloTextFileName,
  readTauriMegaloFile,
  renameTauriMegaloFile,
  tauriFolderLabel,
} from "./tauriDisk";
import { isTauriRuntime } from "./tauriRuntime";
import { withObjectListsFolder } from "./workspaceObjectLists";

/** Selected folder on disk (desktop app only). */
export interface LocalDiskRoot {
  path: string;
}

export function isSystemFolderSupported(): boolean {
  return isTauriRuntime();
}

export async function listSystemMegaloTree(
  root: LocalDiskRoot
): Promise<LocalDiskNode[]> {
  return withObjectListsFolder(await listTauriMegaloTree(root.path));
}

export async function listSystemBuildOutputs(
  outputPath: string
): Promise<BuildOutputEntry[]> {
  return listTauriBuildOutputs(outputPath);
}

export async function readSystemMegaloFile(
  root: LocalDiskRoot,
  path: string[]
): Promise<string> {
  return readTauriMegaloFile(root.path, path);
}

export function systemFolderLabel(root: LocalDiskRoot): string {
  return tauriFolderLabel(root.path);
}

export function systemFolderTitle(root: LocalDiskRoot): string {
  return root.path;
}

export async function resolveSystemMegaloFilePath(
  root: LocalDiskRoot,
  path: string[]
): Promise<string> {
  return join(root.path, ...path);
}

export { normalizeMegaloTextFileName };

export async function createSystemMegaloTextFile(
  root: LocalDiskRoot,
  parentSegments: string[] = []
): Promise<string[]> {
  return createTauriMegaloTextFile(root.path, parentSegments);
}

export async function createSystemMegaloDirectory(
  root: LocalDiskRoot,
  parentSegments: string[] = []
): Promise<string[]> {
  return createTauriMegaloDirectory(root.path, parentSegments);
}

export async function renameSystemMegaloFile(
  root: LocalDiskRoot,
  fromSegments: string[],
  newName: string
): Promise<string[]> {
  return renameTauriMegaloFile(root.path, fromSegments, newName);
}

export async function moveSystemMegaloEntry(
  root: LocalDiskRoot,
  fromSegments: string[],
  toParentSegments: string[],
  options?: { replace?: boolean }
): Promise<MoveTauriMegaloResult> {
  return moveTauriMegaloEntry(
    root.path,
    fromSegments,
    toParentSegments,
    options
  );
}

export async function deleteSystemMegaloFile(
  root: LocalDiskRoot,
  pathSegments: string[]
): Promise<void> {
  return deleteTauriMegaloFile(root.path, pathSegments);
}

export async function duplicateSystemMegaloFile(
  root: LocalDiskRoot,
  fromSegments: string[],
  parentSegments?: string[]
): Promise<string[]> {
  return duplicateTauriMegaloFile(root.path, fromSegments, parentSegments);
}
