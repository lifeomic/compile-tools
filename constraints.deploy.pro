% Main field should not end with any extension, then we can replace it when publishing
gen_enforced_field(WorkspaceCwd, 'main', ExpectedValue) :-
  % Get current value
  workspace_field(WorkspaceCwd, 'main', CurrentValue),
  % Get extension
  \+ atom_concat(_, '.js', CurrentValue),
  % Add the extension
  atom_concat(CurrentValue, '.js', ExpectedValue).

% Types field should end with .d.ts
gen_enforced_field(WorkspaceCwd, 'types', ExpectedValue) :-
  % Get current value
  workspace_field(WorkspaceCwd, 'types', CurrentValue),
  % Must not end with '.d.ts' already
  \+ sub_atom(CurrentValue, Len, 5, 0, '.d.ts'),
  % Find length before .ts
  sub_atom(CurrentValue, Len, 3, 0, '.ts'),
  % Remove .d.ts
  sub_atom(CurrentValue, 0, Len, _, WithoutTs),
  % Store CurrentValue + '.d.ts' in ExpectedValue
  atom_concat(WithoutTs, '.d.ts', ExpectedValue).
