import type { IR } from "..";
import type { StringTableEntry } from "../game/string_table";

export function applyBaseName(ir: IR) {
  let baseName: StringTableEntry = {
    english: "Custom Game",
  };

  if (ir.baseFilePath) {
    // Prefer the script's localized name when present; otherwise keep the default.
    if (ir.gameVariant.localizedName) {
      baseName = ir.gameVariant.localizedName.toArray()[0]!;
    }
  } else if (ir.gameVariant.localizedName) {
    baseName = ir.gameVariant.localizedName.toArray()[0]!;
  }

  ir.gameVariant.baseNameStringIndex =
    ir.gameVariant.scriptStrings?.addEntry(baseName) ?? 0;
}
