// @ts-ignore
import { getProjectConfig, rootConfig, Config } from '../../jest.shared';

const config: Config.InitialOptions = {
  ...rootConfig,
  projects: [
    {
      ...getProjectConfig(__dirname),
      moduleNameMapper: {
        'pnpapi': '<rootDir>/../../.pnp.cjs',
      },
    },
  ],
};

export default config;
