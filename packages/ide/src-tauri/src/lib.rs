use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

mod cli;
mod clipboard_files;
mod discord_rpc;
mod mcc_install;
mod mcc_patches;
mod settings;
mod steam;
mod workspace_discover;

use cli::{CliArgs, CliExitCode, create_headless_cli_window, is_cli_invocation};
use discord_rpc::DiscordRpc;
use mcc_install::MccInstallInfo;
use settings::MegacrowSettings;
use tauri::{AppHandle, RunEvent, WebviewUrl, WebviewWindowBuilder};
use workspace_discover::DiscoveredWorkspace;

#[tauri::command]
fn update_discord_presence(
  discord: tauri::State<DiscordRpc>,
  details: Option<String>,
  presence_state: Option<String>,
) -> Result<(), String> {
  discord.update(details, presence_state);
  Ok(())
}

#[tauri::command]
fn set_discord_presence_enabled(
  discord: tauri::State<DiscordRpc>,
  enabled: bool,
) -> Result<(), String> {
  discord.set_enabled(enabled);
  Ok(())
}

#[tauri::command]
fn write_mcc_hot_reload_mglo(data: Vec<u8>) -> Result<String, String> {
  let path = mcc_hot_reload_mglo_path();
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }
  fs::write(&path, data).map_err(|error| error.to_string())?;

  // Best-effort Reach convenience patches (instant end / no fade) when MCC is running.
  let patch_note = match mcc_patches::apply_hot_reload_patches() {
    Ok(0) => "MCC patches skipped (game not running or Reach not loaded)".to_string(),
    Ok(count) => format!("applied {count} MCC patches"),
    Err(error) => {
      log::warn!("MCC hot-reload patches: {error}");
      format!("MCC patches failed: {error}")
    }
  };

  let resolved = fs::canonicalize(&path).unwrap_or(path);
  Ok(format!(
    "{} ({patch_note})",
    resolved.to_string_lossy()
  ))
}

fn mcc_hot_reload_mglo_path() -> PathBuf {
  if let Ok(profile) = std::env::var("USERPROFILE") {
    return PathBuf::from(profile)
      .join("AppData")
      .join("LocalLow")
      .join("MCC")
      .join("Temporary")
      .join("HaloReach")
      .join("HotReload")
      .join(".mglo");
  }

  PathBuf::from(".")
    .join("LocalLow")
    .join("MCC")
    .join("Temporary")
    .join("HaloReach")
    .join("HotReload")
    .join(".mglo")
}

#[tauri::command]
fn detect_mcc_install() -> MccInstallInfo {
  mcc_install::detect_mcc_install()
}

#[tauri::command]
fn launch_mcc() -> Result<(), String> {
  mcc_install::launch_mcc()
}

#[tauri::command]
fn load_megacrow_settings(app: AppHandle) -> Result<Option<MegacrowSettings>, String> {
  settings::load_settings(&app)
}

#[tauri::command]
fn save_megacrow_settings(app: AppHandle, settings: MegacrowSettings) -> Result<(), String> {
  settings::save_settings(&app, &settings)
}

#[tauri::command]
fn get_system_username() -> String {
  std::env::var("USERNAME")
    .or_else(|_| std::env::var("USER"))
    .unwrap_or_else(|_| "unknown".to_string())
}

#[tauri::command]
fn discover_hrek_workspaces() -> Vec<DiscoveredWorkspace> {
  workspace_discover::discover_hrek_workspaces()
}

fn create_main_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
    .title("MegaCrow")
    .inner_size(1440.0, 900.0)
    .min_inner_size(960.0, 600.0)
    .resizable(true)
    .fullscreen(false)
    .decorations(false)
    .shadow(true)
    .build()?;
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let args: Vec<String> = std::env::args().skip(1).collect();
  let cli_mode = is_cli_invocation(&args);

  if cli_mode {
    cli::attach_parent_console();
    // Quiet Chromium/WebView2 logging for the headless CLI window.
    std::env::set_var(
      "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
      "--disable-logging --log-level=3",
    );
  }

  let exit_code = Arc::new(Mutex::new(None));
  let cli_exit = CliExitCode(exit_code.clone());

  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .manage(DiscordRpc::new())
    .manage(CliArgs(args))
    .manage(cli_exit)
    .invoke_handler(tauri::generate_handler![
      write_mcc_hot_reload_mglo,
      update_discord_presence,
      set_discord_presence_enabled,
      detect_mcc_install,
      launch_mcc,
      load_megacrow_settings,
      save_megacrow_settings,
      discover_hrek_workspaces,
      get_system_username,
      clipboard_files::clipboard_write_files,
      cli::get_cli_args,
      cli::cli_log,
      cli::cli_complete
    ])
    .setup(move |app| {
      if cli_mode {
        create_headless_cli_window(app)?;
      } else {
        create_main_window(app)?;
        if cfg!(debug_assertions) {
          app.handle().plugin(
            tauri_plugin_log::Builder::default()
              .level(log::LevelFilter::Info)
              .build(),
          )?;
        }
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building MegaCrow")
    .run(|_app_handle, event| {
      if let RunEvent::Exit = event {
        // CLI exit code is read after the run loop returns.
      }
    });

  if cli_mode {
    let code = exit_code.lock().ok().and_then(|value| *value).unwrap_or(1);
    std::process::exit(code);
  }
}
