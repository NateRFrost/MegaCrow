import { assignContentUniqueIds } from "src/backend/compile/contentUniqueIds";
import { describe, expect, it } from "vitest";

describe("assignContentUniqueIds", () => {
  it("sets unique/parent/root to the same non-zero u64", () => {
    const general = {
      unique_id: 0n,
      parent_unique_id: 0n,
      root_unique_id: 0n,
    };
    assignContentUniqueIds(general);
    expect(general.unique_id).not.toBe(0n);
    expect(general.parent_unique_id).toBe(general.unique_id);
    expect(general.root_unique_id).toBe(general.unique_id);
  });
});
