"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type View = "overview" | "planner" | "projects" | "capacity";
type DeptId = "HW" | "SW" | "PM" | "PSE" | "FE" | "SS";
type Project = { id: string; name: string; code: string; customer: string; location: string; status: "Active" | "Planning" };
type Department = { id: DeptId; name: string; capacity: number; target: number };
type Bar = { id: string; project: string; dept: DeptId; label: string; person?: string; kind: "forecast" | "allocation"; start: number; end: number; fte: number };
type Milestone = { id: string; project: string; label: string; type: "internal" | "external"; week: number };
type DragState = { target: "bar" | "milestone"; id: string; mode: "move" | "left" | "right"; startX: number; start: number; end: number } | null;

const weeks = ["Sep 14","Sep 21","Sep 28","Oct 5","Oct 12","Oct 19","Oct 26","Nov 2","Nov 9","Nov 16","Nov 23","Nov 30","Dec 7","Dec 14","Dec 21","Dec 28","Jan 4","Jan 11"];

const departments: Department[] = [
  { id: "HW", name: "Hardware Engineering", capacity: 2, target: .85 },
  { id: "SW", name: "Software Engineering", capacity: 2, target: .85 },
  { id: "PM", name: "Project Managers", capacity: 2, target: .80 },
  { id: "PSE", name: "Project System Engineers", capacity: 2, target: .85 },
  { id: "FE", name: "Field Engineers", capacity: 4, target: .85 },
  { id: "SS", name: "Site Supervisors", capacity: 2, target: .85 },
];

const projects: Project[] = [
  { id: "P1", name: "Project Atlas LAX1", code: "LAX1", customer: "Customer A", location: "Los Angeles, CA", status: "Active" },
  { id: "P2", name: "Project Beacon DFW1", code: "DFW1", customer: "Customer B", location: "Fort Worth, TX", status: "Active" },
  { id: "P3", name: "Project Cedar ATL1", code: "ATL1", customer: "Customer C", location: "Atlanta, GA", status: "Planning" },
  { id: "P4", name: "Project Delta EWR1", code: "EWR1", customer: "Customer D", location: "Newark, NJ", status: "Planning" },
];

const seedBars: Bar[] = [
  { id:"B1", project:"P1", dept:"PSE", label:"PSE forecast", kind:"forecast", start:1, end:9, fte:1 },
  { id:"B2", project:"P1", dept:"PSE", label:"Employee 001", person:"Employee 001", kind:"allocation", start:1, end:7, fte:1 },
  { id:"B3", project:"P1", dept:"FE", label:"FE forecast", kind:"forecast", start:5, end:12, fte:2 },
  { id:"B4", project:"P1", dept:"FE", label:"Employee 003", person:"Employee 003", kind:"allocation", start:5, end:10, fte:1 },
  { id:"B5", project:"P1", dept:"FE", label:"Employee 004", person:"Employee 004", kind:"allocation", start:7, end:12, fte:1 },
  { id:"B6", project:"P1", dept:"SS", label:"Site Supervisor forecast", kind:"forecast", start:7, end:13, fte:1 },
  { id:"B7", project:"P1", dept:"SS", label:"Employee 008", person:"Employee 008", kind:"allocation", start:8, end:13, fte:1 },

  { id:"B8", project:"P2", dept:"PSE", label:"PSE forecast", kind:"forecast", start:0, end:12, fte:1 },
  { id:"B9", project:"P2", dept:"PSE", label:"Employee 002", person:"Employee 002", kind:"allocation", start:0, end:12, fte:1 },
  { id:"B10", project:"P2", dept:"FE", label:"FE forecast", kind:"forecast", start:4, end:11, fte:1.5 },
  { id:"B11", project:"P2", dept:"PM", label:"PM forecast", kind:"forecast", start:0, end:15, fte:.5 },

  { id:"B12", project:"P3", dept:"PSE", label:"PSE forecast", kind:"forecast", start:8, end:17, fte:1 },
  { id:"B13", project:"P3", dept:"FE", label:"FE forecast", kind:"forecast", start:9, end:17, fte:2 },
  { id:"B14", project:"P3", dept:"SW", label:"SW forecast", kind:"forecast", start:5, end:12, fte:.75 },

  { id:"B15", project:"P4", dept:"PSE", label:"PSE forecast", kind:"forecast", start:10, end:17, fte:1 },
  { id:"B16", project:"P4", dept:"FE", label:"FE forecast", kind:"forecast", start:13, end:17, fte:2 },
];

