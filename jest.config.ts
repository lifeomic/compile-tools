import { Config } from '@jest/types';
import { rootConfig, projectConfigs, basePath } from './jest.shared';

export default async (): Promise<Config.InitialOptions> => {
  const projects = await Promise.all(projectConfigs.map(async ({ packageName }) => {
    const project = await import(`${basePath}/${packageName}/jest.config.js`);
    return project[0];
  }));
  return {
    ...rootConfig,
    projects,
  };
};
