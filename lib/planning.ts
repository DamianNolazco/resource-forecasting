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
    id: "P1",
    name: "Project Atlas LAX1",
    code: "LAX1",
    customer: "Customer A",
    location: "Los Angeles, CA",
    status: "Active",
  },
  {
    id: "P2",
    name: "Project Beacon DFW1",
    code: "DFW1",
    customer: "Customer B",
    location: "Fort Worth, TX",
    status: "Active",
  },
  {
    id: "P3",
    name: "Project Cedar ATL1",
    code: "ATL1",
    customer: "Customer C",
    location: "Atlanta, GA",
    status: "Planning",
  },
  {
    id: "P4",
    name: "Project Delta EWR1",
    code: "EWR1",
    customer: "Customer D",
    location: "Newark, NJ",
    status: "Planning",
  },
];

export const seedPeople: Person[] = [
  {
    id: "U1",
    name: "Employee 001",
    dept: "PSE",
    title: "Project System Engineer",
    location: "Atlanta, GA",
  },
  {
    id: "U2",
    name: "Employee 002",
    dept: "PSE",
    title: "Project System Engineer",
    location: "Houston, TX",
  },
  {
    id: "U3",
    name: "Employee 003",
    dept: "FE",
    title: "Field Engineer",
    location: "Atlanta, GA",
  },
  {
    id: "U4",
    name: "Employee 004",
    dept: "FE",
    title: "Field Engineer",
    location: "Chicago, IL",
  },
  {
    id: "U5",
    name: "Employee 005",
    dept: "PM",
    title: "Project Manager",
    location: "Atlanta, GA",
  },
  {
    id: "U6",
    name: "Employee 006",
    dept: "SW",
    title: "Software Engineer",
    location: "Atlanta, GA",
  },
  {
    id: "U7",
    name: "Employee 007",
    dept: "HW",
    title: "Hardware Engineer",
    location: "Atlanta, GA",
  },
  {
    id: "U8",
    name: "Employee 008",
    dept: "SS",
    title: "Site Supervisor",
    location: "Dallas, TX",
  },
  {
    id: "U9",
    name: "Employee 009",
    dept: "FE",
    title: "Field Engineer",
    location: "Dallas, TX",
  },
  {
    id: "U10",
    name: "Employee 010",
    dept: "FE",
    title: "Field Engineer",
    location: "Newark, NJ",
  },
  {
    id: "U11",
    name: "Employee 011",
    dept: "PM",
    title: "Project Manager",
    location: "Chicago, IL",
  },
  {
    id: "U12",
    name: "Employee 012",
    dept: "SW",
    title: "Software Engineer",
    location: "Boston, MA",
  },
  {
    id: "U13",
    name: "Employee 013",
    dept: "HW",
    title: "Hardware Engineer",
    location: "Atlanta, GA",
  },
  {
    id: "U14",
    name: "Employee 014",
    dept: "SS",
    title: "Site Supervisor",
    location: "Los Angeles, CA",
  },
];

export const seedBars: PlanBar[] = [
  {
    id: "B1",
    project: "P1",
    dept: "PM",
    start: 5,
    end: 18,
    allocation: 0.5,
    personId: "U5",
  },
  {
    id: "B2",
    project: "P1",
    dept: "PSE",
    start: 7,
    end: 13,
    allocation: 1,
    personId: "U1",
  },
  {
    id: "B3",
    project: "P1",
    dept: "FE",
    start: 9,
    end: 15,
    allocation: 1,
    personId: "U3",
  },
  { id: "B4", project: "P1", dept: "FE", start: 11, end: 17, allocation: 1 },
  {
    id: "B5",
    project: "P1",
    dept: "SS",
    start: 12,
    end: 16,
    allocation: 1,
    personId: "U8",
  },
  {
    id: "B6",
    project: "P2",
    dept: "PM",
    start: 2,
    end: 15,
    allocation: 0.5,
    personId: "U11",
  },
  {
    id: "B7",
    project: "P2",
    dept: "PSE",
    start: 4,
    end: 12,
    allocation: 1,
    personId: "U2",
  },
  { id: "B8", project: "P2", dept: "FE", start: 7, end: 13, allocation: 1.5 },
  {
    id: "B9",
    project: "P3",
    dept: "HW",
    start: 8,
    end: 12,
    allocation: 0.5,
    personId: "U7",
  },
  {
    id: "B10",
    project: "P3",
    dept: "SW",
    start: 9,
    end: 14,
    allocation: 0.75,
    personId: "U6",
  },
  { id: "B11", project: "P3", dept: "PSE", start: 10, end: 18, allocation: 1 },
  { id: "B12", project: "P3", dept: "FE", start: 13, end: 21, allocation: 2 },
  { id: "B13", project: "P4", dept: "PM", start: 10, end: 23, allocation: 0.5 },
  { id: "B14", project: "P4", dept: "PSE", start: 12, end: 20, allocation: 1 },
  { id: "B15", project: "P4", dept: "FE", start: 16, end: 23, allocation: 2 },
];

export const seedMilestones: Milestone[] = [
  {
    id: "M1",
    project: "P1",
    label: "Design freeze",
    type: "internal",
    month: 6,
  },
  {
    id: "M2",
    project: "P1",
    label: "Software ready",
    type: "internal",
    month: 10,
  },
  { id: "M3", project: "P1", label: "SAT", type: "internal", month: 15 },
  { id: "M4", project: "P1", label: "Site ready", type: "external", month: 8 },
  { id: "M5", project: "P1", label: "WMS ready", type: "external", month: 12 },
  { id: "M6", project: "P1", label: "Go live", type: "external", month: 16 },
  {
    id: "M7",
    project: "P2",
    label: "Design freeze",
    type: "internal",
    month: 4,
  },
  { id: "M8", project: "P2", label: "Site ready", type: "external", month: 7 },
  { id: "M9", project: "P2", label: "Go live", type: "external", month: 14 },
  {
    id: "M10",
    project: "P3",
    label: "Design freeze",
    type: "internal",
    month: 9,
  },
  {
    id: "M11",
    project: "P3",
    label: "Site ready",
    type: "external",
    month: 12,
  },
  { id: "M12", project: "P3", label: "Go live", type: "external", month: 20 },
  {
    id: "M13",
    project: "P4",
    label: "Design freeze",
    type: "internal",
    month: 11,
  },
  {
    id: "M14",
    project: "P4",
    label: "Site ready",
    type: "external",
    month: 16,
  },
  { id: "M15", project: "P4", label: "Go live", type: "external", month: 23 },
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
export const STORAGE_KEY = "nolazco-resource-plan-v2";
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
