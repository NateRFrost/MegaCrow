import type { CompiledMegaloFileType } from "@megacrow/megalo";

export type GametypeSaveFormat = "mglo" | "gvar" | "mpvr" | "asq";

/** Reach autosave queue `.game` slot size (zero-padded). */
export const AUTOSAVE_QUEUE_FILE_SIZE = 0x6000;

/** Reach autosave queue filenames: `asq<time64_t uppercase hex, 16 digits>.game`. */
export function autosaveQueueFileName(date: Date = new Date()): string {
  const time64 = BigInt(Math.floor(date.getTime() / 1000));
  return `asq${time64.toString(16).toUpperCase().padStart(16, "0")}.game`;
}

/** Zero-pad an mpvr BLF to the autosave-queue `.game` slot size. */
export function padAutosaveQueueBytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length > AUTOSAVE_QUEUE_FILE_SIZE) {
    throw new Error(
      `Autosave queue file is ${bytes.length} bytes; max is ${AUTOSAVE_QUEUE_FILE_SIZE}`
    );
  }
  if (bytes.length === AUTOSAVE_QUEUE_FILE_SIZE) {
    return bytes;
  }
  const padded = new Uint8Array(AUTOSAVE_QUEUE_FILE_SIZE);
  padded.set(bytes);
  return padded;
}

/** Bytes ready to write for a save format (ASQ pads mpvr to 0x6000). */
export function finalizeGametypeSaveBytes(
  bytes: Uint8Array,
  format: GametypeSaveFormat
): Uint8Array {
  return format === "asq" ? padAutosaveQueueBytes(bytes) : bytes;
}

/** ASQ is presentation-only — content is a packed `mpvr` BLF (then zero-padded). */
export function compiledFileTypeForSaveFormat(
  format: GametypeSaveFormat
): CompiledMegaloFileType {
  switch (format) {
    case "gvar":
      return "gvar";
    case "mpvr":
    case "asq":
      return "mpvr";
    case "mglo":
      return "mglo";
  }
}
