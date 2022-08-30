import chalk from 'chalk';
import { ulid } from 'ulid';
import rawGlob from 'glob';
import { AsyncSeriesHook } from 'tapable';
import { Compiler, Stats, WebpackError } from 'webpack';
import { mock, mockFn, mockDeep } from 'jest-mock-extended';

import { processStats, WebpackLogger, AssetsDirPlugin } from '../../src/assetsDirPlugin';
import { compile, Config } from '../../src';
import path, { join } from 'path';
import { testProject3ir } from '../testProject3';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { dirExists, fileExists } from '../shared/utils';

const glob = promisify(rawGlob);
const logger = mockDeep<WebpackLogger>();

let testBuildDir: string;

beforeEach(async () => {
  testBuildDir = join(__dirname, 'build', ulid());
  await fs.mkdir(testBuildDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testBuildDir, { recursive: true, force: true });
});

test('will copy files to output dir', async () => {
  const config: Config = {
    outputPath: testBuildDir,
    entrypoint: path.join(testProject3ir, 'sharp.ts'),
    folderBased: true,
    configTransformer: (config) => {
      config.module!.rules!.push({
        test: /\.node$/,
        loader: 'node-loader',
        options: {
          name: 'build/release/[contentHash].[ext]',
        },
      });
      return config;
    },
  };

  const results = await compile(config);
  expect(results).not.toBeUndefined();
  await expect(dirExists(testBuildDir, 'sharp.js.dir')).resolves.toBe(true);
  await expect(fileExists(testBuildDir, 'sharp.js.dir', 'sharp.js')).resolves.toBe(true);

  const files = await glob(path.join('build', 'release', '*.node'), { cwd: testBuildDir });
  await Promise.all(files.map((file) => expect(fileExists(testBuildDir, 'sharp.js.dir', file))));
}, 30e3);


test('will not run when errors', async () => {
  const stats = mock<Stats>();
  const compilation = mock<Stats['compilation']>();
  stats.compilation = compilation;
  compilation.errors = [mock<WebpackError>()];
  const entrypoints: Stats['compilation']['entrypoints'] = new Map();
  compilation.entrypoints = entrypoints;
  entrypoints.set(ulid(), mock());

  await expect(processStats(logger, stats)).resolves.not.toThrow();

  expect(logger.info).toBeCalledWith(
    `AssetsDirectoryPlugin: outputDir: ${chalk.bold(process.cwd())} entrypoints: [${
      [...entrypoints.keys()].map((name) => chalk.bold(name)).join(', ')}]`,
  );
  expect(logger.warn).toBeCalledWith('AssetsDirectoryPlugin: Not running because of errors');
});

test('will set up to process stats', () => {
  const compiler = mock<Compiler>();
  compiler.hooks = mock();

  const tapPromise = mockFn<AsyncSeriesHook<[Stats]>['tapPromise']>();
  compiler.hooks.done.tapPromise = tapPromise;

  compiler.getInfrastructureLogger.mockReturnValue(logger);

  const plugin = new AssetsDirPlugin();
  plugin.apply(compiler);

  expect(compiler.getInfrastructureLogger).toBeCalledWith('@lifeomic/compile-tools-webpack-assets-directory-plugin');
  expect(tapPromise).toBeCalledWith('@lifeomic/compile-tools-webpack-assets-directory-plugin', expect.any(Function));
});
