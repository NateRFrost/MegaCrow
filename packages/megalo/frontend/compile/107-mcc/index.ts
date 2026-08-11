import {
  c_game_engine_custom_variant,
  c_string_table,
  e_file_type,
  s_content_item_game_variant_metadata,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { bitstream } from "@blamnetwork/blf";

const { c_bitstream_writer, e_bitstream_byte_order } = bitstream;
import { BUILT_IN_LOCATION, type Diagnostics } from "../../diagnostics";
import type { IR } from "../../intermediate-representation";
import type { StringTable } from "../../intermediate-representation/game/string_table";
import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";
import { Compiler } from "../compiler";
import { FrontendError } from "../../error";
import { CAPABILITES_107_MCC } from "./capabilities";
import { compileGameOptions } from "./game_options";
import { compileHudWidgets } from "./hud_widgets";
import { compileLoadoutPalettes } from "./loadout_palette";
import { compileMapObjects } from "./map_object";
import { compileMapPermissions } from "./map_permissions";
import { compilePlayerRatings } from "./player_rating";
import { compileTeams } from "./teams";
import { assertCompatibleIR, CompilerCapabilities } from "../diagnostics/assertCompatibleIR";
import { MEGALO_VERSIONS, SupportedMegaloVersion } from "../../../version";

/** Reach MCC script string table bitstream layout. */
const SCRIPT_STRINGS = {
  maxStringCount: 112,
  maxStringLength: 0x4c_00,
  offsetBitLength: 15,
  bufferSizeBitLength: 15,
  countBitLength: 7,
} as const;

const LOCALIZED_NAME = {
  maxStringCount: 1,
  maxStringLength: 0x1_80,
  offsetBitLength: 9,
  bufferSizeBitLength: 9,
  countBitLength: 1,
} as const;

const LOCALIZED_DESCRIPTION = {
  maxStringCount: 1,
  maxStringLength: 0xc_00,
  offsetBitLength: 12,
  bufferSizeBitLength: 12,
  countBitLength: 1,
} as const;

const LOCALIZED_CATEGORY = {
  maxStringCount: 1,
  maxStringLength: 0x1_80,
  offsetBitLength: 9,
  bufferSizeBitLength: 9,
  countBitLength: 1,
} as const;

export class Compiler107MCC extends Compiler {
  private compileStringTable(
    irStrings: StringTable,
    maxStringCount: number,
    maxStringLength: number,
    offsetBitLength: number,
    bufferSizeBitLength: number,
    countBitLength: number
  ): c_string_table {
    const table = new c_string_table(
      maxStringCount,
      maxStringLength,
      offsetBitLength,
      bufferSizeBitLength,
      countBitLength
    );

    const entries = irStrings.toArray();
    table.strings = STRING_TABLE_LANGUAGES.map((language) =>
      entries.map((entry) => entry[language] ?? null)
    );

    return table;
  }

  private makeDefaultGametype(): c_game_engine_custom_variant {
    const gametype = new c_game_engine_custom_variant();
    gametype.initialize();
    gametype.m_build_number = -1;
    gametype.m_base_variant.m_metadata.general.file_type =
      e_file_type.GameVariant;
    gametype.m_base_variant.m_metadata.file_type_data =
      new s_content_item_game_variant_metadata();
    return gametype;
  }

  private compile(
    ir: IR,
    diagnostics: Diagnostics
  ): c_game_engine_custom_variant {
    assertCompatibleIR(ir, this, diagnostics);

    const gametype = this.makeDefaultGametype();
    const variant = ir.gameVariant;

    gametype.m_script_strings = this.compileStringTable(
      variant.scriptStrings,
      SCRIPT_STRINGS.maxStringCount,
      SCRIPT_STRINGS.maxStringLength,
      SCRIPT_STRINGS.offsetBitLength,
      SCRIPT_STRINGS.bufferSizeBitLength,
      SCRIPT_STRINGS.countBitLength
    );

    if (variant.localizedName !== undefined) {
      gametype.m_localized_name = this.compileStringTable(
        variant.localizedName,
        LOCALIZED_NAME.maxStringCount,
        LOCALIZED_NAME.maxStringLength,
        LOCALIZED_NAME.offsetBitLength,
        LOCALIZED_NAME.bufferSizeBitLength,
        LOCALIZED_NAME.countBitLength
      );
    }
    if (variant.localizedDescription !== undefined) {
      gametype.m_localized_description = this.compileStringTable(
        variant.localizedDescription,
        LOCALIZED_DESCRIPTION.maxStringCount,
        LOCALIZED_DESCRIPTION.maxStringLength,
        LOCALIZED_DESCRIPTION.offsetBitLength,
        LOCALIZED_DESCRIPTION.bufferSizeBitLength,
        LOCALIZED_DESCRIPTION.countBitLength
      );
    }
    if (variant.localizedCategory !== undefined) {
      gametype.m_localized_category = this.compileStringTable(
        variant.localizedCategory,
        LOCALIZED_CATEGORY.maxStringCount,
        LOCALIZED_CATEGORY.maxStringLength,
        LOCALIZED_CATEGORY.offsetBitLength,
        LOCALIZED_CATEGORY.bufferSizeBitLength,
        LOCALIZED_CATEGORY.countBitLength
      );
    }

    if (variant.engineIcon !== undefined) {
      gametype.m_engine_icon = variant.engineIcon;
      gametype.m_base_variant.m_metadata.file_type_data =
        new s_content_item_game_variant_metadata();
      gametype.m_base_variant.m_metadata.file_type_data.icon_index =
        variant.engineIcon;
    }
    if (variant.engineCategory !== undefined) {
      // this is actually an enum, we havent mapped it yet
      // TODO add e_game_engine_category to blf-ts
      gametype.m_engine_category = variant.engineCategory;
      gametype.m_base_variant.m_metadata.display.megalo_category_index =
        variant.engineCategory;
    }
    if (variant.baseVariant.metadata.name !== undefined) {
      gametype.m_base_variant.m_metadata.name =
        variant.baseVariant.metadata.name;
    }
    if (variant.baseVariant.metadata.description !== undefined) {
      gametype.m_base_variant.m_metadata.description =
        variant.baseVariant.metadata.description;
    }

    // TODO: Move
    gametype.m_base_variant.m_metadata.general.activity = 3;
    gametype.m_base_variant.m_metadata.general.game_mode = 3;
    gametype.m_base_variant.m_metadata.general.game_engine_type = 2;

    gametype.m_base_name_string_index = variant.baseNameStringIndex;

    compileGameOptions(ir, gametype);
    compileTeams(ir, gametype, diagnostics);
    compileLoadoutPalettes(ir, gametype);
    compilePlayerRatings(ir, gametype);
    compileMapPermissions(ir, gametype, diagnostics);
    compileMapObjects(ir, gametype, diagnostics);
    compileHudWidgets(ir, gametype, diagnostics);

    return gametype;
  }

  public dryRun(ir: IR, diagnostics: Diagnostics): void {
    this.compile(ir, diagnostics);
  }

  public writeMegaloFile(ir: IR, diagnostics: Diagnostics): Uint8Array {
    const gametype = this.compile(ir, diagnostics);
    if (diagnostics.hasErrors()) {
      throw new FrontendError(
        "Cannot write megalo file while diagnostics have errors",
        BUILT_IN_LOCATION
      );
    }
    const bitstreamWriter = c_bitstream_writer.new(
      0,
      e_bitstream_byte_order._bitstream_byte_order_big_endian
    );
    bitstreamWriter.begin_writing();
    gametype.encode(bitstreamWriter);
    bitstreamWriter.finish_writing();
    return bitstreamWriter.get_data();
  }

  public getCapabilities(): CompilerCapabilities {
    return CAPABILITES_107_MCC;
  }

  public getMegaloVersion(): SupportedMegaloVersion {
    return MEGALO_VERSIONS["107-mcc"];
  }
}
