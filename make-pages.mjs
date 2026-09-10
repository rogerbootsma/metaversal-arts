import {readFile,writeFile} from 'node:fs/promises';
const home=await readFile(new URL('./dist/index.html',import.meta.url),'utf8');
const header=home.match(/<header>[\s\S]*?<\/header>/)[0].replaceAll('href="#"','href="./index.html"').replaceAll('href="#explorations"','href="./index.html#explorations"').replaceAll('href="#studio"','href="./index.html#studio"');
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0].replace('href="#"','href="./index.html"');
const pages={
 'legal.html':{title:'Legal notice / Impressum',body:`<p class="draft-note"><strong>Draft — publication details pending.</strong> The business address, public contact details and applicable registration information must be supplied before this notice is complete.</p>
 <h2>Website operator & media owner</h2><p>Roger Bootsma<br>Metaversalarts<br>Vienna, Austria</p>
 <h2>Business information</h2><p>Business address: awaiting confirmation.<br>Public contact email: awaiting confirmation.<br>Registered business activities, competent trade authority, chamber membership and applicable professional rules: awaiting confirmation.<br>Company register details and VAT identification number: to be added if applicable.</p>
 <h2>Purpose of this website</h2><p>Presentation of Metaversalarts’ 3D artwork, animation, immersive experiences and creative software. Future concepts and explorations are not statements of product availability.</p>
 <h2>Copyright</h2><p>Original website text and artwork © 2026 Roger Bootsma / Metaversal Arts. Third-party software is credited separately. Product licences are supplied through the relevant product listing.</p>
 <h2>External websites</h2><p>Links to external stores open websites operated by their respective providers. Their own terms and privacy information apply.</p>`},
 'privacy.html':{title:'Privacy',body:`<p class="draft-note">Draft for the intended GitHub Pages hosting setup. Operator contact information is pending; this page does not yet constitute a complete privacy notice.</p>
 <h2>A small digital footprint</h2><p>This page does not use analytics, advertising pixels, cookies, local storage, embedded videos or contact forms. The interactive sculpture runs in your browser. Site assets, including Three.js, are served from the same website.</p>
 <h2>Website hosting</h2><p>The intended host is GitHub Pages. When you access a hosted page, GitHub receives technical request data, including your IP address, to deliver the website and maintain its security. GitHub may process data internationally. Details of its processing, retention and safeguards are described in the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub General Privacy Statement</a>.</p>
 <h2>External links</h2><p>External websites are contacted when you follow their links. The store is not embedded and receives no page request merely because you view this landing page.</p>
 <h2>Contact and your rights</h2><p>The website operator is Roger Bootsma, Metaversalarts, Vienna, Austria. A public privacy contact and full address must be confirmed before launch, together with the applicable legal basis, retention information and complaint authority. Where applicable, data-protection rights include access, correction, erasure, restriction, objection and data portability.</p>`},
 'credits.html':{title:'Credits',body:`<h2>Inner Orbit</h2><p>An original interactive study of light, volume and curved geometry, created for the Metaversal Arts landing page. The scene is generated in real time; no stock imagery is used.</p>
 <h2>Three.js</h2><p>The sculpture uses Three.js 0.180.0, distributed under the MIT licence. <a href="./vendor/THREE-LICENSE.txt">Read the full Three.js licence</a>.</p>
 <h2>Typography & assets</h2><p>The page uses system fonts and locally hosted assets. No external font service is loaded.</p>`},
 '404.html':{title:'A little beyond the map.',body:`<p>This page could not be found.</p><p><a href="./index.html">Return to Metaversal Arts</a></p>`}
};
for(const [file,page] of Object.entries(pages)){
 const head=home.slice(home.indexOf('<head>'),home.indexOf('</head>')+7).replace(/<title>.*?<\/title>/,`<title>${page.title} — Metaversal Arts</title>`).replace(/  <script[^\n]+\n/g,'').replace(/<meta name="description"[^>]+>/,`<meta name="description" content="${page.title} — Metaversal Arts.">`);
 await writeFile(new URL('./dist/'+file,import.meta.url),`<!doctype html>\n<html lang="en">${head}<body><a class="skip" href="#main">Skip to content</a>${header}<main id="main" class="legal-page"><p class="eyebrow">METAVERSAL ARTS</p><h1>${page.title}</h1>${page.body}</main>${footer}</body></html>\n`);
}
