import Config from './jest.config';

const config = {
  ...Config,
  testMatch: ['**/?(*.)+(fuzz).ts'],
  testPathIgnorePatterns: ['/node_modules/', 'jest.config.fuzz.ts'],
};

console.log(config);

export default config;
