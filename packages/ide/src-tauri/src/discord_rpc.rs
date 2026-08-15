use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Discord application ID for MegaCrow rich presence.
pub const APPLICATION_ID: &str = "1517107797437841589";

/// Discord application public key (Social SDK / verification; not used by IPC rich presence).
pub const APPLICATION_PUBLIC_KEY: &str =
  "dbd9c94e21cfce0755547a50f46e5d984eae2e8d56dd9817977b76a10dd5fe02";

#[derive(Clone)]
struct RpcPresence {
  details: String,
  state: String,
  enabled: bool,
}

impl Default for RpcPresence {
  fn default() -> Self {
    Self {
      details: "MegaCrow".into(),
      state: "Editing Halo Reach gametypes".into(),
      enabled: true,
    }
  }
}

pub struct DiscordRpc {
  state: Arc<Mutex<RpcPresence>>,
}

impl DiscordRpc {
  pub fn new() -> Self {
    let state = Arc::new(Mutex::new(RpcPresence::default()));
    let thread_state = Arc::clone(&state);
    thread::spawn(move || run_discord_loop(thread_state));
    Self { state }
  }

  pub fn update(&self, details: Option<String>, presence_state: Option<String>) {
    let Ok(mut guard) = self.state.lock() else {
      return;
    };
    if let Some(details) = details {
      guard.details = details;
    }
    if let Some(presence_state) = presence_state {
      guard.state = presence_state;
    }
  }

  pub fn set_enabled(&self, enabled: bool) {
    let Ok(mut guard) = self.state.lock() else {
      return;
    };
    guard.enabled = enabled;
  }
}

fn run_discord_loop(state: Arc<Mutex<RpcPresence>>) {
  loop {
    let mut client = DiscordIpcClient::new(APPLICATION_ID);

    if let Err(error) = client.connect() {
      log::debug!("Discord RPC: waiting for Discord ({error})");
      thread::sleep(Duration::from_secs(30));
      continue;
    }

    log::info!("Discord RPC connected");

    loop {
      let snapshot = state
        .lock()
        .map(|guard| guard.clone())
        .unwrap_or_default();

      if !snapshot.enabled {
        let _ = client.clear_activity();
        thread::sleep(Duration::from_secs(15));
        continue;
      }

      let payload = activity::Activity::new()
        .details(&snapshot.details)
        .state(&snapshot.state);

      if let Err(error) = client.set_activity(payload) {
        log::debug!("Discord RPC: reconnecting ({error})");
        break;
      }

      thread::sleep(Duration::from_secs(15));
    }
  }
}
