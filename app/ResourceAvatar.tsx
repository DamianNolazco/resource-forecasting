"use client";
import {useEffect, useState} from 'react';
import {type Person} from '../lib/planning';
export function ResourceAvatar({person}: {person:Person}) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[person.photo]);
 return <span className={`resource-avatar avatar-${person.dept}`}>
  {person.photo&&!failed ? <img src={person.photo} alt={`${person.name} profile`} onError={()=>setFailed(true)}/> : <svg role="img" aria-label={`${person.name} generic avatar`} viewBox="0 0 48 48"><circle cx="24" cy="18" r="9" fill="currentColor" opacity=".85"/><path d="M7 46v-7a17 17 0 0 1 34 0v7" fill="currentColor" opacity=".65"/></svg>}
 </span>;
}
export async function preparePhoto(file:File):Promise<string> {
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw Error('Choose a JPG, PNG or WebP image.');
 if(file.size>8*1024*1024) throw Error('Choose an image smaller than 8 MB.');
 const url=URL.createObjectURL(file);
 try {
  const image=new Image();image.src=url;await image.decode();
  if(!image.naturalWidth||!image.naturalHeight)throw Error('This image could not be opened.');
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
  const context=canvas.getContext('2d');if(!context)throw Error('Photo editing is unavailable in this browser.');
  const side=Math.min(image.naturalWidth,image.naturalHeight);
  context.fillStyle='#ffffff';context.fillRect(0,0,192,192);
  context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,192,192);
  return canvas.toDataURL('image/jpeg',.8);
 } finally {URL.revokeObjectURL(url)}
}
