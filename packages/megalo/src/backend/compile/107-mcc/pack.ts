import { bitstream, write_blffile } from "@blamnetwork/blf";
import {
  c_game_engine_custom_variant,
  c_game_variant,
  e_game_engine_type,
  s_blf_chunk_content_header,
  s_blf_chunk_end_of_file,
  s_blf_chunk_game_variant,
  s_blf_chunk_packed_game_variant,
  s_blf_chunk_start_of_file,
  s_content_item_display_metadata,
  s_content_item_game_variant_metadata,
  s_content_item_general_metadata,
  s_content_item_history,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { CompiledMegaloFileType } from "src/backend/compile/compiler";

const { c_bitstream_reader, c_bitstream_writer, e_bitstream_byte_order } =
  bitstream;

/** Fallback when the compiled variant leaves build number unset (-1). */
const DEFAULT_BUILD_NUMBER = 12065;

const encodeCustomVariantBitstream = (
  custom: c_game_engine_custom_variant
): Uint8Array => {
  const writer = c_bitstream_writer.new(
    0,
    e_bitstream_byte_order._bitstream_byte_order_big_endian
  );
  writer.begin_writing();
  custom.encode(writer);
  writer.finish_writing();
  return writer.get_data();
};

const wrapGameVariant = (
  custom: c_game_engine_custom_variant
): c_game_variant => {
  const gameVariant = new c_game_variant();
  gameVariant.m_game_engine = e_game_engine_type.megalogamengine;
  gameVariant.m_custom_variant = custom;
  return gameVariant;
};

const copyHistory = (
  source: s_content_item_history
): s_content_item_history => {
  const history = new s_content_item_history();
  history.timestamp = source.timestamp;
  history.xuid = source.xuid;
  history.name = source.name;
  history.is_online = source.is_online;
  return history;
};

const buildContentHeader = (
  custom: c_game_engine_custom_variant,
  sizeInBytes: number
): s_blf_chunk_content_header => {
  const source = custom.m_base_variant.m_metadata;
  const chdr = new s_blf_chunk_content_header();
  chdr.build_number =
    custom.m_build_number > 0 ? custom.m_build_number : DEFAULT_BUILD_NUMBER;
  chdr.build_sequence_number = 0;

  chdr.metadata.general = Object.assign(new s_content_item_general_metadata(), {
    ...source.general,
    size_in_bytes: sizeInBytes,
  });
  chdr.metadata.display = Object.assign(
    new s_content_item_display_metadata(),
    source.display
  );
  chdr.metadata.creation_history = copyHistory(source.creation_history);
  chdr.metadata.modification_history = copyHistory(source.modification_history);
  chdr.metadata.name = source.name;
  chdr.metadata.description = source.description;
  if (source.file_type_data instanceof s_content_item_game_variant_metadata) {
    const fileTypeData = new s_content_item_game_variant_metadata();
    fileTypeData.icon_index = source.file_type_data.icon_index;
    chdr.metadata.file_type_data = fileTypeData;
  } else {
    chdr.metadata.file_type_data = source.file_type_data;
  }
  chdr.metadata.activity_data = source.activity_data;
  chdr.metadata.game_mode_data = source.game_mode_data;
  return chdr;
};

/**
 * Pack a compiled custom variant into `mglo` / `mpvr` / `gvar` bytes.
 * `mpvr` = `_blf` + `chdr` + `mpvr` + `_eof`; `gvar` = `_blf` + `gvar` + `_eof`.
 */
export const packCompiledVariant = (
  custom: c_game_engine_custom_variant,
  fileType: CompiledMegaloFileType
): { data: Uint8Array; variantByteLength: number } => {
  const mglo = encodeCustomVariantBitstream(custom);
  if (fileType === "mglo") {
    return { data: mglo, variantByteLength: mglo.length };
  }

  const gameVariant = wrapGameVariant(custom);
  if (fileType === "gvar") {
    return {
      data: write_blffile("big", [
        s_blf_chunk_start_of_file.create("game variant"),
        s_blf_chunk_packed_game_variant.create(gameVariant),
        new s_blf_chunk_end_of_file(),
      ]),
      variantByteLength: mglo.length,
    };
  }

  const writeMpvr = (sizeInBytes: number): Uint8Array =>
    write_blffile("big", [
      s_blf_chunk_start_of_file.create("game variant"),
      buildContentHeader(custom, sizeInBytes),
      s_blf_chunk_game_variant.create(gameVariant),
      new s_blf_chunk_end_of_file(),
    ]);

  const first = writeMpvr(0);
  return { data: writeMpvr(first.length), variantByteLength: mglo.length };
};

/** Re-pack an already-encoded `.mglo` bitstream (e.g. workspace Build gvar). */
export const packMgloBytes = (
  mgloBytes: Uint8Array,
  fileType: Exclude<CompiledMegaloFileType, "mglo">
): Uint8Array => {
  const reader = c_bitstream_reader.new(
    mgloBytes,
    e_bitstream_byte_order._bitstream_byte_order_big_endian
  );
  reader.begin_reading();
  const custom = new c_game_engine_custom_variant();
  custom.decode(reader);
  reader.finish_reading();
  return packCompiledVariant(custom, fileType).data;
};
