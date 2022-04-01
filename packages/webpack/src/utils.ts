import path from 'path';
import archiver from 'archiver';
import rawGlob from 'glob';
import { promisify } from 'util';
import chalk from 'chalk';
import { promises as fs, createWriteStream } from 'fs';
import { Stats } from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supportsColor = require('supports-color');

import { logging } from '@lifeomic/test-tool-utils';

const glob = promisify(rawGlob);

export const logger = logging.getLogger('webpack');

export interface Entry {
  file: string;
  name: string;
}

/**
 * Helper function to trim absolute file path by removing the `process.cwd()`
 * prefix if file is nested under `process.cwd()`.
 */
export const makeFilePathRelativeToCwd = (file: string) => {
  const cwd = process.cwd();
  return (file.startsWith(cwd)) ? '.' + file.substring(cwd.length) : file;
};

/**
 * @param {String} outputDir the directory that contains output files
 * @param {String[]} entryNames the entrypoint names from which output was produced
 */
export const zipOutputFiles = async (outputDir: string, entryNames: string[]) => {
  logger.info('\nCreating zip file for each entrypoint...\n');

  await Promise.all(entryNames.map(async (entryName) => {
    const dirname = path.dirname(entryName);
    const outputZipBasename = `${entryName}.zip`;
    const outputZipFile = path.join(outputDir, outputZipBasename);

    // Find all the output files that belong to this entry
    const entriesForZipFile = (await glob(`${entryName}*`, {
      cwd: outputDir,
      // ignore previously output zip file for repeatability
      ignore: outputZipBasename,
    })).map((file) => ({
      name: (dirname === '.') ? file : file.substring(dirname.length + 1),
      file: path.join(outputDir, file),
    }));

    // Now, write a zip file for each entry
    logger.info(`Creating zip for entrypoint ${chalk.bold(entryName)}...`);
    logger.info(entriesForZipFile.map((entry) => `- ${chalk.bold(entry.name)}\n`).join(''));
    await zip(outputZipFile, entriesForZipFile);
    logger.info(chalk.green(`Zip file for ${chalk.bold(entryName)} written to ` +
      `${chalk.bold(makeFilePathRelativeToCwd(outputZipFile))}\n`));
  }));
};

const zip = async (zipFile: string, entries: Entry[]) => {
  await fs.mkdir(path.dirname(zipFile), { recursive: true });

  return new Promise((resolve, reject) => {
    const outStream = createWriteStream(zipFile);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    outStream.on('finish', resolve);

    // it is a good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', reject);
    archive.on('error', reject);

    for (const entry of entries) {
      archive.file(entry.file, { name: entry.name });
    }

    // pipe archive data to the file
    archive.pipe(outStream);

    void archive.finalize();
  });
};

export const handleWebpackResults = (webpackResult?: Stats) => {
  if (!webpackResult) {
    throw new Error('compilation_error');
  }
  logger.info('Webpack compilation result:\n', webpackResult.toString({
    colors: !!supportsColor.stdout,
    // hide excessive chunking output
    chunks: false,
    // hide other built modules
    maxModules: 0,
    // hide warning traces
    moduleTrace: false,
  }));

  if (webpackResult.hasErrors()) {
    throw new Error('compilation_error');
  }
};
