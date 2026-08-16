/** Cryptographically random non-zero u64 for content-item identity fields. */
export const randomContentUniqueId = (): bigint => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value === 0n ? 1n : value;
};

/**
 * Assign the same random u64 to `unique_id`, `parent_unique_id`, and
 * `root_unique_id`. (ASQ filenames use time separately.)
 */
export const assignContentUniqueIds = (general: {
  parent_unique_id: bigint;
  root_unique_id: bigint;
  unique_id: bigint;
}): void => {
  const id = randomContentUniqueId();
  general.unique_id = id;
  general.parent_unique_id = id;
  general.root_unique_id = id;
};
