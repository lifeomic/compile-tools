import type { RuleSetRule } from 'webpack';
import type { Config } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelEnvDeps = require('webpack-babel-env-deps');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelPresetTypescript = require('@babel/preset-typescript');

const DEFAULT_NODE_VERSION = '14.14.0';

export const createRules = (
  {
    cacheDirectory,
    tsconfig,
    transpileOnly,
    nodeVersion = DEFAULT_NODE_VERSION,
  }: Pick<Config, 'cacheDirectory' | 'tsconfig' | 'nodeVersion' | 'transpileOnly'>,
): RuleSetRule[] => {
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

  let tsRule: RuleSetRule;
  if (tsconfig) {
    tsRule = {
      use: [
        babelLoader,
        {
          loader: 'ts-loader',
          options: {
            configFile: tsconfig,
            transpileOnly: transpileOnly,
          },
        },
      ],
    };

  } else {
    tsRule = {
      ...babelLoaderConfig,
      options: {
        cacheDirectory,
        presets: [
          babelEnvConfig,
          babelPresetTypescript,
        ],
      },
    };
  }

  return [
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
  ];
};
