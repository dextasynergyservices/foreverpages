import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
});

const eslintConfig = [
  // extended configs
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "eslint:recommended",
    "plugin:prettier/recommended"
  ),

  // ✅ separate ignore block
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
      "coverage/**",
      "src/generated/**",
    ],
  },

  // ✅ rules block as its own config object
  {
    rules: {
      "prettier/prettier": "error",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
