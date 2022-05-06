import type { Stats } from 'webpack';
import { mock } from 'jest-mock-extended';
import { ulid } from 'ulid';
import path from 'path';
import { promises as fs } from 'fs';

import { handleWebpackResults, logger } from '../../src/utils';

let testBuildDir: string;

beforeEach(async () => {
  jest.spyOn(logger, 'info').mockReturnValue();
  testBuildDir = path.join(__dirname, 'build', ulid());
  await fs.mkdir(testBuildDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testBuildDir, { recursive: true, force: true });
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
