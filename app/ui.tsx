"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  departments,
  timelineMonths,
  monthLabel,
  pct,
  fte,
  allocated,
  type Plan,
  type PlanBar,
  type Person,
  type Project,
  type Milestone,
  type DeptId,
} from "../lib/planning";
import {ResourceAvatar,preparePhoto} from "./ResourceAvatar";
const paths: Record<string, ReactNode> = {
  timeline: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 8h7M10 12h7M7 16h5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a4 4 0 0 1 3 4v2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 3v17h17M8 16v-4M13 16V6M18 16V9" />
    </>
  ),
  folder: (
    <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  diamond: <path d="m12 3 9 9-9 9-9-9Z" />,
  left: <path d="m14 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  edit: (
    <>
      <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5" />
    </>
  ),
  undo: <path d="M3 10h10a7 7 0 0 1 0 14M3 10l5-5M3 10l5 5" />,
  filter: (
    <>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </>
  ),
  spark: <path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
};
export function Icon({ name }: { name: string }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.folder}
    </svg>
  );
}
export function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">PLAN WITH INTENTION</span>
            <h2 id="drawer-title">{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close editor"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
function DateFields({
  start,
  end,
  onChange,
}: {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        Start month
        <select
          value={start}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(n, Math.max(n, end));
          }}
        >
          {timelineMonths.map((m) => (
            <option value={m.index} key={m.index}>
              {monthLabel(m.index)}
            </option>
          ))}
        </select>
      </label>
      <label>
        End month
        <select
          value={end}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Math.min(n, start), n);
          }}
        >
          {timelineMonths.map((m) => (
            <option value={m.index} key={m.index}>
              {monthLabel(m.index)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function AllocationForm({
  value,
  plan,
  onSave,
  onDelete,
}: {
  value: PlanBar;
  plan: Plan;
  onSave: (b: PlanBar) => void;
  onDelete?: () => void;
}) {
  const [b, setB] = useState(value),
    [allocation, setAllocation] = useState(
      String(Math.round(value.allocation * 100)),
    );
  const patch = (p: Partial<PlanBar>) => setB((v) => ({ ...v, ...p }));
  const amount = Number(allocation) / 100;
  const candidate = { ...b, allocation: amount, label: b.label?.trim() || undefined };
  const other = plan.bars.filter((v) => v.id !== b.id);
  const projected = Math.max(
    0,
    ...timelineMonths
      .filter((m) => m.index >= b.start && m.index <= b.end)
      .map((m) => allocated(other, b.personId || "", m.index) + amount),
  );
  const eligible = plan.people.filter((p) => p.dept === b.dept),
    valid = Number.isFinite(amount) && amount > 0 && amount <= 20;
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(candidate);
      }}
    >
      <div className={`editor-banner ${b.personId ? "" : "amber-banner"}`}>
        <Icon name={b.personId ? "people" : "alert"} />
        <div>
          <strong>
            {b.personId
              ? plan.people.find((p) => p.id === b.personId)?.name
              : b.label || "Unassigned demand"}
          </strong>
          <small>
            {monthLabel(b.start)} — {monthLabel(b.end)} · {b.end - b.start + 1}{" "}
            months
          </small>
        </div>
      </div>
      <div className="form-fields">
        <label>
          Project
          <select
            value={b.project}
            onChange={(e) => patch({ project: e.target.value })}
          >
            {plan.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Workstream / system
          <input
            aria-label="Workstream / system"
            value={b.label || ""}
            onChange={(e) => patch({ label: e.target.value || undefined })}
            placeholder="e.g. Skypod"
          />
          <small>Use this to distinguish system-level staffing demand.</small>
        </label>
        <label>
          Department
          <select
            value={b.dept}
            onChange={(e) =>
              patch({ dept: e.target.value as DeptId, personId: undefined })
            }
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assigned resource
          <select
            aria-label="Assigned resource"
            value={b.personId || ""}
            onChange={(e) => patch({ personId: e.target.value || undefined })}
          >
            <option value="">Unassigned / hiring need</option>
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <small>Only resources in this department are shown.</small>
        </label>
        <label>
          Allocation
          <div className="number-field">
            <input
              aria-label="Allocation percentage"
              type="number"
              min="1"
              max="2000"
              step="1"
              required
              value={allocation}
              onChange={(e) => setAllocation(e.target.value)}
            />
            <span>%</span>
          </div>
          <small>
            100% = 1 FTE. An unassigned allocation can represent multiple
            people.
          </small>
        </label>
        <div className="allocation-presets">
          {[25, 50, 75, 100, 150, 200].map((n) => (
            <button
              type="button"
              className={Number(allocation) === n ? "selected" : ""}
              key={n}
              onClick={() => setAllocation(String(n))}
            >
              {n}%
            </button>
          ))}
        </div>
        <DateFields
          start={b.start}
          end={b.end}
          onChange={(start, end) => patch({ start, end })}
        />
        {b.personId && projected > 1 && (
          <div className="form-warning" role="status">
            <Icon name="alert" />
            <span>
              This person reaches <strong>{pct(projected)}</strong> total
              allocation during this period across all projects. Adjust the
              dates, percentage or assignment.
            </span>
          </div>
        )}
        <div className="form-note">
          <Icon name="info" />
          <span>
            Changes update the timeline, resource table and capacity forecast
            together.
          </span>
        </div>
      </div>
      <div className="form-footer">
        {onDelete && (
          <button type="button" className="button danger" onClick={onDelete}>
            <Icon name="trash" />
            Delete
          </button>
        )}
        <button className="button primary" type="submit" disabled={!valid}>
          <Icon name="check" />
          Save allocation
        </button>
      </div>
    </form>
  );
}
export function PersonForm({
  value,
  plan,
  onSave,
  onAllocation,
}: {
  value: Person;
  plan: Plan;
  onSave: (p: Person) => void;
  onAllocation: (b: PlanBar) => void;
}) {
  const [p, setP] = useState(value),[photoError,setPhotoError]=useState(''),[photoBusy,setPhotoBusy]=useState(false);
  const photoRequest=useRef(0);
  useEffect(()=>()=>{photoRequest.current++},[]);
  const changePhoto=async(file?:File)=>{
    if(!file)return;const request=++photoRequest.current;setPhotoBusy(true);setPhotoError('');
    try{const photo=await preparePhoto(file);if(photoRequest.current===request)setP(old=>({...old,photo}));}
    catch(error){if(photoRequest.current===request)setPhotoError(error instanceof Error?error.message:'Could not open this image.');}
    finally{if(photoRequest.current===request)setPhotoBusy(false)}
  };
  const bars = plan.bars.filter((b) => b.personId === p.id);
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (p.name.trim() && !photoBusy)
          onSave({
            ...p,
            name: p.name.trim(),
            title: p.title.trim(),
            location: p.location.trim(),
          });
      }}
    >
      <div className="form-fields">
        <div className="photo-editor"><ResourceAvatar person={p}/><div><label>Resource picture<input aria-label="Resource picture" type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} onChange={e=>{void changePhoto(e.target.files?.[0]);e.target.value=''}}/></label><small>JPG, PNG or WebP · up to 8 MB · cropped to a circle</small>{p.photo&&<button type="button" className="text-button" disabled={photoBusy} onClick={()=>setP(old=>({...old,photo:undefined}))}>Use generic avatar</button>}</div></div>
        {photoBusy&&<p role="status">Preparing photo…</p>}{photoError&&<p role="alert" className="form-warning">{photoError}</p>}
        <label>
          Full name
          <input
            required
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            placeholder="Resource name"
          />
        </label>
        <label>
          Department
          <select
            value={p.dept}
            onChange={(e) => setP({ ...p, dept: e.target.value as DeptId })}
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Role / title
          <input
            value={p.title}
            onChange={(e) => setP({ ...p, title: e.target.value })}
            placeholder="e.g. Project System Engineer"
          />
        </label>
        <label>
          Location
          <input
            value={p.location}
            onChange={(e) => setP({ ...p, location: e.target.value })}
            placeholder="City, State"
          />
        </label>
        {p.dept !== value.dept && bars.length > 0 && (
          <div className="form-warning">
            Changing departments will release this person’s existing
            assignments. Their demand stays in the plan as unassigned.
          </div>
        )}
        {bars.length > 0 && (
          <div className="assignment-list">
            <h3>
              Current assignments <span className="count">{bars.length}</span>
            </h3>
            <p>Save resource changes before opening an assignment.</p>
            {bars.map((b) => (
              <button key={b.id} type="button" onClick={() => onAllocation(b)}>
                <span>
                  <strong>
                    {plan.projects.find((v) => v.id === b.project)?.name}
                  </strong>
                  <small>
                    {monthLabel(b.start)} — {monthLabel(b.end)}
                  </small>
                </span>
                <b>{pct(b.allocation)}</b>
                <Icon name="right" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="form-footer">
        <button className="button primary" disabled={!p.name.trim()||photoBusy}>
          <Icon name="check" />
          Save resource
        </button>
      </div>
    </form>
  );
}
export function ProjectForm({
  value,
  onSave,
}: {
  value: Project;
  onSave: (p: Project) => void;
}) {
  const [p, setP] = useState(value);
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...p,
          name: p.name.trim(),
          code: p.code.trim().toUpperCase(),
          customer: p.customer.trim(),
          location: p.location.trim(),
        });
      }}
    >
      <div className="form-fields">
        <label>
          Project name
          <input
            required
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            placeholder="Project name"
          />
        </label>
        <div className="form-grid">
          <label>
            Project code
            <input
              required
              maxLength={12}
              value={p.code}
              onChange={(e) => setP({ ...p, code: e.target.value })}
              placeholder="e.g. ATL1"
            />
          </label>
          <label>
            Status
            <select
              value={p.status}
              onChange={(e) =>
                setP({ ...p, status: e.target.value as Project["status"] })
              }
            >
              <option>Planning</option>
              <option>Active</option>
            </select>
          </label>
        </div>
        <label>
          Customer
          <input
            value={p.customer}
            onChange={(e) => setP({ ...p, customer: e.target.value })}
            placeholder="Customer name"
          />
        </label>
        <label>
          Location
          <input
            value={p.location}
            onChange={(e) => setP({ ...p, location: e.target.value })}
            placeholder="City, State"
          />
        </label>
        <div className="form-note">
          <Icon name="calendar" />
          <span>
            Projects share the January 2026 to December 2027 planning horizon.
          </span>
        </div>
      </div>
      <div className="form-footer">
        <button
          className="button primary"
          disabled={!p.name.trim() || !p.code.trim()}
        >
          <Icon name="check" />
          Save project
        </button>
      </div>
    </form>
  );
}
export function MilestoneForm({
  value,
  onSave,
  onDelete,
}: {
  value: Milestone;
  onSave: (m: Milestone) => void;
  onDelete?: () => void;
}) {
  const [m, setM] = useState(value);
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...m, label: m.label.trim() });
      }}
    >
      <div className="form-fields">
        <label>
          Milestone name
          <input
            required
            value={m.label}
            onChange={(e) => setM({ ...m, label: e.target.value })}
            placeholder="e.g. Go live"
          />
        </label>
        <label>
          Ownership
          <select
            value={m.type}
            onChange={(e) =>
              setM({ ...m, type: e.target.value as Milestone["type"] })
            }
          >
            <option value="internal">Internal · company controlled</option>
            <option value="external">External · customer or partner</option>
          </select>
        </label>
        <label>
          Target month
          <select
            value={m.month}
            onChange={(e) => setM({ ...m, month: Number(e.target.value) })}
          >
            {timelineMonths.map((v) => (
              <option value={v.index} key={v.index}>
                {monthLabel(v.index)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-footer">
        {onDelete && (
          <button className="button danger" type="button" onClick={onDelete}>
            <Icon name="trash" />
            Delete
          </button>
        )}
        <button className="button primary" disabled={!m.label.trim()}>
          <Icon name="check" />
          Save milestone
        </button>
      </div>
    </form>
  );
}
