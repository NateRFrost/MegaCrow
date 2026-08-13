export {
  type DecodedMglo,
  decodeMglo,
  type MgloGametypeVersion,
  readMgloEncodingVersion,
  resolveGametypeVersion,
} from "../../src/decode-mglo";

/** Structured-clone-safe plain JSON (Maps / bigints / etc. normalized). */
export function toPlainJson(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (typeof current === "bigint") {
        return current.toString();
      }
      return current;
    })
  );
}
