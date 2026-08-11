import {
  type c_game_engine_custom_variant,
  e_file_type,
  e_game_engine_type,
  e_game_mode,
  e_gui_game_mode,
  s_content_item_game_variant_metadata,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { IR } from "../../intermediate-representation";
import { encodeGameEngineCategory } from "./enums/e_game_engine_category";

export const compileMetadata = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const variant = ir.gameVariant;
  const metadata = gameVariant.m_base_variant.m_metadata;

  metadata.general.file_type = e_file_type.GameVariant;
  metadata.general.activity = e_gui_game_mode.multiplayer;
  metadata.general.game_mode = e_game_mode.multiplayer;
  metadata.general.game_engine_type = e_game_engine_type.megalogamengine;

  if (!(metadata.file_type_data instanceof s_content_item_game_variant_metadata)) {
    metadata.file_type_data = new s_content_item_game_variant_metadata();
  }

  if (variant.engineIcon !== undefined) {
    gameVariant.m_engine_icon = variant.engineIcon;
    metadata.file_type_data.icon_index = variant.engineIcon;
  }

  if (variant.engineCategory !== undefined) {
    const engineCategory = encodeGameEngineCategory(variant.engineCategory);
    gameVariant.m_engine_category = engineCategory;
    metadata.display.megalo_category_index = engineCategory;
  }

  if (variant.baseVariant.metadata.name !== undefined) {
    metadata.name = variant.baseVariant.metadata.name;
  }
  if (variant.baseVariant.metadata.description !== undefined) {
    metadata.description = variant.baseVariant.metadata.description;
  }
};