const seedMilestones: Milestone[] = [
  { id:"M1", project:"P1", label:"SRS release", type:"internal", week:2 },
  { id:"M2", project:"P1", label:"SW ready", type:"internal", week:6 },
  { id:"M3", project:"P1", label:"SAT", type:"internal", week:13 },
  { id:"M4", project:"P1", label:"Site ready", type:"external", week:4 },
  { id:"M5", project:"P1", label:"WMS ready", type:"external", week:9 },
  { id:"M6", project:"P1", label:"Go live", type:"external", week:15 },

  { id:"M7", project:"P2", label:"Design freeze", type:"internal", week:1 },
  { id:"M8", project:"P2", label:"Site ready", type:"external", week:5 },
  { id:"M9", project:"P2", label:"Go live", type:"external", week:14 },

  { id:"M10", project:"P3", label:"Design freeze", type:"internal", week:5 },
  { id:"M11", project:"P3", label:"Site ready", type:"external", week:9 },
  { id:"M12", project:"P3", label:"Go live", type:"external", week:17 },

  { id:"M13", project:"P4", label:"Design freeze", type:"internal", week:8 },
  { id:"M14", project:"P4", label:"Site ready", type:"external", week:12 },
  { id:"M15", project:"P4", label:"Go live", type:"external", week:17 },
];

function clamp(n:number,min:number,max:number){ return Math.max(min,Math.min(max,n)); }
function percent(n:number){ return `${Math.round(n*100)}%`; }

