const GAMETYPES_DIR = "gametypes";
const WORKSPACE_ROOT = "workspace";
/** Companion Megalo source next to a saved `.bin` (not a compiled `.mglo`). */
const SOURCE_EXT = ".txt";
/** Pre-rename companion extension; still read/deleted for migration. */
const LEGACY_SOURCE_EXT = ".meg";

export interface OpfsGametypeEntry {
  name: string;
  updatedAt: number;
}

export function isOpfsSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  );
}

export function workspaceInputPath(): string {
  return `${WORKSPACE_ROOT}/input`;
}

export function workspaceOutputPath(): string {
  return `${WORKSPACE_ROOT}/output`;
}

async function getRootDirectory(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

async function getDirectoryHandle(
  path: string,
  create: boolean
): Promise<FileSystemDirectoryHandle | null> {
  const segments = path
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return getRootDirectory();
  }
  let current = await getRootDirectory();
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const isLast = i === segments.length - 1;
    try {
      current = await current.getDirectoryHandle(segment, {
        create: create && !isLast,
      });
    } catch {
      return null;
    }
  }
  return current;
}

/** Read a file from the OPFS workspace using a logical path (`workspace/input/...`). */
export async function readOpfsWorkspaceBytes(
  logicalPath: string
): Promise<Uint8Array | null> {
  if (!isOpfsSupported()) {
    return null;
  }
  const normalized = logicalPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized
    .split("/")
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }
  const fileName = segments.at(-1)!;
  const dirPath = segments.slice(0, -1).join("/");
  const dir = await getDirectoryHandle(dirPath, false);
  if (!dir) {
    return null;
  }
  try {
    const handle = await dir.getFileHandle(fileName);
    const file = await handle.getFile();
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    return null;
  }
}

export async function writeOpfsWorkspaceBytes(
  logicalPath: string,
  bytes: Uint8Array
): Promise<void> {
  if (!isOpfsSupported()) {
    throw new Error("OPFS is not supported in this browser");
  }
  const normalized = logicalPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized
    .split("/")
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    throw new Error("Invalid OPFS workspace path");
  }
  const fileName = segments.at(-1)!;
  const dirPath = segments.slice(0, -1).join("/");
  const dir = await getDirectoryHandle(dirPath, true);
  if (!dir) {
    throw new Error(`Could not create OPFS directory: ${dirPath}`);
  }
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(bytes as unknown as BlobPart);
  await writable.close();
}

