from pathlib import Path

page = Path('app/page.tsx')
text = page.read_text()

if 'collapsedDepts' not in text:
    text = text.replace(
        '  const [resourceYear,setResourceYear] = useState(2026);',
        '  const [resourceYear,setResourceYear] = useState(2026);\n  const [collapsedDepts,setCollapsedDepts] = useState<Set<DeptId>>(new Set());',
        1,
    )

if 'const toggleDept=' not in text:
    anchor = '  const allocationFor=(personId:string,monthIndex:number)=>bars.filter(b=>b.personId===personId&&b.start<=monthIndex&&b.end>=monthIndex).reduce((s,b)=>s+b.allocation,0);'
    replacement = anchor + '''\n\n  const toggleDept=(dept:DeptId)=>setCollapsedDepts(current=>{\n    const next=new Set(current);\n    if(next.has(dept)) next.delete(dept); else next.add(dept);\n    return next;\n  });'''
    if anchor not in text:
        raise SystemExit('allocationFor anchor not found')
    text = text.replace(anchor, replacement, 1)

add_anchor = '    setBars(current=>[...current,newBar]);\n    setSelectedBarId(id);'
if 'next.delete(addDept)' not in text:
    if add_anchor not in text:
        raise SystemExit('addResource anchor not found')
    text = text.replace(
        add_anchor,
        '    setBars(current=>[...current,newBar]);\n    setCollapsedDepts(current=>{const next=new Set(current);next.delete(addDept);return next;});\n    setSelectedBarId(id);',
        1,
    )

start_token = '                {projectBars.length===0&&<><div className="lane-label"><strong>No resources</strong><small>Add the first bar above</small></div><div className="empty-timeline">No resource forecast yet.</div></>}'
end_token = '\n              </div>\n            </div>\n          </section>'
start = text.find(start_token)
if start < 0:
    raise SystemExit('planner resource block start not found')
end = text.find(end_token, start)
if end < 0:
    raise SystemExit('planner resource block end not found')

grouped = r'''                {projectBars.length===0&&<><div className="lane-label"><strong>No resources</strong><small>Add the first bar above</small></div><div className="empty-timeline">No resource forecast yet.</div></>}
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
                })}'''

text = text[:start] + grouped + text[end:]
page.write_text(text)

css = Path('app/globals.css')
styles = css.read_text()
marker = '/* department-swimlanes-v1 */'
if marker not in styles:
    styles += r'''

/* department-swimlanes-v1 */
.department-group{display:contents}.department-header{min-height:54px;background:#f6faf9;border-top:1px solid #e0e9e6;border-bottom:1px solid #e5ebe8;display:flex;align-items:center;gap:9px;padding-top:9px;padding-bottom:9px}.collapse-btn{width:26px;height:26px;border:1px solid #d8e3df;background:#fff;border-radius:9px;color:#4e5a56;font-size:18px;line-height:1;padding:0;display:grid;place-items:center;flex:none}.collapse-btn:hover{border-color:#9fcfcb;background:#f1f9f8}.department-header-lane{min-height:54px;position:relative;background:#f6faf9;border-top:1px solid #e0e9e6;border-bottom:1px solid #e5ebe8;overflow:hidden}.department-expanded-note{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;gap:7px;padding-right:14px;color:#7e8984}.department-expanded-note span{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.department-expanded-note small{font-size:8px}.grouped-resource-label{background:#fcfdfc;padding-left:30px;border-left:3px solid rgba(40,175,185,.18)}.group-indent{width:16px;height:1px;background:#cbd8d4;flex:none}.grouped-resource-lane{background:#fcfdfc}.aggregate-summary{position:absolute;inset:7px 0;border:0;background:transparent;display:grid;grid-template-columns:repeat(24,1fr);padding:0;z-index:3;overflow:hidden;border-radius:9px}.aggregate-cell{height:100%;display:grid;place-items:center;border-right:1px solid rgba(255,255,255,.35);font-size:7px;color:#fff;background:transparent;transition:opacity .15s ease}.aggregate-cell.active{background:#28afb9}.aggregate-cell b{font-size:7px;font-weight:800}.department-header-lane.collapsed{cursor:pointer}.department-header-lane.collapsed:hover .aggregate-cell.active{filter:brightness(.96)}
'''
    css.write_text(styles)