export default function Page(){
  const [view,setView] = useState<View>("planner");
  const [projectId,setProjectId] = useState("P1");
  const [bars,setBars] = useState<Bar[]>(seedBars);
  const [milestones,setMilestones] = useState<Milestone[]>(seedMilestones);
  const [drag,setDrag] = useState<DragState>(null);
  const [addDept,setAddDept] = useState<DeptId>("PSE");
  const [milestoneType,setMilestoneType] = useState<"internal"|"external">("internal");
  const timelineRef = useRef<HTMLDivElement>(null);

  const project = projects.find(p=>p.id===projectId)!;
  const projectBars = bars.filter(b=>b.project===projectId);
  const projectMilestones = milestones.filter(m=>m.project===projectId);

  const months = useMemo(()=>[
    {label:"September",start:0,span:3},{label:"October",start:3,span:4},{label:"November",start:7,span:5},{label:"December",start:12,span:4},{label:"January",start:16,span:2}
  ],[]);

  useEffect(()=>{
    if(!drag) return;
    const onMove = (e:PointerEvent)=>{
      const width = timelineRef.current?.getBoundingClientRect().width || 900;
      const delta = Math.round((e.clientX-drag.startX)/(width/weeks.length));
      if(drag.target==="bar"){
        setBars(current=>current.map(bar=>{
          if(bar.id!==drag.id) return bar;
          if(drag.mode==="move"){
            const duration=drag.end-drag.start;
            const start=clamp(drag.start+delta,0,weeks.length-1-duration);
            return {...bar,start,end:start+duration};
          }
          if(drag.mode==="left") return {...bar,start:clamp(drag.start+delta,0,bar.end)};
          return {...bar,end:clamp(drag.end+delta,bar.start,weeks.length-1)};
        }));
      }else{
        setMilestones(current=>current.map(m=>m.id===drag.id?{...m,week:clamp(drag.start+delta,0,weeks.length-1)}:m));
      }
    };
    const onUp=()=>setDrag(null);
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
    return()=>{window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp)};
  },[drag]);

  const beginBarDrag=(e:ReactPointerEvent,id:string,mode:"move"|"left"|"right")=>{
    e.preventDefault(); e.stopPropagation();
    const bar=bars.find(b=>b.id===id); if(!bar) return;
    setDrag({target:"bar",id,mode,startX:e.clientX,start:bar.start,end:bar.end});
  };
  const beginMilestoneDrag=(e:ReactPointerEvent,id:string)=>{
    e.preventDefault();
    const m=milestones.find(x=>x.id===id); if(!m) return;
    setDrag({target:"milestone",id,mode:"move",startX:e.clientX,start:m.week,end:m.week});
  };

  const addResource=()=>{
    const id=`B${Date.now()}`;
    setBars(current=>[...current,{id,project:projectId,dept:addDept,label:`${addDept} forecast`,kind:"forecast",start:3,end:7,fte:1}]);
  };
  const addMilestone=()=>{
    const label=milestoneType==="internal"?"New internal milestone":"New external milestone";
    setMilestones(current=>[...current,{id:`M${Date.now()}`,project:projectId,label,type:milestoneType,week:7}]);
  };

  const forecastByDeptWeek = useMemo(()=>departments.map(dept=>({
    dept,
    values:weeks.map((_,w)=>bars.filter(b=>b.kind==="forecast"&&b.dept===dept.id&&b.start<=w&&b.end>=w).reduce((s,b)=>s+b.fte,0))
  })),[bars]);

  const portfolio = useMemo(()=>{
    const allWeeks=weeks.map((_,w)=>{
      const demand=bars.filter(b=>b.kind==="forecast"&&b.start<=w&&b.end>=w).reduce((s,b)=>s+b.fte,0);
      const allocated=bars.filter(b=>b.kind==="allocation"&&b.start<=w&&b.end>=w).reduce((s,b)=>s+b.fte,0);
      return {demand,allocated};
    });
    const avgDemand=allWeeks.reduce((s,w)=>s+w.demand,0)/weeks.length;
    const avgAllocated=allWeeks.reduce((s,w)=>s+w.allocated,0)/weeks.length;
    const rawCapacity=departments.reduce((s,d)=>s+d.capacity,0);
    const hires=forecastByDeptWeek.reduce((sum,row)=>{
      const peak=Math.max(...row.values);
      const gap=Math.max(0,peak-row.dept.capacity*row.dept.target);
      return sum+(gap>=.5?Math.ceil(gap):0);
    },0);
    return {allWeeks,avgDemand,avgAllocated,rawCapacity,hires};
  },[bars,forecastByDeptWeek]);

  const nav:{id:View;label:string}[]=[{id:"overview",label:"Overview"},{id:"planner",label:"Project planner"},{id:"projects",label:"Projects"},{id:"capacity",label:"Capacity"}];

  return <div className="app-shell">
    <aside className="side-nav">
      <div className="brand"><span className="brand-dot">N</span><div><strong>Nolazco Labs</strong><small>Resource Forecasting</small></div></div>
      <nav>{nav.map(n=><button key={n.id} className={view===n.id?"nav-item active":"nav-item"} onClick={()=>setView(n.id)}>{n.label}</button>)}</nav>
      <div className="side-note"><span className="live-dot"/><div><strong>Prototype workspace</strong><small>Changes are local to this browser session</small></div></div>
    </aside>

    <main className="main-area">
      <header className="top-bar">
        <div className="mobile-title"><span className="brand-dot small">N</span><strong>Resources</strong></div>
        <div className="top-actions"><span className="quiet-pill">18-week window</span><span className="quiet-pill teal">Interactive prototype</span></div>
      </header>

      <div className="page-wrap">
        {view==="overview"&&<Overview portfolio={portfolio} forecastByDeptWeek={forecastByDeptWeek} setView={setView}/>} 
        {view==="projects"&&<Projects projectId={projectId} onPlan={(id)=>{setProjectId(id);setView("planner")}}/>}
        {view==="capacity"&&<Capacity forecastByDeptWeek={forecastByDeptWeek}/>} 
        {view==="planner"&&<>
          <div className="planner-heading">
            <div><span className="eyebrow">Project planning exercise</span><h1>{project.name}</h1><p>{project.customer} · {project.location}. Drag bars to move them; grab either edge to change duration. Drag milestones to test schedule changes.</p></div>
            <div className="project-switch"><label>Project<select value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
          </div>

          <div className="planner-toolbar card">
            <div className="tool-group"><span>Add forecast</span><select value={addDept} onChange={e=>setAddDept(e.target.value as DeptId)}>{departments.map(d=><option key={d.id} value={d.id}>{d.id} · {d.name}</option>)}</select><button className="primary" onClick={addResource}>+ Resource bar</button></div>
            <div className="tool-group"><span>Add milestone</span><select value={milestoneType} onChange={e=>setMilestoneType(e.target.value as "internal"|"external")}><option value="internal">Internal</option><option value="external">External</option></select><button className="secondary" onClick={addMilestone}>+ Milestone</button></div>
            <div className="legend-inline"><span><i className="legend-swatch forecast"/>Forecast</span><span><i className="legend-swatch allocation"/>Named allocation</span><span><i className="diamond internal"/>Internal</span><span><i className="diamond external"/>External</span></div>
          </div>

          <div className="timeline-card card">
            <div className="timeline-scroll">
              <div className="timeline-layout">
                <div className="timeline-label header-label">Plan</div>
                <div className="timeline-head" ref={timelineRef}>
                  <div className="month-row">{months.map(m=><div key={m.label} className="month" style={{gridColumn:`${m.start+1} / span ${m.span}`}}>{m.label}</div>)}</div>
                  <div className="week-row">{weeks.map(w=><div key={w}>{w.split(" ")[1]}</div>)}</div>
                </div>

                <div className="timeline-label milestone-label"><strong>Milestones</strong><small>Internal / external</small></div>
                <div className="milestone-track timeline-track">
                  <GridLines/>
                  {projectMilestones.map(m=><button key={m.id} className={`milestone ${m.type}`} style={{left:`${(m.week+.5)/weeks.length*100}%`}} onPointerDown={e=>beginMilestoneDrag(e,m.id)} title="Drag milestone"><span className="milestone-diamond"/><b>{m.label}</b><small>{weeks[m.week]}</small></button>)}
                </div>

                {departments.map(dept=>{
                  const deptBars=projectBars.filter(b=>b.dept===dept.id);
                  if(!deptBars.length) return null;
                  return <div className="resource-section" key={dept.id}>
                    <div className="timeline-label dept-label"><span className="dept-chip">{dept.id}</span><div><strong>{dept.name}</strong><small>{deptBars.filter(b=>b.kind==="forecast").reduce((s,b)=>s+b.fte,0).toFixed(1)} FTE planned</small></div></div>
                    <div className="resource-stack">{deptBars.map(bar=><TimelineBar key={bar.id} bar={bar} beginDrag={beginBarDrag}/>)}</div>
                  </div>;
                })}
              </div>
            </div>
          </div>

          <div className="planner-tip card"><div><span className="eyebrow">Try this</span><strong>Move “Site ready” two weeks later.</strong><p>Then extend the FE forecast bar. In the Capacity view, the portfolio pressure recalculates immediately. This is the interaction model we can later persist directly to Excel.</p></div><button className="secondary" onClick={()=>setView("capacity")}>See capacity impact</button></div>
        </>}
      </div>

      <nav className="bottom-nav">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}>{n.label}</button>)}</nav>
    </main>
  </div>;
}

