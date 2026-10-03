import js from "@eslint/js";
import { registerHooks } from "node:module";
const compilerUrl = import.meta.resolve("typescript-eslint-compiler");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "typescript") return { shortCircuit: true, url: compilerUrl };
    return nextResolve(specifier, context);
  },
});
const [{ default: parser }, { default: plugin }] = await Promise.all([
  import("@typescript-eslint/parser"),
  import("@typescript-eslint/eslint-plugin"),
]);
export default [
  { ignores: ["dist/**", "node_modules/**", "src-tauri/target/**"] },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module" } },
    plugins: { "@typescript-eslint": plugin },
    rules: {
      ...js.configs.recommended.rules,
      ...plugin.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
];
