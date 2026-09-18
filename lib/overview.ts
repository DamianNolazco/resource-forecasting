import {type PlanBar,type Person,type DeptId,departments} from './planning';
// Separate overlapping intervals within a single person's lane; endpoints are inclusive.
export function stackIntervals<T extends {start:number;end:number}>(items:T[]) {
 const ends:number[]=[];
 return [...items].sort((a,b)=>a.start-b.start||a.end-b.end).map(item=>{
  let track=ends.findIndex(end=>end<item.start);
  if(track<0)track=ends.length;
  ends[track]=item.end;return {...item,track};
 });
}
export function projectLanes(bars:PlanBar[],people:Person[]) {
 const lanes: {key:string;dept:DeptId;person?:Person;bars:PlanBar[]}[]=[];
 for(const department of departments){
  const matching=bars.filter(b=>b.dept===department.id);
  const ids=[...new Set(matching.map(b=>b.personId))];
  for(const id of ids){const person=people.find(p=>p.id===id);
   lanes.push({key:`${department.id}-${id||'unassigned'}`,dept:department.id,person,bars:matching.filter(b=>b.personId===id)});
  }
 }
 return lanes;
}
