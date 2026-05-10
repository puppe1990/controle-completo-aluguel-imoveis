import globals from "globals";

export default [
  {
    ignores: [
      "bin/**",
      "dist/**",
      "node_modules/**",
      ".data/**",
      ".tmp/**",
      "resources/js/neutralino.js",
      "resources/js/neutralino.d.ts",
      "resources/styles/output.css",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        Neutralino: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
];
