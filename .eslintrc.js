module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Allow console for CLI tools
    'no-console': 'off',
    // Allow unused vars with underscore prefix
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Allow explicit any for migration
    '@typescript-eslint/no-explicit-any': 'warn',
    // Prefer const assertions
    '@typescript-eslint/prefer-as-const': 'error',
  },
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '*.js',
    '*.d.ts',
  ],
};
