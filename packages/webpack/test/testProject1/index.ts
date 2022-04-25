export const testProject1Dir = __dirname;
export const testProject1DirName = 'testProject1' as const;

export enum Project1Lambdas {
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
