import assert from 'assert';
import path from 'path';
import { promises as fs } from 'fs';
import { BannerPlugin } from 'webpack';
import { FooterPlugin } from './footer';

const patches = {
  dns: async () => new BannerPlugin({
    test: /\.js$/,
    raw: true,
    banner: await fs.readFile(path.resolve(__dirname, 'dnsPatch.js'), { encoding: 'utf8' }),
  }),
  lambda: async () => new FooterPlugin(
    await fs.readFile(path.resolve(__dirname, 'lambdaPatch.js'), 'utf8'),
  ),
} as const;

export const loadPatch = async (name: keyof typeof patches) => {
  const patch = patches[name];
  assert(patch, `No patch found for '${name}'`);

  return await patch();
};
