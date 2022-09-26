import { Configuration } from 'webpack';
import type { RuleSetRule } from 'webpack';
import type { Config } from '../types';

const DEFAULT_NODE_VERSION = '16.x.x';

export const configure = (
  webpackConfig: Configuration,
  {
    cacheDirectory,
    tsconfig,
    transpileOnly,
    nodeVersion = DEFAULT_NODE_VERSION,
  }: Pick<Config, 'cacheDirectory' | 'tsconfig' | 'nodeVersion' | 'transpileOnly'>,
) => {
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

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      cacheDirectory,
      presets: [babelEnvConfig],
      plugins: [],
    },
  };

  const tsRule: RuleSetRule = {
    use: [
      babelLoader,
      {
        loader: 'ts-loader',
        options: {
          configFile: tsconfig,
          transpileOnly,
        },
      },
    ],
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
