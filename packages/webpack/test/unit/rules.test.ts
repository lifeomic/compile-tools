import { createRules } from '../../src/rules';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelEnvDeps = require('webpack-babel-env-deps');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelPresetTypescript = require('@babel/preset-typescript');

jest.mock('webpack-babel-env-deps', () => ({
  exclude: jest.fn(),
}));

test.each<undefined | string>([undefined, '12', '14', '16'])('%s will create appropriate rules', (nodeVersion) => {
  const [mjsRule, jsRule, tsRule] = createRules({ nodeVersion });
  expect(mjsRule).toEqual({ type: 'javascript/auto', test: /\.mjs$/, use: [] });
  expect(jsRule).toHaveProperty('loader', 'babel-loader');
  expect(tsRule).toHaveProperty('loader', 'babel-loader');
  expect(tsRule).toHaveProperty(['options', 'presets', 1], babelPresetTypescript);

  expect(babelEnvDeps.exclude).toBeCalledWith({
    engines: {
      node: `>=${nodeVersion ? nodeVersion : '14.14.0'}`,
    },
  });
});

test('will default the node version', () => {
  expect(() => createRules({})).not.toThrow();
  expect(babelEnvDeps.exclude).toBeCalledWith({
    engines: {
      node: '>=14.14.0',
    },
  });
});

test('will use ts-loader if tsconfig is specified', () => {
  const [,, tsRule] = createRules({ tsconfig: 'tsconfig.json' });
  expect(tsRule).toHaveProperty(['use', 1, 'loader'], 'ts-loader');
});
