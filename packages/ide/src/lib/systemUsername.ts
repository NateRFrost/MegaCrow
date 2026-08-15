import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "./tauriRuntime";

export async function getSystemUsername(): Promise<string> {
  if (isTauriRuntime()) {
    try {
      const username = await invoke<string>("get_system_username");
      if (username.trim()) {
        return username.trim();
      }
    } catch {
      // Fall through.
    }
  }
  return "web";
}
