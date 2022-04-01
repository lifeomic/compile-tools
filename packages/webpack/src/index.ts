import {
  webpack,
  Stats,
} from 'webpack';

import { handleWebpackResults, zipOutputFiles } from './utils';
import { Config } from './types';
import { createConfiguration } from './configure';

export * from './types';

export const compile = async (
  config: Config,
) => {
  const { webpackConfig, outputDir, entries } = await createConfiguration(config);
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

  if (config.zip) {
    await zipOutputFiles(outputDir, Object.keys(entries));
  }

  return webpackResult;
};
