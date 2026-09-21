export type DeptId = "HW" | "SW" | "PM" | "PSE" | "FE" | "SS";
export type Project = {
  id: string;
  name: string;
  code: string;
  customer: string;
  location: string;
  status: "Active" | "Planning";
};
export type Department = { id: DeptId; name: string; target: number };
export type Person = {
  photo?: string;
  id: string;
  name: string;
  dept: DeptId;
  title: string;
  location: string;
};
export type PlanBar = {
  id: string;
  project: string;
  dept: DeptId;
  start: number;
  end: number;
  allocation: number;
  label?: string;
  personId?: string;
};
export type Milestone = {
  id: string;
  project: string;
  label: string;
  type: "internal" | "external";
  month: number;
};

export const START_YEAR = 2026;
export const TOTAL_MONTHS = 24;
export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export const timelineMonths = Array.from({ length: TOTAL_MONTHS }, (_, i) => ({
  index: i,
  year: START_YEAR + Math.floor(i / 12),
  month: i % 12,
  label: monthNames[i % 12],
}));

export const departments: Department[] = [
  { id: "HW", name: "Hardware Engineering", target: 0.85 },
  { id: "SW", name: "Software Engineering", target: 0.85 },
  { id: "PM", name: "Project Managers", target: 0.8 },
  { id: "PSE", name: "Project System Engineers", target: 0.85 },
  { id: "FE", name: "Field Engineers", target: 0.85 },
  { id: "SS", name: "Site Supervisors", target: 0.85 },
];

export const seedProjects: Project[] = [
  {
    id: "G-IAH",
    name: "G IAH",
    code: "G IAH",
    customer: "",
    location: "",
    status: "Planning",
  },
  {
    id: "K-SAV",
    name: "K SAV",
    code: "K SAV",
    customer: "",
    location: "",
    status: "Planning",
  },
  {
    id: "C-MLK",
    name: "C MLK",
    code: "C MLK",
    customer: "",
    location: "",
    status: "Planning",
  },
];

export const seedPeople: Person[] = [];

/**
 * Field Engineering staffing rule:
 * - 2 FE per system from commissioning start through one full month after
 *   Provisional Acceptance / Go-Live.
 * - Then 1 FE per system through Final Acceptance.
 * - The planner is monthly, so a reduction that occurs late in the same month
 *   as Final Acceptance is not modeled as a partial-month reduction.
 */
export const seedBars: PlanBar[] = [
  // G IAH
  { id: "G-SP-2", project: "G-IAH", dept: "FE", label: "Skypod", start: 10, end: 18, allocation: 2 },
  { id: "G-SP-1", project: "G-IAH", dept: "FE", label: "Skypod", start: 19, end: 23, allocation: 1 },
  { id: "G-IN-2", project: "G-IAH", dept: "FE", label: "Inbound", start: 12, end: 19, allocation: 2 },
  { id: "G-IN-1", project: "G-IAH", dept: "FE", label: "Inbound", start: 20, end: 23, allocation: 1 },
  { id: "G-OUT-2", project: "G-IAH", dept: "FE", label: "Outbound", start: 14, end: 22, allocation: 2 },
  { id: "G-OUT-1", project: "G-IAH", dept: "FE", label: "Outbound", start: 23, end: 23, allocation: 1 },

  // K SAV — Inbound / Outbound commissioning start is assumed in Nov 2026.
  { id: "K-SP-2", project: "K-SAV", dept: "FE", label: "Skypod", start: 9, end: 14, allocation: 2 },
  { id: "K-SP-1", project: "K-SAV", dept: "FE", label: "Skypod", start: 15, end: 15, allocation: 1 },
  { id: "K-IN-2", project: "K-SAV", dept: "FE", label: "Inbound", start: 10, end: 14, allocation: 2 },
  { id: "K-IN-1", project: "K-SAV", dept: "FE", label: "Inbound", start: 15, end: 15, allocation: 1 },
  { id: "K-OUT-2", project: "K-SAV", dept: "FE", label: "Outbound", start: 10, end: 14, allocation: 2 },
  { id: "K-OUT-1", project: "K-SAV", dept: "FE", label: "Outbound", start: 15, end: 15, allocation: 1 },

  // C MLK — the Feb 15 third-party conveyor start is used for Inbound and Outbound.
  { id: "C-SP-2", project: "C-MLK", dept: "FE", label: "Skypod", start: 13, end: 16, allocation: 2 },
  { id: "C-IN-2", project: "C-MLK", dept: "FE", label: "Inbound", start: 13, end: 16, allocation: 2 },
  { id: "C-OUT-2", project: "C-MLK", dept: "FE", label: "Outbound", start: 13, end: 16, allocation: 2 },
];

