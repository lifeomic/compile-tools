import { Configuration } from 'webpack';
import type { RuleSetRule } from 'webpack';
import type { Config } from '../types';
import { DEFAULT_NODE_VERSION } from '../utils';

export const configure = (
  webpackConfig: Configuration,
  {
    cacheDirectory,
    nodeVersion = DEFAULT_NODE_VERSION,
  }: Pick<Config, 'cacheDirectory' | 'nodeVersion'>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const babelEnvDeps = require('webpack-babel-env-deps');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const babelPresetTypescript = require('@babel/preset-typescript');

  if (!webpackConfig.module) {
    webpackConfig.module = {};
  }

  if (!webpackConfig.module.rules) {
    webpackConfig.module.rules = [];
  }

  const babelEnvConfig = [
    '@babel/preset-env',
    {
      targets: {
        node: nodeVersion,
      },
    },
  ];

  const babelLoaderConfig = {
    exclude: [babelEnvDeps.exclude({ engines: { node: `>=${nodeVersion}` } })],
    loader: 'babel-loader',
  };

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      cacheDirectory,
      presets: [babelEnvConfig],
      plugins: [],
    },
  };

  const tsRule: RuleSetRule = {
    ...babelLoaderConfig,
    options: {
      cacheDirectory,
      presets: [
        babelEnvConfig,
        babelPresetTypescript,
      ],
    },
  };

  webpackConfig.module.rules.push(
    // See https://github.com/bitinn/node-fetch/issues/493
    {
      type: 'javascript/auto',
      test: /\.mjs$/,
      use: [],
    },
    {
      test: /\.c?js$/,
      ...babelLoader,
    },
    {
      test: /\.ts$/,
      ...tsRule,
    },
  );
};
