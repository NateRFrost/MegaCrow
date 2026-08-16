use std::path::PathBuf;
use std::process::Command;

/// Run HREK `tool.exe multiplayer-generate-all-string-lists <object_lists_dir>`.
/// Windows-only; fails on other platforms.
#[tauri::command]
pub fn regenerate_object_lists_with_tool(
  editing_kit_root: String,
  object_lists_dir: String,
) -> Result<(), String> {
  #[cfg(not(windows))]
  {
    let _ = (editing_kit_root, object_lists_dir);
    return Err("Regenerating object lists requires Windows.".to_string());
  }

  #[cfg(windows)]
  {
    let root = PathBuf::from(editing_kit_root.trim());
    let lists = PathBuf::from(object_lists_dir.trim());
    let tool = root.join("tool.exe");
    if !tool.is_file() {
      return Err(format!("tool.exe not found at {}", tool.display()));
    }
    if !lists.is_dir() {
      return Err(format!(
        "object_lists folder not found at {}",
        lists.display()
      ));
    }

    let status = Command::new(&tool)
      .arg("multiplayer-generate-all-string-lists")
      .arg(&lists)
      .current_dir(&root)
      .status()
      .map_err(|error| format!("Failed to launch tool.exe: {error}"))?;

    if status.success() {
      Ok(())
    } else {
      Err(format!(
        "tool.exe exited with {}",
        status
          .code()
          .map(|code| format!("code {code}"))
          .unwrap_or_else(|| "a signal".to_string())
      ))
    }
  }
}
