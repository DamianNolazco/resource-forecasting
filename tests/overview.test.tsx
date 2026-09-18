import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../app/page';
import {initialPlan,STORAGE_KEY,validPlan} from '../lib/planning';
import {stackIntervals,projectLanes} from '../lib/overview';
import * as photos from '../app/ResourceAvatar';
afterEach(()=>vi.restoreAllMocks());
it('shows project swim lanes with multiple department filters while retaining milestones',async()=>{
 const u=userEvent.setup();render(<Page/>);await screen.findByRole('heading',{name:'Resource timeline'});
 await u.click(screen.getByRole('button',{name:'Project overview',exact:true}));
 expect(screen.getByRole('region',{name:'Project Atlas LAX1 swim lane'})).toBeTruthy();
 await u.click(screen.getByRole('button',{name:'Clear',exact:true}));expect(screen.getByText('Select at least one department to see allocations.')).toBeTruthy();
 await u.click(screen.getByRole('checkbox',{name:/PSE Project System/}));await u.click(screen.getByRole('checkbox',{name:/FE Field/}));
 const lane=screen.getByRole('region',{name:'Project Atlas LAX1 swim lane'});
 expect(within(lane).getByRole('button',{name:'Edit resource Employee 001'})).toBeTruthy();
 expect(lane.querySelector('[data-department="PSE"]')).toBeTruthy();expect(lane.querySelector('[data-department="FE"]')).toBeTruthy();expect(lane.querySelector('[data-department="HW"]')).toBeNull();
 expect(within(lane).getAllByRole('button',{name:/milestone/}).length).toBeGreaterThan(0);
 const allocation=within(lane).getAllByRole('button',{name:/Project Atlas LAX1, Employee/})[0];await u.click(allocation);expect(screen.getByRole('dialog')).toBeTruthy();await u.keyboard('{Escape}');
 await u.selectOptions(screen.getByLabelText('Overview horizon'),'2027');
 await u.click(screen.getByRole('button',{name:'Collapse Project Atlas LAX1'}));expect(within(lane).queryByText('Employee 001')).toBeNull();
});
it('keeps overlapping assignments visible within one person lane and includes unassigned demand',()=>{
 const person=initialPlan.people[0];const bars=[{id:'a',project:'P1',dept:person.dept,personId:person.id,start:0,end:4,allocation:1},{id:'b',project:'P1',dept:person.dept,personId:person.id,start:4,end:6,allocation:.5},{id:'c',project:'P1',dept:person.dept,start:7,end:9,allocation:1}];
 const lanes=projectLanes(bars,[person]);expect(lanes).toHaveLength(2);expect(lanes[0].bars).toHaveLength(2);expect(lanes[1].person).toBeUndefined();expect(stackIntervals(bars).map(b=>b.track)).toEqual([0,1,0]);
});
it('updates resource pictures, persists them across reloads, and resets to a generic avatar',async()=>{
 const photo='data:image/jpeg;base64,/9j/AAAA';vi.spyOn(photos,'preparePhoto').mockResolvedValue(photo);
 const u=userEvent.setup();const page=render(<Page/>);await screen.findByRole('heading',{name:'Resource timeline'});await u.click(screen.getByRole('button',{name:'Resources',exact:true}));await u.click(screen.getByRole('button',{name:'Edit resource Employee 001'}));
 await u.upload(screen.getByLabelText('Resource picture'),new File(['image'],'test.jpg',{type:'image/jpeg'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Save resource'}).hasAttribute('disabled')).toBe(false));await u.click(screen.getByRole('button',{name:'Save resource'}));
 await waitFor(()=>expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).people[0].photo).toBe(photo));page.unmount();render(<Page/>);await screen.findByRole('heading',{name:'Resource timeline'});await u.click(screen.getByRole('button',{name:'Project overview',exact:true}));expect(screen.getAllByAltText('Employee 001 profile').length).toBeGreaterThan(0);
 await u.click(screen.getAllByRole('button',{name:'Edit resource Employee 001'})[0]);await u.click(screen.getByRole('button',{name:'Use generic avatar'}));await u.click(screen.getByRole('button',{name:'Save resource'}));await waitFor(()=>expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).people[0].photo).toBeUndefined());
});
it('imports old plans and safe inline pictures but rejects remote and oversized photo payloads',()=>{
 expect(validPlan(initialPlan)).toBe(true);const plan=structuredClone(initialPlan);plan.people[0].photo='data:image/jpeg;base64,/9j/AAAA';expect(validPlan(plan)).toBe(true);plan.people[0].photo='https://example.com/tracker.jpg';expect(validPlan(plan)).toBe(false);plan.people[0].photo='data:image/jpeg;base64,'+'a'.repeat(80000);expect(validPlan(plan)).toBe(false);
});
