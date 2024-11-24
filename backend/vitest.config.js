import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default defineConfig({
  test: {
    include: ["src/**/*.test.js"], 
    exclude: ["src/**/*.spec.js"], 
    environment: "node", 
  },
});
