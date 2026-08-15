//! Native clipboard helpers for pasting files into Explorer / Finder / file managers.

use clipboard_rs::{Clipboard, ClipboardContent, ClipboardContext};

fn validate_paths(paths: &[String]) -> Result<(), String> {
  if paths.is_empty() {
    return Err("No file paths to place on the clipboard".to_string());
  }
  for path in paths {
    if !std::path::Path::new(path).exists() {
      return Err(format!("File not found: {path}"));
    }
  }
  Ok(())
}

fn write_files(paths: &[String], text: Option<&str>) -> Result<(), String> {
  validate_paths(paths)?;

  let ctx = ClipboardContext::new().map_err(|error| error.to_string())?;
  let mut contents = vec![ClipboardContent::Files(paths.to_vec())];
  if let Some(text) = text {
    if !text.is_empty() {
      contents.push(ClipboardContent::Text(text.to_string()));
    }
  }
  ctx
    .set(contents)
    .map_err(|error| format!("Failed to set clipboard files: {error}"))
}

#[tauri::command]
pub fn clipboard_write_files(paths: Vec<String>, text: Option<String>) -> Result<(), String> {
  write_files(&paths, text.as_deref())
}
