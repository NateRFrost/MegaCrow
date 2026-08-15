import {
  basename,
  dirname,
  extname,
  join,
  normalize,
} from "@tauri-apps/api/path";
import { mkdir, readDir, readFile, writeFile } from "@tauri-apps/plugin-fs";
import { createTauriFileProvider } from "../lib/fileProvider";
import type { CliFilesystem } from "./filesystem";

function _cacheKey(filePath: string): string {
  return filePath.replace(/\//g, "\\");
}

async function listTxtFilesRecursive(
  rootDir: string,
  recursive: boolean
): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readDir(dir);
    for (const entry of entries) {
      const absolutePath = await join(dir, entry.name);
      if (entry.isDirectory) {
        if (recursive) {
          await walk(absolutePath);
        }
        continue;
      }
      if (entry.isFile && entry.name.toLowerCase().endsWith(".txt")) {
        results.push(absolutePath);
      }
    }
  }

  await walk(await normalize(rootDir));
  return results.sort();
}

export function createTauriFilesystem(): CliFilesystem {
  const fileProvider = createTauriFileProvider();
  return {
    fileProvider,
    resolve: async (...paths) => normalize(await join(...paths)),
    dirname: (filePath) => dirname(filePath),
    relative: async (from, to) => {
      const fromParts = (await normalize(from)).split(/[\\/]/);
      const toParts = (await normalize(to)).split(/[\\/]/);
      let index = 0;
      while (
        index < fromParts.length &&
        index < toParts.length &&
        fromParts[index]!.toLowerCase() === toParts[index]!.toLowerCase()
      ) {
        index++;
      }
      const ups = fromParts.slice(index).map(() => "..");
      return [...ups, ...toParts.slice(index)].join("\\");
    },
    basename: (filePath, ext) => basename(filePath, ext),
    extname: (filePath) => extname(filePath),
    readBytes: async (filePath) => readFile(filePath),
    writeBytes: async (filePath, bytes) => {
      await writeFile(filePath, bytes);
    },
    mkdirRecursive: async (dirPath) => {
      await mkdir(dirPath, { recursive: true });
    },
    isDirectory: async (targetPath) => {
      try {
        const parent = await dirname(targetPath);
        const name = await basename(targetPath);
        const entries = await readDir(parent);
        const entry = entries.find((candidate) => candidate.name === name);
        return entry?.isDirectory ?? false;
      } catch {
        return false;
      }
    },
    listTxtFiles: listTxtFilesRecursive,
  };
}
