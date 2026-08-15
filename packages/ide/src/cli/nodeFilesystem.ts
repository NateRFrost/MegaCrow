import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createNodeFileProvider } from "./fileProvider";
import type { CliFilesystem } from "./filesystem";

function listTxtFilesSync(rootDir: string, recursive: boolean): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) {
          walk(absolutePath);
        }
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".txt")) {
        results.push(absolutePath);
      }
    }
  };
  walk(path.resolve(rootDir));
  return results.sort();
}

export function createNodeFilesystem(): CliFilesystem {
  const fileProvider = createNodeFileProvider();
  return {
    fileProvider,
    resolve: (...paths) => Promise.resolve(path.resolve(...paths)),
    dirname: (filePath) => Promise.resolve(path.dirname(filePath)),
    relative: (from, to) => Promise.resolve(path.relative(from, to)),
    basename: (filePath, ext) => Promise.resolve(path.basename(filePath, ext)),
    extname: (filePath) => Promise.resolve(path.extname(filePath)),
    readBytes: async (filePath) => new Uint8Array(readFileSync(filePath)),
    writeBytes: async (filePath, bytes) => {
      writeFileSync(filePath, bytes);
    },
    mkdirRecursive: async (dirPath) => {
      mkdirSync(dirPath, { recursive: true });
    },
    isDirectory: async (targetPath) => statSync(targetPath).isDirectory(),
    listTxtFiles: async (rootDir, recursive) =>
      listTxtFilesSync(rootDir, recursive),
  };
}
