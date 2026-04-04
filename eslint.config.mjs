import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: ["node_modules/**", ".cache/**", "dist/**", "build/**"],
  },
  {
    files: ["calc/**/*.ts", "engine/**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='Math'][property.name='pow']",
          message: "Math.pow is banned in financial code. Use dPow from calc/shared/decimal-helpers.ts instead.",
        },
        {
          selector: "TSTypeReference[typeName.name='any']",
          message: "'any' type is banned in financial code. Use a specific type instead.",
        },
        {
          selector: "TSAsExpression[typeAnnotation.type='TSAnyKeyword']",
          message: "'as any' is banned in financial code. Use a specific type assertion instead.",
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "safeNum",
          message: "safeNum is banned. Use assertFinite from calc/shared/decimal-helpers.ts instead.",
        },
      ],
    },
  },
];
