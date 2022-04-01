% Enforces the engines.node field for all workspaces
gen_enforced_field(WorkspaceCwd, 'engines.node', '>=14.14.0').

% Enforces the version for all projects as 0.0.0
gen_enforced_field(WorkspaceCwd, 'version', '0.0.0').

% Enforces that all workspaces depend on other workspaces using `workspace:^`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, 'workspace:^', DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Only consider dependency ranges that start with 'workspace:'
  atom_concat('workspace:', _, DependencyRange),
  % Only consider 'dependencies' and 'devDependencies'
  (DependencyType = 'dependencies'; DependencyType = 'devDependencies').


% Enforces the license in all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'license', 'MIT') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'license', null) :-
  workspace_field(WorkspaceCwd, 'private', true).


% Enforces the repository field for all public workspaces while removing it from private workspaces
gen_enforced_field(WorkspaceCwd, 'repository.type', 'git').
gen_enforced_field(WorkspaceCwd, 'repository.url', 'https://github.com/lifeomic/compile-tools.git').
gen_enforced_field(WorkspaceCwd, 'repository.directory', WorkspaceCwd).

% Enforces the author field to be consistent
gen_enforced_field(WorkspaceCwd, 'author', 'LifeOmic <development@lifeomic.com>') :-
  \+ workspace_field(WorkspaceCwd, 'private', true).
gen_enforced_field(WorkspaceCwd, 'author', null) :-
  workspace_field(WorkspaceCwd, 'private', true).

% Enforces that a dependency doesn't appear in both `dependencies` and `devDependencies`
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, null, 'devDependencies') :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'devDependencies'),
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, _, 'dependencies').

% Enforces the main and types field to start with ./
gen_enforced_field(WorkspaceCwd, FieldName, ExpectedValue) :-
  % Fields the rule applies to
  member(FieldName, ['main', 'types']),
  % Get current value
  workspace_field(WorkspaceCwd, FieldName, CurrentValue),
  % Must not start with ./ already
  \+ atom_concat('./', _, CurrentValue),
  % Store './' + CurrentValue in ExpectedValue
  atom_concat('./', CurrentValue, ExpectedValue).

% Main field should not end with any extension, then we can replace it when publishing
gen_enforced_field(WorkspaceCwd, 'main', ExpectedValue) :-
  % Get current value
  workspace_field(WorkspaceCwd, 'main', CurrentValue),
  % Get extension
  sub_atom(CurrentValue, Len, 3, 0, '.js'),
  % Remove the extension
  sub_atom(CurrentValue, 0, Len, _, ExpectedValue).
gen_enforced_field(WorkspaceCwd, 'main', ExpectedValue) :-
  % Get current value
  workspace_field(WorkspaceCwd, 'main', CurrentValue),
  % Get extension
  sub_atom(CurrentValue, Len, 3, 0, '.ts'),
  % Remove the extension
  sub_atom(CurrentValue, 0, Len, _, ExpectedValue).

% Types field should end with .ts during development
gen_enforced_field(WorkspaceCwd, 'types', ExpectedValue) :-
  % Get current value
  workspace_field(WorkspaceCwd, 'types', CurrentValue),
  % Must not end with '.d.ts' already
  sub_atom(CurrentValue, Len, 5, 0, '.d.ts'),
  % Remove .d.ts
  sub_atom(CurrentValue, 0, Len, _, WithoutTs),
  % Store CurrentValue + '.d.ts' in ExpectedValue
  atom_concat(WithoutTs, '.ts', ExpectedValue).
