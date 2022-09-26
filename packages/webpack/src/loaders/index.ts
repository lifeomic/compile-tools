import { configure as configureBabel } from './babel';
import { configure as configureEsbuild } from './esBuild';
import { configure as configureSwc } from './swcLoader';
import { configure as configureTsLoader } from './tsLoader';
import { Config } from '../types';
import { Configuration } from 'webpack';

export const setupLoaders = (
  webpackConfig: Configuration,
  config: Config,
) => {
  if (config.addBabelLoader) {
    return configureBabel(webpackConfig, config);
  } else if (config.addEsbuildLoader) {
    return configureEsbuild(webpackConfig, config);
  } else if (config.addSwcLoader) {
    return configureSwc(webpackConfig);
  } else if (config.addTsLoader) {
    return configureTsLoader(webpackConfig, config);
  }
};
