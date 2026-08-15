use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

const COMPILE_DIRECTORY_FLAG: &str = "--compile-directory";
const CLI_FLAG: &str = "--cli";
const COMPILE_FLAG: &str = "--compile";

#[derive(Clone)]
pub struct CliArgs(pub Vec<String>);

#[derive(Clone)]
pub struct CliExitCode(pub Arc<Mutex<Option<i32>>>);

/// Headless mode when any CLI compile flag is present (`--cli` alone also counts for usage).
pub fn is_cli_invocation(args: &[String]) -> bool {
  args.iter().any(|arg| {
    arg == COMPILE_DIRECTORY_FLAG || arg == COMPILE_FLAG || arg == CLI_FLAG
  })
}

#[cfg(windows)]
pub fn attach_parent_console() {
  unsafe {
    windows_sys::Win32::System::Console::AttachConsole(
      windows_sys::Win32::System::Console::ATTACH_PARENT_PROCESS,
    );
  }
}

#[cfg(not(windows))]
pub fn attach_parent_console() {}

#[tauri::command]
pub fn get_cli_args(args: tauri::State<CliArgs>) -> Vec<String> {
  args.0.clone()
}

#[tauri::command]
pub fn cli_log(level: String, line: String) {
  match level.as_str() {
    "error" => eprintln!("{line}"),
    _ => println!("{line}"),
  }
}

#[tauri::command]
pub fn cli_complete(
  code: i32,
  app: AppHandle,
  exit_code: tauri::State<CliExitCode>,
) -> Result<(), String> {
  *exit_code.0.lock().map_err(|error| error.to_string())? = Some(code);
  // Destroy the headless webview before process exit to avoid Chromium's
  // benign "Failed to unregister class Chrome_WidgetWin_0" stderr noise.
  if let Some(window) = app.get_webview_window("cli") {
    let _ = window.destroy();
  }
  app.exit(0);
  Ok(())
}

pub fn create_headless_cli_window(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  WebviewWindowBuilder::new(app, "cli", WebviewUrl::App("cli.html".into()))
    .visible(false)
    .skip_taskbar(true)
    .build()?;
  Ok(())
}
