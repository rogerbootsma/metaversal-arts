import {readFile,writeFile} from 'node:fs/promises';
import {projects,projectTypes} from './projects.mjs';
const home=await readFile(new URL('./dist/index.html',import.meta.url),'utf8');
const header=home.match(/<header>[\s\S]*?<\/header>/)[0].replaceAll('href="#"','href="./index.html"').replaceAll('href="#explorations"','href="./index.html#explorations"').replaceAll('href="#studio"','href="./index.html#studio"').replaceAll('href="#contact"','href="./index.html#contact"');
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0].replace('href="#"','href="./index.html"');
const pages={
 'legal.html':{title:'Legal notice / Impressum',body:`<h2>Website operator & media owner</h2><p>Metaversalarts e.U.<br>Inhaber: Roger Bootsma<br>Rechtsform: Einzelunternehmer<br>Sitz: Wien<br>Rosentalgasse 12/6/7<br>1140 Wien, Austria</p><h2>Company registration</h2><p>Firmenbuchnummer: FN 687427 y<br>Firmenbuchgericht: Handelsgericht Wien<br>Geschäftszweig: Multimedia, Kunst</p>
 <h2>Contact</h2><p>Email: <a href="mailto:contact@metaversalarts.io">contact@metaversalarts.io</a><br>Telephone: <a href="tel:+4367762017380">+43 677 62017380</a></p>
 <h2>Business information</h2><p>Multimedia-Agentur<br>Member of Wirtschaftskammer Wien, Fachgruppe Werbung und Marktkommunikation.<br>Trade authority: Magistratisches Bezirksamt des XIV. Bezirkes, Wien.<br>Applicable professional rules: Austrian Gewerbeordnung, available through <a href="https://www.ris.bka.gv.at/" target="_blank" rel="noopener noreferrer">RIS</a>.</p><p>Further registered activities and chamber memberships are listed in the <a href="https://firmen.wko.at/roger-bootsma/wien/?firmaid=012c817c-1553-414a-9334-572a3134fdbb" target="_blank" rel="noopener noreferrer">WKO business directory</a>.</p>
 <h2>Purpose of this website</h2><p>Presentation of Metaversalarts’ 3D artwork, animation, immersive experiences and creative software. Future concepts and explorations are not statements of product availability.</p>
 <h2>Copyright</h2><p>Original website text and artwork © 2026 Roger Bootsma / Metaversal Arts. Third-party software is credited separately. Product licences are supplied through the relevant product listing.</p>
 `},
 'privacy.html':{title:'Privacy',body:`<p>Last updated: 15 September 2026.</p>
 <h2>A small digital footprint</h2><p>This page does not use analytics, advertising pixels, cookies, local storage, embedded videos or server-submitted contact forms. The interactive sculpture runs in your browser. Site assets, including Three.js, are served from the same website.</p>
 <h2>Website hosting</h2><p>This website is hosted on GitHub Pages, operated by GitHub, Inc., USA. When you access the hosted website, GitHub receives technical request data, including your IP address and browser/request information, to deliver the page and maintain its security. The operator’s basis for necessary delivery and security processing is legitimate interests under Article 6(1)(f) GDPR. No separate visitor log or analytics database is maintained by Metaversalarts.</p><p>GitHub determines the retention of its hosting data and may process it outside the EEA. Its retention criteria, transfer safeguards and data-protection contacts are described in the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub General Privacy Statement</a>.</p>
 <h2>External links</h2><p>External websites are contacted when you follow their links.</p>
 <h2>Contact enquiries</h2><p>If you contact the studio by email or telephone, the information you provide is used to respond to your enquiry. Contract-related enquiries are handled under Article 6(1)(b) GDPR; other correspondence is handled under Article 6(1)(f), based on the legitimate interest in responding. Correspondence is retained while needed to resolve the enquiry and meet applicable legal retention obligations. The enquiry panel prepares an email locally in your browser. Its fields are not submitted to this website or saved in browser storage. “Prepare email” displays your draft on this page. “Open Gmail” passes the recipient, subject and message to Google in a new tab; “Open email app” passes them to your configured email application. These actions do not send the email; you review and send it in the chosen service. The copy buttons copy the details to your clipboard only when selected. Selecting an email link opens your own email application.</p>
 <h2>Controller and your rights</h2><p>The controller is Roger Bootsma, Metaversalarts. Contact details and the business address are provided in the <a href="./legal.html">legal notice</a>. Where applicable, you can request access, correction, erasure, restriction or portability of your data and object to processing based on legitimate interests. You may lodge a complaint with the <a href="https://www.dsb.gv.at/" target="_blank" rel="noopener noreferrer">Austrian Data Protection Authority</a>.</p>`},
 'credits.html':{title:'Credits',body:`<h2>Inner Orbit</h2><p>An original interactive study of light, volume and curved geometry, created for the Metaversal Arts landing page. The scene is generated in real time; no stock imagery is used.</p>
 <h2>Worlds in orbit</h2><p>A procedural cloud with a gentle breathing rhythm, surrounded by the Metaversal Arts project constellation.</p>
 <h2>Three.js</h2><p>The interactive artwork uses Three.js 0.180.0, distributed under the MIT licence. <a href="./vendor/THREE-LICENSE.txt">Read the full Three.js licence</a>.</p>
 <h2>Typography & assets</h2><p>The page uses system fonts and locally hosted assets. No external font service is loaded.</p>`},
 '404.html':{title:'A little beyond the map.',body:`<p>This page could not be found.</p><p><a href="./index.html">Return to Metaversal Arts</a></p>`}
};
for(const [file,page] of Object.entries(pages)){
 const head=home.slice(home.indexOf('<head>'),home.indexOf('</head>')+7).replace(/<title>.*?<\/title>/,`<title>${page.title} — Metaversal Arts</title>`).replace(/  <script[^\n]+\n/g,'').replace(/<meta name="description"[^>]+>/,`<meta name="description" content="${page.title} — Metaversal Arts.">`);
 await writeFile(new URL('./dist/'+file,import.meta.url),`<!doctype html>\n<html lang="en">${head}<body><a class="skip" href="#main">Skip to content</a>${header}<main id="main" class="legal-page"><p class="eyebrow">METAVERSAL ARTS</p><h1>${page.title}</h1>${page.body}</main>${footer}</body></html>\n`);
}

