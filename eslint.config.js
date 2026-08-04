const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["node_modules/**", "node_modules_broken_*/**", "dist/**", ".expo/**", ".vercel/**", "coverage/**"]
  },
  {
    rules: {
      "import/namespace": "off",
      "import/no-unresolved": "off",
      "import/no-duplicates": "off",
      "@typescript-eslint/array-type": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];
