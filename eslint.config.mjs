import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  // Spread Next.js core-web-vitals config (includes React, React Hooks, and Next.js rules)
  ...nextVitals,

  // Spread Next.js TypeScript config
  ...nextTs,

  // Add Prettier config to disable conflicting rules
  prettier,

  // Custom rules
  {
    rules: {
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      "@next/next/no-img-element": "warn",
      "@next/next/no-head-element": "warn",
      // Downgrade React Hooks rules to warnings for gradual migration
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },

  // Override default ignores
  globalIgnores([
    // Default Next.js ignores
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional project-specific ignores
    "node_modules/**",
    "public/**",
    "coverage/**",
    "src/generated/**",
    // Ignore compiled artifacts from the signaling server
    "signaling-server/dist/**",
    // Ignore template fixture examples (these are intentionally unlinted)
    "scripts/template-to-fix/**",
    // Ignore uploaded templates - they have their own build and lint configs
    "src/app/templates/**",
    // Ignore root-level template directory (legacy)
    "light-template/**",
  ]),
]);

export default eslintConfig;
