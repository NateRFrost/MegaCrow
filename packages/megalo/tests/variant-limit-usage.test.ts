import { getConfigurationForVersion } from "src/backend/version-configuration";
import { computeVariantLimitUsage } from "src/compute-variant-limit-usage";
import { MEGALO_VERSIONS } from "src/version";
import { describe, expect, it } from "vitest";

const VERSION = MEGALO_VERSIONS["107-mcc"];

const withGlobals = (body: string): string => `variables global
\tlocal number n 0
\tlocal object o none
\tlocal player p none
end
${body}
`;

describe("variant limit usage", () => {
  it("sets requisition palettes to zero for 107-mcc and omits them from the list", () => {
    const limits = getConfigurationForVersion(VERSION).limits;
    expect(limits.requisitionPalettes).toBe(0);

    const usage = computeVariantLimitUsage(
      withGlobals(`trigger general
\taction set n set_to 1
end
`),
      { version: VERSION, usedBytes: 100 }
    );

    expect(usage.items.find((item) => item.id === "requisition-palettes")).toBe(
      undefined
    );
    expect(usage.items.every((item) => item.max > 0)).toBe(true);
    expect(usage.items.some((item) => item.id === "storage")).toBe(true);
    expect(usage.items.some((item) => item.section === "variables")).toBe(true);
  });

  it("reports script counters from the lowered program", () => {
    const usage = computeVariantLimitUsage(
      withGlobals(`trigger general
\taction set n set_to 1
\taction set n set_to 2
end
`),
      { version: VERSION, usedBytes: 50 }
    );

    expect(usage.items.find((item) => item.id === "triggers")?.used).toBe(1);
    expect(
      usage.items.find((item) => item.id === "actions")?.used
    ).toBeGreaterThanOrEqual(2);
    expect(usage.items.find((item) => item.id === "storage")?.used).toBe(50);
  });
});
