// ─── PASCAL'S TRIANGLE  (R62-T017) ──────────────────────────────────────────
//
// Concrete fixture (numRows = 5):
//
//   row 0:  [1]
//   row 1:  [1, 1]
//   row 2:  [1, 2, 1]
//   row 3:  [1, 3, 3, 1]
//   row 4:  [1, 4, 6, 4, 1]
//
// Row-sum property:  row k sums to 2^k  (powers-of-two progression).
//
// Algorithm:
//   Each interior element triangle[i][j] = triangle[i-1][j-1] + triangle[i-1][j].
//   Row 0 is the seed [1]; every new row starts and ends with 1.
//   Time  O(n²) | Space O(n²) for the full triangle.
//
// ─────────────────────────────────────────────────────────────────────────────

import { createStep } from '../../lib/utils'

// ── 1.  Pure algorithm ────────────────────────────────────────────────────────

/**
 * Build Pascal's Triangle up to `numRows` rows (0-indexed).
 *
 * @param {number} numRows - Number of rows to generate (non-negative integer).
 * @returns {number[][]} 2-D array where result[i] is row i.
 *   Returns [] for numRows <= 0.
 *
 * @example
 * pascalsTriangle(4)
 * // => [[1], [1,1], [1,2,1], [1,3,3,1]]
 */
export function pascalsTriangle(numRows) {
  const n = Math.floor(Number(numRows))
  if (!isFinite(n) || n <= 0) return []

  const triangle = [[1]]

  for (let i = 1; i < n; i++) {
    const prev = triangle[i - 1]
    const row = [1]
    for (let j = 1; j < prev.length; j++) {
      row.push(prev[j - 1] + prev[j])
    }
    row.push(1)
    triangle.push(row)
  }

  return triangle
}

// ── 2.  Replay / step generator ───────────────────────────────────────────────

/**
 * Generate animation replay steps for Pascal's Triangle construction.
 * Each step follows the same `createStep` contract used by all other
 * step-generator modules in this codebase.
 *
 * Step lineKey vocabulary (matches every language's lineMap below):
 *   "start"      – function entry / seed row placed
 *   "outerLoop"  – outer loop iteration begins (new row allocated)
 *   "innerCell"  – interior cell computed: row[j] = prev[j-1] + prev[j]
 *   "rowDone"    – a complete row has been appended to the triangle
 *   "result"     – algorithm finished; full triangle returned
 *
 * @param {number} numRows - Number of rows to animate.
 * @returns {Object[]} Array of step objects.
 */
