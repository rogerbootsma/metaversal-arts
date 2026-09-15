import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'dist');
const files=await readdir(root);let checked=0;
for(const file of files){
 if(file.endsWith('.js'))execFileSync(process.execPath,['--check',resolve(root,file)]);
 if(!file.endsWith('.html'))continue;
 const html=await readFile(resolve(root,file),'utf8');
 if(!html.includes('Content-Security-Policy'))throw new Error('Missing CSP: '+file);
 if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html))throw new Error('Unexpected inline script: '+file);
 for(const match of html.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)){
   const url=match[1];if(/^(https:|data:|mailto:|tel:)/.test(url))continue;
   const target=resolve(dirname(resolve(root,file)),url.split("?")[0]);
   await stat(target);checked++;
 }
 if(process.argv.includes('--publish')&&/awaiting confirmation|publication details pending|contact information is pending/i.test(html))throw new Error('Complete confirmed legal details before publishing: '+file);
}
await stat(resolve(root,'vendor/three.module.min.js'));await stat(resolve(root,'vendor/three.core.min.js'));
console.log(`Validated ${files.filter(f=>f.endsWith('.html')).length} HTML pages, JavaScript syntax, CSP, and ${checked} local asset/link references.`);
