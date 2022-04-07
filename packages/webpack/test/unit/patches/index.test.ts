import { promises as fs } from 'fs';
import { join } from 'path';

import { BannerPlugin } from 'webpack';

jest.mock('webpack', () => ({
  BannerPlugin: jest.fn(),
}));

jest.mock('../../../src/patches/footer');

import { loadPatch } from '../../../src/patches';
import { FooterPlugin } from '../../../src/patches/footer';

test('will prepend the dns patch', async () => {
  const banner = await fs.readFile(join(__dirname, '../../../src/patches/dnsPatch.js'), 'utf8');
  await expect(loadPatch('dns')).resolves.not.toThrow();
  expect(BannerPlugin).toBeCalledWith({
    test: /\.js$/,
    raw: true,
    banner,
  });
});

test('will append the lambda patch', async () => {
  const banner = await fs.readFile(join(__dirname, '../../../src/patches/lambdaPatch.js'), 'utf8');
  await expect(loadPatch('lambda')).resolves.not.toThrow();
  expect(BannerPlugin).not.toBeCalled();
  expect(FooterPlugin).toBeCalledWith(banner);
});
