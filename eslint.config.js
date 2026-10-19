const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');

module.exports = defineConfig(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'storageStates/', 'files/'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: __dirname },
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' } },
  },
  {
    files: ['src/tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
  },
);
