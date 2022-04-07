import path from 'path';
import { promises as fs } from 'fs';
import rawGlob from 'glob';
import { promisify } from 'util';

const glob = promisify(rawGlob);

export interface Entrypoint {
  file: string;
  name: string;
}

export const parseEntrypoint = (entrypoint: string): Entrypoint => {
  const [file, name] = entrypoint
    .replace(/:\s+$/, '')
    .split(':');
  let fileName = path.basename(file);
  if (/^index\.[jt]s$/.test(fileName)) {
    fileName = `${path.basename(path.dirname(file))}.js`;
  }

  return {
    file: path.resolve(file),
    name: name || fileName.replace(/.ts$/, '.js'),
  };
};

export const getEntries = async (
  rawEntrypoint: string | string[], enableRuntimeSourceMaps?: boolean,
): Promise<Record<string, string[]>> => {
  const rawEntryPoints: string[] = Array.isArray(rawEntrypoint) ? rawEntrypoint : [rawEntrypoint];

  const preloadModules: string[] = [];
  if (enableRuntimeSourceMaps) {
    preloadModules.push('source-map-support/register');
  }
  // If an entrypoint is a directory then we discover all the entryPoints
  // within that directory.
  // For example, entrypoint might be "./src/lambdas" and we might discover
  // "./src/lambdas/abc/index.[jt]s" (a subdirectory with index file)
  // and "./src/lambdas/def.[jt]s" (a simple file)
  const entryPoints: Record<string, string[]> = {};
  const addEntry = ({ name, file }: Entrypoint) => entryPoints[name] = [...preloadModules, file];

  await Promise.all(rawEntryPoints
    .map(parseEntrypoint)
    .map(async ({ file, name }) => {
      const stats = await fs.stat(file);
      // Is the entrypoint a directory?
      if (stats.isDirectory()) {
        const files = await glob(path.join(file, '{*/index,*}.[jt]s'), {
          nodir: true,
        });
        files.forEach((file) => addEntry(parseEntrypoint(file)));
      } else {
        addEntry({ file, name });
      }
    }),
  );

  return entryPoints;
};
