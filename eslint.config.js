import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/* A regra que justifica esta configuração é `react-hooks/rules-of-hooks`: um hook
   chamado depois de um retorno antecipado já quebrou a tela deste app uma vez, e
   nenhum teste unitário alcançava o caso. */
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "public/sw.js",
    ],
  },

  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      /* o projeto não usa PropTypes; a checagem de tipo, se vier, virá de outro lugar */
      "react/prop-types": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  /* testes e arquivos de configuração rodam no Node */
  {
    files: ["**/*.test.js", "e2e/**/*.js", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },

  /* Os testes de navegador não são React. A regra de hooks reage ao parâmetro
     `use` das fixtures do Playwright, que só coincide no nome. */
  {
    files: ["e2e/**/*.js", "playwright.config.js"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/purity": "off",
    },
  },
];
