import type { Config, Mode } from './types';
import { DefinePlugin } from 'webpack';
import type { Configuration } from 'webpack';
import { getEntries } from './entries';
import { loadPatch } from './patches';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { ZipAssetsPlugin } from './zipAssetsPlugin';
import { PatchPnpResolver } from './patchPnpResolver';
import { AssetsDirPlugin } from './assetsDirPlugin';
import { setupLoaders } from './loaders';

const CALLER_NODE_MODULES = 'node_modules';
const LIB_NODE_MODULES = path.resolve(__dirname, '..', 'node_modules');

export interface ConfigureResults {
  webpackConfig: Configuration;
  outputDir: string;
  entries: Record<string, string[]>;
}

export const createConfiguration = async (config: Config): Promise<ConfigureResults> => {
  const {
    entrypoint,
    serviceName = 'test-service',
    configTransformer = (config: Configuration) => Promise.resolve(config),
    enableRuntimeSourceMaps,
    enableDnsRetry,
    enableLambdaPatch,
    outputPath = process.cwd(),
    minify,
    zip,
    folderBased,
  } = config;
  const entries = await getEntries(entrypoint, enableRuntimeSourceMaps);
  const plugins: Configuration['plugins'] = [
    new DefinePlugin({
      'global.GENTLY': false,
      'process.env.LIFEOMIC_SERVICE_NAME': `'${serviceName}'`,
    }),
  ];

  if (enableLambdaPatch) {
    plugins.push(await loadPatch('lambda'));
  }

  if (enableDnsRetry) {
    plugins.push(await loadPatch('dns'));
  }
  if (zip) {
    plugins.push(new ZipAssetsPlugin());
  }
  if (folderBased) {
    plugins.push(new AssetsDirPlugin());
  }

  const outputDir = path.resolve(outputPath);

  const optimization = minify
    ? { minimize: true, minimizer: [new TerserPlugin({ terserOptions: { sourceMap: true } })] }
    : { minimize: false };

  const devtool = enableRuntimeSourceMaps
    ? 'source-map'
    : undefined;

  const resolve: Configuration['resolve'] = {
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
  };
  const resolveLoader: Configuration['resolveLoader'] = {};

  if (!process.versions.pnp) {
    // Since build is being called by other packages dependencies may be
    // relative to the caller or us. This cause our node modules to be
    // searched if a dependency can't be found in the caller's.
    resolve.modules = [CALLER_NODE_MODULES, LIB_NODE_MODULES];

    // Since build is being called by other packages dependencies may be
    // relative to the caller or us. This puts our node_modules on the
    // resolver path before trying to use the caller's.
    resolveLoader.modules = [LIB_NODE_MODULES, CALLER_NODE_MODULES];
  } else {
    resolve.plugins = [
      new PatchPnpResolver(),
    ];
    resolveLoader.plugins = [
      new PatchPnpResolver(),
    ];
  }

  const rawConfig: Configuration = {
    entry: entries,
    output: {
      path: outputDir,
      libraryTarget: 'commonjs',
      // Zipped bundles use explicit output names to determine the archive name
      filename: '[name]',
    },
    devtool,
    plugins,
    mode: (process.env.WEBPACK_MODE || 'production') as Mode,
    optimization,
    resolve,
    resolveLoader,
    target: 'node',
    externals: {
      'aws-sdk': 'aws-sdk',
      // crypto-browserify is a port of Node's crypto package for browsers.
      // However, it tends to be less reliable than the native crypto. This
      // causes native crypto to be used instead.
      'crypto-browserify': 'crypto',
      'dtrace-provider': 'dtrace-provider',
      'vertx': 'vertx',
    },
    stats: {
      errors: true,
      errorStack: true,
      errorDetails: true,
      logging: true,
      loggingDebug: true,
    },
  };
  setupLoaders(rawConfig, config);

  const webpackConfig: Configuration = await configTransformer(rawConfig);

  return { webpackConfig, outputDir, entries };
};
