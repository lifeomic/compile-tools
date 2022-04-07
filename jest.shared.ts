import path from 'path';
import { lstatSync, readdirSync } from 'fs';
import inspector from 'inspector';
import { Config } from '@jest/types';
export { Config };

// get listing of packages in the mono repo
export const basePath = path.resolve(__dirname, 'packages');
export const packages = readdirSync(basePath).filter((name) => lstatSync(path.join(basePath, name)).isDirectory());
// If we are debugging then extend the timeout to max value, otherwise use the default.
const testTimeout = inspector.url() ? 1e8 : undefined;

export const rootConfig: Config.InitialOptions = {
  preset: '@lifeomic/jest-config',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coveragePathIgnorePatterns: [
    '.yarn',
    '<rootDir>/test',
  ],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  testTimeout,
};

const projectConfigsMap = packages.reduce<Record<string, Config.InitialProjectOptions>>((acc, packageName) => ({
  ...acc,
  [packageName]: {
    rootDir: path.join(basePath, packageName),
    displayName: { name: packageName, color: 'cyan' },
    testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
    transform: {
      '^.+\\.ts$': '@swc/jest',
    },
    // Started getting strange errors where the mocks weren't reset.  Moving these configs here fixed the issue...
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    verbose: true,
  },
}), {} as Record<string, Config.InitialProjectOptions>);

export const getProjectConfig = (dirName: string): Config.InitialProjectOptions => projectConfigsMap[path.basename(dirName)];

export const rootIntegrationConfig: Config.InitialOptions = {
  preset: '@lifeomic/jest-config',
  testEnvironment: 'node',
  collectCoverage: false,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  testTimeout,
};

const projectIntegrationConfigsMap = packages.reduce<Record<string, Config.InitialProjectOptions>>((acc, packageName) => ({
  ...acc,
  [packageName]: {
    rootDir: path.join(basePath, packageName),
    displayName: { name: packageName, color: 'cyan' },
    testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
    transform: {
      '^.+\\.ts$': '@swc/jest',
    },
    // Started getting strange errors where the mocks weren't reset.  Moving these configs here fixed the issue...
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    verbose: true,
  },
}), {} as Record<string, Config.InitialProjectOptions>);

export const getProjectIntegrationConfig = (dirName: string): Config.InitialProjectOptions =>
  projectIntegrationConfigsMap[path.basename(dirName)];
