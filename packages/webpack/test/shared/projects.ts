import { join } from 'path';
import { Project1Lambdas, testProject1Dir } from '../testProject1';
import { Project2Lambdas } from '../testProject2';
import { Project3Lambdas } from '../testProject3';

export interface GetServiceLambdaFile {
  lambda: Project1Lambdas | Project2Lambdas | Project3Lambdas;
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
