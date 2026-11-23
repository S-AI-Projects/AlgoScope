# R62-T003 check evidence

This change keeps the existing Z-algorithm visualization and moves its pure
step generation into `src/algorithms/stringAlgo/zAlgorithm.js`. The UI still
owns animation timing and display state. The JavaScript source shown in the
visualizer was updated to use a unique `Symbol` separator as well.

The focused test compares final match positions with a separate brute-force
substring matcher. For `text = "aaaa"` and `pattern = "aa"`, both return
`[0, 1, 2]`. For `text = "$a$a$"` and `pattern = "$a"`, both return `[0, 2]`;
the final text portions of the Z arrays are also asserted.

## Checks

```sh
npm test -- src/algorithms/course/r62-t003.test.js
npm run build
npm run lint
```

All checks passed. The production build reported the repository's existing
large-chunk-size warning. Inputs and expected/actual results are recorded in
`check-evidence.json`.

## Browser smoke check

Opened the local `/string-algorithms?algo=zalgorithm` page, changed the inputs
to `aaaa` and `aa`, and ran the visualization. The page displayed three
matches at `[0, 1, 2]` and text Z values `[2, 2, 2, 1]`. Initial and result
screenshots were captured during the browser check in the task session.
