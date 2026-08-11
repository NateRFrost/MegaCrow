import {
  c_game_engine_custom_variant,
  c_string_table,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { bitstream } from "@blamnetwork/blf";

const { c_bitstream_writer, e_bitstream_byte_order } = bitstream;
import { decodeMglo } from "../../../decode-mglo";
import { BUILT_IN_LOCATION, type Diagnostics } from "../../diagnostics";
import type { IR } from "../../intermediate-representation";
import type { StringTable } from "../../intermediate-representation/game/string_table";
import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";
import { Compiler } from "../compiler";
import { FrontendError } from "../../error";
import { CAPABILITES_107_MCC } from "./capabilities";
import { compileGameOptions } from "./game_options";
import { compileGameStats } from "./game_stats";
import { compileHudWidgets } from "./hud_widgets";
import { compileLoadoutPalettes } from "./loadout_palette";
import { compileMapObjects } from "./map_object";
import { compileMapPermissions } from "./map_permissions";
import { compileMetadata } from "./metadata";
import { compilePlayerRatings } from "./player_rating";
import { compileTeams } from "./teams";
import { compileConditions } from "./conditions";
import { compileActions } from "./actions";
import { compileTriggers } from "./triggers";
import { compileVariableMetadata } from "./variableMetadata";
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
    return gametype;
  }

  private decodeBaseGametype(
    ir: IR,
    diagnostics: Diagnostics
  ): c_game_engine_custom_variant {
    if (!ir.baseFileBytes) {
      return this.makeDefaultGametype();
    }

    const location = ir.locations.get(ir, "baseFilePath") ?? BUILT_IN_LOCATION;
    const version = this.getMegaloVersion();

    try {
      const decoded = decodeMglo(ir.baseFileBytes);
      if (decoded.version.encodingVersion !== version.version) {
        diagnostics.addError(
          `Base file encoding version ${decoded.version.encodingVersion} does not match compile target ${version.version}`,
          location
        );
        return this.makeDefaultGametype();
      }
      return decoded.gametype as c_game_engine_custom_variant;
    } catch (error) {
      diagnostics.addError(
        error instanceof Error
          ? error.message
          : `Failed to decode base file${
              ir.baseFilePath ? ` "${ir.baseFilePath}"` : ""
            }`,
        location
      );
      return this.makeDefaultGametype();
    }
  }

  private compile(
    ir: IR,
    diagnostics: Diagnostics
  ): c_game_engine_custom_variant {
    assertCompatibleIR(ir, this, diagnostics);

    const gametype = this.decodeBaseGametype(ir, diagnostics);
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

    compileMetadata(ir, gametype);

    gametype.m_base_name_string_index = variant.baseNameStringIndex;

    compileGameOptions(ir, gametype);
    compileTeams(ir, gametype, diagnostics);
    compileLoadoutPalettes(ir, gametype);
    compilePlayerRatings(ir, gametype);
    compileMapPermissions(ir, gametype, diagnostics);
    compileMapObjects(ir, gametype, diagnostics);
    compileGameStats(ir, gametype, diagnostics);
    compileHudWidgets(ir, gametype, diagnostics);
    compileVariableMetadata(ir, gametype);
    compileConditions(ir, gametype, diagnostics);
    compileActions(ir, gametype, diagnostics);
    compileTriggers(ir, gametype);

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
