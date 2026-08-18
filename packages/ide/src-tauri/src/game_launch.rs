use std::path::Path;
use std::process::Command;

/// Split a launch command the way a shell does for quoted paths.
/// Quotes group arguments and are not included in the result.
pub fn split_command_line(command: &str) -> Result<Vec<String>, String> {
  let mut args = Vec::new();
  let mut current = String::new();
  let mut in_quotes = false;
  let mut chars = command.trim().chars().peekable();

  while let Some(ch) = chars.next() {
    match ch {
      '"' => {
        in_quotes = !in_quotes;
      }
      ch if ch.is_whitespace() && !in_quotes => {
        if !current.is_empty() {
          args.push(std::mem::take(&mut current));
        }
      }
      _ => current.push(ch),
    }
  }

  if in_quotes {
    return Err("Unclosed quote in game launch command".into());
  }
  if !current.is_empty() {
    args.push(current);
  }
  if args.is_empty() {
    return Err("Game launch command is empty".into());
  }
  Ok(args)
}

pub fn launch_game_command(command: String) -> Result<(), String> {
  let mut parts = split_command_line(&command)?;
  let program = parts.remove(0);
  let args = parts;

  let mut child = Command::new(&program);
  child.args(&args);

  if let Some(parent) = Path::new(&program).parent() {
    if !parent.as_os_str().is_empty() {
      child.current_dir(parent);
    }
  }

  child.spawn().map_err(|error| {
    format!("Failed to launch \"{program}\": {error}")
  })?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn rejects_empty_command() {
    assert!(split_command_line("   ").is_err());
    assert!(launch_game_command("   ".into()).is_err());
  }

  #[test]
  fn splits_quoted_path_with_spaces() {
    let parts = split_command_line(
      r#"D:\Games\x360\xenia_canary_windows\xenia_canary.exe "D:\Games\x360\Halo Reach (Multiplayer Beta, Apr 9 2010)\defaultfull.xex""#,
    )
    .unwrap();
    assert_eq!(
      parts,
      [
        r"D:\Games\x360\xenia_canary_windows\xenia_canary.exe",
        r"D:\Games\x360\Halo Reach (Multiplayer Beta, Apr 9 2010)\defaultfull.xex",
      ]
    );
  }

  #[test]
  fn splits_unquoted_simple_args() {
    let parts = split_command_line("xenia.exe halo3/default.xex").unwrap();
    assert_eq!(parts, ["xenia.exe", "halo3/default.xex"]);
  }

  #[test]
  fn rejects_unclosed_quote() {
    assert!(split_command_line(r#"xenia.exe "unclosed"#).is_err());
  }
}
