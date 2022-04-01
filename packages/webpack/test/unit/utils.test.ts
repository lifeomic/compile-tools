import type { Stats } from 'webpack';
import { mock } from 'jest-mock-extended';
import { ulid } from 'ulid';
import { join, basename, relative } from 'path';
import { promises as fs } from 'fs';
import JSZip from 'jszip';

import { handleWebpackResults, logger, makeFilePathRelativeToCwd, zipOutputFiles } from '../../src/utils';
import { projectsDir } from '../fixtures';
import { copyRecursive } from './helpers';

let testBuildDir: string;

beforeEach(async () => {
  jest.spyOn(logger, 'info').mockReturnValue();
  testBuildDir = join(__dirname, 'build', ulid());
  await fs.mkdir(testBuildDir, { recursive: true });
});

afterEach(async () => {
  // await fs.rm(testBuildDir, { recursive: true, force: true });
});

describe('handleWebpackResults', () => {

  test('will throw if no webpack result', () => {
    expect(() => handleWebpackResults()).toThrowError('compilation_error');
  });

  test('will throw if results has errors', () => {
    const stats = mock<Stats>();
    stats.hasErrors.mockReturnValue(true);

    expect(() => handleWebpackResults(stats)).toThrowError('compilation_error');
  });

  test('will log results', () => {
    const stats = mock<Stats>();

    // @ts-expect-error
    stats.toString = jest.fn().mockReturnValue('webpack results');

    expect(() => handleWebpackResults(stats)).not.toThrow();

    expect(logger.info).toBeCalledWith('Webpack compilation result:\n', 'webpack results');
    expect(stats.toString).toBeCalledWith({
      colors: expect.any(Boolean),
      chunks: false,
      maxModules: 0,
      moduleTrace: false,
    });
  });
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
  await copyRecursive(join(projectsDir, 'zip'), testBuildDir);
  const entries = ['first.js', 'second.js', 'third/third.js'];
  await expect(zipOutputFiles(testBuildDir, entries)).resolves.not.toThrow();
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

