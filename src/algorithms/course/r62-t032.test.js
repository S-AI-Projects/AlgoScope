import { describe, expect, it } from 'vitest'
import { generateJobSequencingSteps } from '../greedy/jobSequencingSteps.js'

describe('generateJobSequencingSteps boundary and tie contract', () => {
  it('schedules the smallest valid job into its only slot', () => {
    // Preconditions: positive profit/deadline are accepted at source lines 35-41;
    // deadline determines the single-slot timeline at lines 56-65.
    const input = [{ id: 'A', profit: 1, deadline: 1 }]
    const steps = generateJobSequencingSteps(input)
    const complete = steps.at(-1)

    expect(steps.map((step) => step.type)).toEqual([
      'start', 'sorting', 'sorted', 'init-timeline',
      'process-job', 'check-slot', 'schedule-success', 'complete',
    ])
    expect(steps[0].variables).toMatchObject({ totalJobs: 1, maxDeadline: 1 })
    expect(steps.find((step) => step.type === 'schedule-success')).toMatchObject({
      activeJobId: 'A', activeSlotIndex: 0,
      timeline: [{ slotIndex: 0, label: '0-1', jobId: 'A', status: 'filled' }],
      variables: { assignedSlot: 1, totalProfit: 1 },
    })
    expect(complete.variables).toMatchObject({ totalProfit: 1, scheduledCount: 1, missedCount: 0 })
    expect(input).toEqual([{ id: 'A', profit: 1, deadline: 1 }])
  })

  it('applies the profit/deadline tie order and reports the missed job', () => {
    // Preconditions: valid jobs pass the filter at lines 35-41. The deterministic
    // tie-break is profit descending then deadline ascending at line 101.
    const input = [
      { id: 'A', profit: 5, deadline: 2 },
      { id: 'B', profit: 5, deadline: 1 },
      { id: 'C', profit: 4, deadline: 2 },
    ]
    const steps = generateJobSequencingSteps(input)
    const sorted = steps.find((step) => step.type === 'sorted')
    const complete = steps.at(-1)

    expect(sorted.jobs.map(({ id }) => id)).toEqual(['B', 'A', 'C'])
    expect(steps.filter((step) => step.type === 'schedule-success').map((step) => [step.activeJobId, step.variables.assignedSlot])).toEqual([
      ['B', 1], ['A', 2],
    ])
    expect(steps.filter((step) => step.type === 'schedule-miss').map((step) => step.activeJobId)).toEqual(['C'])
    expect(complete.timeline.map(({ jobId }) => jobId)).toEqual(['B', 'A'])
    expect(complete.variables).toMatchObject({ totalProfit: 10, scheduledCount: 2, missedCount: 1 })
    expect(input.map(({ id }) => id)).toEqual(['A', 'B', 'C'])
  })
})
