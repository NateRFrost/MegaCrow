import { getConfigurationForVersion } from "src/backend/version-configuration";
import { compileSource } from "src/compile-source";
import { MEGALO_VERSIONS } from "src/version";
import { describe, expect, it } from "vitest";

const VERSION = MEGALO_VERSIONS["107-mcc"];

const withGlobals = (body: string): string => `variables global
	local number n 0
	local object o none
	local player p none
end
${body}
`;

describe("variant limit usage", () => {
  it("sets requisition palettes to zero for 107-mcc and omits them from the list", async () => {
    const limits = getConfigurationForVersion(VERSION).limits;
    expect(limits.requisitionPalettes).toBe(0);

    const result = await compileSource(
      withGlobals(`trigger general
	action set n set_to 1
end
`),
      { version: VERSION }
    );

    const usage = result.limitUsage;
    expect(usage).toBeDefined();
    expect(
      usage?.items.find((item) => item.id === "requisition-palettes")
    ).toBe(undefined);
    expect(usage?.items.every((item) => item.max > 0)).toBe(true);
    expect(usage?.items.some((item) => item.id === "storage")).toBe(true);
    expect(usage?.items.some((item) => item.section === "variables")).toBe(
      true
    );
  });

  it("reports script counters from the compile lower", async () => {
    const result = await compileSource(
      withGlobals(`trigger general
	action set n set_to 1
	action set n set_to 2
end
`),
      { version: VERSION }
    );

    expect(result.limitUsage).toBeDefined();
    expect(
      result.limitUsage?.items.find((item) => item.id === "triggers")?.used
    ).toBe(1);
    expect(
      result.limitUsage?.items.find((item) => item.id === "actions")?.used
    ).toBeGreaterThanOrEqual(2);
    expect(
      result.limitUsage?.items.find((item) => item.id === "storage")?.used
    ).toBe(result.variantByteLength);
  });
});
