import { Config } from '@lifeomic/compile-tool-webpack';

export const configTransformer: Config['configTransformer'] = (config) => {
  config.module?.rules?.push({
    test: /\.node$/,
    loader: 'node-loader',
    options: {
      name: 'node-file-[contentHash].[ext]',
    },
  });
  return config;
};
