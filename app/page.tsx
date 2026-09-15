"use client";

import { useMemo, useState } from "react";

type View = "overview" | "planner" | "projects" | "people" | "capacity";
type Department = { id: string; name: string; short: string; capacity: number; target: number };
type Project = { id: string; name: string; customer: string; code: string; location: string; status: "Active" | "Planning"; start: number; end: number; priority: string };
type Person = { id: string; first: string; last: string; dept: string; title: string; location: string; capacity: number };
type Demand = { id: string; scenario: string; project: string; dept: string; start: number; end: number; fte: number };
type Allocation = { id: string; scenario: string; person: string; project: string; start: number; end: number; fte: number; type: "Committed" | "Tentative" };

const departments: Department[] = [
  { id: "HW", name: "Hardware Engineering", short: "HW", capacity: 2, target: 0.85 },
  { id: "SW", name: "Software Engineering", short: "SW", capacity: 2, target: 0.85 },
  { id: "PM", name: "Project Managers", short: "PM", capacity: 2, target: 0.8 },
  { id: "PSE", name: "Project System Engineers", short: "PSE", capacity: 2, target: 0.85 },
  { id: "FE", name: "Field Engineers", short: "FE", capacity: 4, target: 0.85 },
  { id: "SS", name: "Site Supervisors", short: "SS", capacity: 2, target: 0.85 },
];

const projects: Project[] = [
  { id: "P1", name: "OpenAI LAX1", customer: "OpenAI", code: "LAX1", location: "Los Angeles, CA", status: "Active", start: 0, end: 10, priority: "High" },
  { id: "P2", name: "Grainger PDX", customer: "Grainger", code: "PDX", location: "Portland, OR", status: "Active", start: 0, end: 11, priority: "High" },
  { id: "P3", name: "Medtronic ATL", customer: "Medtronic", code: "ATL", location: "Atlanta, GA", status: "Planning", start: 3, end: 11, priority: "Medium" },
  { id: "P4", name: "Barnes & Noble EWR", customer: "Barnes & Noble", code: "EWR", location: "Newark, NJ", status: "Planning", start: 6, end: 11, priority: "Medium" },
];

const people: Person[] = [
  { id: "U1", first: "Eli", last: "Tiemann", dept: "PSE", title: "Project System Engineer", location: "Portland, OR", capacity: 1 },
  { id: "U2", first: "Michael", last: "Harris", dept: "PSE", title: "Project System Engineer", location: "Houston, TX", capacity: 1 },
  { id: "U3", first: "Taylor", last: "Reed", dept: "FE", title: "Field Engineer", location: "Atlanta, GA", capacity: 1 },
  { id: "U4", first: "Casey", last: "Nguyen", dept: "FE", title: "Field Engineer", location: "Chicago, IL", capacity: 1 },
  { id: "U5", first: "Morgan", last: "Patel", dept: "PM", title: "Project Manager", location: "Atlanta, GA", capacity: 1 },
  { id: "U6", first: "Riley", last: "Kim", dept: "SW", title: "Software Engineer", location: "Atlanta, GA", capacity: 1 },
  { id: "U7", first: "Jamie", last: "Carter", dept: "HW", title: "Hardware Engineer", location: "Atlanta, GA", capacity: 1 },
  { id: "U8", first: "Sam", last: "Brooks", dept: "SS", title: "Site Supervisor", location: "Dallas, TX", capacity: 1 },
  { id: "U9", first: "Avery", last: "Lopez", dept: "FE", title: "Field Engineer", location: "Dallas, TX", capacity: 1 },
  { id: "U10", first: "Jordan", last: "Price", dept: "FE", title: "Field Engineer", location: "Newark, NJ", capacity: 1 },
  { id: "U11", first: "Drew", last: "Bennett", dept: "PM", title: "Project Manager", location: "Chicago, IL", capacity: 1 },
  { id: "U12", first: "Skyler", last: "Chen", dept: "SW", title: "Software Engineer", location: "Boston, MA", capacity: 1 },
  { id: "U13", first: "Cameron", last: "Diaz", dept: "HW", title: "Hardware Engineer", location: "Atlanta, GA", capacity: 1 },
  { id: "U14", first: "Quinn", last: "Ross", dept: "SS", title: "Site Supervisor", location: "Los Angeles, CA", capacity: 1 },
];

