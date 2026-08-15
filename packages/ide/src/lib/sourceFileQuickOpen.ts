export interface SourceFileQuickOpenEntry {
  /** Secondary text (folder, workspace, etc.). */
  description?: string;
  /** Stable id for the pick (path or opfs name). */
  id: string;
  /** Primary label shown in the picker (searchable). */
  label: string;
  open: () => void | Promise<void>;
}

interface QuickPickItem {
  description?: string;
  entry: SourceFileQuickOpenEntry;
  label: string;
}

interface QuickInputService {
  pick(
    picks: QuickPickItem[],
    options?: {
      matchOnDescription?: boolean;
      placeHolder?: string;
    }
  ): Promise<QuickPickItem | undefined>;
}

let entries: SourceFileQuickOpenEntry[] = [];

/** Replace the catalog of source files available to Go to File. */
export function setSourceFileQuickOpenEntries(
  next: readonly SourceFileQuickOpenEntry[]
): void {
  entries = [...next];
}

export function getSourceFileQuickOpenEntries(): readonly SourceFileQuickOpenEntry[] {
  return entries;
}

/**
 * Open Monaco's quick-pick UI filtered against workspace / OPFS source files.
 * Requires a focused Monaco editor (standalone quick input is editor-scoped).
 */
export async function showSourceFileQuickOpen(editor?: {
  focus(): void;
}): Promise<void> {
  editor?.focus();

  const { StandaloneServices } = await import(
    "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js"
  );
  const { IQuickInputService } = await import(
    "monaco-editor/esm/vs/platform/quickinput/common/quickInput.js"
  );

  StandaloneServices.initialize({});
  const service = StandaloneServices.get(
    IQuickInputService
  ) as QuickInputService;

  if (entries.length === 0) {
    await service.pick(
      [
        {
          label: "No source files in this workspace",
          description: "Open a workspace folder or create a .txt file",
          entry: {
            id: "__empty__",
            label: "",
            open: () => undefined,
          },
        },
      ],
      { placeHolder: "Search source files by name" }
    );
    return;
  }

  const selected = await service.pick(
    entries.map((entry) => ({
      label: entry.label,
      description: entry.description,
      entry,
    })),
    {
      placeHolder: "Search source files by name",
      matchOnDescription: true,
    }
  );

  if (selected?.entry && selected.entry.id !== "__empty__") {
    await selected.entry.open();
  }
}

/** Flatten a LocalDisk-style tree into file nodes only. */
export function flattenSourceFileNodes<
  T extends { children?: T[]; type: "directory" | "file" },
>(nodes: readonly T[]): T[] {
  const files: T[] = [];
  const walk = (list: readonly T[]) => {
    for (const node of list) {
      if (node.type === "file") {
        files.push(node);
      }
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return files;
}
