import Config from './jest.config';

const config = {
  ...Config,
  testMatch: ['**/?(*.)+(fuzz).ts'],
};

console.log(config);

export default config;
