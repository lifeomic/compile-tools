import path from 'path';
import chalk from 'chalk';
import rawGlob from 'glob';
import { promisify } from 'util';
import archiver from 'archiver';
import { createWriteStream, promises as fs } from 'fs';
import { WebpackPluginInstance, Compiler, Stats } from 'webpack';

export type WebpackLogger = ReturnType<Compiler['getInfrastructureLogger']>;

export interface Entry {
  file: string;
  name: string;
}

const glob = promisify(rawGlob);
const pluginName = '@lifeomic/compile-tools-webpack-zip-asset-plugin';

/**
 * Helper function to trim absolute file path by removing the `process.cwd()`
 * prefix if file is nested under `process.cwd()`.
 */
export const makeFilePathRelativeToCwd = (file: string) => {
  const cwd = process.cwd();
  return (file.startsWith(cwd)) ? '.' + file.substring(cwd.length) : file;
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

export const zipOutputFiles = async (
  logger: WebpackLogger,
  outputDir: string,
  resources: Record<string, string[]>,
) => {
  logger.info('\nCreating zip file for each entrypoint...\n');

  await Promise.all(Object.entries(resources).map(async ([entryName, assets]) => {
    const dirname = path.dirname(entryName);
    const outputZipBasename = `${entryName}.zip`;
    const outputZipFile = path.join(outputDir, outputZipBasename);

    // Find all the output files that belong to this entry
    const globFiles = await glob(`${entryName}*`, {
      cwd: outputDir,
      // ignore previously output zip file for repeatability
      ignore: outputZipBasename,
    });

    const entriesForZipFile = [...new Set([...globFiles, ...assets])].map((file) => ({
      name: (dirname === '.') ? file : file.substring(dirname.length + 1),
      file: path.join(outputDir, file),
    }));

    // Now, write a zip file for each entry
    logger.info(`Creating zip for entrypoint ${chalk.bold(entryName)}...`);
    logger.info(entriesForZipFile.map(({ name }) => `- ${chalk.bold(name)}\n`).join(''));
    await zip(outputZipFile, entriesForZipFile);
    logger.info(chalk.green(`Zip file for ${chalk.bold(entryName)} written to ` +
      `${chalk.bold(makeFilePathRelativeToCwd(outputZipFile))}\n`));
  }));
};

export const processStats = async (
  logger: WebpackLogger,
  {
    compilation: {
      errors,
      entrypoints,
      outputOptions: {
        path: outputDir = process.cwd(),
      },
    },
  }: Stats,
) => {
  logger.info(`ZipAssetsPlugin: outputDir: ${chalk.bold(outputDir)} entrypoints: [${
    [...entrypoints.keys()].map((name) => chalk.bold(name)).join(', ')
  }]`);

  if (errors.length) {
    logger.warn('ZipAssetsPlugin: Not running because of errors');
    return;
  }

  const resources: Record<string, string[]> = {};
  for (const [name, entrypoint] of entrypoints) {
    const filesToBundle: string[] = [];
    entrypoint.chunks.forEach(({ files, auxiliaryFiles }) => {
      filesToBundle.push(...files);
      filesToBundle.push(...auxiliaryFiles);
    });
    resources[name] = filesToBundle;
  }

  await zipOutputFiles(logger, outputDir, resources);
};

export class ZipAssetsPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    const logger = compiler.getInfrastructureLogger(pluginName);
    compiler.hooks.done.tapPromise(pluginName, (stats) => processStats(logger, stats));
  }
}