export function generatePascalsTriangleSteps(numRows) {
  const steps = []
  const n = Math.floor(Number(numRows))

  if (!isFinite(n) || n <= 0) {
    steps.push(
      createStep({
        lineKey: 'start',
        type: 'complete',
        array: [],
        message: 'numRows ≤ 0 → return empty triangle',
        variables: { numRows: n, rowIndex: null },
        duration: 600,
      })
    )
    return steps
  }

  const triangle = [[1]]

  // ── seed step ──────────────────────────────────────────────────────────────
  steps.push(
    createStep({
      lineKey: 'start',
      type: 'start',
      array: [1],
      message: `Initialize: triangle = [[1]]  (row 0 seed)`,
      variables: { numRows: n, rowIndex: 0, row: [1] },
      triangle: [[1]],
      duration: 800,
    })
  )

  if (n === 1) {
    steps.push(
      createStep({
        lineKey: 'result',
        type: 'complete',
        array: [1],
        message: 'Done — Pascal\'s Triangle with 1 row: [[1]]',
        variables: { numRows: n, rowIndex: 0 },
        triangle: [[1]],
        duration: 800,
      })
    )
    return steps
  }

  // ── row-building loop ──────────────────────────────────────────────────────
  for (let i = 1; i < n; i++) {
    const prev = triangle[i - 1]
    const row = [1]

    // Announce start of new row
    steps.push(
      createStep({
        lineKey: 'outerLoop',
        type: 'compare',
        array: [...prev],
        message: `Row ${i}: start from previous row [${prev.join(', ')}]`,
        variables: { rowIndex: i, prevRow: [...prev], row: [1] },
        triangle: triangle.map((r) => [...r]),
        duration: 700,
      })
    )

    // Interior cells
    for (let j = 1; j < prev.length; j++) {
      const cell = prev[j - 1] + prev[j]
      row.push(cell)

      steps.push(
        createStep({
          lineKey: 'innerCell',
          type: 'swap',
          array: [...row],
          indices: [j],
          message: `  row[${j}] = prev[${j - 1}] + prev[${j}] = ${prev[j - 1]} + ${prev[j]} = ${cell}`,
          variables: {
            rowIndex: i,
            colIndex: j,
            left: prev[j - 1],
            right: prev[j],
            cell,
            row: [...row],
          },
          triangle: triangle.map((r) => [...r]),
          duration: 600,
        })
      )
    }

    // Close the row with trailing 1
    row.push(1)
    triangle.push(row)

    steps.push(
      createStep({
        lineKey: 'rowDone',
        type: 'inner-loop',
        array: [...row],
        message: `  Row ${i} complete → [${row.join(', ')}]  (sum = ${row.reduce((a, b) => a + b, 0)} = 2^${i})`,
        variables: {
          rowIndex: i,
          row: [...row],
          rowSum: row.reduce((a, b) => a + b, 0),
        },
        triangle: triangle.map((r) => [...r]),
        duration: 750,
      })
    )
  }

  // ── final result step ──────────────────────────────────────────────────────
  const lastRow = triangle[triangle.length - 1]
  steps.push(
    createStep({
      lineKey: 'result',
      type: 'complete',
      array: [...lastRow],
      message: `Done — Pascal's Triangle with ${n} rows built`,
      variables: { numRows: n, rowIndex: n - 1 },
      triangle: triangle.map((r) => [...r]),
      duration: 1000,
    })
  )

  return steps
}

// ── 3.  Multi-language source strings + line maps ─────────────────────────────
//
// lineMap keys align 1-to-1 with the lineKey vocabulary above:
//   start | outerLoop | innerCell | rowDone | result
//
// Line numbers are 1-based and must correspond to actual lines in `code`.

