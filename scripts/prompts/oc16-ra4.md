Add the RA4 drag model to the solver. Small task.

Files you own (edit only these):
  src/solver/drag.ts
  src/solver/solve.ts        (only if its validation lists the allowed drag models)
  tests/drag.test.ts         (append tests; do not change existing ones)

Read first: the header of src/solver/types.ts (DragModel is now 'G1' | 'G7' | 'RA4'), src/solver/drag.ts, src/data/ra4.json (same shape as g1.json), and how validate() in src/solver/solve.ts checks dragModel.

WHAT TO DO
1. drag.ts: import ra4 from '../data/ra4.json' and build RA4_TABLE the same way as G1_TABLE. dragCoefficient(model, mach) must pick the table by model: 'G1', 'G7', or 'RA4'. Use a switch with no default branch that can silently pick the wrong table: every DragModel value must be handled explicitly (an exhaustive switch).
2. solve.ts: if validate() rejects drag models other than 'G1' and 'G7', allow 'RA4' too. Keep the error message for anything else, and list all three models in it.
3. tests/drag.test.ts, add:
   - dragCoefficient('RA4', 0) is 0.2283; dragCoefficient('RA4', 1) is 0.3975; dragCoefficient('RA4', 4) is 0.4969.
   - RA4 clamps: dragCoefficient('RA4', 9) is 0.4969 and dragCoefficient('RA4', -1) is 0.2283.
   - RA4 differs from G1 at Mach 0.9: the two values are not equal.

Do not edit tests/reference*.test.ts or anything in tests/reference/. The file tests/reference-cartridges.test.ts (15 shots, including 3 with RA4) must pass once RA4 works; if a non-RA4 case in it fails, do not change the solver to fit: stop and report the case name and the numbers.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything left failing.
