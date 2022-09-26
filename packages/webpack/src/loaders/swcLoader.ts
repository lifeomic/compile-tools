import { Configuration } from 'webpack';

export const configure = (
  webpackConfig: Configuration,
) => {
  if (!webpackConfig.module) {
    webpackConfig.module = {};
  }

  if (!webpackConfig.module.rules) {
    webpackConfig.module.rules = [];
  }

  webpackConfig.module.rules.push(
    {
      test: /\.[m|c]?[jt]s$/,
      use: {
        loader: 'swc-loader',
      },
    },
  );
};
