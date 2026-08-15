import { decodeTextFile } from "../decodeTextFile";
import type { FileProvider } from "../megaloShim";
import { readOpfsWorkspaceBytes } from "../opfsStorage";
import {
  isAbsoluteLogicalPath,
  joinLogicalPaths,
  normalizeLogicalPath,
} from "./paths";

/** OPFS-backed FileProvider for browser workspace paths (`workspace/input`, etc.). */
export function createOpfsFileProvider(): FileProvider {
  return {
    async readText(path: string): Promise<string | null> {
      const bytes = await readOpfsWorkspaceBytes(path);
      return bytes ? decodeTextFile(bytes) : null;
    },
    async readBytes(path: string): Promise<Uint8Array | null> {
      return readOpfsWorkspaceBytes(path);
    },
    resolvePath(relativePath: string, fromDir: string): string {
      if (isAbsoluteLogicalPath(relativePath)) {
        return normalizeLogicalPath(relativePath);
      }
      return joinLogicalPaths(fromDir, relativePath);
    },
  };
}
