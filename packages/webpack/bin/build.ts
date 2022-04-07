#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import yargs from 'yargs';

import { compile, Config } from '../src';

const epilogue = `
Each entrypoint is a single source file that represents the top-level module for
the bundle being produced. By default, the resulting bundle will use the
basename of the entrypoint as the bundle name. If a :name suffix is provided
then the name value will be used as the bundle name instead. For example,
src/app.js:lambda.js would use src/app.js as the entrypoint and produce a bundle
named lambda.js in the output directory.
`;

const argv = yargs(process.argv.slice(2))
  .scriptName('lifeomic-webpack')
  .usage('$0 [<options>] <entrypoint[:name]>...')
  .option('d', {
    alias: 'dns-retry',
    describe: 'enable automatic retries for DNS lookups',
    type: 'boolean',
  })
  .option('n', {
    alias: 'node-version',
    describe: 'the version of node that the bundle should be optimized for (default 12.13.0)',
    type: 'string',
  })
  .option('enable-runtime-source-maps', {
    describe: 'enable support for runtime source maps',
    type: 'boolean',
    default: false,
  })
  .option('o', {
    alias: 'output-directory',
    describe: 'the path where the bundle will be produced (default: cwd)',
    type: 'string',
  })
  .option('s', {
    alias: 'service-name',
    describe: 'the name of the service the bundle is for',
    type: 'string',
  })
  .option('minify', {
    describe: 'enable minification of bundled code',
    type: 'boolean',
    default: false,
  })
  .option('w', {
    alias: 'webpack-transform',
    describe: 'a module that exports a function to transform the webpack configuration',
    type: 'string',
  })
  .option('z', {
    alias: 'zip',
    describe: 'zip the JS bundle (default false)',
    type: 'boolean',
  })
  .option('t', {
    alias: 'tsconfig',
    describe: 'relative path to a tsconfig.json file to compile typescript',
    type: 'string',
  })
  .option('transpile-only', {
    describe: 'when using --tsconfig, disable typechecking in ts-loader',
    type: 'boolean',
  })
  .options('enable-cache-directory', {
    describe: 'enables babel-loader cache directory',
    type: 'boolean',
  })
  .demandCommand(1)
  .epilog(epilogue)
  .parseSync();

const buildOptions: Config = {
  enableDnsRetry: argv.d,
  entrypoint: argv._ as string[],
  nodeVersion: argv.n,
  outputPath: argv.o,
  minify: argv.minify,
  serviceName: argv.s,
  zip: argv.z,
  tsconfig: argv.t,
  transpileOnly: argv.transpileOnly,
  enableRuntimeSourceMaps: argv.enableRuntimeSourceMaps,
  cacheDirectory: argv.enableCacheDirectory,
};

if (argv.t) {
  // assert typescript and ts-loader are installed
  ['typescript', 'ts-loader'].forEach((dependency) => {
    try {
      require.resolve(dependency);
    } catch (_) {
      console.error(chalk.bold.red(`It looks like you're trying to use TypeScript but do not have '${chalk.bold(
        dependency,
      )}' installed. Please install it or remove the tsconfig flag.`));
      process.exit(1);
    }
  });
}

const prep = async () => {
  if (argv.w) {
    // Ignore the non-literal module require because the module to load is
    // expected to come from the caller of the command
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const transformFunction = await import(path.join(process.cwd(), argv.w));
    const transformType = typeof transformFunction;
    if (transformType !== 'function') {
      throw new Error(`The webpack transform module should export a function, but the exported type was ${transformType}`);
    }
    buildOptions.configTransformer = transformFunction;
  }
  await compile(buildOptions);
};

prep()
  .catch((error) => {
    if (error.message === 'compilation_error') {
      console.error('An error occurred during compilation. See output above for more details.');
    } else {
      console.error('Failed to build lambda package:', error);
    }
    process.exitCode = 1;
  });
