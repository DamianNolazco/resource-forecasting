"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type View = "planner" | "resources" | "capacity" | "projects";
type DeptId = "HW" | "SW" | "PM" | "PSE" | "FE" | "SS";
type Project = { id:string; name:string; code:string; customer:string; location:string; status:"Active"|"Planning" };
type Department = { id:DeptId; name:string; target:number };
type Person = { id:string; name:string; dept:DeptId; title:string; location:string };
type PlanBar = { id:string; project:string; dept:DeptId; start:number; end:number; allocation:number; personId?:string };
type Milestone = { id:string; project:string; label:string; type:"internal"|"external"; month:number };
type DragState = { id:string; mode:"move"|"left"|"right"; startX:number; start:number; end:number } | null;

const START_YEAR = 2026;
const TOTAL_MONTHS = 24;
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const timelineMonths = Array.from({length:TOTAL_MONTHS},(_,i)=>({index:i,year:START_YEAR+Math.floor(i/12),month:i%12,label:monthNames[i%12]}));

const departments:Department[] = [
  {id:"HW",name:"Hardware Engineering",target:.85},
  {id:"SW",name:"Software Engineering",target:.85},
  {id:"PM",name:"Project Managers",target:.80},
  {id:"PSE",name:"Project System Engineers",target:.85},
  {id:"FE",name:"Field Engineers",target:.85},
  {id:"SS",name:"Site Supervisors",target:.85},
];

const projects:Project[] = [
  {id:"P1",name:"Project Atlas LAX1",code:"LAX1",customer:"Customer A",location:"Los Angeles, CA",status:"Active"},
  {id:"P2",name:"Project Beacon DFW1",code:"DFW1",customer:"Customer B",location:"Fort Worth, TX",status:"Active"},
  {id:"P3",name:"Project Cedar ATL1",code:"ATL1",customer:"Customer C",location:"Atlanta, GA",status:"Planning"},
  {id:"P4",name:"Project Delta EWR1",code:"EWR1",customer:"Customer D",location:"Newark, NJ",status:"Planning"},
];

const seedPeople:Person[] = [
  {id:"U1",name:"Employee 001",dept:"PSE",title:"Project System Engineer",location:"Atlanta, GA"},
  {id:"U2",name:"Employee 002",dept:"PSE",title:"Project System Engineer",location:"Houston, TX"},
  {id:"U3",name:"Employee 003",dept:"FE",title:"Field Engineer",location:"Atlanta, GA"},
  {id:"U4",name:"Employee 004",dept:"FE",title:"Field Engineer",location:"Chicago, IL"},
  {id:"U5",name:"Employee 005",dept:"PM",title:"Project Manager",location:"Atlanta, GA"},
  {id:"U6",name:"Employee 006",dept:"SW",title:"Software Engineer",location:"Atlanta, GA"},
  {id:"U7",name:"Employee 007",dept:"HW",title:"Hardware Engineer",location:"Atlanta, GA"},
  {id:"U8",name:"Employee 008",dept:"SS",title:"Site Supervisor",location:"Dallas, TX"},
  {id:"U9",name:"Employee 009",dept:"FE",title:"Field Engineer",location:"Dallas, TX"},
  {id:"U10",name:"Employee 010",dept:"FE",title:"Field Engineer",location:"Newark, NJ"},
  {id:"U11",name:"Employee 011",dept:"PM",title:"Project Manager",location:"Chicago, IL"},
  {id:"U12",name:"Employee 012",dept:"SW",title:"Software Engineer",location:"Boston, MA"},
  {id:"U13",name:"Employee 013",dept:"HW",title:"Hardware Engineer",location:"Atlanta, GA"},
  {id:"U14",name:"Employee 014",dept:"SS",title:"Site Supervisor",location:"Los Angeles, CA"},
];

