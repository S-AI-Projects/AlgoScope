# R62-T002 check evidence

## Contract

`kruskalMinimumSpanningForest(vertices, edges)` requires at least one unique vertex and finite-weight edges whose endpoints appear in `vertices`. It returns the selected forest edges, total cost, remaining component count, connected flag, and a replay trace. Equal-weight edges retain their original input order. Disconnected input returns a minimum spanning forest and reports its component count.

## Inputs and results

| Case | Input | Expected | Actual |
| --- | --- | --- | --- |
| Smallest valid graph | `vertices: ['A']`, `edges: []` | no edges; cost 0; 1 component; connected; no steps | no edges; cost 0; 1 component; connected; no steps |
| Specified triangle | `A-B:1, B-C:2, A-C:4` | choose `A-B`, `B-C`; cost 3; 1 component; decisions `[true,true,false]` | choose `A-B`, `B-C`; cost 3; 1 component; decisions `[true,true,false]`; step states `[[2,1],[1,3],[1,3]]` |
| Disconnected graph | vertices `A,B,C,D,E`; edges `A-B:1, C-D:2` | forest `A-B, C-D`; cost 3; 3 components; disconnected | forest `A-B, C-D`; cost 3; 3 components; disconnected |
| Equal-weight ties, loop and cycle | `A-C`, `A-A`, `A-B`, `B-C`, each weight 1 in that input order | keep tie order; accept `A-C`, reject loop, accept `A-B`, reject cycle | accept `A-C`, reject loop, accept `A-B`, reject cycle; cost 2 |
| Invalid endpoint | vertex list `['A']`; edge `A-B:1` | throw `RangeError` | throws `RangeError` |
| Empty graph | `vertices: []`, `edges: []` | throw `RangeError` | throws `RangeError` |

The test also asserts the triangle input edges are unchanged after computation.

## Automated checks

Command: `npm test -- src/algorithms/course/r62-t002.test.js && npm run build && npm run lint`

Result: passed. Vitest reported 6 tests passed; Vite build completed; ESLint completed with no errors.

Tool versions: Node `v26.13.1`; npm `11.20.0`; Vitest `4.1.7`; Vite `7.1.11`.

## Browser smoke check

Opened `/spath?algo=kruskal` in the local dev server. The existing Kruskal visualizer loaded, selected Kruskal's MST, and displayed the updated JavaScript source comments for stable tie order and disconnected-forest behavior. The starting graph canvas was empty, so pressing Run did not produce a graph result. The algorithm outcomes above are asserted by the focused Vitest test.
