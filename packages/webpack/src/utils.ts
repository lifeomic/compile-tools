import { Stats } from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supportsColor = require('supports-color');

import { logging } from '@lifeomic/test-tool-utils';

export const logger = logging.getLogger('lifeomic-webpack');

export const DEFAULT_NODE_VERSION = '16';

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
