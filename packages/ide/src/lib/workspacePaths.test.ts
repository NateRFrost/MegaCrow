import { describe, expect, it } from "vitest";
import { isPathInWorkspaceInput } from "./workspacePaths";

describe("isPathInWorkspaceInput", () => {
  it("accepts files under the workspace input root", () => {
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\data\\multiplayer\\megalo\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(true);
    expect(
      isPathInWorkspaceInput(
        "C:/HREK/data/multiplayer/megalo/sub/bar.txt",
        "C:/HREK/data/multiplayer/megalo"
      )
    ).toBe(true);
  });

  it("rejects files outside the workspace", () => {
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\maps\\megalo\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(false);
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\data\\multiplayer\\megalo_other\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(false);
  });
});
