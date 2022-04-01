import { Config } from '@jest/types';
import { rootConfig, packages, basePath } from './jest.shared';

export default async (): Promise<Config.InitialOptions> => {
  const projects = await Promise.all(packages.map(async (packageName) => {
    const config = await import(`${basePath}/${packageName}/jest.config`) as { default: Config.InitialOptions } | Config.InitialOptions;
    // @ts-expect-error getting weird crap here...
    return (config.default ?? config).projects[0];
  }));
  return {
    ...rootConfig,
    projects,
  };
};
