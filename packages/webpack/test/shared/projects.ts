import { join } from 'path';
import { Project1Lambdas, testProject1Dir } from '../testProject1';

export interface GetServiceLambdaFile {
  lambda: Project1Lambdas;
  ext?: 'js' | 'ts';
  projectDir?: string;
}

export const getLambdaFile = (
  {
    lambda,
    ext = 'js',
    projectDir = testProject1Dir,
  }: GetServiceLambdaFile,
) => join(projectDir, 'lambdas', `${lambda}.${ext}`);
