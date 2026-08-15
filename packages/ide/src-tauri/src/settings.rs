use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub const SETTINGS_VERSION: u32 = 2;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredWorkspace {
  pub id: String,
  pub name: String,
  pub megalo_version: String,
  pub input_path: String,
  pub output_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MegacrowSettings {
  pub version: u32,
  pub active_workspace_id: Option<String>,
  pub workspaces: Vec<StoredWorkspace>,
  pub discord_rich_presence: bool,
  pub mcc_hot_reload: bool,
  pub gamertag: String,
  pub compiler_strictness: bool,
  pub action_inlay_hints: bool,
  #[serde(default = "default_editor_theme")]
  pub editor_theme: String,
}

fn default_editor_theme() -> String {
  "megacrow-dark".to_string()
}

impl Default for MegacrowSettings {
  fn default() -> Self {
    Self {
      version: SETTINGS_VERSION,
      active_workspace_id: None,
      workspaces: Vec::new(),
      discord_rich_presence: true,
      mcc_hot_reload: true,
      gamertag: String::new(),
      compiler_strictness: false,
      action_inlay_hints: true,
      editor_theme: default_editor_theme(),
    }
  }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app
    .path()
    .app_config_dir()
    .map_err(|error| error.to_string())?;
  Ok(dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> Result<Option<MegacrowSettings>, String> {
  let path = settings_path(app)?;
  if !path.is_file() {
    return Ok(None);
  }
  let raw = fs::read_to_string(&path).map_err(|error| error.to_string())?;
  let settings: MegacrowSettings =
    serde_json::from_str(&raw).map_err(|error| error.to_string())?;
  Ok(Some(settings))
}

pub fn save_settings(app: &AppHandle, settings: &MegacrowSettings) -> Result<(), String> {
  let path = settings_path(app)?;
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }
  let raw = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
  fs::write(&path, raw).map_err(|error| error.to_string())
}
