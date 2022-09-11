import type { InitialOptionsTsJest } from 'ts-jest';

const config: InitialOptionsTsJest = {
  testEnvironment: 'jsdom',
  // See: https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.test.json'
      }
    ]
  }
};

export default config;
