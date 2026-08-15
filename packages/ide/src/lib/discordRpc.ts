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

/** Discord display name from IPC READY; null on web or when Discord is unavailable. */
export async function getDiscordUsername(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    const username = await invoke<string | null>("get_discord_username");
    const trimmed = username?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}