function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const cleaned = base.replace(/[?%*:|"<>]/g, "_").replace(/^\.+/, "");
  if (!cleaned) {
    return "gametype.bin";
  }
  return cleaned.toLowerCase().endsWith(".bin") ? cleaned : `${cleaned}.bin`;
}

async function getGametypesDirectory(): Promise<FileSystemDirectoryHandle> {
  const root = await getRootDirectory();
  return root.getDirectoryHandle(GAMETYPES_DIR, { create: true });
}

export async function listOpfsGametypes(): Promise<OpfsGametypeEntry[]> {
  if (!isOpfsSupported()) {
    return [];
  }

  const dir = await getGametypesDirectory();
  const entries: OpfsGametypeEntry[] = [];

  for await (const entry of dir.values()) {
    if (entry.kind !== "file" || !entry.name.toLowerCase().endsWith(".bin")) {
      continue;
    }
    const fileHandle = entry as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    entries.push({ name: fileHandle.name, updatedAt: file.lastModified });
  }

  return entries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function readOpfsGametype(name: string): Promise<Uint8Array> {
  const dir = await getGametypesDirectory();
  const handle = await dir.getFileHandle(name);
  const file = await handle.getFile();
  return new Uint8Array(await file.arrayBuffer());
}

function companionSourceName(
  binName: string,
  ext: typeof SOURCE_EXT | typeof LEGACY_SOURCE_EXT = SOURCE_EXT
): string | null {
  if (!binName.toLowerCase().endsWith(".bin")) {
    return null;
  }
  return binName.replace(/\.bin$/i, ext);
}

async function removeCompanionSources(
  dir: FileSystemDirectoryHandle,
  binName: string
): Promise<void> {
  for (const ext of [SOURCE_EXT, LEGACY_SOURCE_EXT] as const) {
    const companion = companionSourceName(binName, ext);
    if (!companion) {
      continue;
    }
    try {
      await dir.removeEntry(companion);
    } catch {
      // Companion source may not exist.
    }
  }
}

export async function deleteOpfsGametype(name: string): Promise<void> {
  const dir = await getGametypesDirectory();
  await dir.removeEntry(name);
  await removeCompanionSources(dir, name);
}

async function fileExistsInDir(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function renameEntryInDir(
  dir: FileSystemDirectoryHandle,
  from: string,
  to: string
): Promise<void> {
  const handle = await dir.getFileHandle(from);
  const movable = handle as FileSystemFileHandle & {
    move?: (name: string) => Promise<void>;
  };
  if (typeof movable.move === "function") {
    await movable.move(to);
    return;
  }
  const file = await handle.getFile();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dest = await dir.getFileHandle(to, { create: true });
  const writable = await dest.createWritable();
  await writable.write(bytes as unknown as BlobPart);
  await writable.close();
  await dir.removeEntry(from);
}

/** Rename a saved `.bin` and its companion `.txt` source (if present). */
export async function renameOpfsGametype(
  fromName: string,
  toName: string
): Promise<string> {
  const safeTo = safeFileName(toName);
  if (
    fromName.localeCompare(safeTo, undefined, { sensitivity: "accent" }) === 0
  ) {
    return fromName;
  }
  const dir = await getGametypesDirectory();
  if (await fileExistsInDir(dir, safeTo)) {
    throw new Error(`A file named "${safeTo}" already exists`);
  }
  await renameEntryInDir(dir, fromName, safeTo);

  const toTxt = companionSourceName(safeTo, SOURCE_EXT);
  if (toTxt) {
    await removeCompanionSources(dir, safeTo);
    const fromTxt = companionSourceName(fromName, SOURCE_EXT);
    const fromLegacy = companionSourceName(fromName, LEGACY_SOURCE_EXT);
    const fromCompanion =
      fromTxt && (await fileExistsInDir(dir, fromTxt))
        ? fromTxt
        : fromLegacy && (await fileExistsInDir(dir, fromLegacy))
          ? fromLegacy
          : null;
    if (fromCompanion) {
      await renameEntryInDir(dir, fromCompanion, toTxt);
    }
  }
  return safeTo;
}

/** Create an empty gametype save (`.bin` + empty `.txt` source) and return the `.bin` name. */
export async function createOpfsGametype(): Promise<string> {
  const dir = await getGametypesDirectory();
  let name = "new_gametype.bin";
  let n = 2;
  while (await fileExistsInDir(dir, name)) {
    name = `new_gametype_${n}.bin`;
    n += 1;
  }
  return saveGametypeToOpfs(name, new Uint8Array(0), "");
}

/** Read companion Megalo source for a `.bin` save, if present. */
export async function readOpfsGametypeSource(
  binName: string
): Promise<string | null> {
  const dir = await getGametypesDirectory();
  for (const ext of [SOURCE_EXT, LEGACY_SOURCE_EXT] as const) {
    const companion = companionSourceName(binName, ext);
    if (!companion) {
      return null;
    }
    try {
      const handle = await dir.getFileHandle(companion);
      const file = await handle.getFile();
      return await file.text();
    } catch {
      // try next extension
    }
  }
  return null;
}

export function opfsGametypeLogicalPath(name: string): string {
  return `${GAMETYPES_DIR}/${name}`;
}

/** File blobs for system clipboard write (`.bin` + companion `.txt` when present). */
export async function getOpfsGametypeClipboardFiles(
  name: string
): Promise<File[]> {
  const dir = await getGametypesDirectory();
  const files: File[] = [];
  const binHandle = await dir.getFileHandle(name);
  files.push(await binHandle.getFile());

  for (const ext of [SOURCE_EXT, LEGACY_SOURCE_EXT] as const) {
    const companion = companionSourceName(name, ext);
    if (!companion) {
      continue;
    }
    try {
      const handle = await dir.getFileHandle(companion);
      files.push(await handle.getFile());
      break;
    } catch {
      // try next extension
    }
  }
  return files;
}

async function allocateOpfsCopyName(originalName: string): Promise<string> {
  const dir = await getGametypesDirectory();
  const safeOriginal = safeFileName(originalName);
  const dot = safeOriginal.lastIndexOf(".");
  const stem = dot > 0 ? safeOriginal.slice(0, dot) : safeOriginal;
  const ext = dot > 0 ? safeOriginal.slice(dot) : ".bin";
  let candidate = `${stem} copy${ext}`;
  let n = 2;
  while (await fileExistsInDir(dir, candidate)) {
    candidate = `${stem} copy ${n}${ext}`;
    n += 1;
  }
  return candidate;
}

/** Duplicate a `.bin` save (and companion `.txt` source if present). */
export async function duplicateOpfsGametype(fromName: string): Promise<string> {
  const dir = await getGametypesDirectory();
  const toName = await allocateOpfsCopyName(fromName);
  const fromHandle = await dir.getFileHandle(fromName);
  const fromFile = await fromHandle.getFile();
  const bytes = new Uint8Array(await fromFile.arrayBuffer());
  const source = (await readOpfsGametypeSource(fromName)) ?? "";

  const binHandle = await dir.getFileHandle(toName, { create: true });
  const binWritable = await binHandle.createWritable();
  await binWritable.write(bytes as unknown as BlobPart);
  await binWritable.close();

  const toTxt = companionSourceName(toName, SOURCE_EXT);
  if (toTxt) {
    const megHandle = await dir.getFileHandle(toTxt, { create: true });
    const megWritable = await megHandle.createWritable();
    await megWritable.write(source);
    await megWritable.close();
  }

  return toName;
}

export async function saveGametypeToOpfs(
  name: string,
  bytes: Uint8Array,
  source: string
): Promise<string> {
  const safeName = safeFileName(name);
  const dir = await getGametypesDirectory();

  const binHandle = await dir.getFileHandle(safeName, { create: true });
  const binWritable = await binHandle.createWritable();
  await binWritable.write(bytes as unknown as BlobPart);
  await binWritable.close();

  const sourceName = companionSourceName(safeName, SOURCE_EXT);
  if (sourceName) {
    // Drop legacy `.meg` sidecar if present.
    const legacy = companionSourceName(safeName, LEGACY_SOURCE_EXT);
    if (legacy) {
      try {
        await dir.removeEntry(legacy);
      } catch {
        // ignore
      }
    }
    const sourceHandle = await dir.getFileHandle(sourceName, { create: true });
    const sourceWritable = await sourceHandle.createWritable();
    await sourceWritable.write(source);
    await sourceWritable.close();
  }

  return safeName;
}
