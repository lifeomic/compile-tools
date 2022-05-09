import path from 'path';
import fs from 'fs';
import { ResolvePluginInstance, Resolver } from 'webpack';

export interface PackageLocator {
  name: string,
  reference: string,
}

export interface PackageInformation {
  packageLocation: string,
  packageDependencies: Map<string, null | string | [string, string]>,
  packagePeers: Set<string>,
  linkType: 'HARD' | 'SOFT',
}

export interface PnpApi {
  getPackageInformation(locator: PackageLocator): PackageInformation;
  findPackageLocator(location: string): PackageLocator | null;
}

export class PatchPnpResolver implements ResolvePluginInstance {
  $sourceLocation: undefined | string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pnpApi = require('pnpapi') as PnpApi;
    const sourceLocator = pnpApi.findPackageLocator(module.filename) as PackageLocator;
    const sourceInformation = pnpApi.getPackageInformation(sourceLocator);
    this.$sourceLocation = sourceInformation.packageLocation
      .replace(/\/?$/, '/');
  }

  /**
   * The run point of the plugin, required method.
   */
  apply(resolver: Resolver) {
    const resolveHook = resolver.ensureHook('resolve');

    resolver
      .getHook('after-resolve')
      .tapAsync('PatchPnpResolver', (resolveRequest, resolveContext, callback) => {

        const resolve = () => resolver.doResolve(
          resolveHook,
          {
            ...resolveRequest,
            path: this.$sourceLocation,
          },
          null,
          {
            ...resolveContext,
            path: this.$sourceLocation,
          },
          callback,
        );

        if (resolveRequest.path && resolveRequest.request) {
          const url = path.resolve(resolveRequest.path, resolveRequest.request);
          fs.stat(url, (err, stats) => {
            if (stats?.isDirectory()) {
              callback(null, {
                path: url,
                fragment: '',
                query: '',
              });
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
  }
}
