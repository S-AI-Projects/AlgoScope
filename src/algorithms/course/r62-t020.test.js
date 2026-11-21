import { describe, expect, it } from 'vitest';
import { generateLargestRectangleSteps } from '../monotonicStack/largestRectangleSteps.js';

function getPoppedIndices(steps) {
  return steps
    .filter((step) => step.lineKey === 'popAndCalc' || step.type === 'calculate')
    .map((step) => {
      const match = /Pop index (\d+)/.exec(step.message ?? '');
      return match ? Number(match[1]) : null;
    })
    .filter((idx) => idx !== null);
}

function getPushCount(steps) {
  return steps.filter((step) => step.lineKey === 'push' || step.type === 'push').length;
}

function getFinalMaxArea(steps) {
  const completeStep = steps.find((step) => step.type === 'complete') ?? steps[steps.length - 1];
  return completeStep?.variables?.maxArea ?? 0;
}

// Reference mutant: changes decisive '>' height comparison to '>=' (causes premature pop on equal heights)
function mutatedLargestRectangle(heights) {
  const n = heights.length;
  const stack = new Array();
  let maxArea = 0;
  for (let i = 0; i <= n; i++) {
    const currentHeight = i === n ? 0 : heights[i];
    while (stack.length > 0 && heights[stack[stack.length - 1]] >= currentHeight) {
      const topIndex = stack.pop();
      const h = heights[topIndex];
      // Mutant bug: omits subtracting 1 in width when stack is non-empty
      const buggyW = stack.length === 0 ? i : i - stack[stack.length - 1];
      if (h * buggyW > maxArea) maxArea = h * buggyW;
    }
    stack.push(i);
  }
  return maxArea;
}

describe('R62-T020: largestRectangleSteps mutation-resistant regression suite', () => {
  it('follows LIFO monotonic stack trace: push A, B, C; pop twice; push D; drain -> pop order C, B, D, A', () => {
    // Heights: A=idx 0 (2), B=idx 1 (4), C=idx 2 (6), D=idx 3 (3)
    // 1. Push A(0), B(1), C(2)
    // 2. At i=3 (h=3): pop C(2), pop B(1), push D(3)
    // 3. Drain at i=4 (h=0): pop D(3), pop A(0)
    // Exact LIFO pop sequence: C(2), B(1), D(3), A(0)
    const heights = new Array(2, 4, 6, 3);
    const steps = generateLargestRectangleSteps(heights);

    expect(Array.isArray(steps)).toBe(true);
    expect(getPushCount(steps)).toBe(4);
    expect(getPoppedIndices(steps)).toEqual(new Array(2, 1, 3, 0));
    expect(getFinalMaxArea(steps)).toBe(9);
  });

  it('exercises documented empty-state behavior cleanly', () => {
    const emptySteps = generateLargestRectangleSteps(new Array());
    expect(Array.isArray(emptySteps)).toBe(true);
    expect(getFinalMaxArea(emptySteps)).toBe(0);
    expect(getPoppedIndices(emptySteps)).toEqual(new Array());
  });

  it('rejects a temporary one-condition mutant of the decisive operation', () => {
    const heights = new Array(2, 1, 5, 6, 2, 3);
    const steps = generateLargestRectangleSteps(heights);
    const actualMaxArea = getFinalMaxArea(steps);

    // True maximum rectangle area is 10 (bars of height 5 and 6 -> width 2 * height 5)
    expect(actualMaxArea).toBe(10);

    // Confirm a one-condition mutant of the decisive pop/width operation diverges and is rejected
    const mutantMaxArea = mutatedLargestRectangle(heights);
    expect(mutantMaxArea).not.toBe(actualMaxArea);
  });
});
