"use client";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  initialPlan,
  STORAGE_KEY,
  departments,
  timelineMonths,
  monthNames,
  TOTAL_MONTHS,
  allocated,
  demand,
  peak,
  staffing,
  pct,
  fte,
  monthLabel,
  uid,
  validPlan,
  type Plan,
  type PlanBar,
  type Project,
  type Person,
  type Milestone,
  type DeptId,
} from "../lib/planning";
import {
  Icon,
  Drawer,
  AllocationForm,
  PersonForm,
  ProjectForm,
  MilestoneForm,
} from "./ui";
type View = "planner" | "resources" | "capacity" | "projects";
type Editor =
  | { type: "allocation"; value: PlanBar }
  | { type: "person"; value: Person }
  | { type: "project"; value: Project }
  | { type: "milestone"; value: Milestone }
  | null;
const nav: { id: View; label: string; icon: string }[] = [
  { id: "planner", label: "Project planner", icon: "timeline" },
  { id: "resources", label: "Resources", icon: "people" },
  { id: "capacity", label: "Capacity", icon: "chart" },
  { id: "projects", label: "Projects", icon: "folder" },
];
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export default function Page() {
  const [plan, setPlan] = useState<Plan>(initialPlan),
    [ready, setReady] = useState(false),
    [saveState, setSaveState] = useState("Loading plan…"),
    [storageBlocked, setStorageBlocked] = useState(false);
  const [view, setView] = useState<View>("planner"),
    [projectId, setProjectId] = useState("P1"),
    [editor, setEditor] = useState<Editor>(null),
    [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<Plan | null>(null),
    [query, setQuery] = useState(""),
    [dept, setDept] = useState("ALL"),
    [year, setYear] = useState(2026),
    [zoom, setZoom] = useState(false),
    [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [onlyGaps, setOnlyGaps] = useState(false),
    [resourceFilter, setResourceFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null),
    timelineRef = useRef<HTMLDivElement>(null),
    scrollRef = useRef<HTMLDivElement>(null),
    dragged = useRef(false);
  const [drag, setDrag] = useState<{
    id: string;
    mode: "move" | "start" | "end";
    x: number;
    start: number;
    end: number;
    width: number;
    snapshot: Plan;
  } | null>(null);
  const project =
    plan.projects.find((p) => p.id === projectId) || plan.projects[0];
  const projectBars = plan.bars.filter((b) => b.project === project.id);
  const currentMonth = useMemo(() => {
    const d = new Date();
    return (d.getFullYear() - 2026) * 12 + d.getMonth();
  }, []);
  const focusMonth = clamp(currentMonth, 0, 23);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validPlan(parsed)) throw Error();
        setPlan(parsed);
      }
      setSaveState(
        raw ? "Saved in this browser" : "Sample plan · saved locally",
      );
    } catch {
      setStorageBlocked(true);
      setSaveState("Could not load saved plan");
      setNotice(
        "Saved data could not be read. Export your plan before leaving; automatic saving is paused.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        setSaveState("Saved in this browser");
      } catch {
        setSaveState("Not saved · export a backup");
        setNotice(
          "Browser storage is unavailable. Use Export to keep your changes.",
        );
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [plan, ready, storageBlocked]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(id);
  }, [notice]);
  const commit = (next: Plan, message = "Changes saved") => {
    setUndo(plan);
    setPlan(next);
    setNotice(message);
  };
  const upsert = <T extends { id: string }>(rows: T[], value: T) =>
    rows.some((r) => r.id === value.id)
      ? rows.map((r) => (r.id === value.id ? value : r))
      : [...rows, value];
  const openAllocation = (department: DeptId = "PSE") =>
    setEditor({
      type: "allocation",
      value: {
        id: uid(),
        project: project.id,
        dept: department,
        start: focusMonth,
        end: Math.min(focusMonth + 3, 23),
        allocation: 1,
      },
    });
  const go = (next: View) => {
    setView(next);
    setQuery("");
    setDept("ALL");
    setOnlyGaps(false);
  };
  useEffect(() => {
    if (!drag) return;
    const move = (event: PointerEvent) => {
      const dx = event.clientX - drag.x;
      if (Math.abs(dx) > 4) dragged.current = true;
      const delta = Math.round(dx / (drag.width / 24));
      setPlan((p) => ({
        ...p,
        bars: p.bars.map((b) => {
          if (b.id !== drag.id) return b;
          if (drag.mode === "start")
            return { ...b, start: clamp(drag.start + delta, 0, drag.end) };
          if (drag.mode === "end")
            return { ...b, end: clamp(drag.end + delta, drag.start, 23) };
          const start = clamp(
            drag.start + delta,
            0,
            23 - (drag.end - drag.start),
          );
          return { ...b, start, end: start + drag.end - drag.start };
        }),
      }));
    };
    const up = () => {
      if (dragged.current) setUndo(drag.snapshot);
      setDrag(null);
    };
    const cancel = () => {
      setPlan(drag.snapshot);
      setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [drag]);
  const startDrag = (
    e: ReactPointerEvent,
    b: PlanBar,
    mode: "move" | "start" | "end",
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragged.current = false;
    setDrag({
      id: b.id,
      mode,
      x: e.clientX,
      start: b.start,
      end: b.end,
      width: timelineRef.current?.getBoundingClientRect().width || 960,
      snapshot: plan,
    });
  };
  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resource-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Plan exported");
  };
  const importPlan = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!validPlan(data)) throw Error();
      if (
        !window.confirm(
          "Replace this browser’s plan with the imported plan? You can undo this change.",
        )
      )
        return;
      commit(data, "Plan imported");
      setProjectId(data.projects[0].id);
      setStorageBlocked(false);
    } catch {
      setNotice(
        "That file is not a valid resource plan. Your current plan has not changed.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const visiblePeople = plan.people
    .filter(
      (p) =>
        (dept === "ALL" || p.dept === dept) &&
        `${p.name} ${p.title} ${p.location}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .filter(
      (p) =>
        resourceFilter === "all" ||
        monthNames.some((_, m) =>
          resourceFilter === "over"
            ? allocated(plan.bars, p.id, (year - 2026) * 12 + m) > 1
            : allocated(plan.bars, p.id, (year - 2026) * 12 + m) < 1,
        ),
    );
  const rows = departments
    .filter((d) => dept === "ALL" || d.id === dept)
    .map((d) => ({ dept: d, ...staffing(plan.people, plan.bars, d) }));
  const projectPeak = peak(projectBars),
    unassignedPeak = peak(projectBars.filter((b) => !b.personId));
  const conflicts = plan.people.filter((p) =>
    timelineMonths.some((m) => allocated(plan.bars, p.id, m.index) > 1),
  );
  const filteredProjects = plan.projects.filter((p) =>
    `${p.name} ${p.customer} ${p.code} ${p.location}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const activeDepts = departments.filter(
    (d) =>
      (dept === "ALL" || d.id === dept) &&
      projectBars.some((b) => b.dept === d.id && (!onlyGaps || !b.personId)),
  );
  const switchProject = (id: string) => {
    setProjectId(id);
    go("planner");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("planner");
          }}
        >
          <span className="brand-symbol">
            <i />
            <i />
            <i />
          </span>
          <span>
            Nolazco<span className="brand-labs">Labs / Workspace</span>
          </span>
        </a>
        <div className="workspace-label">RESOURCE PLANNING</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
            >
              <Icon name={n.icon} />
              {n.label}
              {n.id === "projects" && (
                <span className="nav-count">{plan.projects.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="horizon">
            <Icon name="calendar" />
            <span>
              Planning horizon<strong>2026 — 2027</strong>
            </span>
          </div>
          <div className="profile">
            <span className="avatar dark">NL</span>
            <span>
              Planning workspace<small>Browser storage</small>
            </span>
            <span className="status-dot" />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>{nav.find((n) => n.id === view)?.label}</strong>
          </div>
          <div className="top-actions">
            <span className="save-status">
              <i
                className={
                  saveState.startsWith("Saved")
                    ? "status-dot"
                    : "status-dot muted"
                }
              />
              {saveState}
            </span>
            <button
              className="icon-button"
              disabled={!undo}
              aria-label="Undo last change"
              title="Undo last change"
              onClick={() => {
                if (undo) {
                  setPlan(undo);
                  setUndo(null);
                  setNotice("Last change undone");
                }
              }}
            >
              <Icon name="undo" />
            </button>
            <button
              className="button subtle"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" />
              Import
            </button>
            <button className="button" onClick={exportPlan}>
              <Icon name="download" />
              Export
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => void importPlan(e.target.files?.[0])}
            />
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "planner"
                  ? "BUILD THE PLAN"
                  : view === "resources"
                    ? "YOUR PEOPLE, IN FOCUS"
                    : view === "capacity"
                      ? "LOOK AHEAD WITH CONFIDENCE"
                      : "THE BIG PICTURE"}
              </div>
              <h1>
                {view === "planner"
                  ? "Project planner"
                  : view === "resources"
                    ? "Resources"
                    : view === "capacity"
                      ? "Demand & capacity"
                      : "Project portfolio"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {view === "planner"
                  ? "The right people. The right project. The right time."
                  : view === "resources"
                    ? "See every commitment and find room for what’s next."
                    : view === "capacity"
                      ? "Spot the gaps early. Turn your forecast into a staffing plan."
                      : "One place to see what’s planned and what needs attention."}
              </p>
            </div>
            <div className="heading-actions">
              <span className="sample-badge">Sample starting data</span>
              {view === "resources" ? (
                <button
                  className="button primary"
                  onClick={() =>
                    setEditor({
                      type: "person",
                      value: {
                        id: uid(),
                        name: "",
                        dept: "PSE",
                        title: "",
                        location: "",
                      },
                    })
                  }
                >
                  <Icon name="plus" />
                  Add resource
                </button>
              ) : view === "projects" ? (
                <button
                  className="button primary"
                  onClick={() =>
                    setEditor({
                      type: "project",
                      value: {
                        id: uid(),
                        name: "",
                        code: "",
                        customer: "",
                        location: "",
                        status: "Planning",
                      },
                    })
                  }
                >
                  <Icon name="plus" />
                  New project
                </button>
              ) : view === "capacity" ? (
                <button className="button" onClick={() => go("resources")}>
                  <Icon name="people" />
                  View resources
                </button>
              ) : null}
            </div>
          </div>
          {!ready ? (
            <div className="loading">Loading your plan…</div>
          ) : (
            <>
              {view === "planner" && (
                <>
                  <div className="project-context">
                    <span className="project-icon">
                      <Icon name="folder" />
                    </span>
                    <div className="project-select">
                      <label htmlFor="project-select">PROJECT</label>
                      <select
                        id="project-select"
                        value={project.id}
                        onChange={(e) => setProjectId(e.target.value)}
                      >
                        {plan.projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <span>
                        {project.customer || "Customer not set"}
                        <i /> {project.location || "Location not set"}
                      </span>
                    </div>
                    <span
                      className={`badge ${project.status === "Active" ? "green" : "neutral"}`}
                    >
                      {project.status}
                    </span>
                    <button
                      className="icon-button"
                      title="Edit project"
                      aria-label="Edit project"
                      onClick={() =>
                        setEditor({ type: "project", value: project })
                      }
                    >
                      <Icon name="edit" />
                    </button>
                    <div className="context-divider" />
                    <div className="mini-stat">
                      <strong>
                        {fte(projectPeak)} <small>FTE</small>
                      </strong>
                      <span>Peak demand</span>
                    </div>
                    <div className="mini-stat">
                      <strong className={unassignedPeak ? "amber-text" : ""}>
                        {fte(unassignedPeak)} <small>FTE</small>
                      </strong>
                      <span>Peak unassigned</span>
                    </div>
                    <div className="mini-stat">
                      <strong>
                        {
                          plan.milestones.filter(
                            (m) => m.project === project.id,
                          ).length
                        }
                      </strong>
                      <span>Milestones</span>
                    </div>
                  </div>
                  <section className="panel planner-panel">
                    <div className="panel-toolbar">
                      <div className="toolbar-left">
                        <h2>Resource timeline</h2>
                        <span className="badge neutral">24 months</span>
                      </div>
                      <div className="toolbar-right">
                        <div className="segmented">
                          <button
                            className={!zoom ? "selected" : ""}
                            onClick={() => setZoom(false)}
                          >
                            Fit 2 years
                          </button>
                          <button
                            className={zoom ? "selected" : ""}
                            onClick={() => setZoom(true)}
                          >
                            Monthly zoom
                          </button>
                        </div>
                        <button
                          className="button"
                          onClick={() =>
                            setEditor({
                              type: "milestone",
                              value: {
                                id: uid(),
                                project: project.id,
                                label: "",
                                type: "internal",
                                month: focusMonth,
                              },
                            })
                          }
                        >
                          <Icon name="diamond" />
                          Milestone
                        </button>
                        <button
                          className="button primary"
                          onClick={() => openAllocation()}
                        >
                          <Icon name="plus" />
                          Allocation
                        </button>
                      </div>
                    </div>
                    <div className="filter-row">
                      <div className="toolbar-left">
                        <Icon name="filter" />
                        <select
                          aria-label="Timeline department"
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                        >
                          <option value="ALL">All departments</option>
                          {departments.map((d) => (
                            <option key={d.id}>{d.id}</option>
                          ))}
                        </select>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={onlyGaps}
                            onChange={(e) => setOnlyGaps(e.target.checked)}
                          />
                          Unassigned only
                        </label>
                      </div>
                      <div className="toolbar-right">
                        <button
                          className="text-button"
                          onClick={() =>
                            setCollapsed(
                              collapsed.size
                                ? new Set()
                                : new Set(departments.map((d) => d.id)),
                            )
                          }
                        >
                          {collapsed.size ? "Expand all" : "Collapse all"}
                        </button>
                        <span className="legend-item">
                          <i className="legend-swatch teal" />
                          Assigned
                        </span>
                        <span className="legend-item">
                          <i className="legend-swatch amber" />
                          Unassigned
                        </span>
                        <button
                          className="icon-button small"
                          aria-label="Scroll timeline left"
                          onClick={() =>
                            scrollRef.current?.scrollBy({
                              left: -350,
                              behavior: "smooth",
                            })
                          }
                        >
                          <Icon name="left" />
                        </button>
                        <button
                          className="icon-button small"
                          aria-label="Scroll timeline right"
                          onClick={() =>
                            scrollRef.current?.scrollBy({
                              left: 350,
                              behavior: "smooth",
                            })
                          }
                        >
                          <Icon name="right" />
                        </button>
                      </div>
                    </div>
                    <div className="timeline-scroll" ref={scrollRef}>
                      <div className={`timeline ${zoom ? "zoom" : ""}`}>
                        <div className="timeline-label timeline-top">
                          <strong>Teams & allocations</strong>
                          <small>Drag to move · click to edit</small>
                        </div>
                        <div className="timeline-dates">
                          <div className="years">
                            <span>2026</span>
                            <span>2027</span>
                          </div>
                          <div className="months" ref={timelineRef}>
                            {timelineMonths.map((m) => (
                              <span
                                key={m.index}
                                className={
                                  m.index === currentMonth ? "current" : ""
                                }
                              >
                                {m.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        {(["internal", "external"] as const).map((type) => (
                          <div className="grid-fragment" key={type}>
                            <div className="timeline-label milestone-label">
                              <Icon name="diamond" />
                              <span>
                                {type === "internal"
                                  ? "Internal milestones"
                                  : "External milestones"}
                              </span>
                            </div>
                            <div className="milestone-track grid-track">
                              <Today month={currentMonth} />
                              {plan.milestones
                                .filter(
                                  (m) =>
                                    m.project === project.id && m.type === type,
                                )
                                .map((m, _, all) => (
                                  <button
                                    className={`milestone ${type} ${m.month === 0 ? "edge-start" : m.month === 23 ? "edge-end" : ""}`}
                                    key={m.id}
                                    style={{
                                      left: `${((m.month + 0.5) / 24) * 100}%`,
                                      top:
                                        all
                                          .filter((x) => x.month === m.month)
                                          .findIndex((x) => x.id === m.id) % 2
                                          ? 36
                                          : 6,
                                    }}
                                    aria-label={`Edit milestone ${m.label}`}
                                    title={`${m.label} · ${monthLabel(m.month)}`}
                                    onClick={() =>
                                      setEditor({ type: "milestone", value: m })
                                    }
                                  >
                                    <span className="diamond" />
                                    <span>{m.label}</span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        ))}
                        {activeDepts.map((d) => {
                          const all = projectBars.filter(
                            (b) =>
                              b.dept === d.id && (!onlyGaps || !b.personId),
                          );
                          return (
                            <div className="grid-fragment" key={d.id}>
                              <div className="timeline-label department-label">
                                <button
                                  className="department-toggle"
                                  onClick={() =>
                                    setCollapsed((c) => {
                                      const n = new Set(c);
                                      n.has(d.id)
                                        ? n.delete(d.id)
                                        : n.add(d.id);
                                      return n;
                                    })
                                  }
                                >
                                  <Icon
                                    name={
                                      collapsed.has(d.id) ? "right" : "down"
                                    }
                                  />
                                  <span className={`dept-tag ${d.id}`}>
                                    {d.id}
                                  </span>
                                  <span>
                                    {d.name}
                                    <small>
                                      {all.length} allocation
                                      {all.length !== 1 ? "s" : ""}
                                    </small>
                                  </span>
                                </button>
                                <button
                                  className="icon-button small"
                                  aria-label={`Add ${d.id} allocation`}
                                  onClick={() => openAllocation(d.id)}
                                >
                                  <Icon name="plus" />
                                </button>
                              </div>
                              <div className="department-total grid-track">
                                <Today month={currentMonth} />
                                {timelineMonths.map((m) => {
                                  const v = demand(all, m.index);
                                  return (
                                    <span
                                      key={m.index}
                                      className={v ? "has-demand" : ""}
                                    >
                                      {v ? fte(v) : ""}
                                    </span>
                                  );
                                })}
                              </div>
                              {!collapsed.has(d.id) &&
                                all.map((b) => {
                                  const person = plan.people.find(
                                    (p) => p.id === b.personId,
                                  );
                                  const over =
                                    !!person &&
                                    timelineMonths.some(
                                      (m) =>
                                        m.index >= b.start &&
                                        m.index <= b.end &&
                                        allocated(
                                          plan.bars,
                                          person.id,
                                          m.index,
                                        ) > 1,
                                    );
                                  return (
                                    <div className="grid-fragment" key={b.id}>
                                      <button
                                        className="timeline-label allocation-label"
                                        onClick={() =>
                                          setEditor({
                                            type: "allocation",
                                            value: b,
                                          })
                                        }
                                      >
                                        <span
                                          className={`avatar ${person ? "" : "unassigned"}`}
                                        >
                                          {person ? initials(person.name) : "?"}
                                        </span>
                                        <span>
                                          <strong>
                                            {person?.name || "Unassigned"}
                                          </strong>
                                          <small>
                                            {pct(b.allocation)} allocation{" "}
                                            {over && (
                                              <span className="red-text">
                                                · Conflict
                                              </span>
                                            )}
                                          </small>
                                        </span>
                                        <Icon name="edit" />
                                      </button>
                                      <div className="bar-track grid-track">
                                        <Today month={currentMonth} />
                                        <button
                                          aria-label={`Edit ${person?.name || "unassigned"} ${b.dept} allocation`}
                                          className={`plan-bar ${person ? "assigned" : "forecast"} ${over ? "conflict" : ""}`}
                                          style={{
                                            left: `${(b.start / 24) * 100}%`,
                                            width: `${((b.end - b.start + 1) / 24) * 100}%`,
                                          }}
                                          onPointerDown={(e) =>
                                            startDrag(e, b, "move")
                                          }
                                          onClick={() => {
                                            if (dragged.current) {
                                              dragged.current = false;
                                              return;
                                            }
                                            setEditor({
                                              type: "allocation",
                                              value: b,
                                            });
                                          }}
                                          title={`${person?.name || "Unassigned"} · ${pct(b.allocation)} · ${monthLabel(b.start)} – ${monthLabel(b.end)}`}
                                        >
                                          <span
                                            className="resize-handle left"
                                            onPointerDown={(e) =>
                                              startDrag(e, b, "start")
                                            }
                                          />
                                          <span className="bar-name">
                                            {person?.name || "Unassigned"}
                                          </span>
                                          <span className="bar-percent">
                                            {pct(b.allocation)}
                                          </span>
                                          <span
                                            className="resize-handle right"
                                            onPointerDown={(e) =>
                                              startDrag(e, b, "end")
                                            }
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                        {!activeDepts.length && (
                          <div className="empty-timeline">
                            No allocations match this view. Add an allocation or
                            adjust your filters.
                          </div>
                        )}
                        <div className="timeline-label timeline-footer">
                          <strong>Total demand</strong>
                          <small>FTE · current filters</small>
                        </div>
                        <div className="totals grid-track">
                          {timelineMonths.map((m) => (
                            <strong key={m.index}>
                              {fte(
                                demand(
                                  projectBars.filter(
                                    (b) =>
                                      (dept === "ALL" || b.dept === dept) &&
                                      (!onlyGaps || !b.personId),
                                  ),
                                  m.index,
                                ),
                              )}
                            </strong>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="panel-footer">
                      <span>
                        <i className="today-key" />
                        Current month
                      </span>
                      <span>
                        Monthly allocations include both start and end months.
                      </span>
                    </div>
                  </section>
                  {unassignedPeak > 0 && (
                    <div className="insight">
                      <span className="insight-icon">
                        <Icon name="spark" />
                      </span>
                      <div>
                        <strong>There’s still a team to build.</strong>
                        <p>
                          This project has up to {fte(unassignedPeak)} FTE of
                          unassigned demand. Compare it with department capacity
                          before planning a hire.
                        </p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => go("capacity")}
                      >
                        Review capacity <Icon name="right" />
                      </button>
                    </div>
                  )}
                </>
              )}
              {view === "resources" && (
                <>
                  <div className="stat-grid">
                    <Stat
                      label="Team members"
                      value={String(plan.people.length)}
                      note="Across all departments"
                      icon="people"
                    />
                    <Stat
                      label="Allocated this month"
                      value={`${fte(
                        demand(
                          plan.bars.filter((b) => b.personId),
                          focusMonth,
                        ),
                      )} FTE`}
                      note={monthLabel(focusMonth)}
                      icon="timeline"
                    />
                    <Stat
                      label="People with conflicts"
                      value={String(conflicts.length)}
                      note="Above 100% in any planning month"
                      icon="alert"
                      tone={conflicts.length ? "warning" : ""}
                    />
                  </div>
                  <section className="panel">
                    <div className="panel-toolbar">
                      <Search
                        value={query}
                        onChange={setQuery}
                        placeholder="Search people, role or location"
                      />
                      <div className="toolbar-right">
                        <DeptFilter value={dept} onChange={setDept} />
                        <select
                          aria-label="Resource availability filter"
                          value={resourceFilter}
                          onChange={(e) => setResourceFilter(e.target.value)}
                        >
                          <option value="all">All resources</option>
                          <option value="over">Overallocated</option>
                          <option value="available">Has availability</option>
                        </select>
                        <select
                          aria-label="Resource year"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                        >
                          <option>2026</option>
                          <option>2027</option>
                        </select>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table className="resource-table">
                        <thead>
                          <tr>
                            <th>
                              Resource{" "}
                              <span className="count">
                                {visiblePeople.length}
                              </span>
                            </th>
                            {monthNames.map((m) => (
                              <th key={m}>{m}</th>
                            ))}
                            <th>Average</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePeople.map((p) => {
                            const values = monthNames.map((_, m) =>
                              allocated(
                                plan.bars,
                                p.id,
                                (year - 2026) * 12 + m,
                              ),
                            );
                            return (
                              <tr key={p.id}>
                                <td>
                                  <button
                                    className="person-cell"
                                    onClick={() =>
                                      setEditor({ type: "person", value: p })
                                    }
                                  >
                                    <span className="avatar">
                                      {initials(p.name)}
                                    </span>
                                    <span>
                                      <strong>{p.name}</strong>
                                      <small>
                                        {p.dept} · {p.title}
                                      </small>
                                    </span>
                                  </button>
                                </td>
                                {values.map((v, i) => (
                                  <td key={i}>
                                    <button
                                      className={`allocation-cell ${v > 1 ? "over" : v >= 0.85 ? "full" : v > 0 ? "used" : "empty"}`}
                                      title={`${p.name} · ${monthNames[i]} ${year}: ${pct(v)}. Click to inspect allocations.`}
                                      onClick={() =>
                                        setEditor({ type: "person", value: p })
                                      }
                                    >
                                      {v ? pct(v) : "—"}
                                    </button>
                                  </td>
                                ))}
                                <td className="average">
                                  {pct(values.reduce((s, v) => s + v, 0) / 12)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {!visiblePeople.length && (
                        <Empty text="No resources match your filters." />
                      )}
                    </div>
                    <div className="panel-footer">
                      <span>
                        {visiblePeople.length} of {plan.people.length} people ·{" "}
                        {year}
                      </span>
                      <div className="legend">
                        <span>
                          <i className="legend-swatch pale" />
                          1–84%
                        </span>
                        <span>
                          <i className="legend-swatch teal" />
                          85–100%
                        </span>
                        <span>
                          <i className="legend-swatch red" />
                          Over 100%
                        </span>
                      </div>
                    </div>
                  </section>
                </>
              )}
              {view === "capacity" && (
                <>
                  <div className="stat-grid">
                    <Stat
                      label="Portfolio peak"
                      value={`${fte(peak(plan.bars))} FTE`}
                      note="Highest monthly demand · 2026–2027"
                      icon="chart"
                    />
                    <Stat
                      label="Sustainable capacity"
                      value={`${fte(departments.reduce((n, d) => n + staffing(plan.people, plan.bars, d).capacity, 0))} FTE`}
                      note="Headcount × department allocation target"
                      icon="people"
                    />
                    <Stat
                      label="Departments with gaps"
                      value={`${departments.filter((d) => staffing(plan.people, plan.bars, d).gap > 0).length} / ${departments.length}`}
                      note="At least one month above target capacity"
                      icon="alert"
                      tone="warning"
                    />
                  </div>
                  <div className="section-heading">
                    <div>
                      <h2>Department forecast</h2>
                      <p>
                        Demand includes assigned and unassigned allocations.
                      </p>
                    </div>
                    <DeptFilter value={dept} onChange={setDept} />
                  </div>
                  <div className="capacity-grid">
                    {rows.map((r) => (
                      <article className="panel capacity-card" key={r.dept.id}>
                        <div className="capacity-heading">
                          <span className={`dept-tag ${r.dept.id}`}>
                            {r.dept.id}
                          </span>
                          <div>
                            <h3>{r.dept.name}</h3>
                            <p>
                              {r.team} people · {pct(r.dept.target)} planning
                              target
                            </p>
                          </div>
                          <span
                            className={`badge ${r.gap > 0 ? "amber" : "green"}`}
                          >
                            {r.gap > 0 ? `${fte(r.gap)} FTE gap` : "Covered"}
                          </span>
                        </div>
                        <CapacityChart
                          monthly={r.monthly}
                          capacity={r.capacity}
                          team={r.team}
                        />
                        <div className="capacity-bottom">
                          <span>
                            Peak{" "}
                            <strong>{fte(Math.max(...r.monthly))} FTE</strong>
                            <i />
                            Target <strong>{fte(r.capacity)} FTE</strong>
                          </span>
                          {r.hires > 0 ? (
                            <span className="hiring-note">
                              +{r.hires} {r.hires === 1 ? "hire" : "hires"} at{" "}
                              {pct(r.dept.target)}
                            </span>
                          ) : (
                            <span className="green-text">Within target</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="method-note">
                    <Icon name="info" />
                    <span>
                      Hiring estimate = peak capacity gap ÷ department target,
                      rounded up. This assumes full-period availability; leave,
                      start dates and skill matching are not modeled.
                    </span>
                  </div>
                </>
              )}
              {view === "projects" && (
                <>
                  <div className="stat-grid">
                    <Stat
                      label="Projects in portfolio"
                      value={String(plan.projects.length)}
                      note={`${plan.projects.filter((p) => p.status === "Active").length} active · ${plan.projects.filter((p) => p.status === "Planning").length} planning`}
                      icon="folder"
                    />
                    <Stat
                      label="Peak unassigned demand"
                      value={`${fte(peak(plan.bars.filter((b) => !b.personId)))} FTE`}
                      note="Concurrent need across the portfolio"
                      icon="people"
                    />
                    <Stat
                      label="Planned milestones"
                      value={String(plan.milestones.length)}
                      note="Internal and external commitments"
                      icon="diamond"
                    />
                  </div>
                  <div className="section-heading">
                    <h2>All projects</h2>
                    <Search
                      value={query}
                      onChange={setQuery}
                      placeholder="Search projects"
                    />
                  </div>
                  <div className="project-grid">
                    {filteredProjects.map((p) => {
                      const bars = plan.bars.filter((b) => b.project === p.id),
                        gap = peak(bars.filter((b) => !b.personId));
                      return (
                        <article className="panel project-card" key={p.id}>
                          <div className="project-card-head">
                            <span className="project-code">{p.code}</span>
                            <span
                              className={`badge ${p.status === "Active" ? "green" : "neutral"}`}
                            >
                              {p.status}
                            </span>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${p.name}`}
                              onClick={() =>
                                setEditor({ type: "project", value: p })
                              }
                            >
                              <Icon name="edit" />
                            </button>
                          </div>
                          <h3>{p.name}</h3>
                          <p>
                            {p.customer || "No customer set"} ·{" "}
                            {p.location || "No location set"}
                          </p>
                          <div className="project-spark">
                            {timelineMonths.map((m) => {
                              const v = demand(bars, m.index);
                              return (
                                <span
                                  key={m.index}
                                  title={`${monthLabel(m.index)}: ${fte(v)} FTE`}
                                  style={{
                                    height: `${Math.max(3, (v / Math.max(1, peak(bars))) * 100)}%`,
                                  }}
                                />
                              );
                            })}
                          </div>
                          <div className="project-metrics">
                            <span>
                              Peak demand<strong>{fte(peak(bars))} FTE</strong>
                            </span>
                            <span>
                              Peak unassigned
                              <strong className={gap ? "amber-text" : ""}>
                                {fte(gap)} FTE
                              </strong>
                            </span>
                            <span>
                              Allocations<strong>{bars.length}</strong>
                            </span>
                          </div>
                          <button
                            className="button project-open"
                            onClick={() => switchProject(p.id)}
                          >
                            Open resource plan
                            <Icon name="right" />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  {!filteredProjects.length && (
                    <Empty text="No projects match your search." />
                  )}
                </>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>
              NOLAZCO LABS <b>/</b> RESOURCE PLANNING
            </span>
            <span>
              Your plan stays in this browser. Export a backup to keep or share
              it.
            </span>
          </footer>
        </div>
      </main>
      {notice && (
        <div className="toast" role="status">
          <Icon name="info" />
          <span>{notice}</span>
          <button
            className="icon-button small"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {editor && (
        <Drawer
          title={
            editor.type === "allocation"
              ? "Allocation details"
              : editor.type === "person"
                ? "Resource details"
                : editor.type === "project"
                  ? "Project details"
                  : "Milestone details"
          }
          onClose={() => setEditor(null)}
        >
          {editor.type === "allocation" && (
            <AllocationForm
              key={editor.value.id}
              value={editor.value}
              plan={plan}
              onSave={(value) => {
                commit(
                  { ...plan, bars: upsert(plan.bars, value) },
                  "Allocation saved",
                );
                setEditor(null);
              }}
              onDelete={
                plan.bars.some((b) => b.id === editor.value.id)
                  ? () => {
                      commit(
                        {
                          ...plan,
                          bars: plan.bars.filter(
                            (b) => b.id !== editor.value.id,
                          ),
                        },
                        "Allocation removed · Undo is available",
                      );
                      setEditor(null);
                    }
                  : undefined
              }
            />
          )}
          {editor.type === "person" && (
            <PersonForm
              key={editor.value.id}
              value={editor.value}
              plan={plan}
              onAllocation={(b) => setEditor({ type: "allocation", value: b })}
              onSave={(value) => {
                const reassigned = plan.bars.map((b) =>
                  b.personId === value.id && b.dept !== value.dept
                    ? { ...b, personId: undefined }
                    : b,
                );
                commit(
                  {
                    ...plan,
                    people: upsert(plan.people, value),
                    bars: reassigned,
                  },
                  "Resource saved",
                );
                setEditor(null);
              }}
            />
          )}
          {editor.type === "project" && (
            <ProjectForm
              key={editor.value.id}
              value={editor.value}
              onSave={(value) => {
                commit(
                  { ...plan, projects: upsert(plan.projects, value) },
                  "Project saved",
                );
                setProjectId(value.id);
                setEditor(null);
              }}
            />
          )}
          {editor.type === "milestone" && (
            <MilestoneForm
              key={editor.value.id}
              value={editor.value}
              onSave={(value) => {
                commit(
                  { ...plan, milestones: upsert(plan.milestones, value) },
                  "Milestone saved",
                );
                setEditor(null);
              }}
              onDelete={
                plan.milestones.some((m) => m.id === editor.value.id)
                  ? () => {
                      commit(
                        {
                          ...plan,
                          milestones: plan.milestones.filter(
                            (m) => m.id !== editor.value.id,
                          ),
                        },
                        "Milestone removed",
                      );
                      setEditor(null);
                    }
                  : undefined
              }
            />
          )}
        </Drawer>
      )}
    </div>
  );
}
function initials(s: string) {
  return s
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}
function Today({ month }: { month: number }) {
  return month >= 0 && month < 24 ? (
    <i
      className="today-line"
      style={{ left: `${((month + 0.5) / 24) * 100}%` }}
    />
  ) : null;
}
function Search({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Icon name="search" />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <Icon name="close" />
        </button>
      )}
    </label>
  );
}
function DeptFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <select
      aria-label="Department filter"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="ALL">All departments</option>
      {departments.map((d) => (
        <option value={d.id} key={d.id}>
          {d.id} · {d.name}
        </option>
      ))}
    </select>
  );
}
function Stat({
  label,
  value,
  note,
  icon,
  tone = "",
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  tone?: string;
}) {
  return (
    <div className={`panel stat ${tone}`}>
      <div>
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Icon name="search" />
      <p>{text}</p>
    </div>
  );
}
function CapacityChart({
  monthly,
  capacity,
  team,
}: {
  monthly: number[];
  capacity: number;
  team: number;
}) {
  const max = Math.max(1, Math.ceil(Math.max(...monthly, team))),
    height = 150;
  return (
    <>
      <div className="chart-legend">
        <span>
          <i className="legend-swatch teal" />
          Demand
        </span>
        <span>
          <i className="legend-swatch amber" />
          Above target
        </span>
        <span>
          <i className="line-swatch" />
          Target capacity
        </span>
      </div>
      <div className="capacity-chart">
        <div className="chart-axis">
          <span>FTE</span>
          {[max, max * 0.75, max * 0.5, max * 0.25, 0].map((v, i) => (
            <small key={i} style={{ top: 24 + (i * height) / 4 }}>
              {fte(v)}
            </small>
          ))}
        </div>
        <div className="chart-plot">
          <div className="chart-bars" style={{ height }}>
            {[0, 25, 50, 75, 100].map((v) => (
              <div
                className="chart-grid-line"
                key={v}
                style={{ bottom: `${v}%` }}
              />
            ))}
            <div
              className="capacity-line"
              style={{ bottom: `${(capacity / max) * 100}%` }}
            />
            <div className="bars-container">
              {monthly.map((v, i) => (
                <div className="chart-column" key={i}>
                  <div
                    className={`chart-bar ${v > capacity ? "over" : ""}`}
                    style={{ height: `${(v / max) * 100}%` }}
                    tabIndex={0}
                    aria-label={`${monthLabel(i)}: demand ${fte(v)} FTE, capacity ${fte(capacity)} FTE`}
                  >
                    <span className="chart-tooltip">
                      {monthLabel(i)}
                      <b>{fte(v)} FTE demand</b>
                      <small>{fte(capacity)} FTE capacity</small>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-months">
            {monthNames.concat(monthNames).map((m, i) => (
              <span key={i}>{m[0]}</span>
            ))}
          </div>
          <div className="chart-years">
            <span>2026</span>
            <span>2027</span>
          </div>
        </div>
      </div>
    </>
  );
}
