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

Currently tested and working with [npm](https://www.npmjs.com/package/npm), 
[yarn v1](https://classic.yarnpkg.com/), 
and [yarn berry](https://yarnpkg.com/).

`lifeomic-webpack -h` for CLI options.

Will also accept configuration options from `package.json#lifeomic-webpack` field, 
or from the following config files. 

    .lifeomic-webpackrc.json
    .lifeomic-webpackrc.yaml
    .lifeomic-webpackrc.yml
    .lifeomic-webpackrc.js
    .lifeomic-webpackrc.ts
    .lifeomic-webpackrc.cjs
    lifeomic-webpack.config.js
    lifeomic-webpack.config.ts
    lifeomic-webpack.config.cjs

## API Configuration

|                                        |                                                                                        |
|----------------------------------------|----------------------------------------------------------------------------------------|
| entrypoint: string &#124; string[];    | Either a single file, or multiple files                                                |
| serviceName?: string;                  | Name of the service to replace process.env.LIFEOMIC_SERVICE_NAME with                  |                  
| nodeVersion?: string; 14.14.0          | Version of node that the output should be compatible with, defaults to                 |                  
| cacheDirectory?: boolean;              | For babel-loader                                                                       |              
| enableDnsRetry?: boolean;              | [dns retry](src/patches/dnsPatch.js)                                                   |              
| outputPath?: string; process.cwd()     | Output of webpack files                                                                |                   
| enableRuntimeSourceMaps?: boolean;     | [devtool source-map](https://webpack.js.org/configuration/devtool/)                    |     
| tsconfig?: string;                     | tsconfig.json file to use, will use ts-loader instead of babel-loader                  |                     
| transpileOnly?: boolean;               | [transpile only for ts-loader](https://www.npmjs.com/package/ts-loader#transpileonly)] |               
| minify?: boolean;                      | Minify with terser plugin                                                              |                      
| configTransformer?: ConfigTransformer; | Function to add/alter the webpack config before sending to Webpack                     | 
| zip?: boolean;                         | Zip output files for each entrypoint: `entrypoint.js.zip`                              |                         
| folderBased?: boolean;                 | Send output files to a directory for each entrypoint `entrypoint.js.dir`               |                 


### Folder vs Zip output on Terraform
When deploying zip files to Lambda using terraform, a source_code_hash can be provided to trigger updates.
Because zip file contain metadata like file creation date, webpacked zip files will never have the same file hash.
Terraform provides an [archive_file](https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/archive_file)
that can create a zip file with a deterministic hash.  Use `folderBased: true` to cause `lifeomic-webpack` to copy 
all relevant outputs for a given `entrypoint` to a directory for other tools, like `archive_file`, to create the zip file from`

## CLI 

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
