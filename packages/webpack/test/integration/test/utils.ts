import { SpawnSyncReturns } from 'child_process';
import { testProject1DirName } from '../../testProject1';
import { testProject2DirName } from '../../testProject2';
import { testProject3DirName } from '../../testProject3';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const tmpProjectDir = process.env.INTEGRATION_TEST_TMP_DIR!;

export const tmpTestProject1Dir = path.join(tmpProjectDir, testProject1DirName);
export const tmpTestProject2Dir = path.join(tmpProjectDir, testProject2DirName);
export const tmpTestProject3Dir = path.join(tmpProjectDir, testProject3DirName);

export const handleSpawnResults = (
  {
    status,
    ...result
  }: SpawnSyncReturns<string | Buffer>,
) => {
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (status !== 0) {
    if (stdout) {
      console.error(Buffer.from(stdout).toString('utf-8'));
    }
    if (stderr) {
      console.error(Buffer.from(stderr).toString('utf-8'));
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Process exited with status ${status}`);
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
