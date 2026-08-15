use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredWorkspace {
  pub name: String,
  pub megalo_version: String,
  pub input_path: String,
  pub output_path: String,
}

const FRIENDLY_NAMES: &[&str] = &[
  "HR MegaloEdit",
  "HR Foundation Tag Editor",
  "HR Tag Play Standalone",
  "HR Tag Test Standalone",
  "HR Sapien Level Editor",
];
const MUI_CACHE_KEY: &str =
  "Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache";

fn strip_mui_path_suffix(raw: &str) -> String {
  let mut path = raw.trim().to_string();
  for suffix in [
    ".FriendlyAppName",
    ".ApplicationCompany",
    ".ApplicationDescription",
  ] {
    if let Some(stripped) = path.strip_suffix(suffix) {
      path = stripped.to_string();
    }
  }
  path
}

fn label_matches_hrek_tool(label: &str) -> bool {
  FRIENDLY_NAMES.iter().any(|name| label.contains(name))
}

fn hrek_paths_from_install_root(root: &Path) -> Option<(PathBuf, PathBuf)> {
  let input = root.join("data").join("multiplayer").join("megalo");
  let output = root.join("maps").join("megalo");
  if input.is_dir() && output.is_dir() {
    Some((input, output))
  } else {
    None
  }
}

fn find_hrek_root(start: &Path) -> Option<PathBuf> {
  let mut current = if start.is_file() {
    start.parent().map(|p| p.to_path_buf())
  } else if start.exists() {
    Some(start.to_path_buf())
  } else {
    // Path may not exist anymore; still walk parents from the given path.
    start.parent().map(|p| p.to_path_buf())
  };

  while let Some(dir) = current {
    if hrek_paths_from_install_root(&dir).is_some() {
      return Some(dir);
    }
    current = dir.parent().map(|p| p.to_path_buf());
  }
  None
}

fn normalize_key(path: &Path) -> String {
  path
    .to_string_lossy()
    .replace('/', "\\")
    .trim_end_matches('\\')
    .to_ascii_lowercase()
}

#[cfg(windows)]
pub fn discover_hrek_workspaces() -> Vec<DiscoveredWorkspace> {
  use winreg::enums::*;
  use winreg::RegKey;

  let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
  let Ok(mui) = hkcr.open_subkey(MUI_CACHE_KEY) else {
    return Vec::new();
  };

  let mut roots: Vec<PathBuf> = Vec::new();
  let mut seen: HashSet<String> = HashSet::new();

  for name in mui.enum_values().filter_map(|entry| entry.ok().map(|(n, _)| n)) {
    let Ok(label) = mui.get_value::<String, _>(&name) else {
      continue;
    };
    if !label_matches_hrek_tool(&label) {
      continue;
    }

    let path = PathBuf::from(strip_mui_path_suffix(&name));
    let Some(root) = find_hrek_root(&path) else {
      continue;
    };
    let key = normalize_key(&root);
    if !seen.insert(key) {
      continue;
    }
    roots.push(root);
  }

  roots
    .into_iter()
    .enumerate()
    .filter_map(|(index, root)| {
      let (input, output) = hrek_paths_from_install_root(&root)?;
      let name = if index == 0 {
        "HREK".to_string()
      } else {
        format!("HREK ({})", index + 1)
      };
      Some(DiscoveredWorkspace {
        name,
        megalo_version: "107-mcc".to_string(),
        input_path: input.to_string_lossy().to_string(),
        output_path: output.to_string_lossy().to_string(),
      })
    })
    .collect()
}

#[cfg(not(windows))]
pub fn discover_hrek_workspaces() -> Vec<DiscoveredWorkspace> {
  Vec::new()
}
