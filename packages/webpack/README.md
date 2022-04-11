# @lifeomic/compile-tool-webpack

[![npm](https://img.shields.io/npm/v/@lifeomic/compile-tool-webpack.svg)](https://www.npmjs.com/package/@lifeomic/compile-tool-webpack)
[![Build Status](https://github.com/lifeomic/compile-tools/actions/workflows/release.yaml/badge.svg)](https://github.com/lifeomic/compile-tools/actions/workflows/release.yaml)
[![Coverage Status](https://coveralls.io/repos/github/lifeomic/compile-tools/badge.svg?branch=master)](https://coveralls.io/github/lifeomic/compile-tools?branch=master)


Building code bundles that are optimized for the Lambda runtime can be a
tedious exercise. In order to share code and learning in this area across
several projects, `compile-tool-webpack` provides a `lifeomic-webpack` command that
will generate Lambda code bundles. The CLI is capable of building a single
bundle or multiple bundles and includes source maps, transpiling, minification,
and relevant polyfills. When building a single bundle the output may also be
zipped so that it is ready for upload to the Lambda environment. The CLI
documentation may be accessed using the `lifeomic-webpack --help` command.

Currently tested and working with `npm` and `yarn v1`.  TODO: Add support for 
`yarn berry`.

**Build all lambda functions within a directory:**

```bash
lifeomic-webpack -z -s my-service -n 14.0.0 -o ./dist/lambdas ./src/lambdas
```

Your `./src/lambdas` directory should look similar to:

- `./src/lambdas/func1/index.js`
- `./src/lambdas/func2/index.ts`
- `./src/lambdas/func3.js`
- `./src/lambdas/func4.ts`

This will produce the following zip files:

- `./dist/lambdas/func1.js.zip`
- `./dist/lambdas/func2.js.zip`
- `./dist/lambdas/func3.js.zip`
- `./dist/lambdas/func4.js.zip`

**Build a single lambda function and provide a name for the file:**

```bash
 lifeomic-webpack -z -s my-service -n 14.0.0 -o ./dist/lambdas ./src/lambdas/my-function/index.ts:my-function.js
 ```

This will produce the following zip files:

- `./dist/lambdas/my-function.js.zip`

You will also find the following intermediate files:

- `./dist/lambdas/my-function.js`
- `./dist/lambdas/my-function.js.map` // Only when setting source maps

**Build a TypeScript lambda function with a custom tsconfig**

```bash
 lifeomic-webpack -t tsconfig-prod.json -o ./dist src/service.ts
```

**Development mode:**

```bash
 WEBPACK_MODE=development lifeomic-webpack -z -s my-service -n 14.0.0 -o ./dist/lambdas ./src/lambdas/my-function/index.ts:my-function.js
 ```

The `WEBPACK_MODE=development` environment variable will prevent
minification in the final output bundle.

## Debugging

To enable debug level logging we are using the [debug][debug] library to create the log lines.
Debug flag: `lifeomic-webpack`