function GridLines(){ return <div className="grid-lines">{weeks.map((_,i)=><i key={i}/>)}</div>; }

function TimelineBar({bar,beginDrag}:{bar:Bar;beginDrag:(e:ReactPointerEvent,id:string,mode:"move"|"left"|"right")=>void}){
  const left=bar.start/weeks.length*100;
  const width=(bar.end-bar.start+1)/weeks.length*100;
  return <div className="bar-row timeline-track"><GridLines/><div className={`resource-bar ${bar.kind}`} style={{left:`${left}%`,width:`${width}%`}} onPointerDown={e=>beginDrag(e,bar.id,"move")}>
    <button className="resize-handle left" aria-label="Resize start" onPointerDown={e=>beginDrag(e,bar.id,"left")}/>
    <div className="bar-copy"><strong>{bar.label}</strong><small>{bar.fte} FTE · {weeks[bar.start]} → {weeks[bar.end]}</small></div>
    <button className="resize-handle right" aria-label="Resize end" onPointerDown={e=>beginDrag(e,bar.id,"right")}/>
  </div></div>;
}

function Overview({portfolio,forecastByDeptWeek,setView}:{portfolio:{avgDemand:number;avgAllocated:number;rawCapacity:number;hires:number;allWeeks:{demand:number;allocated:number}[]};forecastByDeptWeek:{dept:Department;values:number[]}[];setView:(v:View)=>void}){
  return <><PageTitle eyebrow="Portfolio" title="Resource outlook" text="A calm summary of demand, named staffing and where the current plan starts to exceed sustainable capacity."/>
  <section className="kpi-grid"><Kpi label="Average forecast" value={`${portfolio.avgDemand.toFixed(1)} FTE`} note="Across the 18-week window"/><Kpi label="Named allocation" value={`${portfolio.avgAllocated.toFixed(1)} FTE`} note={`${percent(portfolio.avgAllocated/Math.max(.1,portfolio.avgDemand))} of forecast named`}/><Kpi label="Raw capacity" value={`${portfolio.rawCapacity} FTE`} note="Before sustainable-utilization target"/><Kpi label="Hiring signal" value={portfolio.hires?`+${portfolio.hires}`:"Covered"} note={portfolio.hires?"Peak capacity gaps":"No material gap"} accent={portfolio.hires>0}/></section>
  <section className="overview-grid"><article className="card demand-chart"><div className="card-head"><div><span className="eyebrow">18 weeks</span><h2>Demand vs named allocation</h2></div><button className="text-btn" onClick={()=>setView("planner")}>Open planner</button></div><div className="mini-bars">{portfolio.allWeeks.map((w,i)=><div className="mini-col" key={i}><div><i className="demand" style={{height:`${Math.min(100,w.demand/12*100)}%`}}/><i className="allocated" style={{height:`${Math.min(100,w.allocated/12*100)}%`}}/></div><small>{weeks[i].split(" ")[1]}</small></div>)}</div></article>
  <article className="card pressure-list"><div className="card-head"><div><span className="eyebrow">Departments</span><h2>Peak pressure</h2></div></div>{forecastByDeptWeek.map(row=>{const peak=Math.max(...row.values);const sustainable=row.dept.capacity*row.dept.target;const load=peak/sustainable;return <div className="pressure-row" key={row.dept.id}><span className="dept-chip">{row.dept.id}</span><div><strong>{row.dept.name}</strong><small>{peak.toFixed(1)} FTE peak · {sustainable.toFixed(1)} sustainable</small></div><span className={`pressure-pill ${load>1?"red":load>.9?"amber":"green"}`}>{percent(load)}</span></div>})}</article></section></>;
}

