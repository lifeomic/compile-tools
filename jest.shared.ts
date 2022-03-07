import path from 'path';
import { lstatSync, readdirSync } from 'fs';
import inspector from 'inspector';
import { Config } from '@jest/types';

// get listing of packages in the mono repo
export const basePath = path.resolve(__dirname, 'packages');
const packages = readdirSync(basePath).filter((name) => lstatSync(path.join(basePath, name)).isDirectory());

const isDebug = !!inspector.url();

export const rootConfig: Config.InitialOptions = {
  preset: '@lifeomic/jest-config',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  verbose: true,
  // If we are debugging then extend the timeout to max value, otherwise use the default.
  testTimeout: isDebug ? 1e8 : undefined,
};

export interface ProjectConfig {
  packageName: string;
  config: Config.InitialProjectOptions;
}

export const projectConfigs: ProjectConfig[] = packages.map((packageName) => ({
  packageName,
  config: {
    collectCoverageFrom: [`${basePath}/${packageName}/src/**/*.ts`],
    coveragePathIgnorePatterns: [
      '.yarn',
      `${basePath}/${packageName}/test`,
    ],
    testMatch: [`${basePath}/${packageName}/test/**/*.test.ts`],
    displayName: { name: packageName, color: 'cyan' },
    transform: {
      '^.+\\.ts$': '@swc/jest',
    },
    // Started getting strange errors where the mocks weren't reset.  Moving these configs here fixed the issue...
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    verbose: true,
  },
}));

export const projectConfigsMap = projectConfigs.reduce<Record<string, Config.InitialProjectOptions>>((acc, next) => ({
  ...acc,
  [next.packageName]: next.config,
}), {} as Record<string, Config.InitialProjectOptions>);

export const getProjectConfig = (dirName: string): Config.InitialProjectOptions => projectConfigsMap[path.basename(dirName)];
