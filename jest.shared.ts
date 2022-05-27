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

const colors = [
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
] as const;

const transform: Config.InitialProjectOptions['transform'] = {
  '^.+\\.tsx?$': '@swc/jest',
};

export const rootConfig: Config.InitialOptions = {
  rootDir: __dirname,
  coverageDirectory: '<rootDir>/coverage',
  preset: '@lifeomic/jest-config',
  testEnvironment: 'node',
  collectCoverage: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  transform,
  verbose: true,
  testTimeout,
};

const projectConfigsMap = packages.reduce<Record<string, Config.InitialProjectOptions>>((acc, packageName, idx) => ({
  ...acc,
  [packageName]: {
    rootDir: path.join(basePath, packageName),
    displayName: { name: packageName, color: colors[idx % colors.length] },
    testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
    transform,
    // Started getting strange errors where the mocks weren't reset.  Moving these configs here fixed the issue...
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
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

const projectIntegrationConfigsMap = packages.reduce<Record<string, Config.InitialProjectOptions>>((acc, packageName, idx) => ({
  ...acc,
  [packageName]: {
    collectCoverageFrom: [
      '<rootDir>/src/**/*.ts',
    ],
    rootDir: path.join(basePath, packageName),
    displayName: { name: packageName, color: colors[idx % colors.length] },
    testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
    transform,
    // Started getting strange errors where the mocks weren't reset.  Moving these configs here fixed the issue...
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
  },
}), {} as Record<string, Config.InitialProjectOptions>);

export const getProjectIntegrationConfig = (dirName: string): Config.InitialProjectOptions =>
  projectIntegrationConfigsMap[path.basename(dirName)];
