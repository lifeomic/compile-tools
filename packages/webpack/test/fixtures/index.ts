import { join } from 'path';

export const projectsDir = __dirname;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const tmpProjectDir = process.env.INTEGRATION_TEST_PROJECT_TMP_DIR!;

export enum Lambdas {
  asyncIterators= 'async_iterators',
  asyncTest= 'async_test',
  asyncWithArrow= 'async_with_arrow',
  crypto= 'crypto-browserify',
  lambdaService= 'lambda_service',
  runtimeCallbacks= 'runtime_callbacks',
  runtimeDns= 'runtime_dns',
  runtimeEvents= 'runtime_events',
  runtimePromises= 'runtime_promises',
  tsLambdaService= 'ts_lambda_service',
}

export interface GetServiceLambdaFile {
  lambda: Lambdas;
  ext?: 'js' | 'ts';
}

export const getLambdaFile = (
  {
    lambda,
    ext = 'js',
  }: GetServiceLambdaFile,
) => join(tmpProjectDir || projectsDir, 'lambdas', `${lambda}.${ext}`);

