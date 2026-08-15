import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "./tauriRuntime";

export async function updateDiscordPresence(options: {
  details?: string;
  state?: string;
}): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await invoke("update_discord_presence", {
      details: options.details,
      presence_state: options.state,
    });
  } catch {
    // Discord may be closed or RPC unavailable.
  }
}

export async function setDiscordPresenceEnabled(
  enabled: boolean
): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  try {
    await invoke("set_discord_presence_enabled", { enabled });
  } catch {
    // Discord may be closed or RPC unavailable.
  }
}
