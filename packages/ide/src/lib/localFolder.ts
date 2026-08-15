import { decodeTextFile } from "./decodeTextFile";

export function isLocalFolderSupported(): boolean {
  return typeof window.showDirectoryPicker === "function";
}

export async function pickLocalFolder(): Promise<FileSystemDirectoryHandle> {
  if (!isLocalFolderSupported()) {
    throw new Error("Folder selection is not supported in this browser");
  }
  return window.showDirectoryPicker({ mode: "read" });
}

export interface LocalDiskNode {
  children?: LocalDiskNode[];
  name: string;
  /** Path segments from the selected root folder. */
  path: string[];
  type: "directory" | "file";
  /**
   * Bundled default shown in the tree before the file exists on disk
   * (object list tables). Saving materializes the file and clears this flag.
   */
  virtual?: boolean;
}

function pathKey(path: string[]): string {
  return path.join("/");
}

function sortNodes(nodes: LocalDiskNode[]): LocalDiskNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

async function scanDirectory(
  directory: FileSystemDirectoryHandle,
  pathPrefix: string[] = []
): Promise<LocalDiskNode[]> {
  const nodes: LocalDiskNode[] = [];

  for await (const entry of directory.values()) {
    if (entry.kind === "directory") {
      const childPath = [...pathPrefix, entry.name];
      const children = await scanDirectory(
        entry as FileSystemDirectoryHandle,
        childPath
      );
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

    if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".txt")) {
      nodes.push({
        type: "file",
        name: entry.name,
        path: [...pathPrefix, entry.name],
      });
    }
  }

  return sortNodes(nodes);
}

export async function listLocalMegaloTree(
  directory: FileSystemDirectoryHandle
): Promise<LocalDiskNode[]> {
  return scanDirectory(directory);
}

export function formatLocalDiskPath(path: string[]): string {
  return path.join("/");
}

async function resolveFileHandle(
  root: FileSystemDirectoryHandle,
  path: string[]
): Promise<FileSystemFileHandle> {
  if (path.length === 0) {
    throw new Error("Invalid file path");
  }

  let directory = root;
  for (let i = 0; i < path.length - 1; i++) {
    directory = await directory.getDirectoryHandle(path[i]);
  }

  return directory.getFileHandle(path.at(-1));
}

export async function readLocalMegaloFile(
  root: FileSystemDirectoryHandle,
  path: string[]
): Promise<string> {
  const handle = await resolveFileHandle(root, path);
  const file = await handle.getFile();
  return decodeTextFile(new Uint8Array(await file.arrayBuffer()));
}

export { pathKey };
