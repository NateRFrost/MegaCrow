//! Shared Steam library helpers (registry path + libraryfolders.vdf).

use std::path::{Path, PathBuf};

#[cfg(windows)]
pub fn read_steam_path() -> Option<PathBuf> {
  use winreg::enums::*;
  use winreg::RegKey;

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let steam = hkcu.open_subkey("Software\\Valve\\Steam").ok()?;
  let path: String = steam.get_value("SteamPath").ok()?;
  let path = PathBuf::from(path);
  if path.is_dir() {
    Some(path)
  } else {
    None
  }
}

#[cfg(not(windows))]
pub fn read_steam_path() -> Option<PathBuf> {
  None
}

pub fn parse_vdf_quoted_value(content: &str, key: &str) -> Option<String> {
  let pattern = format!("\"{key}\"");
  let start = content.find(&pattern)?;
  let after_key = &content[start + pattern.len()..];
  let quote_start = after_key.find('"')? + 1;
  let after_open = &after_key[quote_start..];
  let quote_end = after_open.find('"')?;
  Some(after_open[..quote_end].replace("\\\\", "\\"))
}

pub fn steam_library_roots(steam_path: &Path) -> Vec<PathBuf> {
  let mut roots = vec![steam_path.to_path_buf()];
  let vdf_path = steam_path.join("steamapps").join("libraryfolders.vdf");
  let Ok(content) = std::fs::read_to_string(&vdf_path) else {
    return roots;
  };

  let mut search_from = 0;
  while let Some(rel) = content[search_from..].find("\"path\"") {
    let offset = search_from + rel;
    if let Some(path) = parse_vdf_quoted_value(&content[offset..], "path") {
      let path = PathBuf::from(path);
      if path.is_dir() && !roots.iter().any(|existing| existing == &path) {
        roots.push(path);
      }
    }
    search_from = offset + 6;
  }

  roots
}

/// All Steam install roots for `app_id` across library folders.
pub fn steam_app_install_dirs(app_id: &str) -> Vec<PathBuf> {
  let Some(steam_path) = read_steam_path() else {
    return Vec::new();
  };

  let mut installs = Vec::new();
  let mut seen = std::collections::HashSet::new();

  for library_root in steam_library_roots(&steam_path) {
    let manifest = library_root
      .join("steamapps")
      .join(format!("appmanifest_{app_id}.acf"));
    if !manifest.is_file() {
      continue;
    }
    let Ok(content) = std::fs::read_to_string(&manifest) else {
      continue;
    };
    let Some(installdir) = parse_vdf_quoted_value(&content, "installdir") else {
      continue;
    };
    let install_path = library_root
      .join("steamapps")
      .join("common")
      .join(installdir);
    let key = install_path
      .to_string_lossy()
      .replace('/', "\\")
      .trim_end_matches('\\')
      .to_ascii_lowercase();
    if seen.insert(key) {
      installs.push(install_path);
    }
  }

  installs
}
