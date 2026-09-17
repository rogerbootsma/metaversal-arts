// Ordered destinations shared by the animated menu and accessible directory.
export const asimulationLinks = [
  {label:'X',url:'https://x.com/asimulation_io',icon:'x'},
  {label:'Website',url:'https://asimulation.io/',icon:'globe'},
  {label:'YouTube',url:'https://www.youtube.com/channel/UCunF_Jnya4XHpbIR7E-VYog',icon:'video'},
];
const icons={
 x:'<path d="M5 4h4l10 16h-4zM19 4L5 20"/>',
 globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
 video:'<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
};
export function iconMarkup(icon){return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[icon]}</svg>`;}
export function createProjectHub(el,onChoosing){
 el.classList.add('project-hub');el.removeAttribute('aria-hidden');
 const trigger=document.createElement('button');trigger.type='button';trigger.className='project-hub-trigger';
 trigger.textContent='asimulation.io';trigger.setAttribute('aria-label','ASimulation — show website and social links');
 trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','asimulation-destinations');
 const satellites=document.createElement('span');satellites.className='project-satellites';satellites.setAttribute('aria-hidden','true');
 satellites.innerHTML=asimulationLinks.map(({icon})=>`<span class="project-satellite">${iconMarkup(icon)}</span>`).join('');
 const menu=document.createElement('nav');menu.id='asimulation-destinations';menu.className='project-destinations';menu.setAttribute('aria-label','ASimulation destinations');menu.hidden=true;
 menu.innerHTML=asimulationLinks.map(({label,url,icon})=>`<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="ASimulation ${label} (opens in a new tab)">${iconMarkup(icon)}<span>${label}</span></a>`).join('');
 el.replaceChildren(trigger,satellites,menu);
 let open=false,pinned=false,over=false,closeTimer=0,ignoreFocus=false;
 function setOpen(value){clearTimeout(closeTimer);if(open===value)return;open=value;trigger.setAttribute('aria-expanded',String(open));menu.hidden=!open;el.classList.toggle('is-choosing',open);onChoosing(open);}
 function dismiss(restoreFocus=false){pinned=false;over=false;setOpen(false);if(restoreFocus){ignoreFocus=true;trigger.focus({preventScroll:true});ignoreFocus=false;}}
 el.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){over=true;setOpen(true);}});
 el.addEventListener('pointerleave',()=>{over=false;closeTimer=setTimeout(()=>{if(!pinned&&!el.contains(document.activeElement))setOpen(false);},200);});
 el.addEventListener('focusin',()=>{if(!ignoreFocus)setOpen(true);});
 el.addEventListener('focusout',()=>queueMicrotask(()=>{if(!el.contains(document.activeElement)){pinned=false;if(!over)setOpen(false);}}));
 trigger.addEventListener('click',()=>{if(pinned)dismiss();else{pinned=true;setOpen(true);}});
 el.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss(true);}});
 document.addEventListener('pointerdown',event=>{if(!el.contains(event.target))dismiss();});
 return {trigger,menu,get open(){return open;},dismiss};
}
