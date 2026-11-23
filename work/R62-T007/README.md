# R62-T007 check evidence

This task validates the displayed `backtrackingSources.nqueens.javascript.code` string. The 4-Queens example is documented in that displayed string; the test executes only that selected snippet in a child Node process and checks the two expected boards. It also checks the independently computed `n = 1` result.

`CodePanel` displays sequential line numbers and this entry has no separate `lineMap`. The focused test checks that displayed lines 1, 5, 17, 22, 23, and 24 contain the function, safety check, solution recording, queen placement, recursive call, and backtrack assignment respectively.

Run from the repository root:

```sh
npm test -- src/algorithms/course/r62-t007.test.js && npm run build && npm run lint
```

Inputs, expected and actual values, displayed line checks, tool versions, and check exit codes are recorded in `check-evidence.json`.
