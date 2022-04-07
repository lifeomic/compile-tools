import { getProjectIntegrationConfig, rootIntegrationConfig, Config } from '../../jest.shared';

const config: Config.InitialOptions = {
  ...rootIntegrationConfig,
  testTimeout: rootIntegrationConfig.testTimeout || 20e3,
  projects: [
    {
      ...getProjectIntegrationConfig(__dirname),
    },
  ],
};

export default config;