export const pascalsTriangleSources = {
  javascript: {
    code: `function pascalsTriangle(numRows) {
  const triangle = [[1]];           // start: seed row 0

  for (let i = 1; i < numRows; i++) {  // outerLoop
    const prev = triangle[i - 1];
    const row = [1];

    for (let j = 1; j < prev.length; j++) {
      row.push(prev[j - 1] + prev[j]);  // innerCell
    }

    row.push(1);
    triangle.push(row);             // rowDone
  }

  return triangle;                  // result
}

console.log(pascalsTriangle(5));`,
    lineMap: { start: 2, outerLoop: 4, innerCell: 9, rowDone: 13, result: 16 },
  },

  python: {
    code: `def pascals_triangle(num_rows):
    triangle = [[1]]           # start: seed row 0

    for i in range(1, num_rows):  # outerLoop
        prev = triangle[i - 1]
        row = [1]

        for j in range(1, len(prev)):
            row.append(prev[j - 1] + prev[j])  # innerCell

        row.append(1)
        triangle.append(row)   # rowDone

    return triangle            # result

print(pascals_triangle(5))`,
    lineMap: { start: 2, outerLoop: 4, innerCell: 9, rowDone: 12, result: 14 },
  },

  cpp: {
    code: `#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> pascalsTriangle(int numRows) {
    vector<vector<int>> triangle = {{1}};  // start

    for (int i = 1; i < numRows; i++) {    // outerLoop
        const auto& prev = triangle[i - 1];
        vector<int> row = {1};

        for (int j = 1; j < (int)prev.size(); j++) {
            row.push_back(prev[j - 1] + prev[j]);  // innerCell
        }

        row.push_back(1);
        triangle.push_back(row);           // rowDone
    }

    return triangle;                       // result
}

int main() {
    auto t = pascalsTriangle(5);
    for (auto& r : t) {
        for (int v : r) cout << v << " ";
        cout << "\\n";
    }
}`,
    lineMap: { start: 6, outerLoop: 8, innerCell: 13, rowDone: 17, result: 20 },
  },

  java: {
    code: `import java.util.*;

public class PascalsTriangle {
    public static List<List<Integer>> generate(int numRows) {
        List<List<Integer>> triangle = new ArrayList<>();
        triangle.add(Arrays.asList(1));  // start: seed row 0

        for (int i = 1; i < numRows; i++) {  // outerLoop
            List<Integer> prev = triangle.get(i - 1);
            List<Integer> row = new ArrayList<>();
            row.add(1);

            for (int j = 1; j < prev.size(); j++) {
                row.add(prev.get(j - 1) + prev.get(j));  // innerCell
            }

            row.add(1);
            triangle.add(row);  // rowDone
        }

        return triangle;  // result
    }

    public static void main(String[] args) {
        System.out.println(generate(5));
    }
}`,
    lineMap: { start: 6, outerLoop: 8, innerCell: 14, rowDone: 18, result: 21 },
  },

  c: {
    code: `#include <stdio.h>
#include <stdlib.h>

void pascalsTriangle(int numRows) {
    int* rows[numRows];
    int sizes[numRows];

    rows[0] = malloc(sizeof(int));  // start: seed row 0
    rows[0][0] = 1;
    sizes[0] = 1;

    for (int i = 1; i < numRows; i++) {  // outerLoop
        int sz = i + 1;
        rows[i] = malloc(sz * sizeof(int));
        sizes[i] = sz;
        rows[i][0] = rows[i][sz - 1] = 1;

        for (int j = 1; j < sz - 1; j++) {
            rows[i][j] = rows[i-1][j-1] + rows[i-1][j];  // innerCell
        }
        // rowDone (row i complete)
    }
    // result: triangle fully built
    for (int i = 0; i < numRows; i++) free(rows[i]);
}

int main() { pascalsTriangle(5); }`,
    lineMap: { start: 8, outerLoop: 12, innerCell: 19, rowDone: 21, result: 23 },
  },

  rust: {
    code: `fn pascals_triangle(num_rows: usize) -> Vec<Vec<u64>> {
    let mut triangle: Vec<Vec<u64>> = vec![vec![1]];  // start

    for i in 1..num_rows {  // outerLoop
        let prev = &triangle[i - 1];
        let mut row = vec![1u64];

        for j in 1..prev.len() {
            row.push(prev[j - 1] + prev[j]);  // innerCell
        }

        row.push(1);
        triangle.push(row);  // rowDone
    }

    triangle  // result
}

fn main() {
    println!("{:?}", pascals_triangle(5));
}`,
    lineMap: { start: 2, outerLoop: 4, innerCell: 9, rowDone: 13, result: 16 },
  },

  go: {
    code: `package main

import "fmt"

func pascalsTriangle(numRows int) [][]int {
    triangle := [][]int{{1}}  // start: seed row 0

    for i := 1; i < numRows; i++ {  // outerLoop
        prev := triangle[i-1]
        row := []int{1}

        for j := 1; j < len(prev); j++ {
            row = append(row, prev[j-1]+prev[j])  // innerCell
        }

        row = append(row, 1)
        triangle = append(triangle, row)  // rowDone
    }

    return triangle  // result
}

func main() {
    fmt.Println(pascalsTriangle(5))
}`,
    lineMap: { start: 6, outerLoop: 8, innerCell: 13, rowDone: 17, result: 20 },
  },
}

// ── 4.  Convenience accessors (same pattern as other source modules) ───────────

/** Returns the source code string for a given language (falls back to JS). */
export const getPascalsTriangleSource = (language) =>
  pascalsTriangleSources[language]?.code ??
  pascalsTriangleSources.javascript.code

/**
 * Resolves a lineMap key to its 1-based line number for a given language.
 * @param {string} language
 * @param {'start'|'outerLoop'|'innerCell'|'rowDone'|'result'} lineKey
 * @returns {number|undefined}
 */
export const resolvePascalsTriangleLine = (language, lineKey) =>
  (pascalsTriangleSources[language] ?? pascalsTriangleSources.javascript)
    .lineMap?.[lineKey]

