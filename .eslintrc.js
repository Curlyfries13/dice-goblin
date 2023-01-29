module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['tsconfig.json', 'tsconfig.eslint.json'],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
