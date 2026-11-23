# R62-T001 check evidence

The pure ternary-search contract returns the matching zero-based index or `-1` when the target is absent. Empty input returns `-1` under the same contract. The focused Vitest assertions exit non-zero on incorrect results.

Run from the repository root:

```sh
npm test -- src/algorithms/course/r62-t001.test.js && npm run build && npm run lint
```

Inputs, expected and actual results, tool versions, and check exit codes are recorded in `check-evidence.json`.
