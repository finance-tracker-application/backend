import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser, // browser globals
        ...globals.node, // Node.js globals
        ...globals.jest, // Jest globals (beforeAll, describe, expect, etc.)
      },
    },
  },
]);
