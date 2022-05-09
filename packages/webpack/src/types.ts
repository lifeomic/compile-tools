import {
  Configuration,
} from 'webpack';

export type Mode = 'development' | 'production' | 'none';

export type ConfigTransformer = (config: Configuration) => Promise<Configuration> | Configuration

export interface Config {
  entrypoint: string | string[];
  serviceName?: string;
  nodeVersion?: string;
  cacheDirectory?: boolean;
  enableDnsRetry?: boolean;
  outputPath?: string;
  enableRuntimeSourceMaps?: boolean;
  tsconfig?: string;
  transpileOnly?: boolean;
  minify?: boolean;
  configTransformer?: ConfigTransformer;
  zip?: boolean;
}
