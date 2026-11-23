# R62-T010 check evidence

The focused test targets the first exported entry, `kadaneSources.kadane.javascript.code`. It executes the displayed source in a temporary file under a child Node process, checks the displayed example (`6`) and an independently computed small input (`1`), then mutates a temporary copy so the max-sum update uses `Math.min`. An assertion in that child process fails with a non-zero exit code for the mutated result.

Run from the repository root:

```sh
npm test -- src/algorithms/course/r62-t010.test.js && npm run build && npm run lint
```

Inputs, expected and actual results, mutation outcome, tool versions, and check exit codes are recorded in `check-evidence.json`.
