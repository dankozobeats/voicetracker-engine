import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Fichiers ignorés
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**"
    ]
  },

  // Base JS
  js.configs.recommended,

  // TypeScript
  ...tseslint.configs.recommended,

  // Next.js (App Router)
  ...next,

  // Règles projet
  {
    plugins: {
      "unused-imports": unusedImports
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // Propreté
      "no-console": "warn",

      // Imports morts → ERREUR
      "unused-imports/no-unused-imports": "error",

      // Variables inutilisées → warning
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],

      // React 19 (JSX auto)
      "react/react-in-jsx-scope": "off"
    }
  }
];
