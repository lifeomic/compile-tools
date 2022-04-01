import { getProjectConfig, rootConfig, Config } from '../../jest.shared';

const config: Config.InitialOptions = {
  ...rootConfig,
  projects: [
    {
      coveragePathIgnorePatterns: [
        '<rootDir>/src/patches/footer.*',
      ],
      ...getProjectConfig(__dirname),
    },
  ],
};

export default config;
