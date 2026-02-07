import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@calc": path.resolve(__dirname, "calc"),
      "@domain": path.resolve(__dirname, "domain"),
    },
  },
});