function Projects({projectId,onPlan}:{projectId:string;onPlan:(id:string)=>void}){
  return <><PageTitle eyebrow="Portfolio" title="Projects" text="Enter a project planning exercise from here. Milestones and resource bars stay attached to the project."/><div className="project-grid">{projects.map(p=><article className={`project-card card ${p.id===projectId?"selected":""}`} key={p.id}><div className="project-card-top"><span className="code-badge">{p.code}</span><span className={`status ${p.status==="Active"?"green":"gray"}`}>{p.status}</span></div><h2>{p.name}</h2><p>{p.customer} · {p.location}</p><div className="project-card-foot"><span>{seedMilestones.filter(m=>m.project===p.id).length} milestones</span><button className="secondary" onClick={()=>onPlan(p.id)}>Plan project</button></div></article>)}</div></>;
}

function Capacity({forecastByDeptWeek}:{forecastByDeptWeek:{dept:Department;values:number[]}[]}){
  return <><PageTitle eyebrow="Portfolio impact" title="Capacity & hiring" text="Every drag or resize in the project planner changes this view immediately."/><div className="capacity-list">{forecastByDeptWeek.map(row=>{const sustainable=row.dept.capacity*row.dept.target;const peak=Math.max(...row.values);const gap=Math.max(0,peak-sustainable);const hires=gap>=.5?Math.ceil(gap):0;const scale=Math.max(peak,row.dept.capacity,1);return <article className="capacity-card card" key={row.dept.id}><div className="capacity-head"><span className="dept-chip">{row.dept.id}</span><div><h2>{row.dept.name}</h2><p>{row.dept.capacity} FTE raw · {sustainable.toFixed(1)} FTE sustainable</p></div>{hires?<span className="hire-pill">+{hires} hire{hires>1?"s":""}</span>:<span className="status green">Covered</span>}</div><div className="capacity-week-bars">{row.values.map((v,i)=><div className="capacity-week" key={i}><div className="cap-track"><i className="sustainable" style={{height:`${sustainable/scale*100}%`}}/><i className={v>sustainable?"forecast over":"forecast"} style={{height:`${v/scale*100}%`}}/></div><small>{weeks[i].split(" ")[1]}</small></div>)}</div></article>})}</div></>;
}

function PageTitle({eyebrow,title,text}:{eyebrow:string;title:string;text:string}){return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>}
function Kpi({label,value,note,accent=false}:{label:string;value:string;note:string;accent?:boolean}){return <article className={`card kpi ${accent?"accent":""}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}
