import { ulid } from 'ulid';
import * as allWebpack from 'webpack';
import type { Stats, Compiler, Configuration } from 'webpack';
import { mock, MockProxy } from 'jest-mock-extended';

import { Project1Lambdas } from '../testProject1';

import { compile } from '../../src';
import * as rawConfig from '../../src/configure';
import * as rawUtils from '../../src/utils';
import { getLambdaFile } from '../shared/projects';

jest.mock('../../src/configure');
jest.mock('../../src/utils');
jest.mock('webpack', () => ({
  config: jest.requireActual('webpack').config,
  webpack: jest.fn(),
}));

const { webpack } = allWebpack as MockProxy<typeof allWebpack>;
const { createConfiguration } = rawConfig as MockProxy<typeof rawConfig>;
const { handleWebpackResults, zipOutputFiles } = rawUtils as MockProxy<typeof rawUtils>;

const setupEnv = (error?: Error) => {
  const webpackResult = mock<Stats>();
  const expectedConfig: Configuration = {
    context: ulid(),
  };
  const entries = {
    [ulid()]: [ulid()],
  };
  createConfiguration.mockResolvedValue({
    webpackConfig: expectedConfig,
    outputDir: __dirname,
    entries,
  });

  const webpackImpl = (config: Configuration, fn: (err: Error | undefined, stats: Stats | undefined) => void) => {
    expect(config).toBe(expectedConfig);
    fn(error, webpackResult);
    return mock<Compiler>();
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  webpack.mockImplementation(webpackImpl as any);
  return {
    webpackResult,
    entries,
  };
};

test('will orchestrate a build, and return result', async () => {
  const { webpackResult } = setupEnv();
  await expect(compile({ entrypoint: getLambdaFile({ lambda: Project1Lambdas.lambdaService }) })).resolves
    .toBe(webpackResult);

  expect(handleWebpackResults).toBeCalledWith(webpackResult);
  expect(zipOutputFiles).not.toBeCalled();
});

test('will zip results', async () => {
  const { webpackResult, entries } = setupEnv();
  await expect(compile({ entrypoint: getLambdaFile({ lambda: Project1Lambdas.lambdaService }), zip: true })).resolves
    .toBe(webpackResult);

  expect(handleWebpackResults).toBeCalledWith(webpackResult);
  expect(zipOutputFiles).toBeCalledWith(__dirname, Object.keys(entries));
});

test('will throw webpack exceptions', async () => {
  const error = new Error(ulid());
  setupEnv(error);
  await expect(compile({ entrypoint: getLambdaFile({ lambda: Project1Lambdas.lambdaService }) })).rejects.toThrow(error);
});
