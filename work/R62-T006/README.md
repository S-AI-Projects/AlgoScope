# R62-T006 check evidence

The focused Vitest regression asserts the found index and terminal replay state for `[10, 20, 30, 40]` with target `30`, and the absent/present all-equal cases. It also asserts the empty and out-of-range cases, source input immutability, and that the step generator returns replay steps. Vitest exits non-zero on a failed assertion.

Run from the repository root:

```sh
npm test -- src/algorithms/course/r62-t006.test.js && npm run build && npm run lint
```

Inputs, expected and actual values, tool versions, and check exit codes are recorded in `check-evidence.json`.
