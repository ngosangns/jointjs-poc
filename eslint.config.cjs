/* eslint-disable no-undef */
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  // Global ignores
  {
    ignores: ['**/node_modules/**', '**/.angular/**', 'lib/dist/**', '**/*.d.ts'],
  },
  // TypeScript sources (app, lib, e2e)
  {
    files: ['src/**/*.ts', 'lib/**/*.ts', 'e2e/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      // Do not use type-aware linting to avoid project file resolution issues
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // JS config files
  {
    files: ['*.{js,cjs,mjs}', 'lib/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];
