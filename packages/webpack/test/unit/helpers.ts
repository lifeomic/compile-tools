import { promises as fs, Stats } from 'fs';
import path from 'path';

export const fileExists = async (file: string) => {
  try {
    const stat = await fs.stat(file);
    return stat.isFile();
  } catch (e) {
    console.log(`Unable to find ${file}`);
    return false;
  }
};

export const copyRecursive = async (src: string, dest: string) => {
  let stats: Stats;
  try {
    stats = await fs.stat(src);
  } catch (e) {
    console.log(`Unable to find ${src}`);
    return;
  }
  if (stats.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    for (const childItemName of await fs.readdir(src)) {
      await copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    }
  } else {
    await fs.copyFile(src, dest);
  }
};