export const seedMilestones: Milestone[] = [
  // G IAH
  { id: "G-M1", project: "G-IAH", label: "Skypod · Start commissioning (mid-Nov)", type: "internal", month: 10 },
  { id: "G-M2", project: "G-IAH", label: "Inbound · Start commissioning (mid-Jan)", type: "internal", month: 12 },
  { id: "G-M3", project: "G-IAH", label: "Outbound · Start commissioning (Mar)", type: "internal", month: 14 },
  { id: "G-M4", project: "G-IAH", label: "Skypod · Provisional Acceptance / Go-Live (mid-Jun)", type: "external", month: 17 },
  { id: "G-M5", project: "G-IAH", label: "Inbound · Provisional Acceptance / Go-Live (Jul 13)", type: "external", month: 18 },
  { id: "G-M6", project: "G-IAH", label: "Outbound · Provisional Acceptance / Go-Live (Oct 12)", type: "external", month: 21 },
  { id: "G-M7", project: "G-IAH", label: "Final Acceptance (end Dec)", type: "external", month: 23 },

  // K SAV
  { id: "K-M1", project: "K-SAV", label: "Skypod · Start commissioning (Oct 2)", type: "internal", month: 9 },
  { id: "K-M2", project: "K-SAV", label: "Inbound · Start commissioning (Nov, assumed)", type: "internal", month: 10 },
  { id: "K-M3", project: "K-SAV", label: "Outbound · Start commissioning (Nov, assumed)", type: "internal", month: 10 },
  { id: "K-M4", project: "K-SAV", label: "Provisional Acceptance / Go-Live (Feb 27)", type: "external", month: 13 },
  { id: "K-M5", project: "K-SAV", label: "Final Acceptance (Apr 25)", type: "external", month: 15 },

  // C MLK
  { id: "C-M1", project: "C-MLK", label: "Skypod · Start commissioning (Feb 2)", type: "internal", month: 13 },
  { id: "C-M2", project: "C-MLK", label: "Inbound · Start commissioning (Feb 15 conveyor)", type: "internal", month: 13 },
  { id: "C-M3", project: "C-MLK", label: "Outbound · Start commissioning (Feb 15 conveyor)", type: "internal", month: 13 },
  { id: "C-M4", project: "C-MLK", label: "Provisional Acceptance / Go-Live (Apr 25)", type: "external", month: 15 },
  { id: "C-M5", project: "C-MLK", label: "Final Acceptance (end May)", type: "external", month: 16 },
];

export type Plan = {
  projects: Project[];
  people: Person[];
  bars: PlanBar[];
  milestones: Milestone[];
};
export const initialPlan: Plan = {
  projects: seedProjects,
  people: seedPeople,
  bars: seedBars,
  milestones: seedMilestones,
};
export const STORAGE_KEY = "nolazco-resource-plan-v3";
export const LEGACY_STORAGE_KEYS = ["nolazco-resource-plan-v1", "nolazco-resource-plan-v2"];
export const active = (b: PlanBar, m: number) => b.start <= m && b.end >= m;
export const demand = (bars: PlanBar[], m: number) =>
  bars.filter((b) => active(b, m)).reduce((n, b) => n + b.allocation, 0);
export const allocated = (bars: PlanBar[], personId: string, m: number) =>
  demand(
    bars.filter((b) => b.personId === personId),
    m,
  );
export const peak = (bars: PlanBar[]) =>
  Math.max(0, ...timelineMonths.map((m) => demand(bars, m.index)));
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const fte = (n: number) => Number(n.toFixed(2)).toString();
export const monthLabel = (n: number) =>
  `${monthNames[n % 12]} ${START_YEAR + Math.floor(n / 12)}`;
export const uid = () => crypto.randomUUID();
export function staffing(people: Person[], bars: PlanBar[], dept: Department) {
  const team = people.filter((p) => p.dept === dept.id).length;
  const monthly = timelineMonths.map((m) =>
    demand(
      bars.filter((b) => b.dept === dept.id),
      m.index,
    ),
  );
  const capacity = team * dept.target;
  const gap = Math.max(0, ...monthly) - capacity;
  return {
    team,
    monthly,
    capacity,
    gap: Math.max(0, gap),
    hires: Math.max(0, Math.ceil((gap - 1e-9) / dept.target)),
  };
}
export function validPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Plan;
  const depts = new Set(departments.map((d) => d.id));
  const str = (s: unknown) => typeof s === "string" && s.trim().length > 0;
  const month = (n: number) =>
    Number.isInteger(n) && n >= 0 && n < TOTAL_MONTHS;
  if (![p.projects, p.people, p.bars, p.milestones].every(Array.isArray))
    return false;
  if (
    ![p.projects, p.people, p.bars, p.milestones].every(
      (a) =>
        a.every((v) => v && str(v.id)) &&
        new Set(a.map((v) => v.id)).size === a.length,
    )
  )
    return false;
  if (
    !p.projects.length ||
    !p.projects.every(
      (v) =>
        str(v.name) &&
        str(v.code) &&
        typeof v.customer === "string" &&
        typeof v.location === "string" &&
        ["Active", "Planning"].includes(v.status),
    )
  )
    return false;
  if (
    !p.people.every(
      (v) =>
        str(v.name) &&
        depts.has(v.dept) &&
        (v.photo === undefined || (typeof v.photo === "string" && v.photo.length <= 80000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v.photo))) &&
        typeof v.title === "string" &&
        typeof v.location === "string",
    )
  )
    return false;
  if (
    !p.bars.every(
      (v) =>
        p.projects.some((x) => x.id === v.project) &&
        depts.has(v.dept) &&
        month(v.start) &&
        month(v.end) &&
        v.end >= v.start &&
        Number.isFinite(v.allocation) &&
        (v.label === undefined || (typeof v.label === "string" && v.label.trim().length > 0 && v.label.length <= 80)) &&
        v.allocation > 0 &&
        v.allocation <= 20 &&
        (!v.personId ||
          p.people.some((x) => x.id === v.personId && x.dept === v.dept)),
    )
  )
    return false;
  return p.milestones.every(
    (v) =>
      p.projects.some((x) => x.id === v.project) &&
      str(v.label) &&
      ["internal", "external"].includes(v.type) &&
      month(v.month),
  );
}
