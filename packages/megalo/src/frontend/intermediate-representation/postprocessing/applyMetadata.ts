import type { IR } from "..";

export function applyMetadata(ir: IR) {
  if (ir.gameVariant.localizedName) {
    const name =
      ir.gameVariant.localizedName.toArray()[0]?.english ?? "";
    const location = ir.locations.get(ir.gameVariant, "localizedName");
    ir.gameVariant.baseVariant.metadata.name = name;
    if (location !== undefined) {
      ir.locations.record(
        ir.gameVariant.baseVariant.metadata,
        "name",
        location
      );
    }
  }
  if (ir.gameVariant.localizedDescription) {
    const description =
      ir.gameVariant.localizedDescription.toArray()[0]?.english ?? "";
    const location = ir.locations.get(
      ir.gameVariant,
      "localizedDescription"
    );
    ir.gameVariant.baseVariant.metadata.description = description;
    if (location !== undefined) {
      ir.locations.record(
        ir.gameVariant.baseVariant.metadata,
        "description",
        location
      );
    }
  }

  ir.gameVariant.baseVariant.metadata.creationHistory.timestamp = new Date();
  ir.gameVariant.baseVariant.metadata.modificationHistory.timestamp =
    new Date();
}
