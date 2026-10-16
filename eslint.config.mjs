import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The legacy static pages, Node build scripts and folders unrelated to the app
    "public/**",
    "scripts/**",
    "docs/**",
    ".cursor/**",
    "temp_design/**",
    "prompts_chat/**",
  ]),
]);

export default eslintConfig;
