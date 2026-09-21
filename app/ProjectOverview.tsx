"use client";
import {useState,type CSSProperties} from 'react';
import {departments,timelineMonths,monthLabel,pct,fte,peak,allocated,type Plan,type PlanBar,type Person,type Milestone,type DeptId} from '../lib/planning';
import {projectLanes,stackIntervals} from '../lib/overview';
import {ResourceAvatar} from './ResourceAvatar';
import {Icon} from './ui';
export function ProjectOverview({plan,onPerson,onAllocation,onMilestone,onProject}:{plan:Plan;onPerson:(p:Person)=>void;onAllocation:(b:PlanBar)=>void;onMilestone:(m:Milestone)=>void;onProject:(id:string)=>void}){
 const [selected,setSelected]=useState<DeptId[]>(departments.map(d=>d.id));
 const [query,setQuery]=useState(''),[period,setPeriod]=useState('both'),[collapsed,setCollapsed]=useState<string[]>([]);
 const start=period==='2027'?12:0,end=period==='2026'?11:23,count=end-start+1;
 const months=timelineMonths.slice(start,end+1);
 const projects=plan.projects.filter(p=>`${p.name} ${p.code} ${p.customer} ${p.location}`.toLowerCase().includes(query.toLowerCase()));
 const projectIds=new Set(projects.map(p=>p.id));
 const filtered=plan.bars.filter(b=>projectIds.has(b.project)&&selected.includes(b.dept)&&b.start<=end&&b.end>=start);
 const visiblePeak=(bars:PlanBar[])=>peak(bars.map(b=>({...b,start:Math.max(start,b.start),end:Math.min(end,b.end)})));
 const now=new Date(),current=(now.getFullYear()-2026)*12+now.getMonth();
 const position=(month:number)=>(month-start)/count*100;
 const gridStyle={'--months':count} as CSSProperties;
 return <section className="panel overview-panel" aria-label="Project allocation overview">
  <style>{`@media print { @page { size: letter portrait; margin: 10mm; } }`}</style>
  <div className="overview-print-header"><h1>Project allocation overview</h1><p>{period==='both'?'2026–2027':period} · Departments: {selected.join(', ')}{query?` · Search: ${query}`:''}</p></div>
  <div className="panel-toolbar"><label className="search"><Icon name="search"/><input aria-label="Search overview projects" placeholder="Search projects or customers" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="toolbar-right"><button className="button overview-export" disabled={!selected.length||!projects.length} onClick={()=>window.print()} title="Export all matching projects, including collapsed lanes. Choose Save as PDF in the print dialog.">Export PDF</button><label className="overview-period">Horizon <select aria-label="Overview horizon" value={period} onChange={e=>setPeriod(e.target.value)}><option value="both">2026–2027</option><option value="2026">2026</option><option value="2027">2027</option></select></label><span>{fte(visiblePeak(filtered))} FTE peak · {new Set(filtered.flatMap(b=>b.personId?[b.personId]:[])).size} people</span></div></div>
  <fieldset className="overview-filters"><legend>Departments · select one or more</legend><div className="overview-filter-options"><button className="text-button" onClick={()=>setSelected(departments.map(d=>d.id))}>Select all</button><button className="text-button" onClick={()=>setSelected([])}>Clear</button>{departments.map(d=><label key={d.id} className={`department-chip avatar-${d.id}`}><input type="checkbox" aria-label={`${d.id} ${d.name}`} checked={selected.includes(d.id)} onChange={()=>setSelected(old=>old.includes(d.id)?old.filter(id=>id!==d.id):[...old,d.id])}/><b>{d.id}</b><span>{d.name}</span></label>)}</div></fieldset>
  <div className="overview-key"><span>Department colors show assignments · Dashed bars are unassigned · Red dots flag overallocation.</span><span>◆ Internal milestone · ◇ External milestone</span></div>
  {!selected.length?<div className="empty-state">Select at least one department to see allocations.</div>:<div className="overview-scroll" tabIndex={0} aria-label="Scrollable project swim lanes">
   <div className="overview-grid" style={gridStyle}>
    <div className="overview-axis"><div className="overview-label">PROJECT / RESOURCE</div><div className="overview-months">{months.map(m=><div key={m.index} className={m.index===current?'is-current':''}><b>{m.label}</b><small>{m.year}</small></div>)}</div></div>
    {projects.map(project=>{
     const bars=filtered.filter(b=>b.project===project.id),lanes=projectLanes(bars,plan.people),folded=collapsed.includes(project.id);
     const milestones=plan.milestones.filter(m=>m.project===project.id&&m.month>=start&&m.month<=end);
     // Reserve three month columns for readable milestone labels, including at the right edge.
     const markers=stackIntervals(milestones.map(m=>({...m,start:Math.max(start,Math.min(m.month,end-2)),end:Math.min(end,Math.max(start,Math.min(m.month,end-2))+2)})));
     const markerHeight=Math.max(52,(Math.max(-1,...markers.map(m=>m.track))+1)*31+12);
     return <section className="overview-project" key={project.id} aria-label={`${project.name} swim lane`}>
      <div className="overview-axis overview-print-axis"><div className="overview-label">PROJECT / RESOURCE</div><div className="overview-months">{months.map(m=><div key={m.index}><b>{m.label}</b><small>{m.year}</small></div>)}</div></div>
      <div className="overview-project-heading"><div className="overview-label"><button className="overview-collapse" aria-expanded={!folded} aria-label={`${folded?'Expand':'Collapse'} ${project.name}`} onClick={()=>setCollapsed(v=>v.includes(project.id)?v.filter(id=>id!==project.id):[...v,project.id])}>{folded?'+':'−'}</button><div><button className="overview-project-link" onClick={()=>onProject(project.id)}>{project.name}</button><small>{project.code} · {project.customer}</small></div></div><div className="overview-project-summary"><span>{lanes.filter(l=>l.person).length} people · {fte(visiblePeak(bars))} FTE peak</span><span>{fte(visiblePeak(bars.filter(b=>!b.personId)))} FTE unassigned</span></div></div>
      <div hidden={folded} className={`overview-project-body${folded?' is-collapsed':''}`}>
       <div className="overview-row"><div className="overview-label milestone-label">Project milestones <small>{milestones.length} in this horizon</small></div><div className="overview-track" style={{height:markerHeight}}>{markers.map(m=><button key={m.id} className={`overview-milestone ${m.type}`} style={{left:`${position(m.start)}%`,width:`${3/count*100}%`,top:6+m.track*31}} title={`${m.label} · ${monthLabel(m.month)} · ${m.type}`} aria-label={`Edit ${project.name} milestone ${m.label}`} onClick={()=>onMilestone(plan.milestones.find(v=>v.id===m.id)!)}><span>{m.type==='internal'?'◆':'◇'}</span> {m.label} <small>{monthLabel(m.month)}</small></button>)}{markers.map(m=><span key={`line-${m.id}`} className="overview-milestone-tick" style={{left:`${position(m.month+.5)}%`}} title={`${m.label}: ${monthLabel(m.month)}`}/>)}{!markers.length&&<span className="overview-no-milestones">No milestones in this horizon</span>}</div></div>
       {lanes.map(lane=>{
        const stacked=stackIntervals(lane.bars),height=Math.max(62,(Math.max(...stacked.map(b=>b.track))+1)*35+18);
        return <div className="overview-row" key={lane.key} data-department={lane.dept}>
         <div className="overview-label">{lane.person?<button className="overview-person" aria-label={`Edit resource ${lane.person.name}`} onClick={()=>onPerson(lane.person!)}><ResourceAvatar person={lane.person}/><span><strong>{lane.person.name}</strong><small>{lane.dept} · {lane.person.title||'Resource'}</small></span></button>:<div className="overview-person"><span className={`resource-avatar avatar-${lane.dept}`}><Icon name="people"/></span><span><strong>Unassigned</strong><small>{lane.dept} · Open demand</small></span></div>}</div>
         <div className="overview-track" style={{height}}>{current>=start&&current<=end&&<span className="overview-today" style={{left:`${position(current+.5)}%`}}/>}{stacked.map(b=>{const conflict=!!b.personId&&months.some(m=>m.index>=b.start&&m.index<=b.end&&allocated(plan.bars,b.personId!,m.index)>1);return <button key={b.id} className={`overview-bar avatar-${b.dept} ${!b.personId?'unassigned':''} ${conflict?'conflict':''}`} style={{left:`${position(Math.max(start,b.start))}%`,width:`${(Math.min(end,b.end)-Math.max(start,b.start)+1)/count*100}%`,top:9+b.track*35}} onClick={()=>onAllocation(b)} aria-label={`${project.name}, ${lane.person?.name||b.label||'Unassigned'}, ${b.dept}, ${pct(b.allocation)}, ${monthLabel(b.start)} to ${monthLabel(b.end)}${conflict?', overallocated across projects':''}`} title={`${lane.person?.name||b.label||'Unassigned'} · ${b.dept} · ${pct(b.allocation)}\n${monthLabel(b.start)} – ${monthLabel(b.end)}${conflict?'\nAbove 100% across all projects':''}`}><b>{lane.person?.name||b.label||'Unassigned'}</b><span className="overview-allocation-value">{pct(b.allocation)}</span>{conflict&&<span className="overview-conflict-dot" aria-hidden="true">●</span>}</button>})}</div>
        </div>;
       })}
       {!lanes.length&&<div className="overview-project-empty">No allocations for the selected departments and horizon.</div>}
      </div>
     </section>;
    })}
    {!projects.length&&<div className="empty-state">No projects match your search.</div>}
   </div>
  </div>}
  <div className="panel-footer"><span>{projects.length} projects · {selected.length} departments selected</span><span>Click a person, allocation or milestone to edit. Dates include both end months.</span></div>
 </section>;
}