const baseDemand: Demand[] = [
  { id: "D1", scenario: "base", project: "P1", dept: "PSE", start: 0, end: 6, fte: 1 },
  { id: "D2", scenario: "base", project: "P2", dept: "PSE", start: 0, end: 11, fte: 1 },
  { id: "D3", scenario: "base", project: "P1", dept: "FE", start: 1, end: 7, fte: 1.5 },
  { id: "D4", scenario: "base", project: "P2", dept: "FE", start: 2, end: 8, fte: 1.25 },
  { id: "D5", scenario: "base", project: "P3", dept: "FE", start: 4, end: 11, fte: 2 },
  { id: "D6", scenario: "base", project: "P3", dept: "SW", start: 3, end: 8, fte: 0.75 },
  { id: "D7", scenario: "base", project: "P4", dept: "PSE", start: 7, end: 11, fte: 1 },
  { id: "D8", scenario: "base", project: "P1", dept: "PM", start: 0, end: 10, fte: 0.4 },
  { id: "D9", scenario: "base", project: "P2", dept: "PM", start: 0, end: 11, fte: 0.5 },
  { id: "D10", scenario: "base", project: "P3", dept: "HW", start: 3, end: 7, fte: 0.5 },
  { id: "D11", scenario: "base", project: "P1", dept: "SS", start: 2, end: 6, fte: 0.75 },
];

const growthDemand: Demand[] = baseDemand.map((d) => ({ ...d, id: `G-${d.id}`, scenario: "growth", fte: ["FE", "PSE"].includes(d.dept) ? d.fte * 1.2 : d.fte }));

const seedAllocations: Allocation[] = [
  { id: "A1", scenario: "base", person: "U1", project: "P2", start: 0, end: 11, fte: 1, type: "Committed" },
  { id: "A2", scenario: "base", person: "U2", project: "P1", start: 0, end: 6, fte: 1, type: "Committed" },
  { id: "A3", scenario: "base", person: "U3", project: "P1", start: 1, end: 7, fte: 1, type: "Committed" },
  { id: "A4", scenario: "base", person: "U4", project: "P3", start: 4, end: 11, fte: 1, type: "Tentative" },
  { id: "A5", scenario: "base", person: "U6", project: "P3", start: 3, end: 8, fte: 0.6, type: "Tentative" },
  { id: "A6", scenario: "base", person: "U5", project: "P1", start: 0, end: 10, fte: 0.4, type: "Committed" },
  { id: "A7", scenario: "growth", person: "U1", project: "P2", start: 0, end: 11, fte: 1, type: "Committed" },
  { id: "A8", scenario: "growth", person: "U2", project: "P1", start: 0, end: 6, fte: 1, type: "Committed" },
  { id: "A9", scenario: "growth", person: "U3", project: "P1", start: 1, end: 7, fte: 1, type: "Committed" },
  { id: "A10", scenario: "growth", person: "U4", project: "P3", start: 4, end: 11, fte: 1, type: "Tentative" },
  { id: "A11", scenario: "growth", person: "U6", project: "P3", start: 3, end: 8, fte: 0.6, type: "Tentative" },
];

const weekLabels = ["Sep 14", "Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2", "Nov 9", "Nov 16", "Nov 23", "Nov 30"];

