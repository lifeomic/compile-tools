// Not including the @semantic-release/npm plugin so we can do the publish to npm using yarn workspaces.

module.exports = {
  branches: ['master'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    [
      '@semantic-release/github',
      {
        // Setting this to false disables the default behavior
        // of opening a GitHub issue when a release fails.
        failComment: false,
      },
    ],
  ],
};
