import path from 'path';
import chalk from 'chalk';
import JSZip from 'jszip';
import rawGlob from 'glob';
import { ulid } from 'ulid';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { AsyncSeriesHook } from 'tapable';
import { basename, join, relative } from 'path';
import { Compiler, Stats, WebpackError } from 'webpack';
import { mock, mockFn, mockDeep } from 'jest-mock-extended';

import { compile, Config } from '../../src';
import {
  ZipAssetsPlugin,
  zipOutputFiles,
  WebpackLogger,
  processStats,
  makeFilePathRelativeToCwd,
} from '../../src/zipAssetsPlugin';

import { copyRecursive } from './helpers';
import { testProject1Dir } from '../testProject1';
import { testProject3ir } from '../testProject3';

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

test('will return non cwd full file path', () => {
  const file = '/dir/to/file.js';
  expect(makeFilePathRelativeToCwd(file)).toBe(file);
});

test('will return the relative portion of the path', () => {
  const expected = `./${relative(process.cwd(), __filename)}`;
  expect(makeFilePathRelativeToCwd(__filename)).toBe(expected);
});

test('zipOutputFiles will zip files for us', async () => {
  await copyRecursive(join(testProject1Dir, 'zip'), testBuildDir);
  const entries = ['first.js', 'second.js', 'third/third.js'];
  await expect(zipOutputFiles(logger, testBuildDir, entries.reduce((acc, entryName) => ({ ...acc, [entryName]: [entryName] }), {}))).resolves.not.toThrow();
  await Promise.all(entries.map(async (name) => {
    const zip = new JSZip();
    const zipFileName = join(testBuildDir, `${name}.zip`);
    await expect(fs.stat(zipFileName)).resolves.not.toThrow();
    await zip.loadAsync(await fs.readFile(zipFileName));
    expect(zip.file(basename(name))).not.toBeNull();
    if (name === 'second.js') {
      expect(zip.file(`${name}.png`)).not.toBeNull();
    }
  }));
});

test('will zip output files', async () => {
  const config: Config = {
    outputPath: testBuildDir,
    entrypoint: path.join(testProject3ir, 'sharp.ts'),
    zip: true,
    configTransformer: (config) => {
      config.module!.rules!.push({
        test: /\.node$/,
        loader: 'node-loader',
        options: {
          name: 'node-file-[contentHash].[ext]',
        },
      });
      return config;
    },
  };

  const results = await compile(config);
  expect(results).not.toBeUndefined();
  const files = await glob(path.join(testBuildDir, 'node-file-*.node'));

  const zip = new JSZip();
  const zipFileName = join(testBuildDir, 'sharp.js.zip');
  await expect(fs.stat(zipFileName)).resolves.not.toThrow();
  await zip.loadAsync(await fs.readFile(zipFileName));
  expect(zip.file('sharp.js')).not.toBeNull();
  files.forEach((file) => {
    const relativeName = path.relative(testBuildDir, file);
    expect(zip.file(relativeName)).not.toBeNull();
  });
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
    `ZipAssetsPlugin: outputDir: ${chalk.bold(process.cwd())} entrypoints: [${
      [...entrypoints.keys()].map((name) => chalk.bold(name)).join(', ')}]`,
  );
  expect(logger.warn).toBeCalledWith('ZipAssetsPlugin: Not running because of errors');
});

test('will set up to process stats', () => {
  const compiler = mock<Compiler>();
  compiler.hooks = mock();

  const tapPromise = mockFn<AsyncSeriesHook<[Stats]>['tapPromise']>();
  compiler.hooks.done.tapPromise = tapPromise;

  compiler.getInfrastructureLogger.mockReturnValue(logger);

  const plugin = new ZipAssetsPlugin();
  plugin.apply(compiler);

  expect(compiler.getInfrastructureLogger).toBeCalledWith('@lifeomic/compile-tools-webpack-zip-asset-plugin');
  expect(tapPromise).toBeCalledWith('@lifeomic/compile-tools-webpack-zip-asset-plugin', expect.any(Function));
});
