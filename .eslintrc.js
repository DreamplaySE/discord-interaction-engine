module.exports = {
  root: true,
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsdoc/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint",
    "jsdoc"
  ],
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
    "jsdoc/require-param-type": 0,
    "jsdoc/require-property-type": 0,
    "jsdoc/require-returns-type": 0,
    "@typescript-eslint/no-namespace": 0,
    "@typescript-eslint/no-explicit-any": 0
  }
};