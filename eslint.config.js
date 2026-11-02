const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'storageStates/', 'files/'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { project: './tsconfig.eslint.json', tsconfigRootDir: __dirname },
    },
    rules: {
      // A missed `await` lets a Playwright action or check run unawaited and the test pass falsely
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
  },
  {
    files: ['src/tests/**/*.ts', 'src/fixtures/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
  },
  // Last, so it turns off every rule above that conflicts with Prettier formatting.
  prettier,
);
