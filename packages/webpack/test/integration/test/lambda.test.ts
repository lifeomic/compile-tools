import { join } from 'path';

import { Project1Lambdas } from '../../testProject1';
import { localStackHooks } from '@lifeomic/test-tool-localstack';
import { BUILD_ENV, handleSpawnResults, tmpProjectDir, tmpTestProject1Dir } from './utils';
import { Lambda } from '@aws-sdk/client-lambda';
import { ulid } from 'ulid';
import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';

const hooks = localStackHooks({ services: ['lambda'], versionTag: '0.14' });

const testBuildDir = join(tmpProjectDir, 'build', ulid());

const supportedNodeVersions = [
  '14',
  '16',
] as const;
type NodeVersion = typeof supportedNodeVersions[number];

const lambdas = [
  Project1Lambdas.asyncTest,
  Project1Lambdas.asyncWithArrow,
  Project1Lambdas.asyncIterators,
  'es_modules',
] as const;

type LambdaFiles = typeof lambdas[number];

type NameMap = {
  [key in LambdaFiles]: string;
};

type VersionNameMap = {
  [key in NodeVersion]: NameMap;
};

const versionNameMap = {} as VersionNameMap;

supportedNodeVersions.forEach((version) => {
  versionNameMap[version] = {} as NameMap;
});

let lambda: Lambda;

const publishLambda = async (name: LambdaFiles, nodeVersion: NodeVersion) => {
  const FunctionName = ulid();
  versionNameMap[nodeVersion][name] = FunctionName;
  await lambda.createFunction({
    FunctionName,
    Code: {
      ZipFile: await fs.readFile(join(testBuildDir, `${name}.js.zip`)),
    },
    Handler: `${name}.handle`,
    Runtime: `nodejs${nodeVersion}.x`,
    Role: 'arn:aws:iam::000000000000:role/service-role/role-name',
    MemorySize: 1024,
    Timeout: 15,
    Publish: true,
    Environment: {
      Variables: {
        NODE_OPTIONS: '--trace-deprecation',
      },
    },
  });
};

beforeAll(async () => {
  await fs.mkdir(testBuildDir, { recursive: true });
  const connection = await hooks.beforeAll();
  lambda = new Lambda(connection.config);
  const result = spawnSync('npx', [
    'lifeomic-webpack',
    '-o', testBuildDir,
    '-z',
    'lambdas',
    'es_modules',
  ], {
    cwd: tmpTestProject1Dir,
    env: BUILD_ENV,
  });
  handleSpawnResults(result);
  for (const name of lambdas) {
    for (const version of supportedNodeVersions) {
      await publishLambda(name, version);
    }
  }
}, 120e3);

afterAll(async () => {
  await fs.rm(testBuildDir, { recursive: true, force: true });
  await hooks.afterAll();
});

describe.each(supportedNodeVersions)('Node %s', (nodeVersion) => {
  const runLambda = async (name: LambdaFiles, expected: number | string) => {
    const FunctionName = versionNameMap[nodeVersion][name];
    const { Payload, StatusCode } = await lambda.invoke({
      FunctionName,
      Payload: Buffer.from('{}'),
    });
    expect(StatusCode).toBe(200);
    expect(Payload).toBeDefined();
    expect(Buffer.from(Payload!).toString()).toBe(`${expected}\n`);
  };

  test(`Can webpack files that use arrow functions inside async functions when targeting ${nodeVersion}`, async () => {
    await runLambda(Project1Lambdas.asyncWithArrow, '{}');
  });

  test(`Can webpack files that use async iterators inside when targeting ${nodeVersion}`, async () => {
    await runLambda(Project1Lambdas.asyncIterators, 5 + 4 + 3 + 2 + 1);
  });
});
