use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

use crate::steam::steam_app_install_dirs;

const MCC_STEAM_APP_ID: &str = "976730";
const MCC_STORE_PACKAGE_PREFIX: &str = "Microsoft.Halifax_";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MccInstallInfo {
  pub installed: bool,
  pub source: Option<String>,
  pub install_path: Option<String>,
}

#[derive(Debug, Clone)]
enum MccInstall {
  Steam(PathBuf),
  MicrosoftStore { aumid: String, install_path: Option<PathBuf> },
}

fn steam_mcc_install() -> Option<PathBuf> {
  // Prefer the first library that has MCC installed.
  steam_app_install_dirs(MCC_STEAM_APP_ID).into_iter().next()
}

#[cfg(windows)]
fn microsoft_store_mcc_install() -> Option<MccInstall> {
  use winreg::enums::*;
  use winreg::RegKey;

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let packages = hkcu
    .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Appx\\Repository\\Packages")
    .ok()?;

  for package_name in packages.enum_keys().flatten() {
    if !package_name.starts_with(MCC_STORE_PACKAGE_PREFIX) {
      continue;
    }

    let aumid = store_package_aumid(&package_name)?;
    let install_path = store_package_install_path(&package_name);
    return Some(MccInstall::MicrosoftStore {
      aumid,
      install_path,
    });
  }

  None
}

#[cfg(windows)]
fn store_package_aumid(package_name: &str) -> Option<String> {
  use winreg::enums::*;
  use winreg::RegKey;

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let package_key = hkcu
    .open_subkey(format!(
      "Software\\Classes\\ActivatableClasses\\Package\\{package_name}"
    ))
    .ok()?;

  for app_key_name in package_key.enum_keys().flatten() {
    if app_key_name.starts_with(package_name) && app_key_name.contains('!') {
      return Some(app_key_name);
    }
  }

  None
}

#[cfg(windows)]
fn store_package_install_path(package_name: &str) -> Option<PathBuf> {
  use winreg::enums::*;
  use winreg::RegKey;

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let package_key = hkcu
    .open_subkey(format!(
      "Software\\Microsoft\\Windows\\CurrentVersion\\Appx\\Repository\\Packages\\{package_name}"
    ))
    .ok()?;

  let path: String = package_key.get_value("Path").ok()?;
  let path = PathBuf::from(path);
  if path.is_dir() { Some(path) } else { None }
}

#[cfg(not(windows))]
fn microsoft_store_mcc_install() -> Option<MccInstall> {
  None
}

fn detect_install() -> Option<MccInstall> {
  if let Some(path) = steam_mcc_install() {
    return Some(MccInstall::Steam(path));
  }
  microsoft_store_mcc_install()
}

pub fn detect_mcc_install() -> MccInstallInfo {
  let Some(install) = detect_install() else {
    return MccInstallInfo {
      installed: false,
      source: None,
      install_path: None,
    };
  };

  match install {
    MccInstall::Steam(path) => MccInstallInfo {
      installed: true,
      source: Some("steam".into()),
      install_path: Some(path.to_string_lossy().into_owned()),
    },
    MccInstall::MicrosoftStore {
      aumid: _,
      install_path,
    } => MccInstallInfo {
      installed: true,
      source: Some("microsoft_store".into()),
      install_path: install_path.map(|path| path.to_string_lossy().into_owned()),
    },
  }
}

#[cfg(windows)]
fn launch_steam_mcc() -> Result<(), String> {
  let status = Command::new("cmd")
    .args([
      "/C",
      "start",
      "",
      &format!("steam://rungameid/{MCC_STEAM_APP_ID}"),
    ])
    .status()
    .map_err(|error| error.to_string())?;
  if status.success() {
    Ok(())
  } else {
    Err(format!("Failed to launch Halo MCC via Steam (status {status})"))
  }
}

#[cfg(not(windows))]
fn launch_steam_mcc() -> Result<(), String> {
  Err("Steam launch is only supported on Windows".into())
}

#[cfg(windows)]
fn launch_store_mcc(aumid: &str) -> Result<(), String> {
  let arg = format!("shell:AppsFolder\\{aumid}");
  let status = Command::new("explorer.exe")
    .arg(arg)
    .status()
    .map_err(|error| error.to_string())?;
  if status.success() {
    Ok(())
  } else {
    Err(format!(
      "Failed to launch Halo MCC from Microsoft Store (status {status})"
    ))
  }
}

#[cfg(not(windows))]
fn launch_store_mcc(_aumid: &str) -> Result<(), String> {
  Err("Microsoft Store launch is only supported on Windows".into())
}

pub fn launch_mcc() -> Result<(), String> {
  let Some(install) = detect_install() else {
    return Err("Halo: The Master Chief Collection is not installed".into());
  };

  match install {
    MccInstall::Steam(_) => launch_steam_mcc(),
    MccInstall::MicrosoftStore { aumid, .. } => launch_store_mcc(&aumid),
  }
}
