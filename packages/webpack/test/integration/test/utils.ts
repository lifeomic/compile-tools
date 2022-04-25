import { SpawnSyncReturns } from 'child_process';
import { logging } from '@lifeomic/test-tool-utils';
import { testProject1DirName } from '../../testProject1';
import { testProject2DirName } from '../../testProject2';
import * as path from 'path';

export const logger = logging.getLogger('integration-test');

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const tmpProjectDir = process.env.INTEGRATION_TEST_PROJECT_TMP_DIR!;

export const tmpTestProject1Dir = path.join(tmpProjectDir, testProject1DirName);
export const tmpTestProject2Dir = path.join(tmpProjectDir, testProject2DirName);

export const handleSpawnResults = (results: SpawnSyncReturns<string | Buffer>) => {
  if (results.stdout.length) {
    logger.debug(Buffer.from(results.stdout).toString('utf-8'));
  }
  if (results.stderr.length) {
    logger.debug(Buffer.from(results.stderr).toString('utf-8'));
  }
  if (results.status !== 0) {
    logger.error(Buffer.from(results.stdout).toString('utf-8'));
    logger.error(Buffer.from(results.stderr).toString('utf-8'));
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Process exited with status ${results.status}`);
  }
};

const rejectEnvRegex = /^(npm.*|berry.*)$/i;
export const BUILD_ENV: Record<string, string> = Object.entries(process.env)
  .filter(([key]) => !rejectEnvRegex.test(key))
  .reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value,
  }), {});

delete BUILD_ENV.NODE_OPTIONS;

export type Unwrap<T> =
  T extends Promise<infer U> ? U :
  T extends (...args: any) => Promise<infer U> ? U :
  T extends (...args: any) => infer U ? U :
  T;
