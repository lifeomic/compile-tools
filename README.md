# compile-tools
Shared repo for compiling services or libraries

[![Build Status](https://github.com/lifeomic/compile-tools/actions/workflows/release.yaml/badge.svg)](https://github.com/lifeomic/compile-tools/actions/workflows/release.yaml)
[![Coverage Status](https://coveralls.io/repos/github/lifeomic/compile-tools/badge.svg?branch=master)](https://coveralls.io/github/lifeomic/compile-tools?branch=master)
![Dependabot Badge](https://flat.badgen.net/dependabot/lifeomic/compile-tools?icon=dependabot)

## Jest configuration

The `jest.shared.js` file is made to provide certain default values that are shared by all projects.  Then each project can customize as needed.

Example config:

```typescript
import {
  getProjectConfig, // Project specific configuration, which files to cover, where tests are to run
  rootConfig, // The global configuration.  Things like code coverage
} from '../../jest.shared';

const config = {
  ...rootConfig,
  projects: [
    getProjectConfig(__dirname),
  ],
};

export default config;
```

## Constraints

[Yarn constraints](https://yarnpkg.com/features/constraints) used to lint package.json files.  Most of the configs are copied from the [babel](https://github.com/babel/babel/blob/a53c2fa4a21cae90dfc2a62030be08b2599b86f1/constraints.pro) project.

### constraints.pro
Main constraints rules.

* Sets a standard node engine for all projects.  Should be the minimum supported.
* All project versions should be 0.0.0, as we use semantic release for versioning
* Any packages that use other packages should use `workspace:^` as the version
* All non-private packages should be using the 'MIT' license
* All repos should have a repository field
* The author field should always be set to `LifeOmic <development@lifeomic.com>`
* Dependencies shouldn't show up in both the `dependencies` and `devDependencies` sections
* `main` and `types` fields should start with `./`
* The `main` field should leave off the file extension.
  If the file extension is set to `.js` then tests will fail when importing parallel workspaces.
  Currently `ts-jest` is not able to handle typescript files in `pnp` packages, so we are using `@swc-node/jest` to transform typescript files
* The `types` field should leave off the `.d.ts` extension while developing.  This is again for testing inter-package dependencies.

### constraints.deploy.pro
Constraints to be used when ready to actually publish

* Updates the `main` field to end with `.js`
* Updates the `types` field to end with `.d.ts`


## Publishing

[semantic-release]() is being used to handle the git tags, and github release publishing.  
The version created by semantic-release is then used to version the local packages.
Finally, we use `yarn workspaces foreach --no-private npm publish` to publish each of the packages to NPM.
