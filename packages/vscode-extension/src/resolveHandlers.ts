import path from "node:path";
import { FileType, Uri, workspace } from "vscode";
import { decodeTextFile } from "./decodeTextFile";
import type {
  ListDirectoryParams,
  ListDirectoryResult,
  ResolveBaseFileParams,
  ResolveBaseFileResult,
  ResolveIncludeParams,
  ResolveIncludeResult,
} from "./protocol";

const parentDirectory = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return path.parse(filePath).root || ".";
  }
  const parent = normalized.slice(0, index);
  return /\\/.test(filePath) ? parent.replace(/\//g, "\\") : parent;
};

const uriToFsPath = (uri: string | undefined): string | null => {
  if (!uri) {
    return null;
  }
  if (uri.startsWith("file:")) {
    try {
      return Uri.parse(uri).fsPath;
    } catch {
      return null;
    }
  }
  // Bare filesystem path (same shape the IDE LSP client returns).
  if (/^[A-Za-z]:[\\/]/.test(uri) || uri.startsWith("/")) {
    return uri;
  }
  return null;
};

/** Directories to try for relative include / base resolution. */
const resolveSearchDirs = (fromUri: string | undefined): string[] => {
  const dirs: string[] = [];
  const seen = new Set<string>();
  const add = (dir: string | null | undefined) => {
    if (!dir || dir === ".") {
      return;
    }
    const key = dir.replace(/\\/g, "/").toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    dirs.push(dir);
  };

  const fromPath = uriToFsPath(fromUri);
  if (fromPath) {
    add(parentDirectory(fromPath));
  }

  for (const folder of workspace.workspaceFolders ?? []) {
    add(folder.uri.fsPath);
  }

  return dirs.length > 0 ? dirs : ["."];
};

const encodeBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");

const readTextFile = async (absolute: string): Promise<string | null> => {
  try {
    const data = await workspace.fs.readFile(Uri.file(absolute));
    return decodeTextFile(data);
  } catch {
    return null;
  }
};

const readBytesFile = async (absolute: string): Promise<Uint8Array | null> => {
  try {
    return await workspace.fs.readFile(Uri.file(absolute));
  } catch {
    return null;
  }
};

export const handleResolveInclude = async (
  params: ResolveIncludeParams
): Promise<ResolveIncludeResult> => {
  const tried: string[] = [];
  for (const dir of resolveSearchDirs(params.fromUri)) {
    const absolute = path.resolve(dir, params.path);
    tried.push(absolute);
    const text = await readTextFile(absolute);
    if (text !== null) {
      return {
        text,
        uri: Uri.file(absolute).toString(),
      };
    }
  }
  return {
    error: `Include not found: ${params.path} (tried ${tried.join(", ")})`,
  };
};

export const handleResolveBaseFile = async (
  params: ResolveBaseFileParams
): Promise<ResolveBaseFileResult> => {
  const tried: string[] = [];
  for (const dir of resolveSearchDirs(params.fromUri)) {
    const absolute = path.resolve(dir, params.path);
    tried.push(absolute);
    const bytes = await readBytesFile(absolute);
    if (bytes !== null) {
      return { dataBase64: encodeBase64(bytes) };
    }
  }
  return {
    error: `Base file not found: ${params.path} (tried ${tried.join(", ")})`,
  };
};

export const handleListDirectory = async (
  params: ListDirectoryParams
): Promise<ListDirectoryResult> => {
  const relative = (params.directory ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const searchDirs = resolveSearchDirs(params.fromUri);
  const baseDir = searchDirs[0];
  if (!baseDir || baseDir === ".") {
    return { error: "No directory available for path completion" };
  }
  const absolute = relative ? path.resolve(baseDir, relative) : baseDir;
  try {
    const entries = await workspace.fs.readDirectory(Uri.file(absolute));
    return {
      entries: entries.map(([name, type]) => ({
        name,
        directory: type === FileType.Directory,
      })),
    };
  } catch {
    return { error: `Directory not found: ${absolute}` };
  }
};
