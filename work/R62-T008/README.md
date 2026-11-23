# R62-T008 check evidence

This task tests `generateLCSSteps` as an existing replay-step generator used by
the DP visualizer. It does not treat displayed source strings as executable
steps or register another visualization.

## Preconditions and source references

- `src/components/dynamicProgramming/DPVisualizer.jsx:16` defines the default
  LCS example (`ABCBDAB`, `BDCAB`).
- `src/components/dynamicProgramming/DPVisualizer.jsx:779` trims both strings
  before passing them to `generateLCSSteps`.
- `src/algorithms/dp/dpStepGenerators.js:3-4` rejects arguments that are not
  strings. Lines 7-9 size the DP table from those strings' lengths.

## Results

The focused test covers the smallest valid input (`'', ''`), the visualizer's
ordinary example, and an unsupported null input followed immediately by a
valid invocation. For the ordinary input, the independently calculated LCS
is `BDAB`, with length 4. Expected and actual values are recorded in
`check-evidence.json`.

The unsupported input throws `TypeError('LCS inputs must be strings.')`. A
subsequent `('A', 'A')` call returns its normal table and two replay steps,
showing the failure does not leave generator state behind.

## Commands

```sh
npm test -- src/algorithms/course/r62-t008.test.js
npm run build
npm run lint
```

All commands passed. The production build emitted the repository's existing
large-chunk-size warning.
