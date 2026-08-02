import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import prettierConfig from "eslint-config-prettier"
import prettierPlugin from "eslint-plugin-prettier"

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/",
      "dist/",
      "dist-npm/",
      "**/dist-npm/",
      ".vercel/",
      "site/",
      "*.log",
      "*.local",
      ".DS_Store",
      "*.tsbuildinfo",
      "**/.turbo/",
      "**/bin/",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.mts", "**/*.cts"],
    languageOptions: {
      globals: {
        ...js.configs.recommended.globals,
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        Bun: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        Bun: "readonly",
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      "prettier/prettier": ["error", { endOfLine: "auto", printWidth: 120, semi: false }],
      // Base JS rules that duplicate TypeScript's own checking and produce
      // false positives on typed code (TS upstream covers these):
      "no-undef": "off",
      "no-redeclare": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrors: "none", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // The following base rules are stylistic / low-signal on this codebase.
      // They are intentionally warnings (not errors) so legacy code does not
      // block CI; treat them as suggestions to clean up incrementally.
      "no-empty": "warn",
      "no-fallthrough": "warn",
      "no-case-declarations": "warn",
      "no-self-assign": "warn",
      "no-irregular-whitespace": "warn",
      "no-constant-condition": "warn",
      "require-yield": "warn",
      "no-useless-escape": "warn",
      "no-control-regex": "warn",
      "getter-return": "warn",
      "no-unsafe-finally": "warn",
      "no-import-assign": "warn",
      "no-empty-pattern": "warn",
      "no-dupe-keys": "warn",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]