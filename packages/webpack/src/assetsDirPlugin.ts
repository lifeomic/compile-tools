import path from 'path';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { WebpackPluginInstance, Compiler, Stats } from 'webpack';
const pluginName = '@lifeomic/compile-tools-webpack-assets-directory-plugin';

export type WebpackLogger = ReturnType<Compiler['getInfrastructureLogger']>;

export const copyAssets = async (
  logger: WebpackLogger,
  outputDir: string,
  resources: Record<string, string[]>,
) => {
  await Promise.all(Object.entries(resources).map(async ([entryName, filesToCopy]) => {
    // Now, write a zip file for each entry
    logger.info(`Adding entries for ${chalk.bold(entryName)}...`);
    const outDir = path.join(outputDir, `${entryName}.dir`);
    await Promise.all(filesToCopy.map(async (file) => {
      const destDir = path.join(outDir, file);
      await fs.mkdir(path.dirname(destDir), { recursive: true });
      await fs.copyFile(path.join(outputDir, file), destDir);
    }));
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
  logger.info(`AssetsDirectoryPlugin: outputDir: ${chalk.bold(outputDir)} entrypoints: [${
    [...entrypoints.keys()].map((name) => chalk.bold(name)).join(', ')
  }]`);

  if (errors.length) {
    logger.warn('AssetsDirectoryPlugin: Not running because of errors');
    return;
  }

  const resources: Record<string, string[]> = {};
  for (const [name, entrypoint] of entrypoints) {
    const filesToCopy: string[] = [];
    entrypoint.chunks.forEach(({ files, auxiliaryFiles }) => {
      filesToCopy.push(...files);
      filesToCopy.push(...auxiliaryFiles);
    });
    resources[name] = filesToCopy;
  }

  await copyAssets(logger, outputDir, resources);
};

export class AssetsDirPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
    const logger = compiler.getInfrastructureLogger(pluginName);
    compiler.hooks.done.tapPromise(pluginName, (stats) => processStats(logger, stats));
  }
}
