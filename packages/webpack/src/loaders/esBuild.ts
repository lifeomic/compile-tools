import { Configuration } from 'webpack';
import { DEFAULT_NODE_VERSION } from '../utils';
import { Config } from '../types';

export const configure = (
  webpackConfig: Configuration,
  {
    nodeVersion = DEFAULT_NODE_VERSION,
    tsconfig,
  }: Pick<Config, 'nodeVersion' | 'tsconfig'>,
) => {
  if (!webpackConfig.module) {
    webpackConfig.module = {};
  }

  if (!webpackConfig.module.rules) {
    webpackConfig.module.rules = [];
  }
  let tsconfigRaw: Record<string, any> | undefined;
  if (tsconfig) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tsconfigRaw = require(tsconfig);
  }

  const target = `node${nodeVersion}`;

  webpackConfig.module.rules.push(
    {
      test: /\.[m|c]?js$/,
      loader: 'esbuild-loader',
      options: {
        target,
      },
    },
    {
      test: /\.ts$/,
      loader: 'esbuild-loader',
      options: {
        loader: 'ts',
        target,
        tsconfigRaw,
      },
    },
  );
};
