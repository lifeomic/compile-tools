/* eslint-disable @typescript-eslint/no-require-imports */

import { Config, Context, Options } from 'semantic-release';
import { inc, ReleaseType } from 'semver';

export type FullContext = Config & Omit<Context, 'env'>;

export interface Plugins {
  verifyConditions: (context: FullContext) => Promise<void>;
  analyzeCommits: (context: FullContext) => Promise<ReleaseType>;
  verifyRelease: (context: FullContext) => Promise<void>;
  generateNotes: (context: FullContext) => Promise<void>;
  prepare: (context: FullContext) => Promise<void>;
  publish: (context: FullContext) => Promise<void>;
  addChannel: (context: FullContext) => Promise<void>;
  success: (context: FullContext) => Promise<void>;
  fail: (context: FullContext) => Promise<void>;
}

export type GetConfig = (context: Config, cliOptions: Options) => Promise<{ options: Options; plugins: Plugins }>;
const getConfig = require('semantic-release/lib/get-config') as GetConfig;

export type GetLogger = (config: Config) => FullContext['logger'];
const getLogger = require('semantic-release/lib/get-logger') as GetLogger;

export interface MonoRepoSemReleaseContext {
  context: FullContext;
  options: Options;
  plugins: Plugins;
}
export const createConfig = async (cwd: string): Promise<MonoRepoSemReleaseContext> => {
  const config: Config = {
    cwd,
    env: {
      ...(process.env as Record<string, string>),
    },
    stdout: process.stdout,
    stderr: process.stderr,
  };
  const context: FullContext = {
    ...config,
    logger: getLogger(config),
  };
  const { options, plugins } = await getConfig({}, context);
  return {
    options,
    plugins,
    context,
  };
};

export const getNextVersion = async (
  { plugins, context }: MonoRepoSemReleaseContext,
): Promise<ReleaseType | undefined> => {
  const type = await plugins.analyzeCommits(context);
  return type ? inc(context.lastRelease?.version ?? '0.0.0', type) : undefined;
};
