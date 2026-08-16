import type { MegaloVersionId } from "@megacrow/megalo";
import {
  browserOpfsStoredWorkspace,
  isBrowserWorkspaceAvailable,
  type StoredWorkspace,
} from "./megacrowSettings";
import { isTauriRuntime } from "./tauriRuntime";

export type WorkspaceType = "opfs" | "tauri";

export interface Workspace {
  id: string;
  inputPath: string;
  megaloVersion: MegaloVersionId;
  name: string;
  /** Compiled `.mglo` output folder, or `null` when Build is disabled. */
  outputPath: string | null;
  type: WorkspaceType;
}

let activeWorkspaceStore: Workspace | null = null;

export function setActiveWorkspace(workspace: Workspace | null): void {
  activeWorkspaceStore = workspace;
}

/** Active workspace for this session (module store; set by App on bootstrap/switch). */
export function getActiveWorkspace(): Workspace | null {
  if (activeWorkspaceStore) {
    return activeWorkspaceStore;
  }
  if (!isTauriRuntime() && isBrowserWorkspaceAvailable()) {
    return storedToWorkspace(browserOpfsStoredWorkspace(), "opfs");
  }
  return null;
}

export function storedToWorkspace(
  stored: StoredWorkspace,
  type: WorkspaceType = "tauri"
): Workspace {
  return {
    id: stored.id,
    type,
    name: stored.name,
    megaloVersion: stored.megaloVersion,
    inputPath: stored.inputPath,
    outputPath: stored.outputPath,
  };
}

export function resolveActiveWorkspace(
  workspaces: StoredWorkspace[],
  activeWorkspaceId: string | null
): Workspace | null {
  if (isTauriRuntime()) {
    const match =
      (activeWorkspaceId
        ? workspaces.find((workspace) => workspace.id === activeWorkspaceId)
        : null) ?? workspaces[0];
    return match ? storedToWorkspace(match, "tauri") : null;
  }
  if (isBrowserWorkspaceAvailable()) {
    return storedToWorkspace(browserOpfsStoredWorkspace(), "opfs");
  }
  return null;
}

export interface WorkspaceContext {
  inputPath: string;
  megaloVersion: MegaloVersionId;
  outputPath: string | null;
  type: WorkspaceType;
}

export function workspaceContext(workspace: Workspace): WorkspaceContext {
  return {
    type: workspace.type,
    megaloVersion: workspace.megaloVersion,
    inputPath: workspace.inputPath,
    outputPath: workspace.outputPath,
  };
}
