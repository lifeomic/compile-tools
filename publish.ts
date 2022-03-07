/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-argument */
import semanticRelease from 'semantic-release';
import { spawnSync, SpawnSyncOptions } from 'child_process';

const spawnOptions: SpawnSyncOptions = {
  stdio: 'inherit',
  cwd: __dirname,
};

const build = (version: string) => {
  spawnSync('yarn', ['tsc', '-p', 'tsconfig.build.json'], {
    ...spawnOptions,
  });
  spawnSync('yarn', ['workspaces', 'foreach', 'version', version], {
    ...spawnOptions,
  });
  spawnSync('yarn', ['constraints', '--fix'], {
    ...spawnOptions,
    env: {
      ...process.env,
      YARN_CONSTRAINTS_PATH: './constraints.deploy.pro',
    },
  });
};

const npmPublish = () => {
  spawnSync('yarn', ['workspaces', 'foreach', '--no-private', 'npm', 'publish'], {
    ...spawnOptions,
  });
};

const versionAndPublish = async () => {
  const options = {};
  const result = await semanticRelease({ ...options, dryRun: true });
  if (result) {
    const { lastRelease, commits, nextRelease } = result;

    build(nextRelease.version);
    await semanticRelease(options);
    npmPublish();

    console.log(`Published ${nextRelease.type} release version ${nextRelease.version} containing ${commits.length} commits.`);

    if (lastRelease.version) {
      console.log(`The last release was "${lastRelease.version}".`);
    }
  } else {
    console.log('No release to publish.');
  }
};

versionAndPublish().then(
  () => console.log('Completed release process'),
  (err) => {
    console.error(err);
    process.exit(-1);
  },
);
