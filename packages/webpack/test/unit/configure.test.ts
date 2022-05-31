import { ulid } from 'ulid';
import { resolve } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { DefinePlugin, NormalModuleReplacementPlugin } from 'webpack';

import { createConfiguration } from '../../src/configure';
import { loadPatch } from '../../src/patches';

import { Project1Lambdas } from '../testProject1';
import { getLambdaFile } from '../shared/projects';
import { PatchPnpResolver } from '../../src/patchPnpResolver';

const CALLER_NODE_MODULES = 'node_modules';
const LAMBDA_TOOLS_NODE_MODULES = resolve(__dirname, '..', '..', 'node_modules');

jest.mock('../../src/patches');
jest.mock('webpack', () => ({
  DefinePlugin: jest.fn(),
  NormalModuleReplacementPlugin: jest.fn(),
  config: jest.requireActual('webpack').config,
}));

jest.mock('terser-webpack-plugin');

const defaultEntryPoint = {
  [`${Project1Lambdas.lambdaService}.js`]: [getLambdaFile({ lambda: Project1Lambdas.lambdaService })],
};

const pnpVersion = process.versions.pnp;
beforeEach(() => {
  process.versions.pnp = pnpVersion;
});

afterEach(() => {
  delete process.env.WEBPACK_MODE;
  process.versions.pnp = pnpVersion;
});

test('will set up for non pnp', async () => {
  delete process.versions.pnp;
  const configuration = await createConfiguration({ entrypoint: getLambdaFile({ lambda: Project1Lambdas.lambdaService }) });
  expect(configuration.webpackConfig).toEqual(expect.objectContaining({
    resolve: {
      extensions: ['.js', '.ts', '.mjs', '.cjs'],
      modules: [CALLER_NODE_MODULES, LAMBDA_TOOLS_NODE_MODULES],
    },
    resolveLoader: {
      modules: [LAMBDA_TOOLS_NODE_MODULES, CALLER_NODE_MODULES],
    },
  }));
});

test('will set defaults', async () => {
  const configuration = await createConfiguration({ entrypoint: getLambdaFile({ lambda: Project1Lambdas.lambdaService }) });
  expect(configuration.webpackConfig).toEqual(expect.objectContaining({
    entry: defaultEntryPoint,
    output: {
      path: process.cwd(),
      libraryTarget: 'commonjs',
      filename: '[name]',
    },
    resolve: {
      extensions: ['.js', '.ts', '.mjs', '.cjs'],
      plugins: [expect.any(PatchPnpResolver)],
    },
    resolveLoader: {
      plugins: [expect.any(PatchPnpResolver)],
    },
    devtool: undefined,
    optimization: { minimize: false },
    mode: 'production',
  }));
  expect(configuration.webpackConfig.plugins).toHaveLength(3);
  expect(configuration).toHaveProperty('outputDir', process.cwd());
  expect(configuration).toHaveProperty('entries', defaultEntryPoint);
  expect(NormalModuleReplacementPlugin).toBeCalledWith(/^any-promise$/, 'core-js/fn/promise');
  expect(DefinePlugin).toBeCalledWith({
    'global.GENTLY': false,
    'process.env.LIFEOMIC_SERVICE_NAME': '\'test-service\'',
  });
  expect(loadPatch).toBeCalledWith('lambda');
  expect(loadPatch).not.toBeCalledWith('dns');
});

test('can override defaults', async () => {
  process.env.WEBPACK_MODE = 'development';
  const serviceName = ulid();
  const outputPath = '/some/output/path';
  const configTransformer = jest.fn().mockImplementation(async (config: Record<string, any>) => Promise.resolve({
    ...config,
    watch: true,
  }));
  const configuration = await createConfiguration({
    entrypoint: getLambdaFile({ lambda: Project1Lambdas.tsLambdaService, ext: 'ts' }),
    serviceName,
    configTransformer,
    enableRuntimeSourceMaps: true,
    enableDnsRetry: true,
    outputPath,
    minify: true,
    zip: true,
    folderBased: true,
  });
  const entries = {
    [`${Project1Lambdas.tsLambdaService}.js`]: ['source-map-support/register', getLambdaFile({ lambda: Project1Lambdas.tsLambdaService, ext: 'ts' })],
  };

  expect(configuration.webpackConfig).toEqual(expect.objectContaining({
    entry: entries,
    output: {
      path: outputPath,
      libraryTarget: 'commonjs',
      filename: '[name]',
    },
    resolve: {
      extensions: ['.js', '.ts', '.mjs', '.cjs'],
      plugins: [expect.any(PatchPnpResolver)],
    },
    resolveLoader: {
      plugins: [expect.any(PatchPnpResolver)],
    },
    devtool: 'source-map',
    optimization: expect.objectContaining({ minimize: true }),
    mode: 'development',
    watch: true,
  }));
  expect(configuration.webpackConfig.plugins).toHaveLength(6);
  expect(configuration).toHaveProperty('outputDir', outputPath);
  expect(configuration).toHaveProperty('entries', entries);
  expect(NormalModuleReplacementPlugin).toBeCalledWith(/^any-promise$/, 'core-js/fn/promise');
  expect(TerserPlugin).toBeCalledWith({ terserOptions: { sourceMap: true } });
  expect(DefinePlugin).toBeCalledWith({
    'global.GENTLY': false,
    'process.env.LIFEOMIC_SERVICE_NAME': `'${serviceName}'`,
  });
  expect(loadPatch).toBeCalledWith('lambda');
  expect(loadPatch).toBeCalledWith('dns');
});
