import { readFile } from "@tauri-apps/plugin-fs";
import { decodeTextFile } from "../decodeTextFile";
import {
  isAbsoluteLogicalPath,
  joinLogicalPaths,
  normalizeLogicalPath,
} from "./paths";
import type { FileProvider } from "./types";

export function createTauriFileProvider(): FileProvider {
  return {
    async readText(filePath: string): Promise<string | null> {
      try {
        return decodeTextFile(await readFile(filePath));
      } catch (error) {
        console.warn(`[megacrow] readText failed: ${filePath}`, error);
        return null;
      }
    },
    async readBytes(filePath: string): Promise<Uint8Array | null> {
      try {
        return await readFile(filePath);
      } catch (error) {
        console.warn(`[megacrow] readBytes failed: ${filePath}`, error);
        return null;
      }
    },
    resolvePath(relativePath: string, fromDir: string): string {
      if (isAbsoluteLogicalPath(relativePath)) {
        return normalizeLogicalPath(relativePath).replace(/\//g, "\\");
      }
      const base = fromDir.replace(/[\\/]+$/, "");
      return joinLogicalPaths(base, relativePath).replace(/\//g, "\\");
    },
  };
}
