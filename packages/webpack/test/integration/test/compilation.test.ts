import { spawnSync } from 'child_process';
import { BUILD_ENV, handleSpawnResults } from './utils';

import { ulid } from 'ulid';
import { promises as fs } from 'fs';
import { join } from 'path';
import JsZip from 'jszip';
import { getLambdaFile, Lambdas, tmpProjectDir } from '../../fixtures';
import { fileExists } from '../../unit/helpers';

let testBuildDir: string;

beforeEach( async() => {
  testBuildDir = join(tmpProjectDir, 'build', ulid());
  await fs.mkdir(testBuildDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testBuildDir, { recursive: true, force: true });
});

test('Lambda archives can be produced', async () => {
  const bundle = join(testBuildDir, `${Lambdas.lambdaService}.js.zip`);
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    '-z',
    getLambdaFile({ lambda: Lambdas.lambdaService }),
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);

  const zip = new JsZip();
  await zip.loadAsync(await fs.readFile(bundle));
  expect(zip.file(`${Lambdas.lambdaService}.js`)).not.toBeNull();
});

test('Lambda archives can be produced repeatedly', async () => {
  const bundle = join(testBuildDir, `${Lambdas.lambdaService}.js.zip`);
  const build = () => spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    '-z',
    getLambdaFile({ lambda: Lambdas.lambdaService }),
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });

  handleSpawnResults(build());
  handleSpawnResults(build());

  const zip = new JsZip();
  await zip.loadAsync(await fs.readFile(bundle));
  expect(zip.file(`${Lambdas.lambdaService}.js`)).not.toBeNull();
  expect(zip.file(`${Lambdas.lambdaService}.js.zip`)).toBeNull();
});

test('multiple bundles can be produced at one time', async () => {
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    getLambdaFile({ lambda: Lambdas.lambdaService }),
    getLambdaFile({ lambda: Lambdas.asyncTest }),
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  await expect(fileExists(join(testBuildDir, `${Lambdas.lambdaService}.js`))).resolves.toBe(true);
  await expect(fileExists(join(testBuildDir, `${Lambdas.asyncTest}.js`))).resolves.toBe(true);
});

test('multiple bundles can be produced at one time with mixed source types', async () => {
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    getLambdaFile({ lambda: Lambdas.lambdaService }),
    getLambdaFile({ lambda: Lambdas.tsLambdaService, ext: 'ts' }),
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  await expect(fileExists(join(testBuildDir, `${Lambdas.lambdaService}.js`))).resolves.toBe(true);
  await expect(fileExists(join(testBuildDir, `${Lambdas.tsLambdaService}.js`))).resolves.toBe(true);
});

test('bundles can use custom names', async () => {
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    `${getLambdaFile({ lambda: Lambdas.lambdaService })}:service.js`,
    `${getLambdaFile({ lambda: Lambdas.tsLambdaService, ext: 'ts' })}:lambda/tsService.js`,
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  await expect(fileExists(join(testBuildDir, 'service.js'))).resolves.toBe(true);
  await expect(fileExists(join(testBuildDir, 'lambda', 'tsService.js'))).resolves.toBe(true);
});

test('bundles with custom names can be zipped', async () => {
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    '-z',
    `${getLambdaFile({ lambda: Lambdas.lambdaService })}:service.js`,
    `${getLambdaFile({ lambda: Lambdas.tsLambdaService, ext: 'ts' })}:lambda/tsService.js`,
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  await expect(fileExists(join(testBuildDir, 'service.js.zip'))).resolves.toBe(true);
  await expect(fileExists(join(testBuildDir, 'lambda', 'tsService.js.zip'))).resolves.toBe(true);
});

test('Expand input entrypoint directory into multiple entrypoints', async () => {
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    '-z',
    join(tmpProjectDir, 'multi-lambdas'),
  ], {
    cwd: tmpProjectDir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  for (const funcName of ['func1', 'func2', 'func3', 'func4']) {
    const bundlePath = join(testBuildDir, `${funcName}.js.zip`);
    await expect(fileExists(bundlePath)).resolves.toBe(true);
    const zip = new JsZip();
    await zip.loadAsync(await fs.readFile(bundlePath));
    expect(zip.file(`${funcName}.js`)).not.toBeNull();
  }
});
