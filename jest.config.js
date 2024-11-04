import { createDefaultEsmPreset } from "ts-jest";

const defaultPreset = createDefaultEsmPreset();

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  ...defaultPreset,
  testEnvironment: "jsdom",
  // Convert `.js` imports to one without an extension to support 'NodeNext' module resolution.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default jestConfig;
