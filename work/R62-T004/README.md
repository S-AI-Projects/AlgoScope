# R62-T004 check evidence

This adds population count to the existing bit-manipulation visualizer. The
integer policy is unsigned 8-bit input (`0` through `255`), declared by
`BIT_WIDTH` and `BIT_MAX` in `src/algorithms/mathTheory/bitManipulation.js`.
The pure count function, replay-step generator, displayed source strings, and
React component remain separate.

The replay uses Brian Kernighan's operation (`remaining &= remaining - 1`).
Each recorded step includes `count`, `remaining`, and the invariant value;
the test independently checks
`count + populationCount(remaining) === populationCount(input)` after every
step and verifies the expected bit-array snapshots remain distinct and stable
after a later run.

## Results

- `12` (`00001100` in the declared 8-bit width) has population count `2`.
- `0` has population count `0`.
- Negative, fractional, and greater-than-255 values are rejected.
- All seven displayed language examples map their population-count step and
  result line to existing source lines.

## Checks

```sh
npm test -- src/algorithms/course/r62-t004.test.js
npm run build
npm run lint
```

All checks passed. The build emitted the existing large-chunk-size warning.

## Browser smoke check

The local Math Theory page displayed the `POPCOUNT` operation. Running input
`12` displayed result `2` and the completion message; running input `0`
displayed result `0`. Initial and completed-run screenshots were captured in
the task session.
