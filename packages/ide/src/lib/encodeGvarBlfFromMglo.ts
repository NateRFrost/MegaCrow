import { bitstream, write_blffile } from "@blamnetwork/blf";
import {
  c_game_engine_custom_variant,
  c_game_variant,
  e_game_engine_type,
  s_blf_chunk_end_of_file,
  s_blf_chunk_packed_game_variant,
  s_blf_chunk_start_of_file,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";

const { c_bitstream_reader, e_bitstream_byte_order } = bitstream;

/**
 * Wrap compiled `.mglo` (custom-variant bitstream) in a Reach MCC `gvar` BLF file.
 * Output is suitable for a `.bin` matchmaking game variant.
 */
export function encodeGvarBlfFromMglo(mgloBytes: Uint8Array): Uint8Array {
  const reader = c_bitstream_reader.new(
    mgloBytes,
    e_bitstream_byte_order._bitstream_byte_order_big_endian
  );
  reader.begin_reading();
  const custom = new c_game_engine_custom_variant();
  custom.decode(reader);
  reader.finish_reading();

  const gameVariant = new c_game_variant();
  gameVariant.m_game_engine = e_game_engine_type.megalogamengine;
  gameVariant.m_custom_variant = custom;

  return write_blffile("big", [
    s_blf_chunk_start_of_file.create("game variant"),
    s_blf_chunk_packed_game_variant.create(gameVariant),
    new s_blf_chunk_end_of_file(),
  ]);
}
