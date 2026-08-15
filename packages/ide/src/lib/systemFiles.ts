import { join } from "@tauri-apps/api/path";
import type { LocalDiskNode } from "./localFolder";
import {
  createTauriMegaloTextFile,
  deleteTauriMegaloFile,
  duplicateTauriMegaloFile,
  listTauriMegaloTree,
  normalizeMegaloTextFileName,
  readTauriMegaloFile,
  renameTauriMegaloFile,
  tauriFolderLabel,
} from "./tauriDisk";
import { isTauriRuntime } from "./tauriRuntime";

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
  return listTauriMegaloTree(root.path);
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

export async function renameSystemMegaloFile(
  root: LocalDiskRoot,
  fromSegments: string[],
  newName: string
): Promise<string[]> {
  return renameTauriMegaloFile(root.path, fromSegments, newName);
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
