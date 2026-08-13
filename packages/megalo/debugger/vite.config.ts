import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, defineConfig, type Plugin } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const analyzeWorkerEntry = path.resolve(root, "src/analyze.worker.ts");

/**
 * @blamnetwork/blf ships ESM with bare directory re-exports
 * (`export * from "../../blam/common"`). Vite's dev server tries to read the
 * directory as a file and fails with EISDIR; resolve those to index.js.
 *
 * With `file:` / junction installs, Vite realpaths importers into the linked
 * package tree (e.g. `.../blf/blf-ts/dist/...`), so matching only
 * `node_modules/@blamnetwork/blf` is not enough.
 */
const resolveBlfPackageRoots = (): string[] => {
  const candidates = [
    path.resolve(root, "../node_modules/@blamnetwork/blf"),
    path.resolve(root, "../../node_modules/@blamnetwork/blf"),
    path.resolve(root, "../../../node_modules/@blamnetwork/blf"),
  ];
  const roots: string[] = [];
  for (const candidate of candidates) {
    try {
      roots.push(fs.realpathSync(candidate).replace(/\\/g, "/"));
    } catch {
      // optional install location
    }
  }
  return roots;
};

const blfPackageRoots = resolveBlfPackageRoots();

const stripViteId = (id: string): string =>
  id.replace(/\\/g, "/").split("?")[0]!.split("#")[0]!;

const isBlfImporter = (importer: string): boolean => {
  const importerPath = stripViteId(importer);
  if (
    importerPath.includes("/node_modules/@blamnetwork/blf/") ||
    importerPath.includes("/@blamnetwork/blf/")
  ) {
    return true;
  }
  let realImporter = importerPath;
  try {
    realImporter = fs.realpathSync(importerPath).replace(/\\/g, "/");
  } catch {
    // keep logical path
  }
  return blfPackageRoots.some(
    (rootPath) =>
      realImporter === rootPath || realImporter.startsWith(`${rootPath}/`)
  );
};

const resolveDirectoryIndex = (candidate: string): string | null => {
  const resolved = stripViteId(candidate);
  try {
    if (!fs.statSync(resolved).isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }
  const indexJs = path.join(resolved, "index.js");
  return fs.existsSync(indexJs) ? indexJs : null;
};

const blfDirectoryIndexPlugin = (): Plugin => ({
  name: "blf-directory-index",
  enforce: "pre",
  resolveId(source, importer) {
    // Absolute / rooted ids that already point at a blf directory.
    if (!source.startsWith(".")) {
      if (isBlfImporter(source)) {
        return resolveDirectoryIndex(source);
      }
      return null;
    }
    if (!importer || !isBlfImporter(importer)) {
      return null;
    }
    return resolveDirectoryIndex(
      path.resolve(path.dirname(stripViteId(importer)), source)
    );
  },
  load(id) {
    const indexJs = resolveDirectoryIndex(id);
    if (indexJs === null) {
      return null;
    }
    // Dev middleware may still ask to load the directory path; serve index.js.
    return fs.readFileSync(indexJs, "utf8");
  },
});

/**
 * Dev module workers fan out to every imported file (100+ action lowerers).
 * That races with Monaco and trips Worker.onerror / hangs on cold load.
 * Serve a single bundled worker script instead.
 */
const bundleAnalyzeWorkerDevPlugin = (): Plugin => {
  let cached: string | null = null;
  let building: Promise<string> | null = null;

  const rebuild = (): Promise<string> => {
    if (building) {
      return building;
    }
    building = (async () => {
      const started = Date.now();
      const result = await build({
        configFile: false,
        root,
        logLevel: "error",
        plugins: [blfDirectoryIndexPlugin()],
        build: {
          write: false,
          emptyOutDir: false,
          sourcemap: false,
          minify: false,
          target: "es2022",
          lib: {
            entry: analyzeWorkerEntry,
            formats: ["es"],
            fileName: "analyze.worker",
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
      });
      const outputs = Array.isArray(result) ? result : [result];
      const first = outputs[0];
      if (!first || !("output" in first)) {
        throw new Error("analyze worker bundle produced no output");
      }
      const entry = first.output.find(
        (item) => item.type === "chunk" && item.isEntry
      );
      if (!entry || entry.type !== "chunk") {
        throw new Error("analyze worker bundle missing entry chunk");
      }
      cached = entry.code;
      console.log(
        `[megalo-debugger] bundled analyze worker in ${Date.now() - started}ms`
      );
      return cached;
    })().finally(() => {
      building = null;
    });
    return building;
  };

  const invalidate = (file: string): void => {
    const normalized = file.replace(/\\/g, "/");
    if (
      normalized.includes("/frontend/") ||
      normalized.includes("/debugger/src/") ||
      normalized.endsWith("/version.ts")
    ) {
      cached = null;
    }
  };

  return {
    name: "bundle-analyze-worker-dev",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      server.watcher.add(path.resolve(root, "../src/frontend"));
      server.watcher.on("change", invalidate);
      server.watcher.on("add", invalidate);
      server.watcher.on("unlink", invalidate);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (
          !url.includes("analyze.worker.ts") ||
          !url.includes("worker_file")
        ) {
          next();
          return;
        }
        try {
          const code = cached ?? (await rebuild());
          res.setHeader("Content-Type", "text/javascript; charset=utf-8");
          res.end(code);
        } catch (error) {
          console.error(
            "[megalo-debugger] failed to bundle analyze worker",
            error
          );
          next(error);
        }
      });
    },
  };
};

export default defineConfig({
  root,
  appType: "mpa",
  server: {
    port: 5175,
    strictPort: true,
    fs: {
      // Linked `file:../../../blf/blf-ts` resolves outside the MegaCrow tree.
      allow: [path.resolve(root, "../../.."), ...blfPackageRoots],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, "index.html"),
        inspector: path.resolve(root, "inspector.html"),
      },
    },
  },
  // Worker bundles do not inherit `plugins` — register the blf fix here too.
  worker: {
    plugins: () => [blfDirectoryIndexPlugin()],
  },
  plugins: [
    blfDirectoryIndexPlugin(),
    bundleAnalyzeWorkerDevPlugin(),
    {
      name: "megalo-debugger-routes",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/inspector" || req.url === "/inspector/") {
            req.url = "/inspector.html";
          }
          next();
        });
      },
    },
  ],
});