const seedBars:PlanBar[] = [
  {id:"B1",project:"P1",dept:"PM",start:5,end:18,allocation:.5,personId:"U5"},
  {id:"B2",project:"P1",dept:"PSE",start:7,end:13,allocation:1,personId:"U1"},
  {id:"B3",project:"P1",dept:"FE",start:9,end:15,allocation:1,personId:"U3"},
  {id:"B4",project:"P1",dept:"FE",start:11,end:17,allocation:1},
  {id:"B5",project:"P1",dept:"SS",start:12,end:16,allocation:1,personId:"U8"},
  {id:"B6",project:"P2",dept:"PM",start:2,end:15,allocation:.5,personId:"U11"},
  {id:"B7",project:"P2",dept:"PSE",start:4,end:12,allocation:1,personId:"U2"},
  {id:"B8",project:"P2",dept:"FE",start:7,end:13,allocation:1.5},
  {id:"B9",project:"P3",dept:"HW",start:8,end:12,allocation:.5,personId:"U7"},
  {id:"B10",project:"P3",dept:"SW",start:9,end:14,allocation:.75,personId:"U6"},
  {id:"B11",project:"P3",dept:"PSE",start:10,end:18,allocation:1},
  {id:"B12",project:"P3",dept:"FE",start:13,end:21,allocation:2},
  {id:"B13",project:"P4",dept:"PM",start:10,end:23,allocation:.5},
  {id:"B14",project:"P4",dept:"PSE",start:12,end:20,allocation:1},
  {id:"B15",project:"P4",dept:"FE",start:16,end:23,allocation:2},
];

const seedMilestones:Milestone[] = [
  {id:"M1",project:"P1",label:"Design freeze",type:"internal",month:6},
  {id:"M2",project:"P1",label:"Software ready",type:"internal",month:10},
  {id:"M3",project:"P1",label:"SAT",type:"internal",month:15},
  {id:"M4",project:"P1",label:"Site ready",type:"external",month:8},
  {id:"M5",project:"P1",label:"WMS ready",type:"external",month:12},
  {id:"M6",project:"P1",label:"Go live",type:"external",month:16},
  {id:"M7",project:"P2",label:"Design freeze",type:"internal",month:4},
  {id:"M8",project:"P2",label:"Site ready",type:"external",month:7},
  {id:"M9",project:"P2",label:"Go live",type:"external",month:14},
  {id:"M10",project:"P3",label:"Design freeze",type:"internal",month:9},
  {id:"M11",project:"P3",label:"Site ready",type:"external",month:12},
  {id:"M12",project:"P3",label:"Go live",type:"external",month:20},
  {id:"M13",project:"P4",label:"Design freeze",type:"internal",month:11},
  {id:"M14",project:"P4",label:"Site ready",type:"external",month:16},
  {id:"M15",project:"P4",label:"Go live",type:"external",month:23},
];

function clamp(n:number,min:number,max:number){ return Math.max(min,Math.min(max,n)); }
function pct(n:number){ return `${Math.round(n*100)}%`; }
function monthLabel(i:number){ const m=timelineMonths[clamp(i,0,TOTAL_MONTHS-1)]; return `${m.label} ${m.year}`; }

