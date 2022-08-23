import path from 'path';
import { promises as fs, Stats } from 'fs';

export const fsStat = async (...filePath: string[]): Promise<Stats | undefined> => {
  try {
    return await fs.stat(path.join(...filePath));
  } catch (e) {
    return undefined;
  }
};

export const fileExists = async (...filePath: string[]) => {
  const stat = await fsStat(...filePath);
  return stat && stat.isFile();
};

export const dirExists = async (...filePath: string[]) => {
  const stat = await fsStat(...filePath);
  return stat && stat.isDirectory();
};
