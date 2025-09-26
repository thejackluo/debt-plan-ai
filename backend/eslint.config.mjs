import { fileURLToPath } from "node:url";

import eslintPluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default [
  eslintPluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  pluginImport.flatConfigs.recommended,
  pluginImport.flatConfigs.typescript,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: projectRoot,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "import/no-unresolved": "error",
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  eslintConfigPrettier,
];
