export {
  decodeMglo,
  readMgloEncodingVersion,
  resolveGametypeVersion,
  type DecodedMglo,
  type MgloGametypeVersion,
} from "../../decode-mglo";

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
