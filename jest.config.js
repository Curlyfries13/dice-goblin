module.exports = {
  projects: [
    {
      displayName: {
        name: 'fuzz tests',
        color: 'blue',
      },
      testMatch: ['**/?(*.)+(fuzz).[jt]s?(x)'],
      transform: {
        '^.+\\.tsx?$': ['esbuild-jest', { sourcemap: true }],
      },
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
    {
      displayName: {
        name: 'unit tests',
        color: 'white',
      },
      testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      transform: {
        '^.+\\.tsx?$': 'esbuild-jest',
      },
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],
};
