import { describe, expect, it } from "vitest";
import { compileSource } from "../src/compile-source";
import { DiagnosticSeverity } from "../src/diagnostics";
import { MEGALO_VERSIONS } from "../src/version";

const minimalScript = `string_table english
\tname "Custom Game"
end
engine_data
\tname name
end
`;

describe("pre-release mpvr packing", () => {
  it.each([
    ["49", MEGALO_VERSIONS["49"], "34.1"],
    ["73", MEGALO_VERSIONS["73"], "38.1"],
  ] as const)("writes chdr + mpvr %s (%s)", async (_id, version, expectedMpvrVersion) => {
    const result = await compileSource(minimalScript, {
      version,
      fileType: "mpvr",
    });
    expect(
      result.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error)
    ).toEqual([]);
    expect(result.bytes).toBeDefined();
    const buf = Buffer.from(result.bytes!);
    const chunks: { sig: string; ver: string; size: number }[] = [];
    let offset = buf.readUInt32BE(4);
    while (offset + 12 <= buf.length) {
      const sig = buf.toString("ascii", offset, offset + 4);
      const size = buf.readUInt32BE(offset + 4);
      const ver = `${buf.readUInt16BE(offset + 8)}.${buf.readUInt16BE(offset + 10)}`;
      chunks.push({ sig, ver, size });
      offset += size;
      if (sig === "_eof") {
        break;
      }
    }
    expect(chunks.map((c) => c.sig)).toEqual(["chdr", "mpvr", "_eof"]);
    expect(chunks[0]?.ver).toBe("10.2");
    expect(chunks[1]?.ver).toBe(expectedMpvrVersion);
    expect(chunks[1]?.size).toBe(12 + 28 + 0x5000);
  });
});
