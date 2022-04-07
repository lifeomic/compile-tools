import { promises as fs } from 'fs';
import { join, resolve, basename } from 'path';

import { getEntries, parseEntrypoint } from '../../src/entries';
import { projectsDir, Lambdas, getLambdaFile } from '../fixtures';

const serviceProjectLambdasDir = join(projectsDir, 'lambdas');
const filesPromise = fs.readdir(serviceProjectLambdasDir);

test.each<[string, string | undefined]>([
  [getLambdaFile({ lambda: Lambdas.lambdaService }), undefined],
  [getLambdaFile({ lambda: Lambdas.lambdaService, ext: 'ts' }), undefined],
  [getLambdaFile({ lambda: Lambdas.lambdaService }), 'test-service'],
])('%# parseEntrypoint will return file path and name', (fileName, name) => {
  const entrypoint = `${fileName}${name ? `:${name}` : ''}`;
  const expectedName = name ?? basename(fileName).replace(/\.ts$/, '.js');
  expect(parseEntrypoint(entrypoint)).toEqual({
    file: resolve(fileName),
    name: expectedName,
  });
});

describe('getEntries', () => {
  test('can return a single file entrypoint', async () => {
    const fileName = `${Lambdas.lambdaService}.js`;
    const entryPoints = await getEntries(getLambdaFile({ lambda: Lambdas.lambdaService }));
    expect(entryPoints).toEqual({
      [fileName]: [join(projectsDir, 'lambdas', fileName)],
    });
  });
  test('will accept an array of files', async () => {
    const entryPoints = await getEntries([
      getLambdaFile({ lambda: Lambdas.lambdaService }),
      getLambdaFile({ lambda: Lambdas.tsLambdaService, ext: 'ts' }),
    ]);
    expect(entryPoints).toEqual({
      [`${Lambdas.lambdaService}.js`]: [getLambdaFile({ lambda: Lambdas.lambdaService })],
      [`${Lambdas.tsLambdaService}.js`]: [getLambdaFile({ lambda: Lambdas.tsLambdaService, ext: 'ts' })],
    });
  });

  test('will prepend source-map-support/register', async () => {
    const fileName = `${Lambdas.lambdaService}.js`;
    const entryPoints = await getEntries(getLambdaFile({ lambda: Lambdas.lambdaService }), true);
    expect(entryPoints).toEqual({
      [fileName]: ['source-map-support/register', join(projectsDir, 'lambdas', fileName)],
    });
  });

  test('will find all files in dir', async () => {
    const files = await filesPromise;
    const entryPoints = await getEntries(serviceProjectLambdasDir);
    expect(entryPoints).toEqual(files.reduce<Record<string, string[]>>((acc, fileName) => ({
      ...acc,
      [fileName.replace(/\.ts$/, '.js')]: [join(serviceProjectLambdasDir, fileName)],
    }), {}));
  });

  test('will return nested index files also', async () => {
    const dir = join(projectsDir, 'multi-lambdas');
    await expect(getEntries(dir)).resolves.toEqual({
      'func1.js': [join(dir, 'func1.js')],
      'func2.js': [join(dir, 'func2.ts')],
      'func3.js': [join(dir, 'func3', 'index.js')],
      'func4.js': [join(dir, 'func4', 'index.ts')],
    });
  });
});


