# Nolazco Labs Resource Planning

A Next.js workspace for monthly resource forecasting across January 2026–December 2027.

## Run

```sh
npm ci
npm run dev
npm test
npm run build
```

## Workflows

- Project planner: fit two years or zoom, department swimlanes, drag/move/resize allocations, edit assignments and percentages, internal/external milestones.
- Resources: create/edit people, search/filter, yearly monthly allocation heatmap, cross-project overload detection.
- Capacity: FTE demand versus department target capacity, numeric axes, gap and target-adjusted hiring estimates.
- Portfolio: create/edit projects and review project demand.
- Persistence: versioned browser local storage, JSON export/import with validation, one-step undo.

The app starts with the G IAH, K SAV, and C MLK commissioning staffing forecast. Resource names are intentionally empty until real people are added, and system demand is preloaded as unassigned Field Engineering FTE. This seed update clears the prior demo-data browser keys once. There is no shared database, authentication, or cross-device synchronization in this version. Export a JSON backup before clearing browser storage. Invalid saved data is preserved and automatic writes pause until a valid plan is imported.

## Calculation rules

Start and end months are inclusive. Allocations sum across concurrent projects. Unassigned allocations count as demand but not as a person's utilization. 100% equals 1 FTE. Sustainable capacity is department headcount multiplied by its target (80% for PM, 85% for other departments). Hiring estimates round up the peak demand gap divided by that target. Leave, employment start dates, and skill constraints are not modeled.

## Validation

The test suite covers allocation boundaries and summation, hiring math, import validation, editor/save/undo workflows, reload persistence, dragging/resizing, filters, milestones, and corrupt-storage protection. Real browser visual QA must be performed separately.