function Icon({ name }: { name: View | "plus" | "search" | "close" }) {
  const paths: Record<string, string> = {
    overview: "M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z",
    planner: "M5 3v2M19 3v2M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 7h2m4 0h2m-8 4h2m4 0h2",
    projects: "M4 7h16v12H4V7Zm4 0V4h8v3M8 12h8",
    people: "M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10A3.5 3.5 0 1 0 9.5 3a3.5 3.5 0 0 0 0 7Zm7-5.5a3 3 0 0 1 0 5.8M21 20v-2a4 4 0 0 0-3-3.65",
    capacity: "M4 20V10m6 10V4m6 16v-7m4 7H2",
    plus: "M12 5v14M5 12h14",
    search: "m21 21-4.35-4.35m1.35-5.65A7 7 0 1 1 4 11a7 7 0 0 1 14 0Z",
    close: "m6 6 12 12M18 6 6 18",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function fmt(value: number) { return `${value.toFixed(value >= 10 ? 0 : 1)} FTE`; }
function pct(value: number) { return `${Math.round(value * 100)}%`; }

export default function Page() {
  const [view, setView] = useState<View>("overview");
  const [scenario, setScenario] = useState("base");
  const [demand, setDemand] = useState<Demand[]>([...baseDemand, ...growthDemand]);
  const [allocations, setAllocations] = useState<Allocation[]>(seedAllocations);
  const [selected, setSelected] = useState<{ dept: string; week: number } | null>(null);
  const [search, setSearch] = useState("");

  const activeDemand = demand.filter((d) => d.scenario === scenario);
  const activeAllocations = allocations.filter((a) => a.scenario === scenario);

  const metrics = useMemo(() => {
    const weeks = weekLabels.map((_, week) => {
      const demandFte = activeDemand.filter((d) => d.start <= week && d.end >= week).reduce((s, d) => s + d.fte, 0);
      const allocatedFte = activeAllocations.filter((a) => a.start <= week && a.end >= week).reduce((s, a) => s + a.fte, 0);
      const capacityFte = departments.reduce((s, d) => s + d.capacity, 0);
      return { demandFte, allocatedFte, capacityFte, utilization: allocatedFte / capacityFte };
    });
    const avgDemand = weeks.reduce((s, w) => s + w.demandFte, 0) / weeks.length;
    const avgAllocated = weeks.reduce((s, w) => s + w.allocatedFte, 0) / weeks.length;
    const totalCapacity = departments.reduce((s, d) => s + d.capacity, 0);
    const hiring = departments.reduce((sum, dept) => {
      const peakGap = Math.max(0, ...weekLabels.map((_, week) => {
        const deptDemand = activeDemand.filter((d) => d.dept === dept.id && d.start <= week && d.end >= week).reduce((s, d) => s + d.fte, 0);
        return deptDemand - dept.capacity * dept.target;
      }));
      return sum + (peakGap >= 0.5 ? Math.ceil(peakGap) : 0);
    }, 0);
    return { weeks, avgDemand, avgAllocated, totalCapacity, hiring };
  }, [activeDemand, activeAllocations]);

  const deptMetric = (dept: Department, week: number) => {
    const demandFte = activeDemand.filter((d) => d.dept === dept.id && d.start <= week && d.end >= week).reduce((s, d) => s + d.fte, 0);
    const deptPeople = new Set(people.filter((p) => p.dept === dept.id).map((p) => p.id));
    const allocatedFte = activeAllocations.filter((a) => deptPeople.has(a.person) && a.start <= week && a.end >= week).reduce((s, a) => s + a.fte, 0);
    const sustainable = dept.capacity * dept.target;
    return { demandFte, allocatedFte, sustainable, load: sustainable ? demandFte / sustainable : 0, coverage: demandFte ? allocatedFte / demandFte : 1, gap: demandFte - sustainable };
  };

  const personUtil = (person: Person) => {
    const values = weekLabels.map((_, week) => activeAllocations.filter((a) => a.person === person.id && a.start <= week && a.end >= week).reduce((s, a) => s + a.fte, 0) / person.capacity);
    return values.reduce((s, v) => s + v, 0) / values.length;
  };

  const selectedDept = selected ? departments.find((d) => d.id === selected.dept) : undefined;
  const selectedMetric = selected && selectedDept ? deptMetric(selectedDept, selected.week) : null;
  const selectedRows = selected ? activeDemand.filter((d) => d.dept === selected.dept && d.start <= selected.week && d.end >= selected.week) : [];

  const adjustDemand = (id: string, delta: number) => {
    setDemand((current) => current.map((row) => row.id === id ? { ...row, fte: Math.max(0, Math.round((row.fte + delta) * 4) / 4) } : row));
  };

  const assignPerson = (personId: string, projectId: string, fte: number) => {
    if (!selected || !personId || !projectId) return;
    setAllocations((current) => [...current, {
      id: `A-${Date.now()}`,
      scenario,
      person: personId,
      project: projectId,
      start: selected.week,
      end: selected.week,
      fte,
      type: "Tentative",
    }]);
  };

  const nav: { id: View; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "planner", label: "Planner" },
    { id: "projects", label: "Projects" },
    { id: "people", label: "People" },
    { id: "capacity", label: "Capacity" },
  ];

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">E</span><div><strong>Resource Planner</strong><small>Exotec North America</small></div></div>
      <nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "nav active" : "nav"} onClick={() => setView(item.id)}><Icon name={item.id} /><span>{item.label}</span></button>)}</nav>
      <div className="sync"><i /><div><strong>Planning workspace</strong><small>Google Sheets-ready</small></div></div>
    </aside>

    <main>
      <header className="topbar">
        <div className="mobile-brand"><span className="brand-mark">E</span><strong>Resource Planner</strong></div>
        <div className="scenario"><span>Scenario</span><select value={scenario} onChange={(e) => setScenario(e.target.value)}><option value="base">Base Plan</option><option value="growth">Growth Scenario</option></select><button title="Create scenario" onClick={() => setScenario(scenario === "base" ? "growth" : "base")}><Icon name="plus" /></button></div>
        <span className="mode-pill">12-week forecast</span>
      </header>

      <div className="content">
        {view === "overview" && <>
          <PageTitle eyebrow="Resource planning" title="Good morning" description="See demand, named staffing and hiring pressure without turning planning into a spreadsheet." />
          <section className="kpis">
            <Kpi label="Forecast demand" value={fmt(metrics.avgDemand)} note="12-week average" />
            <Kpi label="Named allocation" value={fmt(metrics.avgAllocated)} note={`${pct(metrics.avgAllocated / Math.max(metrics.avgDemand, .01))} forecast coverage`} />
            <Kpi label="Available capacity" value={fmt(metrics.totalCapacity)} note={`${pct(metrics.avgAllocated / metrics.totalCapacity)} utilized`} />
            <Kpi label="Hiring signal" value={metrics.hiring ? `+${metrics.hiring}` : "Covered"} note={metrics.hiring ? "Recommended hires" : "No sustained gap"} accent={metrics.hiring > 0} />
          </section>

          <section className="grid-two">
            <article className="card chart-card"><div className="card-head"><div><span className="eyebrow">Portfolio</span><h2>Demand vs capacity</h2></div><button className="text-button" onClick={() => setView("capacity")}>View capacity</button></div>
              <div className="trend">{metrics.weeks.map((w, i) => <div className="trend-col" key={i}><div className="trend-bars"><i className="capacity-bar" style={{ height: `${Math.min(100, w.capacityFte / 15 * 100)}%` }} /><i className={w.demandFte > w.capacityFte ? "demand-bar over" : "demand-bar"} style={{ height: `${Math.min(100, w.demandFte / 15 * 100)}%` }} /></div><small>{weekLabels[i].replace(" ", "\n")}</small></div>)}</div>
              <div className="legend"><span><i className="dot demand" />Forecast demand</span><span><i className="dot capacity" />Raw capacity</span></div>
            </article>

            <article className="card pressure-card"><div className="card-head"><div><span className="eyebrow">Attention</span><h2>Capacity pressure</h2></div></div>
              <div className="pressure-list">{departments.map((dept) => {
                const peak = Math.max(...weekLabels.map((_, week) => deptMetric(dept, week).load));
                const gap = Math.max(0, ...weekLabels.map((_, week) => deptMetric(dept, week).gap));
                return <button key={dept.id} onClick={() => setView("planner")} className="pressure-row"><span className="dept-badge">{dept.short}</span><div><strong>{dept.name}</strong><small>{gap > .01 ? `${gap.toFixed(1)} FTE peak gap` : "Capacity available"}</small></div><div className={`load-pill ${peak > 1 ? "red" : peak > .9 ? "amber" : "green"}`}>{pct(peak)}</div></button>;
              })}</div>
            </article>
          </section>

          <section className="card hiring-card"><div><span className="eyebrow">Hiring outlook</span><h2>{metrics.hiring ? "Staffing action is needed" : "Current team covers the forecast"}</h2><p>Hiring recommendations use sustainable capacity rather than 100% theoretical utilization, so the model preserves room for support, travel, PTO and operational variability.</p></div><button className="primary" onClick={() => setView("capacity")}>Open capacity report</button></section>
        </>}

        {view === "planner" && <>
          <PageTitle eyebrow="Scenario planning" title="Planner" description="Select any week to change forecast demand or place a named resource. Darker cells indicate higher pressure." />
          <div className="planner-wrap card"><div className="planner-grid">
            <div className="planner-corner">Department</div>{weekLabels.map((w) => <div className="week-head" key={w}>{w}</div>)}
            {departments.map((dept) => <div className="planner-row" key={dept.id}>
              <div className="dept-head"><span className="dept-badge">{dept.short}</span><div><strong>{dept.name}</strong><small>{dept.capacity} FTE team</small></div></div>
              {weekLabels.map((_, week) => { const m = deptMetric(dept, week); const cls = m.load > 1 ? "hot" : m.load > .9 ? "warm" : m.load > .55 ? "good" : "cool"; return <button key={week} className={`plan-cell ${cls}`} onClick={() => setSelected({ dept: dept.id, week })}><strong>{m.demandFte.toFixed(1)}</strong><small>{pct(m.load)}</small></button>; })}
            </div>)}
          </div></div>
        </>}

        {view === "projects" && <>
          <PageTitle eyebrow="Portfolio" title="Projects" description="Forecast demand follows the project, while named allocations show who is actually committed." />
          <Search value={search} onChange={setSearch} placeholder="Search project, airport code or location" />
          <div className="project-grid">{projects.filter((p) => `${p.name} ${p.location}`.toLowerCase().includes(search.toLowerCase())).map((project) => {
            const rows = activeDemand.filter((d) => d.project === project.id);
            const peak = Math.max(0, ...weekLabels.map((_, week) => rows.filter((d) => d.start <= week && d.end >= week).reduce((s, d) => s + d.fte, 0)));
            const assigned = activeAllocations.filter((a) => a.project === project.id).reduce((s, a) => s + a.fte, 0);
            const demandSum = rows.reduce((s, d) => s + d.fte, 0);
            const depts = Array.from(new Set(rows.map((r) => r.dept)));
            return <article className="card project-card" key={project.id}><div className="project-top"><span className="project-code">{project.code}</span><span className={`status ${project.status === "Active" ? "green" : "neutral"}`}>{project.status}</span></div><h2>{project.name}</h2><p>{project.location}</p><div className="project-stats"><div><small>Peak demand</small><strong>{fmt(peak)}</strong></div><div><small>Named coverage</small><strong>{pct(Math.min(1, assigned / Math.max(demandSum, .01)))}</strong></div></div><div className="chips">{depts.map((d) => <span key={d}>{d}</span>)}</div><div className="project-foot"><span>{project.priority} priority</span><span>W{project.start + 1} → W{project.end + 1}</span></div></article>;
          })}</div>
        </>}

        {view === "people" && <>
          <PageTitle eyebrow="Capacity" title="People" description="Spot available bandwidth, full placement and overload before allocations become conflicts." />
          <Search value={search} onChange={setSearch} placeholder="Search person, role or location" />
          <div className="people-grid">{people.filter((p) => `${p.first} ${p.last} ${p.title} ${p.location}`.toLowerCase().includes(search.toLowerCase())).map((person) => {
            const util = personUtil(person); const dept = departments.find((d) => d.id === person.dept); const current = activeAllocations.filter((a) => a.person === person.id && a.start <= 0 && a.end >= 0);
            return <article className="card person-card" key={person.id}><div className="person-head"><div className="avatar">{person.first[0]}{person.last[0]}</div><div className={`util-ring ${util > 1 ? "red" : util > .9 ? "amber" : ""}`}><strong>{Math.round(util * 100)}%</strong></div></div><h2>{person.first} {person.last}</h2><p>{person.title}</p><div className="person-meta"><span>{dept?.short}</span><span>•</span><span>{person.location}</span></div><div className="person-projects">{current.length ? current.map((a) => <span key={a.id}>{projects.find((p) => p.id === a.project)?.code} · {pct(a.fte)}</span>) : <span className="available">Available this week</span>}</div></article>;
          })}</div>
        </>}

        {view === "capacity" && <>
          <PageTitle eyebrow="Decision support" title="Capacity & hiring" description="Translate forecast pressure into a staffing conversation by department and by week." />
          <section className="card hiring-summary"><div><span className="eyebrow">12-week staffing signal</span><strong>{metrics.hiring ? `+${metrics.hiring} recommended hires` : "No immediate hiring need"}</strong><p>A hire is suggested when the peak sustainable-capacity gap reaches at least 0.5 FTE. This is intentionally conservative for an MVP and can later use sustained-week thresholds.</p></div></section>
          <div className="capacity-list">{departments.map((dept) => {
            const series = weekLabels.map((_, week) => deptMetric(dept, week)); const peakGap = Math.max(0, ...series.map((s) => s.gap)); const hires = peakGap >= .5 ? Math.ceil(peakGap) : 0; const maxScale = Math.max(dept.capacity, ...series.map((s) => s.demandFte), 1);
            return <article className="card capacity-row" key={dept.id}><div className="capacity-title"><span className="dept-badge">{dept.short}</span><div><h2>{dept.name}</h2><p>{dept.capacity} FTE raw capacity · {Math.round(dept.target * 100)}% sustainable target</p></div>{hires ? <div className="hire-badge">+{hires}<small>hire{hires > 1 ? "s" : ""}</small></div> : <span className="status green">Covered</span>}</div><div className="capacity-bars">{series.map((s, i) => <div className="cap-week" key={i}><div className="bar-area"><i className="target-line" style={{ height: `${dept.capacity * dept.target / maxScale * 100}%` }} /><i className={s.demandFte > dept.capacity * dept.target ? "demand-column over" : "demand-column"} style={{ height: `${s.demandFte / maxScale * 100}%` }} /></div><small>{weekLabels[i].split(" ")[1]}</small></div>)}</div></article>;
          })}</div>
        </>}
      </div>

      <nav className="bottom-nav">{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><Icon name={item.id} /><small>{item.label}</small></button>)}</nav>
    </main>

    {selected && selectedDept && selectedMetric && <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="drawer" onMouseDown={(e) => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">{weekLabels[selected.week]}</span><h2>{selectedDept.name}</h2></div><button className="close" onClick={() => setSelected(null)}><Icon name="close" /></button></div><div className="drawer-kpis"><div><small>Forecast</small><strong>{fmt(selectedMetric.demandFte)}</strong></div><div><small>Sustainable capacity</small><strong>{fmt(selectedMetric.sustainable)}</strong></div><div><small>Named</small><strong>{fmt(selectedMetric.allocatedFte)}</strong></div></div>
      <div className="drawer-section"><h3>Project demand</h3>{selectedRows.length ? selectedRows.map((row) => <div className="forecast-row" key={row.id}><div><strong>{projects.find((p) => p.id === row.project)?.name}</strong><small>{row.fte.toFixed(2)} FTE forecast</small></div><div className="stepper"><button onClick={() => adjustDemand(row.id, -.25)}>−</button><span>{row.fte.toFixed(2)}</span><button onClick={() => adjustDemand(row.id, .25)}>+</button></div></div>) : <p className="empty">No forecast demand this week.</p>}</div>
      <AllocationForm dept={selectedDept.id} projectsForWeek={selectedRows.map((r) => r.project)} onAssign={assignPerson} />
    </aside></div>}
  </div>;
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

function Kpi({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return <article className={`card kpi ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Search({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="search"><Icon name="search" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}

function AllocationForm({ dept, projectsForWeek, onAssign }: { dept: string; projectsForWeek: string[]; onAssign: (person: string, project: string, fte: number) => void }) {
  const availablePeople = people.filter((p) => p.dept === dept);
  const projectOptions = Array.from(new Set(projectsForWeek));
  const [person, setPerson] = useState(availablePeople[0]?.id ?? "");
  const [project, setProject] = useState(projectOptions[0] ?? "");
  const [fte, setFte] = useState(.5);
  return <div className="drawer-section"><h3>Add tentative allocation</h3><div className="allocation-form"><label>Person<select value={person} onChange={(e) => setPerson(e.target.value)}>{availablePeople.map((p) => <option value={p.id} key={p.id}>{p.first} {p.last}</option>)}</select></label><label>Project<select value={project} onChange={(e) => setProject(e.target.value)}>{projectOptions.length ? projectOptions.map((id) => <option value={id} key={id}>{projects.find((p) => p.id === id)?.name}</option>) : <option value="">No active demand</option>}</select></label><label>Allocation<select value={fte} onChange={(e) => setFte(Number(e.target.value))}><option value={.25}>25%</option><option value={.5}>50%</option><option value={.75}>75%</option><option value={1}>100%</option></select></label><button className="primary" disabled={!person || !project} onClick={() => onAssign(person, project, fte)}>Add allocation</button></div></div>;
}