const projectHead=home.slice(home.indexOf('<head>'),home.indexOf('</head>')+7)
 .replace(/<title>.*?<\/title>/,'<title>Projects — Metaversal Arts</title>')
 .replace(/  <script[^\n]+\n/g,'')
 .replace(/<meta name="description"[^>]+>/,'<meta name="description" content="The Metaversal Arts project constellation. Art, tools and other worlds in orbit.">')
 .replace('</head>','<link rel="stylesheet" href="./projects.css?v=orbit-planes-3">\n<script type="module" src="./projects-scene.js?v=orbit-planes-3"></script>\n</head>');
const projectHeader=header.replace('href="./projects.html"','href="./projects.html" aria-current="page"');
const items=projects.map(({name,type},i)=>`<li><span class="project-number">${String(i+1).padStart(2,'0')}</span><span class="project-entry"><span data-project-name data-project-type="${type}">${name}</span><small>${projectTypes[type]}</small></span><img src="./star-nine.svg" width="18" height="18" alt=""></li>`).join('\n');
await writeFile(new URL('./dist/projects.html',import.meta.url),`<!doctype html>
<html lang="en">${projectHead}<body class="projects-page"><a class="skip" href="#main">Skip to content</a>${projectHeader}
<main id="main">
 <section class="constellation" aria-labelledby="projects-title">
  <div class="constellation-heading"><p class="eyebrow">THE METAVERSAL ARTS CONSTELLATION</p><h1 id="projects-title">Worlds in <em>orbit.</em></h1></div>
  <div class="cloud-stage" id="cloud-stage" role="img" aria-label="Ivory and gold project names orbit a softly glowing cloud of mist."><canvas id="project-cloud" aria-hidden="true"></canvas><div id="orbit-labels" aria-hidden="true"></div></div>
  <div class="constellation-bottom"><span class="eyebrow">${String(projects.length).padStart(2,'0')} PROJECTS · ONE EXPANDING UNIVERSE</span><a class="text-link" href="#project-directory">Explore the constellation <span aria-hidden="true">↓</span></a><button class="motion" id="project-motion" type="button" aria-pressed="false" hidden>Pause motion</button></div>
  <p id="cloud-fallback" hidden>The animated cloud is unavailable on this device. All projects are listed below.</p>
 </section>
 <section class="project-directory section" id="project-directory" aria-labelledby="directory-title"><div><p class="eyebrow">THE PROJECTS</p><h2 id="directory-title">A universe of<br><em>possibilities.</em></h2></div><ol>${items}</ol></section>
</main>${footer}</body></html>\n`);

