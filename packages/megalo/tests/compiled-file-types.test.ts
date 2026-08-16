import { search_for_chunk } from "@blamnetwork/blf";
import {
  s_blf_chunk_content_header,
  s_blf_chunk_end_of_file,
  s_blf_chunk_game_variant,
  s_blf_chunk_packed_game_variant,
  s_blf_chunk_start_of_file,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { compileSource } from "src/compile-source";
import { MEGALO_VERSIONS } from "src/version";
import { describe, expect, it } from "vitest";

const version = MEGALO_VERSIONS["107-mcc"];

const minimalScript = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
`;

describe("compiled file types", () => {
  it("packs mpvr as _blf + chdr + mpvr + _eof", async () => {
    const result = await compileSource(minimalScript, {
      version,
      fileType: "mpvr",
    });
    expect(result.bytes).toBeDefined();
    const bytes = result.bytes!;

    expect(
      search_for_chunk(bytes, new s_blf_chunk_start_of_file(), "big")
    ).toBe(true);
    expect(
      search_for_chunk(bytes, new s_blf_chunk_content_header(), "big")
    ).toBe(true);
    expect(search_for_chunk(bytes, new s_blf_chunk_game_variant(), "big")).toBe(
      true
    );
    expect(search_for_chunk(bytes, new s_blf_chunk_end_of_file(), "big")).toBe(
      true
    );
  });

  it("packs gvar as _blf + gvar + _eof", async () => {
    const result = await compileSource(minimalScript, {
      version,
      fileType: "gvar",
    });
    expect(result.bytes).toBeDefined();
    const bytes = result.bytes!;

    expect(
      search_for_chunk(bytes, new s_blf_chunk_start_of_file(), "big")
    ).toBe(true);
    expect(
      search_for_chunk(bytes, new s_blf_chunk_packed_game_variant(), "big")
    ).toBe(true);
    expect(search_for_chunk(bytes, new s_blf_chunk_end_of_file(), "big")).toBe(
      true
    );
    expect(
      search_for_chunk(bytes, new s_blf_chunk_content_header(), "big")
    ).toBe(false);
  });

  it("reports variantByteLength as mglo size for mpvr packs", async () => {
    const result = await compileSource(minimalScript, {
      version,
      fileType: "mpvr",
    });
    expect(result.bytes).toBeDefined();
    expect(result.variantByteLength).toBeDefined();
    expect(result.variantByteLength!).toBeLessThan(result.bytes!.length);

    const mglo = await compileSource(minimalScript, {
      version,
      fileType: "mglo",
    });
    expect(result.variantByteLength).toBe(mglo.bytes!.length);
  });

  it("keeps mglo as a raw bitstream without BLF framing", async () => {
    const result = await compileSource(minimalScript, {
      version,
      fileType: "mglo",
    });
    expect(result.bytes).toBeDefined();
    expect(
      search_for_chunk(result.bytes!, new s_blf_chunk_start_of_file(), "big")
    ).toBe(false);
  });
});
