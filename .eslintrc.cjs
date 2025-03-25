module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true, // Add jest environment for test files
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
  },
  ignorePatterns: [
    'index.js',
    'dist/**/*',
    'coverage/**/*',
    'test/**/*',
    '**/*.test.ts',
    'vitest.config.ts',
    'vitest.visual.config.ts',
  ],
};
