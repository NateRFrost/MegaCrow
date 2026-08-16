import { invoke } from "@tauri-apps/api/core";

/** Run HREK tool.exe to regenerate object list string files. */
export async function regenerateObjectListsWithTool(
  editingKitRoot: string,
  objectListsDir: string
): Promise<void> {
  await invoke("regenerate_object_lists_with_tool", {
    editingKitRoot,
    objectListsDir,
  });
}
