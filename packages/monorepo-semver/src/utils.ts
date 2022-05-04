import { spawnSync, SpawnSyncOptions } from 'child_process';

export const spawnAndReturn = (cmd: string, args: string[], options: SpawnSyncOptions = {}) => {
  const results = spawnSync(cmd, args, { ...options, encoding: 'utf-8' });
  const stdOut = Buffer.from(results.stdout).toString('utf-8');
  console.log(stdOut);
  if (results.stderr.length) {
    console.error(Buffer.from(results.stderr).toString('utf-8'));
  }
  if (results.signal) {
    console.log(`Process exited with signal ${results.signal}`);
    process.exit(-1);
  }
  return stdOut.trim();
};
