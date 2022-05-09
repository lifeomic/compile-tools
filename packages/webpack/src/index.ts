import {
  webpack,
  Stats,
} from 'webpack';

import { handleWebpackResults } from './utils';
import { Config } from './types';
import { createConfiguration } from './configure';

export * from './types';

export const compile = async (
  config: Config,
) => {
  const { webpackConfig } = await createConfiguration(config);
  const webpackResult = await new Promise<Stats | undefined>((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });

  handleWebpackResults(webpackResult);

  return webpackResult;
};
