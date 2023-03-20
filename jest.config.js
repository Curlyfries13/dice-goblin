module.exports = {
  projects: [
    {
      displayName: 'unit tests',
      transform: {
        '^.+\\.tsx?$': 'esbuild-jest',
      },
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],
};