export default function Page(){
  const [view,setView] = useState<View>("planner");
  const [projectId,setProjectId] = useState("P1");
  const [bars,setBars] = useState<PlanBar[]>(seedBars);
  const [people,setPeople] = useState<Person[]>(seedPeople);
  const [milestones,setMilestones] = useState<Milestone[]>(seedMilestones);
  const [selectedBarId,setSelectedBarId] = useState<string|null>(null);
  const [resourceYear,setResourceYear] = useState(2026);
  const [collapsedDepts,setCollapsedDepts] = useState<Set<DeptId>>(new Set());
  const [addDept,setAddDept] = useState<DeptId>("PSE");
  const [milestoneType,setMilestoneType] = useState<"internal"|"external">("internal");
  const [drag,setDrag] = useState<DragState>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);

  const project = projects.find(p=>p.id===projectId)!;
  const projectBars = bars.filter(b=>b.project===projectId);
  const projectMilestones = milestones.filter(m=>m.project===projectId);
  const selectedBar = bars.find(b=>b.id===selectedBarId) || null;

  useEffect(()=>{
    if(!drag) return;
    const onMove=(e:PointerEvent)=>{
      const width=timelineRef.current?.getBoundingClientRect().width || 960;
      const delta=Math.round((e.clientX-drag.startX)/(width/TOTAL_MONTHS));
      if(Math.abs(e.clientX-drag.startX)>4) draggedRef.current=true;
      setBars(current=>current.map(bar=>{
        if(bar.id!==drag.id) return bar;
        if(drag.mode==="move"){
          const duration=drag.end-drag.start;
          const start=clamp(drag.start+delta,0,TOTAL_MONTHS-1-duration);
          return {...bar,start,end:start+duration};
        }
        if(drag.mode==="left") return {...bar,start:clamp(drag.start+delta,0,bar.end)};
        return {...bar,end:clamp(drag.end+delta,bar.start,TOTAL_MONTHS-1)};
      }));
    };
    const onUp=()=>setDrag(null);
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
    return()=>{window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp);};
  },[drag]);

  const beginBarDrag=(e:ReactPointerEvent,id:string,mode:"move"|"left"|"right")=>{
    e.preventDefault(); e.stopPropagation();
    const bar=bars.find(b=>b.id===id); if(!bar) return;
    draggedRef.current=false;
    setDrag({id,mode,startX:e.clientX,start:bar.start,end:bar.end});
  };

  const updateBar=(id:string,patch:Partial<PlanBar>)=>setBars(current=>current.map(b=>b.id===id?{...b,...patch}:b));

  const addResource=()=>{
    const id=`B${Date.now()}`;
    const start=8;
    const newBar:PlanBar={id,project:projectId,dept:addDept,start,end:clamp(start+3,0,TOTAL_MONTHS-1),allocation:1};
    setBars(current=>[...current,newBar]);
    setCollapsedDepts(current=>{const next=new Set(current);next.delete(addDept);return next;});
    setSelectedBarId(id);
  };

  const addMilestone=()=>{
    const label=milestoneType==="internal"?"New internal milestone":"New external milestone";
    setMilestones(current=>[...current,{id:`M${Date.now()}`,project:projectId,label,type:milestoneType,month:10}]);
  };

  const moveMilestone=(id:string,delta:number)=>setMilestones(current=>current.map(m=>m.id===id?{...m,month:clamp(m.month+delta,0,TOTAL_MONTHS-1)}:m));

  const allocationFor=(personId:string,monthIndex:number)=>bars.filter(b=>b.personId===personId&&b.start<=monthIndex&&b.end>=monthIndex).reduce((s,b)=>s+b.allocation,0);

  const toggleDept=(dept:DeptId)=>setCollapsedDepts(current=>{
    const next=new Set(current);
    if(next.has(dept)) next.delete(dept); else next.add(dept);
    return next;
  });

  const capacityRows=useMemo(()=>departments.map(dept=>{
    const team=people.filter(p=>p.dept===dept.id).length;
    const monthly=timelineMonths.map(m=>bars.filter(b=>b.dept===dept.id&&b.start<=m.index&&b.end>=m.index).reduce((s,b)=>s+b.allocation,0));
    return {dept,team,monthly,peak:Math.max(0,...monthly)};
  }),[bars,people]);

  const nav:{id:View;label:string}[]=[
    {id:"planner",label:"Project planner"},
    {id:"resources",label:"Resources"},
    {id:"capacity",label:"Capacity"},
    {id:"projects",label:"Projects"},
  ];

  return <div className="app-shell">
    <aside className="side-nav">
      <div className="brand"><span className="brand-dot">N</span><div><strong>Nolazco Labs</strong><small>Resource Forecasting</small></div></div>
      <nav>{nav.map(n=><button key={n.id} className={view===n.id?"nav-item active":"nav-item"} onClick={()=>setView(n.id)}>{n.label}</button>)}</nav>
      <div className="side-note"><span className="live-dot"/><div><strong>Planning prototype</strong><small>2026–2027 monthly planning</small></div></div>
    </aside>

    <main className="main-area">
      <header className="top-bar">
        <div className="mobile-title"><span className="brand-dot small">N</span><strong>Resources</strong></div>
        <div className="top-actions"><span className="quiet-pill">2026–2027</span><span className="quiet-pill teal">Monthly view</span></div>
      </header>

      <div className="page-wrap">
        {view==="planner"&&<>
          <div className="planner-heading">
            <div><span className="eyebrow">Project planning</span><h1>{project.name}</h1><p>{project.customer} · {project.location}. Two years are visible at once on desktop; the planner can still scroll horizontally on smaller windows.</p></div>
            <div className="project-switch"><label>Project<select value={projectId} onChange={e=>{setProjectId(e.target.value);setSelectedBarId(null);}}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
          </div>

          <div className="planner-toolbar card">
            <div className="tool-group"><span>Add resource</span><select value={addDept} onChange={e=>setAddDept(e.target.value as DeptId)}>{departments.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select><button className="primary" onClick={addResource}>+ Resource</button></div>
            <div className="tool-group"><span>Add milestone</span><select value={milestoneType} onChange={e=>setMilestoneType(e.target.value as "internal"|"external")}><option value="internal">Internal</option><option value="external">External</option></select><button className="secondary" onClick={addMilestone}>+ Milestone</button></div>
            <div className="scroll-buttons"><button className="icon-btn" onClick={()=>scrollRef.current?.scrollBy({left:-360,behavior:"smooth"})}>←</button><button className="icon-btn" onClick={()=>scrollRef.current?.scrollBy({left:360,behavior:"smooth"})}>→</button></div>
          </div>

          <section className="planner-card card">
            <div className="planner-scroll" ref={scrollRef}>
              <div className="planner-grid-shell">
                <div className="left-head"><span>Resource plan</span><small>Click any bar to edit</small></div>
                <div className="timeline-head">
                  <div className="year-row"><div>2026</div><div>2027</div></div>
                  <div className="month-row" ref={timelineRef}>{timelineMonths.map(m=><div key={m.index} className={m.month===0?"month-cell year-start":"month-cell"}>{m.label}</div>)}</div>
                </div>

                <div className="lane-label milestone-label"><strong>Internal milestones</strong><small>Company-controlled dates</small></div>
                <MilestoneLane milestones={projectMilestones.filter(m=>m.type==="internal")} onMove={moveMilestone}/>
                <div className="lane-label milestone-label"><strong>External milestones</strong><small>Customer / partner dates</small></div>
                <MilestoneLane milestones={projectMilestones.filter(m=>m.type==="external")} onMove={moveMilestone}/>

                {projectBars.length===0&&<><div className="lane-label"><strong>No resources</strong><small>Add the first bar above</small></div><div className="empty-timeline">No resource forecast yet.</div></>}
                {departments.filter(dept=>projectBars.some(bar=>bar.dept===dept.id)).map(dept=>{
                  const deptBars=projectBars.filter(bar=>bar.dept===dept.id);
                  const collapsed=collapsedDepts.has(dept.id);
                  const aggregate=timelineMonths.map(m=>deptBars.filter(bar=>bar.start<=m.index&&bar.end>=m.index).reduce((sum,bar)=>sum+bar.allocation,0));
                  const peak=Math.max(0,...aggregate);
                  return <div className="department-group" key={dept.id}>
                    <div className="lane-label department-header">
                      <button className="collapse-btn" onClick={()=>toggleDept(dept.id)} aria-label={`${collapsed?"Expand":"Collapse"} ${dept.name}`}>{collapsed?"›":"⌄"}</button>
                      <span className="dept-chip">{dept.id}</span>
                      <div><strong>{dept.name}</strong><small>{deptBars.length} resource{deptBars.length===1?"":"s"} · Peak {peak.toFixed(peak%1?1:0)} FTE</small></div>
                    </div>
                    <div className={collapsed?"department-header-lane collapsed":"department-header-lane"}>
                      <div className="month-grid-lines">{timelineMonths.map(m=><i key={m.index} className={m.month===0?"year-start":""}/>)}</div>
                      {collapsed?<button className="aggregate-summary" onClick={()=>toggleDept(dept.id)} title={`Expand ${dept.name}`}>{aggregate.map((value,i)=><span key={i} className={value?"aggregate-cell active":"aggregate-cell"} style={value?{opacity:Math.min(.45+value*.18,1)}:undefined}>{value?<b>{value.toFixed(value%1?1:0)}</b>:null}</span>)}</button>:<div className="department-expanded-note"><span>Expanded</span><small>{deptBars.length} allocation bar{deptBars.length===1?"":"s"}</small></div>}
                    </div>
                    {!collapsed&&deptBars.map(bar=>{
                      const person=people.find(p=>p.id===bar.personId);
                      return <div className="resource-row" key={bar.id}>
                        <div className="lane-label resource-label grouped-resource-label"><span className="group-indent"/><div><strong>{person?.name||"Unassigned"}</strong><small>{pct(bar.allocation)} · {monthLabel(bar.start)} → {monthLabel(bar.end)}</small></div></div>
                        <div className="bar-lane grouped-resource-lane">
                          <div className="month-grid-lines">{timelineMonths.map(m=><i key={m.index} className={m.month===0?"year-start":""}/>)}</div>
                          <button className={bar.personId?"plan-bar assigned":"plan-bar forecast"} style={{left:`${bar.start/TOTAL_MONTHS*100}%`,width:`${(bar.end-bar.start+1)/TOTAL_MONTHS*100}%`}} onPointerDown={e=>beginBarDrag(e,bar.id,"move")} onClick={()=>{if(draggedRef.current){draggedRef.current=false;return;}setSelectedBarId(bar.id);}} title="Click to edit; drag to move">
                            <span className="resize-handle left" onPointerDown={e=>beginBarDrag(e,bar.id,"left")}/>
                            <span className="bar-text"><strong>{person?.name||`${bar.dept} unassigned`}</strong><small>{pct(bar.allocation)}</small></span>
                            <span className="resize-handle right" onPointerDown={e=>beginBarDrag(e,bar.id,"right")}/>
                          </button>
                        </div>
                      </div>;
                    })}
                  </div>;
                })}
              </div>
            </div>
          </section>
        </>}

        {view==="resources"&&<ResourcesView year={resourceYear} setYear={setResourceYear} allocationFor={allocationFor} people={people} onAdd={person=>setPeople(current=>[...current,person])}/>} 
        {view==="capacity"&&<CapacityView rows={capacityRows}/>} 
        {view==="projects"&&<ProjectsView selected={projectId} onPlan={id=>{setProjectId(id);setView("planner");}}/>}
      </div>

      <nav className="bottom-nav">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}>{n.label}</button>)}</nav>
    </main>

    {selectedBar&&<BarDrawer bar={selectedBar} people={people} onClose={()=>setSelectedBarId(null)} onUpdate={patch=>updateBar(selectedBar.id,patch)} onDelete={()=>{setBars(current=>current.filter(b=>b.id!==selectedBar.id));setSelectedBarId(null);}}/>}
  </div>;
}

