import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectHub,asimulationLinks,blendermonkLinks,projectHubs} from './dist/project-links.js';
class Element extends EventTarget {
 constructor(){super();this.children=[];this.attrs={};this.parent=null;const classes=new Set();this.classList={add:c=>classes.add(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)};}
 setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
 replaceChildren(...nodes){this.children=nodes;nodes.forEach(n=>n.parent=this);}
 contains(node){return node===this||this.children.some(child=>child.contains(node));}
 focus(){document.activeElement=this;this.parent?.dispatchEvent(new Event('focusin'));}
}
function setup(config){globalThis.document=new Element();document.createElement=()=>new Element();document.activeElement=null;const el=new Element(),changes=[];const hub=createProjectHub(el,value=>changes.push(value),config);return {el,hub,changes};}
function send(target,type,props={}){const e=new Event(type,{cancelable:true});for(const [k,v] of Object.entries(props))Object.defineProperty(e,k,{value:v});target.dispatchEvent(e);}
test('touch requires activation, never hover or implicit navigation',()=>{
 const {el,hub,changes}=setup();send(el,'pointerenter',{pointerType:'touch'});assert.equal(hub.open,false);
 hub.trigger.focus();send(hub.trigger,'click');assert.equal(hub.open,true);assert.equal(hub.trigger.attrs['aria-expanded'],'true');
 send(hub.trigger,'click');assert.equal(hub.open,false);assert.deepEqual(changes,[true,false]);
 assert.equal(hub.trigger.href,undefined);assert.equal(hub.trigger.type,'button');
});
test('hover travel to menu stays open, then closes when leaving',async()=>{
 const {el,hub}=setup();send(el,'pointerenter',{pointerType:'mouse'});assert.equal(hub.open,true);
 send(el,'pointerleave');send(el,'pointerenter',{pointerType:'mouse'});await new Promise(r=>setTimeout(r,220));assert.equal(hub.open,true);
 send(el,'pointerleave');await new Promise(r=>setTimeout(r,220));assert.equal(hub.open,false);
});
test('keyboard Escape restores focus without reopening; outside click dismisses',()=>{
 const {el,hub}=setup();hub.trigger.focus();assert.equal(hub.open,true);send(el,'keydown',{key:'Escape'});assert.equal(hub.open,false);assert.equal(document.activeElement,hub.trigger);
 send(hub.trigger,'click');assert.equal(hub.open,true);send(document,'pointerdown',{target:new Element()});assert.equal(hub.open,false);
});
test('destinations are canonical, HTTPS, ordered and safe new-tab links',()=>{
 const {hub}=setup();assert.deepEqual(asimulationLinks.map(x=>x.url),['https://x.com/asimulation_io','https://asimulation.io/','https://www.youtube.com/channel/UCunF_Jnya4XHpbIR7E-VYog']);
 assert.equal((hub.menu.innerHTML.match(/rel="noopener noreferrer"/g)||[]).length,3);
 assert.ok(hub.menu.innerHTML.indexOf('>X<')<hub.menu.innerHTML.indexOf('>Website<'));
 assert.ok(hub.menu.innerHTML.indexOf('>Website<')<hub.menu.innerHTML.indexOf('>YouTube<'));
});

test('BlenderMonk has its own accessible destinations and icons',()=>{
 const {hub}=setup(projectHubs.BlenderMonk);
 assert.deepEqual(blendermonkLinks.map(link=>link.url),[
  'https://www.facebook.com/Blendermonk',
  'https://superhivemarket.com/creators/blendermonk',
  'https://www.youtube.com/@Blendermonk',
 ]);
 assert.equal(hub.trigger.textContent,'BlenderMonk');
 assert.equal(hub.trigger.attrs['aria-controls'],'blendermonk-destinations');
 assert.equal(hub.menu.id,'blendermonk-destinations');
 assert.equal((hub.menu.innerHTML.match(/rel="noopener noreferrer"/g)||[]).length,3);
 assert.equal((hub.menu.innerHTML.match(/<svg/g)||[]).length,3);
 assert(!hub.menu.innerHTML.includes('undefined'));
 assert(!hub.menu.innerHTML.includes('asimulation.io'));
});
test('multiple hubs do not share disclosure state or aria controls',()=>{
 const {hub:first}=setup();
 const second=createProjectHub(new Element(),()=>{},projectHubs.BlenderMonk);
 assert.notEqual(first.menu.id,second.menu.id);
 send(second.trigger,'click');assert.equal(second.open,true);assert.equal(first.open,false);
 second.dismiss();assert.equal(second.open,false);
});
