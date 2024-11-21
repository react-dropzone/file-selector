/** @type {import('ts-jest').ProjectConfigTsJest} **/
module.exports = {
    testEnvironment: 'jsdom',
    "setupFilesAfterEnv": [
      "<rootDir>/test-setup.js"
    ],
    transform: {
      '^.+.tsx?$': [
        'ts-jest',
        {
          tsconfig: 'tsconfig.spec.json',
        },
      ],
    },
};
