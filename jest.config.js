module.exports = {
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/types/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
