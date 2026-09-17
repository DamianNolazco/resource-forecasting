import { describe, it, expect } from "vitest";
import {
  initialPlan,
  allocated,
  demand,
  staffing,
  departments,
  validPlan,
  type PlanBar,
} from "../lib/planning";
describe("forecast correctness", () => {
  it("includes both boundary months and sums concurrent assignments across projects", () => {
    const bars: PlanBar[] = [
      {
        id: "a",
        project: "P1",
        dept: "PSE",
        personId: "U1",
        start: 0,
        end: 1,
        allocation: 0.75,
      },
      {
        id: "b",
        project: "P2",
        dept: "PSE",
        personId: "U1",
        start: 1,
        end: 2,
        allocation: 0.5,
      },
    ];
    expect(allocated(bars, "U1", 0)).toBe(0.75);
    expect(allocated(bars, "U1", 1)).toBe(1.25);
    expect(allocated(bars, "U1", 2)).toBe(0.5);
    expect(allocated(bars, "U1", 3)).toBe(0);
  });
  it("uses target-adjusted capacity when estimating hires, including fractional gaps", () => {
    const d = departments.find((d) => d.id === "PSE")!;
    const people = initialPlan.people.filter((p) => p.dept === "PSE");
    const bars: PlanBar[] = [
      {
        id: "a",
        project: "P1",
        dept: "PSE",
        start: 0,
        end: 0,
        allocation: 2.6,
      },
    ];
    const result = staffing(people, bars, d);
    expect(result.capacity).toBe(1.7);
    expect(result.hires).toBe(2);
    expect(staffing(people, [{ ...bars[0], allocation: 1.8 }], d).hires).toBe(
      1,
    );
    expect(staffing(people, [{ ...bars[0], allocation: 1.7 }], d).hires).toBe(
      0,
    );
  });
  it("counts unassigned demand without assigning it to a person", () => {
    expect(demand(initialPlan.bars, 12)).toBeGreaterThan(
      initialPlan.people.reduce(
        (s, p) => s + allocated(initialPlan.bars, p.id, 12),
        0,
      ),
    );
  });
  it("validates complete imports and rejects broken references and invalid dates", () => {
    expect(validPlan(initialPlan)).toBe(true);
    for (const patch of [
      { start: -1 },
      { end: 24 },
      { start: 20, end: 1 },
      { allocation: NaN },
      { allocation: 0 },
      { personId: "missing" },
      { dept: "HW", personId: "U1" },
    ])
      expect(
        validPlan({
          ...initialPlan,
          bars: [{ ...initialPlan.bars[0], ...patch }],
        }),
      ).toBe(false);
    expect(
      validPlan({
        ...initialPlan,
        people: [initialPlan.people[0], initialPlan.people[0]],
      }),
    ).toBe(false);
    expect(validPlan({})).toBe(false);
  });
});
