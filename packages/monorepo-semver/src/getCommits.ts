import { spawnAndReturn } from './utils';

export const getCommits = (
  tagName: string,
  directory: string,
) => {
  const name = spawnAndReturn('node', ['-p', `require("${directory}/package.json").name`]);
  const latestVersion = spawnAndReturn('npm', ['show', '@lifeomic/compile-tool-webpack', 'version']);
  const rawCommits = spawnAndReturn('git', ['log', '--pretty=oneline', `HEAD..${name}/${latestVersion}`, '--', directory]);
  return rawCommits
    .split('\n')
    .map((logLine) => ({
      message: logLine.slice(logLine.indexOf(' ') + 1),
      hash: logLine.slice(0, logLine.indexOf(' ')),
    }));
};
