# Range Ballistics: rules for coding agents

Local web app: Vite + TypeScript (strict, noUncheckedIndexedAccess) + three.js. Tests: Vitest.

## Rules

- Do only the task you were given. Edit only the files the task says you own.
- Never edit `src/solver/types.ts`, `src/data/*.json`, or anything in `tests/reference/`.
- `src/solver` and `src/units` are pure: no DOM, and no imports from `src/planner` or `src/scene`.
- The planner and scene never compute physics. They call `solve()` and read its samples.
- All solver values are SI. Convert for display with `src/units/units.ts`.
- No `any`. No new npm dependencies.
- Run shell commands one line at a time.
- Before you finish, run `npm run typecheck` and `npm test`. Both must pass. Fix failures in your
  own files; if a failure is in a file you do not own, stop and report it.
- Do not run `git commit`, `git add`, or `npm run dev`. The lead reviews and commits.

## Layout

```
src/solver/   physics (types.ts is the fixed contract; read its header comment first)
src/units/    conversions and formatting
src/data/     drag tables, loads, rifle
src/planner/  inputs, results, dope table
src/scene/    three.js range scene
tests/        Vitest tests
```
