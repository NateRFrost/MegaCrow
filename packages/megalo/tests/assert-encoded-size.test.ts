import { assertEncodedSize } from "src/backend/compile/diagnostics/assertEncodedSize";
import { DiagnosticSeverity, Diagnostics } from "src/diagnostics";
import { describe, expect, it } from "vitest";

describe("assertEncodedSize", () => {
  it("adds an error when encoded size exceeds the max", () => {
    const diagnostics = new Diagnostics();
    assertEncodedSize(20481, 20480, diagnostics);
    const errors = diagnostics.getErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.severity).toBe(DiagnosticSeverity.Error);
    expect(errors[0]?.message).toContain("Variant encoded too large");
    expect(errors[0]?.message).toContain("20481");
    expect(errors[0]?.message).toContain("20480");
  });

  it("does nothing when encoded size is within the max", () => {
    const diagnostics = new Diagnostics();
    assertEncodedSize(20480, 20480, diagnostics);
    expect(diagnostics.getErrors()).toHaveLength(0);
  });

  it("skips the check when max is zero", () => {
    const diagnostics = new Diagnostics();
    assertEncodedSize(999_999, 0, diagnostics);
    expect(diagnostics.getErrors()).toHaveLength(0);
  });
});
