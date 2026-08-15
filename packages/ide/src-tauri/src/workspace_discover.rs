use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

use crate::steam::steam_app_install_dirs;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredWorkspace {
  pub name: String,
  pub megalo_version: String,
  pub input_path: String,
  pub output_path: String,
}

/// Halo: Reach Mod Tools – MCC (HREK).
const HREK_STEAM_APP_ID: &str = "1695793";

const FRIENDLY_NAMES: &[&str] = &[
  "HR MegaloEdit",
  "HR Foundation Tag Editor",
  "HR Tag Play Standalone",
  "HR Tag Test Standalone",
  "HR Sapien Level Editor",
];

/// Exe basenames that live at the HREK install root.
const HREK_TOOL_EXES: &[&str] = &[
  "megaloedit.exe",
  "foundation.exe",
  "sapien.exe",
  "reach_tag_test.exe",
  "reach_tag_play.exe",
];

const MUI_CACHE_HKCU: &str =
  "Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache";
const MUI_CACHE_HKCR: &str = "Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache";

fn strip_mui_path_suffix(raw: &str) -> String {
  let mut path = raw.trim().to_string();
  // Some caches prefix a hash: `123456|C:\...\exe.FriendlyAppName`
  if let Some((_prefix, rest)) = path.split_once('|') {
    if rest.len() >= 2 && rest.as_bytes()[1] == b':' {
      path = rest.to_string();
    }
  }
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

/// Match HREK tools by install path so locale-specific FriendlyAppName still works.
fn path_looks_like_hrek_tool(raw_name: &str) -> bool {
  let path = strip_mui_path_suffix(raw_name);
  let lower = path.replace('/', "\\").to_ascii_lowercase();
  if !(lower.contains("\\hrek\\") || lower.ends_with("\\hrek")) {
    return false;
  }
  HREK_TOOL_EXES
    .iter()
    .any(|exe| lower.ends_with(exe) || lower.contains(&format!("\\{exe}")))
}

fn mui_entry_is_hrek_tool(raw_name: &str, label: &str) -> bool {
  label_matches_hrek_tool(label) || path_looks_like_hrek_tool(raw_name)
}

fn hrek_paths_from_install_root(root: &Path) -> Option<(PathBuf, PathBuf)> {
  let input = root.join("data").join("multiplayer").join("megalo");
  let output = root.join("maps").join("megalo");
  // Scripts tree is required.
  if !input.is_dir() {
    return None;
  }
  // Some editing kits ship without maps/megalo; create it so compile output has a home.
  if !output.is_dir() {
    if let Err(error) = std::fs::create_dir_all(&output) {
      eprintln!(
        "[megacrow] failed to create {}: {error}",
        output.display()
      );
    }
  }
  Some((input, output))
}

/// Read `displayName` from `<HREK>/project.xml` when present.
fn read_project_display_name(root: &Path) -> Option<String> {
  let text = std::fs::read_to_string(root.join("project.xml")).ok()?;
  // Prefer displayName="…"; fall back to name="…" if displayName is absent.
  for attr in ["displayName", "name"] {
    let needle = format!("{attr}=\"");
    if let Some(start) = text.find(&needle) {
      let value_start = start + needle.len();
      if let Some(rel_end) = text[value_start..].find('"') {
        let value = text[value_start..value_start + rel_end].trim();
        if !value.is_empty() {
          return Some(value.to_string());
        }
      }
    }
  }
  None
}

fn workspace_name_for_root(root: &Path, used_names: &mut HashSet<String>) -> String {
  let base = read_project_display_name(root).unwrap_or_else(|| "HREK".to_string());
  let key = base.to_ascii_lowercase();
  if used_names.insert(key.clone()) {
    return base;
  }
  let mut n = 2;
  loop {
    let candidate = format!("{base} ({n})");
    let candidate_key = candidate.to_ascii_lowercase();
    if used_names.insert(candidate_key) {
      return candidate;
    }
    n += 1;
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

fn push_root(roots: &mut Vec<PathBuf>, seen: &mut HashSet<String>, root: PathBuf) {
  let key = normalize_key(&root);
  if seen.insert(key) {
    roots.push(root);
  }
}

#[cfg(windows)]
fn collect_roots_from_mui_key(
  mui: &winreg::RegKey,
  roots: &mut Vec<PathBuf>,
  seen: &mut HashSet<String>,
) {
  use winreg::types::FromRegValue;

  for entry in mui.enum_values().filter_map(Result::ok) {
    let (name, value) = entry;
    let label = String::from_reg_value(&value).unwrap_or_default();
    if !mui_entry_is_hrek_tool(&name, &label) {
      continue;
    }

    let path = PathBuf::from(strip_mui_path_suffix(&name));
    let Some(root) = find_hrek_root(&path) else {
      continue;
    };
    push_root(roots, seen, root);
  }
}

#[cfg(windows)]
fn collect_roots_from_mui_cache(roots: &mut Vec<PathBuf>, seen: &mut HashSet<String>) {
  use winreg::enums::*;
  use winreg::RegKey;

  // Shell writes under HKCU\Software\Classes\... — open that directly.
  // Also try HKCR\Local Settings\... (merged view) for older layouts.
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  if let Ok(mui) = hkcu.open_subkey(MUI_CACHE_HKCU) {
    collect_roots_from_mui_key(&mui, roots, seen);
  }

  let hkcr = RegKey::predef(HKEY_CLASSES_ROOT);
  if let Ok(mui) = hkcr.open_subkey(MUI_CACHE_HKCR) {
    collect_roots_from_mui_key(&mui, roots, seen);
  }
}

#[cfg(windows)]
fn collect_roots_from_steam(roots: &mut Vec<PathBuf>, seen: &mut HashSet<String>) {
  for install in steam_app_install_dirs(HREK_STEAM_APP_ID) {
    let Some(root) = find_hrek_root(&install) else {
      continue;
    };
    push_root(roots, seen, root);
  }
}

fn workspaces_from_roots(roots: Vec<PathBuf>) -> Vec<DiscoveredWorkspace> {
  let mut used_names: HashSet<String> = HashSet::new();
  roots
    .into_iter()
    .filter_map(|root| {
      let (input, output) = hrek_paths_from_install_root(&root)?;
      let name = workspace_name_for_root(&root, &mut used_names);
      Some(DiscoveredWorkspace {
        name,
        megalo_version: "107-mcc".to_string(),
        input_path: input.to_string_lossy().to_string(),
        output_path: output.to_string_lossy().to_string(),
      })
    })
    .collect()
}

#[cfg(windows)]
pub fn discover_hrek_workspaces() -> Vec<DiscoveredWorkspace> {
  let mut roots: Vec<PathBuf> = Vec::new();
  let mut seen: HashSet<String> = HashSet::new();

  collect_roots_from_mui_cache(&mut roots, &mut seen);
  collect_roots_from_steam(&mut roots, &mut seen);

  workspaces_from_roots(roots)
}

#[cfg(not(windows))]
pub fn discover_hrek_workspaces() -> Vec<DiscoveredWorkspace> {
  Vec::new()
}

#[cfg(all(test, windows))]
mod tests {
  use super::*;

  #[test]
  fn discover_finds_hrek_on_dev_machine() {
    let found = discover_hrek_workspaces();
    eprintln!("discovered: {found:#?}");
    assert!(
      !found.is_empty(),
      "expected HREK from MuiCache and/or Steam app 1695793"
    );
    let first = &found[0];
    assert!(
      Path::new(&first.input_path).is_dir(),
      "input_path missing: {}",
      first.input_path
    );
  }

  #[test]
  fn steam_resolves_hrek_install() {
    let installs = crate::steam::steam_app_install_dirs(HREK_STEAM_APP_ID);
    eprintln!("steam installs: {installs:#?}");
    assert!(
      !installs.is_empty(),
      "Steam should report HREK install dir"
    );
  }

  #[test]
  fn path_match_recognizes_megaloedit() {
    assert!(path_looks_like_hrek_tool(
      r"C:\Program Files (x86)\Steam\steamapps\common\HREK\MegaloEdit.exe.FriendlyAppName"
    ));
    assert!(label_matches_hrek_tool("HR MegaloEdit"));
  }

  #[test]
  fn creates_maps_megalo_when_missing() {
    let dir = std::env::temp_dir().join(format!(
      "megacrow_hrek_maps_megalo_{}",
      std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    let scripts = dir
      .join("data")
      .join("multiplayer")
      .join("megalo");
    std::fs::create_dir_all(&scripts).expect("scripts dir");

    let output = dir.join("maps").join("megalo");
    assert!(!output.exists());

    let paths = hrek_paths_from_install_root(&dir).expect("hrek paths");
    assert_eq!(paths.0, scripts);
    assert_eq!(paths.1, output);
    assert!(
      output.is_dir(),
      "expected maps/megalo to be created at {}",
      output.display()
    );

    let _ = std::fs::remove_dir_all(&dir);
  }

  #[test]
  fn reads_display_name_from_project_xml() {
    let dir = std::env::temp_dir().join(format!(
      "megacrow_project_xml_{}",
      std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    std::fs::write(
      dir.join("project.xml"),
      r#"<?xml version="1.0" encoding="utf-8" ?>
<project
	name="Bulgogi"
	displayName="Omaha"
	>
</project>
"#,
    )
    .expect("write project.xml");

    assert_eq!(
      read_project_display_name(&dir).as_deref(),
      Some("Omaha")
    );

    let _ = std::fs::remove_dir_all(&dir);
  }

  #[test]
  fn workspace_names_dedupe_display_names() {
    let mut used = HashSet::new();
    let dir = std::env::temp_dir().join(format!(
      "megacrow_project_xml_dedupe_{}",
      std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).expect("temp dir");
    std::fs::write(
      dir.join("project.xml"),
      r#"<project name="Bulgogi" displayName="Omaha"></project>"#,
    )
    .expect("write project.xml");

    assert_eq!(workspace_name_for_root(&dir, &mut used), "Omaha");
    assert_eq!(workspace_name_for_root(&dir, &mut used), "Omaha (2)");

    let _ = std::fs::remove_dir_all(&dir);
  }
}
