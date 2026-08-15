//! MCC Reach process patches used during hot-reload testing.
//! Ports UniversalGametypeEditor `Patches.cs` (`ApplyPatches` / `WriteBytes`).
//! https://github.com/Sopitive/UniversalGametypeEditor/blob/980fe330a07e0a4ee51cf093148bf9ca226b2eae/UniversalGametypeEditor/Patches.cs

#[cfg(windows)]
mod windows_impl {
  use std::ffi::OsString;
  use std::os::windows::ffi::OsStringExt;
  use std::sync::Once;

  use windows_sys::Win32::Foundation::{
    CloseHandle, GetLastError, SetLastError, FALSE, HANDLE, INVALID_HANDLE_VALUE, LUID,
  };
  use windows_sys::Win32::Security::{
    AdjustTokenPrivileges, LookupPrivilegeValueA, LUID_AND_ATTRIBUTES,
    SE_PRIVILEGE_ENABLED, TOKEN_ADJUST_PRIVILEGES, TOKEN_PRIVILEGES, TOKEN_QUERY,
  };
  use windows_sys::Win32::System::Diagnostics::Debug::WriteProcessMemory;
  use windows_sys::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
    TH32CS_SNAPPROCESS,
  };
  use windows_sys::Win32::System::ProcessStatus::{
    K32EnumProcessModules, K32GetModuleBaseNameW,
  };
  use windows_sys::Win32::System::Threading::{
    GetCurrentProcess, OpenProcess, OpenProcessToken, PROCESS_QUERY_INFORMATION,
    PROCESS_VM_READ,
  };

  const PROCESS_NAME: &str = "mcc-win64-shipping";
  const MODULE_NAME: &str = "haloreach.dll";

  /// Same constant UGE uses (`Patches.cs`).
  const PROCESS_ALL_ACCESS_UGE: u32 = 0x1F0FFF;

  /// Rights .NET uses when reading `Process.Modules`.
  const PROCESS_MODULE_ACCESS: u32 = PROCESS_QUERY_INFORMATION | PROCESS_VM_READ;

  /// Instant game end / no-fade stubs — UGE `ApplyPatches`.
  const PATCHES: &[(&str, &[u8])] = &[
    ("haloreach.dll+44FD1B", &[0x90, 0x90]),
    ("haloreach.dll+2509B8", &[0xC3, 0x00]),
    ("haloreach.dll+34E6C", &[0xC3, 0x90]),
  ];

  static ENABLE_DEBUG_PRIVILEGE: Once = Once::new();

  fn last_error(prefix: &str) -> String {
    format!("{prefix} (Win32 error {})", unsafe { GetLastError() })
  }

  fn wide_eq_ignore_ascii_case(wide: &[u16], ascii: &str) -> bool {
    let end = wide.iter().position(|&c| c == 0).unwrap_or(wide.len());
    let name = OsString::from_wide(&wide[..end]);
    name.to_string_lossy().eq_ignore_ascii_case(ascii)
  }

  /// Best-effort. UGE often doesn't need this, but MegaCrow may when launched from an
  /// elevated IDE / restricted token where `Process.Modules` would otherwise work.
  fn enable_debug_privilege() {
    ENABLE_DEBUG_PRIVILEGE.call_once(|| unsafe {
      let mut token: HANDLE = std::ptr::null_mut();
      if OpenProcessToken(
        GetCurrentProcess(),
        TOKEN_ADJUST_PRIVILEGES | TOKEN_QUERY,
        &mut token,
      ) == FALSE
      {
        return;
      }

      let mut luid = LUID {
        LowPart: 0,
        HighPart: 0,
      };
      if LookupPrivilegeValueA(
        std::ptr::null(),
        c"SeDebugPrivilege".as_ptr() as *const u8,
        &mut luid,
      ) == FALSE
      {
        CloseHandle(token);
        return;
      }

      let privileges = TOKEN_PRIVILEGES {
        PrivilegeCount: 1,
        Privileges: [LUID_AND_ATTRIBUTES {
          Luid: luid,
          Attributes: SE_PRIVILEGE_ENABLED,
        }],
      };
      let _ = AdjustTokenPrivileges(
        token,
        FALSE,
        &privileges,
        0,
        std::ptr::null_mut(),
        std::ptr::null_mut(),
      );
      SetLastError(0);
      CloseHandle(token);
    });
  }

  fn find_process_id(process_name: &str) -> Option<u32> {
    unsafe {
      let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
      if snapshot == INVALID_HANDLE_VALUE {
        return None;
      }

      let mut entry = PROCESSENTRY32W {
        dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
        ..std::mem::zeroed()
      };

      let mut found = None;
      if Process32FirstW(snapshot, &mut entry) != FALSE {
        loop {
          if wide_eq_ignore_ascii_case(&entry.szExeFile, process_name)
            || wide_eq_ignore_ascii_case(&entry.szExeFile, &format!("{process_name}.exe"))
          {
            found = Some(entry.th32ProcessID);
            break;
          }
          if Process32NextW(snapshot, &mut entry) == FALSE {
            break;
          }
        }
      }

      CloseHandle(snapshot);
      found
    }
  }

  /// Equivalent of UGE / .NET `process.Modules` → module base.
  fn find_module_base(process_id: u32, module_name: &str) -> Result<usize, String> {
    enable_debug_privilege();
    unsafe {
      SetLastError(0);
      let process = OpenProcess(PROCESS_MODULE_ACCESS, FALSE, process_id);
      if process.is_null() {
        return Err(last_error(
          "Failed to open MCC for module enumeration (Process.Modules equivalent)",
        ));
      }

      let result = find_module_base_with_handle(process, module_name);
      CloseHandle(process);
      result
    }
  }

  fn find_module_base_with_handle(process: HANDLE, module_name: &str) -> Result<usize, String> {
    unsafe {
      let mut needed = 0u32;
      SetLastError(0);
      // Same pattern as .NET: size query, then real call.
      let _ = K32EnumProcessModules(process, std::ptr::null_mut(), 0, &mut needed);
      if needed == 0 {
        return Err(last_error("EnumProcessModules failed (no modules / access denied)"));
      }

      let count = (needed as usize).div_ceil(std::mem::size_of::<HANDLE>());
      let mut modules = vec![std::ptr::null_mut(); count];
      let bytes = (modules.len() * std::mem::size_of::<HANDLE>()) as u32;
      let mut needed2 = 0u32;
      SetLastError(0);
      if K32EnumProcessModules(process, modules.as_mut_ptr(), bytes, &mut needed2) == FALSE {
        return Err(last_error("EnumProcessModules failed"));
      }

      let mut name = [0u16; 260];
      for module in modules {
        if module.is_null() {
          continue;
        }
        let len = K32GetModuleBaseNameW(process, module, name.as_mut_ptr(), name.len() as u32);
        if len == 0 {
          continue;
        }
        if wide_eq_ignore_ascii_case(&name[..len as usize], module_name) {
          return Ok(module as usize);
        }
      }

      Err(format!(
        "Module '{module_name}' not found in process '{PROCESS_NAME}' (is Halo: Reach running?)."
      ))
    }
  }

  fn parse_module_offset(module_and_offset: &str) -> Result<(&str, usize), String> {
    let (module, offset_hex) = module_and_offset.split_once('+').ok_or_else(|| {
      format!(
        "Invalid module+offset format '{module_and_offset}'. Expected 'moduleName+offset'."
      )
    })?;
    let offset = usize::from_str_radix(offset_hex.trim(), 16).map_err(|_| {
      format!("Invalid offset '{offset_hex}'. Offset must be hexadecimal.")
    })?;
    Ok((module.trim(), offset))
  }

  /// UGE `WriteBytes`.
  fn write_bytes(module_and_offset: &str, bytes: &[u8]) -> Result<(), String> {
    let (module_name, offset) = parse_module_offset(module_and_offset)?;
    if !module_name.eq_ignore_ascii_case(MODULE_NAME) {
      return Err(format!(
        "Unexpected module '{module_name}'. Expected '{MODULE_NAME}'."
      ));
    }

    let process_id = find_process_id(PROCESS_NAME)
      .ok_or_else(|| format!("Process '{PROCESS_NAME}' not found."))?;

    // Phase 1 (UGE `process.Modules`): resolve module base with query/read rights.
    let module_base = find_module_base(process_id, MODULE_NAME)?;

    // Phase 2 (UGE `OpenProcess(PROCESS_ALL_ACCESS)` + `WriteProcessMemory`).
    enable_debug_privilege();
    let process = unsafe { OpenProcess(PROCESS_ALL_ACCESS_UGE, FALSE, process_id) };
    if process.is_null() {
      return Err(last_error("Failed to open process"));
    }

    let target = (module_base + offset) as *const std::ffi::c_void;
    let mut written = 0usize;
    let ok = unsafe {
      SetLastError(0);
      WriteProcessMemory(
        process,
        target,
        bytes.as_ptr() as *const _,
        bytes.len(),
        &mut written,
      )
    };
    unsafe {
      CloseHandle(process);
    }

    if ok == FALSE || written != bytes.len() {
      return Err(last_error(&format!(
        "Failed to write bytes to process memory at {module_and_offset}"
      )));
    }

    Ok(())
  }

  pub fn apply_patches() -> Result<usize, String> {
    // Resolve module once (UGE re-resolves per WriteBytes; we cache for clearer errors).
    let process_id = find_process_id(PROCESS_NAME)
      .ok_or_else(|| format!("Process '{PROCESS_NAME}' not found."))?;
    let module_base = find_module_base(process_id, MODULE_NAME)?;
    log::info!("MCC patches: {MODULE_NAME} @ {module_base:#x} (PID {process_id})");

    let mut applied = 0usize;
    let mut errors = Vec::new();

    for &(site, bytes) in PATCHES {
      match write_bytes(site, bytes) {
        Ok(()) => applied += 1,
        Err(error) => errors.push(error),
      }
    }

    if applied == 0 {
      return Err(if errors.is_empty() {
        "No MCC patches applied.".to_string()
      } else {
        errors.join(" ")
      });
    }

    if !errors.is_empty() {
      log::warn!(
        "Applied {applied}/{} MCC patches; partial failures: {}",
        PATCHES.len(),
        errors.join(" ")
      );
    } else {
      log::info!("Patches applied successfully ({applied}).");
    }

    Ok(applied)
  }
}

/// Apply Reach hot-reload convenience patches to a running MCC process.
/// Best-effort: returns Ok(0) when MCC is not running.
#[cfg(windows)]
pub fn apply_hot_reload_patches() -> Result<usize, String> {
  match windows_impl::apply_patches() {
    Ok(count) => Ok(count),
    Err(error) if error.contains("not found") => {
      log::debug!("Skipping MCC patches: {error}");
      Ok(0)
    }
    Err(error) => Err(error),
  }
}

#[cfg(not(windows))]
pub fn apply_hot_reload_patches() -> Result<usize, String> {
  Ok(0)
}