function MilestoneLane({milestones,onMove}:{milestones:Milestone[];onMove:(id:string,delta:number)=>void}){
  return <div className="milestone-lane">
    <div className="month-grid-lines">{timelineMonths.map(m=><i key={m.index} className={m.month===0?"year-start":""}/>)}</div>
    {milestones.map(m=><div key={m.id} className={`milestone ${m.type}`} style={{left:`${(m.month+.5)/TOTAL_MONTHS*100}%`}}><button className="milestone-arrow" onClick={()=>onMove(m.id,-1)}>‹</button><span className="milestone-diamond"/><div><strong>{m.label}</strong><small>{monthLabel(m.month)}</small></div><button className="milestone-arrow" onClick={()=>onMove(m.id,1)}>›</button></div>)}
  </div>;
}

function BarDrawer({bar,people,onClose,onUpdate,onDelete}:{bar:PlanBar;people:Person[];onClose:()=>void;onUpdate:(patch:Partial<PlanBar>)=>void;onDelete:()=>void}){
  const eligible=people.filter(p=>p.dept===bar.dept);
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="drawer" onMouseDown={e=>e.stopPropagation()}>
    <div className="drawer-head"><div><span className="eyebrow">Resource allocation</span><h2>{bar.dept} resource</h2></div><button className="close-btn" onClick={onClose}>×</button></div>
    <div className="drawer-summary"><span className="dept-chip large">{bar.dept}</span><div><strong>{people.find(p=>p.id===bar.personId)?.name||"Unassigned resource"}</strong><small>{monthLabel(bar.start)} → {monthLabel(bar.end)}</small></div></div>
    <div className="form-stack">
      <label>Department<select value={bar.dept} onChange={e=>onUpdate({dept:e.target.value as DeptId,personId:undefined})}>{departments.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select></label>
      <label>Person<select value={bar.personId||""} onChange={e=>onUpdate({personId:e.target.value||undefined})}><option value="">Unassigned / hiring need</option>{eligible.map(p=><option key={p.id} value={p.id}>{p.name} · {p.location}</option>)}</select></label>
      <label>Allocation percentage<div className="percent-input"><input type="number" min="25" max="200" step="25" value={Math.round(bar.allocation*100)} onChange={e=>onUpdate({allocation:clamp(Number(e.target.value||0)/100,.25,2)})}/><span>%</span></div><small>100% = one full-time resource. Unassigned bars may exceed 100% to represent multiple FTE.</small></label>
      <div className="form-two"><label>Start<select value={bar.start} onChange={e=>{const start=Number(e.target.value);onUpdate({start,end:Math.max(start,bar.end)});}}>{timelineMonths.map(m=><option key={m.index} value={m.index}>{m.label} {m.year}</option>)}</select></label><label>End<select value={bar.end} onChange={e=>{const end=Number(e.target.value);onUpdate({end,start:Math.min(end,bar.start)});}}>{timelineMonths.map(m=><option key={m.index} value={m.index}>{m.label} {m.year}</option>)}</select></label></div>
    </div>
    <div className="drawer-actions"><button className="danger" onClick={onDelete}>Delete resource</button><button className="primary" onClick={onClose}>Done</button></div>
  </aside></div>;
}

function ResourcesView({year,setYear,allocationFor,people,onAdd}:{year:number;setYear:(y:number)=>void;allocationFor:(personId:string,monthIndex:number)=>number;people:Person[];onAdd:(person:Person)=>void}){
  const yearOffset=(year-START_YEAR)*12;
  const [query,setQuery]=useState("");
  const [deptFilter,setDeptFilter]=useState<"ALL"|DeptId>("ALL");
  const [showAdd,setShowAdd]=useState(false);
  const filtered=people.filter(person=>{
    const matchesDept=deptFilter==="ALL"||person.dept===deptFilter;
    const q=query.trim().toLowerCase();
    const matchesSearch=!q||`${person.name} ${person.dept} ${person.title} ${person.location}`.toLowerCase().includes(q);
    return matchesDept&&matchesSearch;
  });
  return <>
    <div className="page-title"><span className="eyebrow">People utilization</span><h1>Resources</h1><p>Monthly allocation by person. Search the team, filter by department, or add a resource directly from this view.</p></div>
    <div className="resource-toolbar card">
      <label className="resource-search"><SearchIcon/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources" aria-label="Search resources"/></label>
      <label className="resource-filter"><span>Department</span><select value={deptFilter} onChange={e=>setDeptFilter(e.target.value as "ALL"|DeptId)}><option value="ALL">All departments</option>{departments.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select></label>
      <label className="resource-filter year-filter"><span>Year</span><select value={year} onChange={e=>setYear(Number(e.target.value))}><option value={2026}>2026</option><option value={2027}>2027</option></select></label>
      <button className="primary resource-add" onClick={()=>setShowAdd(true)}><PlusIcon/>Add resource</button>
    </div>
    <div className="resource-result-count">{filtered.length} of {people.length} resources</div>
    <div className="resource-table-card card"><div className="resource-table-scroll"><table className="resource-table"><thead><tr><th>Resource</th>{monthNames.map(m=><th key={m}>{m}</th>)}<th>Avg.</th></tr></thead><tbody>{filtered.map(person=>{const values=monthNames.map((_,m)=>allocationFor(person.id,yearOffset+m));const avg=values.reduce((s,v)=>s+v,0)/12;return <tr key={person.id}><td><strong>{person.name}</strong><small>{person.dept} · {person.title}</small></td>{values.map((v,i)=><td key={i}><span className={`alloc-cell ${v>1?"over":v>.85?"high":v>0?"used":"empty"}`}>{v?pct(v):"—"}</span></td>)}<td><strong>{pct(avg)}</strong></td></tr>;})}{filtered.length===0&&<tr><td className="resource-empty" colSpan={14}>No resources match this search or department filter.</td></tr>}</tbody></table></div><div className="table-legend"><span><i className="empty"/>Available</span><span><i className="used"/>Allocated</span><span><i className="high"/>85–100%</span><span><i className="over"/>Over 100%</span></div></div>
    {showAdd&&<AddPersonDrawer onClose={()=>setShowAdd(false)} onAdd={person=>{onAdd(person);setShowAdd(false);}}/>}
  </>;
}

function SearchIcon(){return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>}
function PlusIcon(){return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>}

function AddPersonDrawer({onClose,onAdd}:{onClose:()=>void;onAdd:(person:Person)=>void}){
  const [name,setName]=useState("");
  const [dept,setDept]=useState<DeptId>("PSE");
  const [title,setTitle]=useState("");
  const [location,setLocation]=useState("");
  const save=()=>{
    if(!name.trim()) return;
    onAdd({id:`U${Date.now()}`,name:name.trim(),dept,title:title.trim()||`${dept} Resource`,location:location.trim()||"—"});
  };
  return <div className="drawer-backdrop" onMouseDown={onClose}><aside className="drawer" onMouseDown={e=>e.stopPropagation()}>
    <div className="drawer-head"><div><span className="eyebrow">Team capacity</span><h2>Add resource</h2></div><button className="close-btn" onClick={onClose}>×</button></div>
    <div className="drawer-summary"><span className="dept-chip large">{dept}</span><div><strong>{name.trim()||"New resource"}</strong><small>{title.trim()||"Define the resource details below"}</small></div></div>
    <div className="form-stack">
      <label>Resource name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Employee name" autoFocus/></label>
      <label>Department<select value={dept} onChange={e=>setDept(e.target.value as DeptId)}>{departments.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select></label>
      <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Role / title"/></label>
      <label>Location<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="City, State"/></label>
    </div>
    <div className="drawer-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!name.trim()} onClick={save}>Add resource</button></div>
  </aside></div>;
}

function CapacityView({rows}:{rows:{dept:Department;team:number;monthly:number[];peak:number}[]}){
  const axisLabel=(value:number)=>Number.isInteger(value)?String(value):value.toFixed(1);
  return <><div className="page-title"><span className="eyebrow">Portfolio demand</span><h1>Capacity</h1><p>Monthly forecast across all projects compared with the people currently available in each department. Vertical scale is shown in FTE.</p></div><div className="capacity-list">{rows.map(row=>{const sustainable=row.team*row.dept.target;const gap=Math.max(0,row.peak-sustainable);const hires=gap>=.5?Math.ceil(gap):0;const axisMax=Math.max(1,Math.ceil(Math.max(row.team,row.peak)));const ticks=[axisMax,axisMax*.75,axisMax*.5,axisMax*.25,0];return <article className="card capacity-card" key={row.dept.id}><div className="capacity-head"><span className="dept-chip">{row.dept.id}</span><div><h2>{row.dept.name}</h2><p>{row.team} people · {Math.round(row.dept.target*100)}% sustainable target</p></div>{hires?<span className="hire-pill">+{hires} hire{hires>1?"s":""}</span>:<span className="status green">Covered</span>}</div><div className="capacity-chart"><div className="capacity-axis"><span className="axis-title">FTE</span><div className="axis-ticks">{ticks.map((t,i)=><span key={i}>{axisLabel(t)}</span>)}</div></div><div className="capacity-bars">{row.monthly.map((v,i)=><div className="capacity-month" key={i}><div className="capacity-track"><i className="capacity-bg" style={{height:`${row.team/axisMax*100}%`}}/><i className={v>sustainable?"capacity-demand over":"capacity-demand"} style={{height:`${v/axisMax*100}%`}}/></div><small>{monthNames[i%12]}{i===0||i===12?<b>{timelineMonths[i].year}</b>:null}</small></div>)}</div></div></article>;})}</div></>;
}

function ProjectsView({selected,onPlan}:{selected:string;onPlan:(id:string)=>void}){
  return <><div className="page-title"><span className="eyebrow">Portfolio</span><h1>Projects</h1><p>Open a project to adjust its milestones and resource plan.</p></div><div className="project-grid">{projects.map(p=><article key={p.id} className={`card project-card ${p.id===selected?"selected":""}`}><div className="project-card-top"><span className="code-badge">{p.code}</span><span className={p.status==="Active"?"status green":"status gray"}>{p.status}</span></div><h2>{p.name}</h2><p>{p.customer} · {p.location}</p><div className="project-card-foot"><span>24-month planning horizon</span><button className="primary" onClick={()=>onPlan(p.id)}>Open planner</button></div></article>)}</div></>;
}