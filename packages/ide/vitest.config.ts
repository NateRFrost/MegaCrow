import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    testTimeout: 600_000,
  },
  ssr: {
    noExternal: [/@blamnetwork\/.*/, /@craftycodie\/.*/],
  },
});
