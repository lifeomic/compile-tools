import { Config } from '@lifeomic/compile-tool-webpack';

export const configTransformer: Config['configTransformer'] = (config) => {
  if (!config.module) {
    config.module = {};
  }

  if (!config.module.rules) {
    config.module.rules = [];
  }

  config.module.rules.push({
    test: /\.node$/,
    loader: 'node-loader',
    options: {
      name: 'node-file-[contentHash].[ext]',
    },
  });

  return config;
};
