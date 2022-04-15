import { getProjectConfig, rootConfig, Config } from '../../jest.shared';

const config: Config.InitialOptions = {
  ...rootConfig,
  projects: [
    {
      ...getProjectConfig(__dirname),
    },
  ],
};

export default config;
