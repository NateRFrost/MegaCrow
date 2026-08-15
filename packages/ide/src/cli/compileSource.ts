import { decodeTextFile } from "../lib/decodeTextFile";
import {
  compileMgloFromMegaloSourceAsync,
  type FileProvider,
} from "../lib/megaloShim";
import type { CliFilesystem } from "./filesystem";

export type CompileOutputFormat = "mglo" | "bin";

export interface CompileFileOptions {
  fileProvider?: FileProvider;
  filesystem: CliFilesystem;
  format?: CompileOutputFormat;
  outputPath?: string;
  sourcePath: string;
}

export interface CompileFileResult {
  bytes: Uint8Array;
  format: CompileOutputFormat;
  outputPath: string;
  sourcePath: string;
}

async function defaultOutputPath(
  sourcePath: string,
  format: CompileOutputFormat,
  fs: CliFilesystem
): Promise<string> {
  const resolved = await fs.resolve(sourcePath);
  const dir = await fs.dirname(resolved);
  const ext = await fs.extname(resolved);
  const base = await fs.basename(resolved, ext);
  const extension = format === "bin" ? ".bin" : ".mglo";
  return fs.resolve(dir, `${base}${extension}`);
}

function inferFormat(outputPath: string): CompileOutputFormat {
  const ext = outputPath.toLowerCase();
  if (ext.endsWith(".bin") || ext.endsWith(".blf")) {
    return "bin";
  }
  return "mglo";
}

function isAbsolutePath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return /^[A-Za-z]:\//.test(normalized) || normalized.startsWith("/");
}

export async function compileMegaloFile(
  options: CompileFileOptions
): Promise<CompileFileResult> {
  const fs = options.filesystem;
  const fileProvider = options.fileProvider ?? fs.fileProvider;
  const sourcePath = await fs.resolve(options.sourcePath);
  const sourceDir = await fs.dirname(sourcePath);
  const source = decodeTextFile(await fs.readBytes(sourcePath));
  const ext = await fs.extname(sourcePath);
  const scriptBasename = await fs.basename(sourcePath, ext);
  const outputPath = await fs.resolve(
    options.outputPath ??
      (await defaultOutputPath(sourcePath, options.format ?? "mglo", fs))
  );
  const format =
    options.format ?? (options.outputPath ? inferFormat(outputPath) : "mglo");
  const outputDir = await fs.dirname(outputPath);

  if (format === "bin") {
    throw new Error("gvar/bin export is not available in this CLI build");
  }

  const resolveFromDir = async (fromUri?: string): Promise<string> => {
    if (!fromUri) {
      return sourceDir;
    }
    return fs.dirname(fromUri);
  };

  const bytes = await compileMgloFromMegaloSourceAsync(
    source,
    scriptBasename,
    undefined,
    {
      fromUri: sourcePath,
      resolveInclude: async (includePath, ctx) => {
        const fromDir = await resolveFromDir(ctx.fromUri);
        const absolute = isAbsolutePath(includePath)
          ? includePath
          : fileProvider.resolvePath(includePath, fromDir);
        const includeBytes = await fileProvider.readBytes(absolute);
        if (!includeBytes) {
          return null;
        }
        return { text: decodeTextFile(includeBytes), uri: absolute };
      },
      resolveBaseFile: async (basePath, ctx) => {
        const fromDir = await resolveFromDir(ctx.fromUri);
        const candidates = [
          fileProvider.resolvePath(basePath, fromDir),
          fileProvider.resolvePath(basePath, sourceDir),
          fileProvider.resolvePath(basePath, outputDir),
          fileProvider.resolvePath(
            `../../../maps/megalo/${basePath.replace(/^.*[\\/]/, "")}`,
            sourceDir
          ),
        ];
        for (const candidate of [...new Set(candidates)]) {
          const baseBytes = await fileProvider.readBytes(candidate);
          if (baseBytes) {
            return baseBytes;
          }
        }
        return null;
      },
    }
  );

  await fs.mkdirRecursive(outputDir);
  await fs.writeBytes(outputPath, bytes);

  return { sourcePath, outputPath, format, bytes };
}
