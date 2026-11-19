# R62-T009 verification evidence

## Scope

The existing Shell Sort step generator is already registered by the sorting visualizer and supplies its source display. The change adds focused tests only; source strings, pure result logic, replay frames, and UI registration remain distinct.

## Cases and results

| Input | Expected ascending output | Actual final frame array |
| --- | --- | --- |
| `[3, 1, 2]` | `[1, 2, 3]` | `[1, 2, 3]` |
| `[2, 2, 1]` | `[1, 2, 2]` | `[1, 2, 2]` |
| `[1, 2, 3]` | `[1, 2, 3]` | `[1, 2, 3]` |
| `[3, 2, 1]` | `[1, 2, 3]` | `[1, 2, 3]` |
| `[]` (smallest supported collection) | `[]` | `[]` |

The test also asserts the input remains unchanged, every replay frame has the input length, and the completion frame lists all sorted indices.

## Deterministic operation/frame counts

Counts are replay `steps.length`, `compare` frames, and `swap` frames (which represent shifts in this insertion-style algorithm). These are bounded inputs of size 1, 2, and 3; no elapsed-time threshold is used.

| Input | Steps | Comparisons | Shifts |
| --- | ---: | ---: | ---: |
| `[1]` | 2 | 0 | 0 |
| `[2, 1]` | 7 | 1 | 1 |
| `[3, 2, 1]` | 13 | 3 | 3 |

## Validation

Command: `npm test -- src/algorithms/course/r62-t009.test.js && npm run build && npm run lint`

- Focused test: pass, 1 test file / 8 tests.
- Production build: pass with existing chunk-size advisory warning.
- Lint: pass with zero warnings.
- Tool versions: Node `v26.13.1`, npm `11.20.0`, Vitest `4.1.7` (darwin-arm64).

The focused test exits non-zero when an assertion fails; a run with an incorrect expected comparison count failed and reported the actual count before the expectation was corrected.
