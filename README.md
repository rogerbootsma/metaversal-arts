# Metaversal Arts

Static landing page for GitHub Pages. Original Three.js volumetric sculpture, responsive layout, reduced-motion support, and legal/privacy/credits pages. No analytics, cookies, remote fonts, remote scripts, or backend. The contact panel prepares an email locally for contact@metaversalarts.io; visitors review the on-page draft, then choose Gmail, an email app, or copy it into their preferred service. Nothing is sent automatically. It also offers an explicit copy-to-clipboard fallback.

## Local preview

Run `node preview.mjs` and visit `http://127.0.0.1:4173`.

Run `node validate.mjs` to check page links, assets, JavaScript syntax and security-policy presence. Run `node --test test-project-links.mjs` for the ASimulation disclosure regression checks. The Projects scene has also been inspected in the browser at desktop and narrow widths, including shader compilation, console errors, keyboard order, pause and menu bounds.

## Editing

- `dist/index.html`: landing-page copy and structure.
- `dist/style.css`: page appearance and responsive rules.
- `dist/scene.js`: original raymarched volume, curve geometry and motion.
- `dist/planet-volume.js`: the Projects planet's dense body, mineral formations, ribbons and 4D cloud shell.
- `dist/project-links.js`: ordered ASimulation destinations and hover/focus/tap disclosure.
- `PLANET-RESEARCH.md`: source-linked research and artistic implementation choices.
- `make-pages.mjs`: legal/privacy/credits copy; run it to regenerate these pages after editing.
- `dist/vendor/`: locally served Three.js 0.180.0 and MIT licence.

Public positioning comes from the owner's Metaversalarts strategy. Planning targets, private business documents, credentials and unconfirmed launch claims are excluded.

## Publication status

The approved site is deployed from `rogerbootsma/metaversal-arts` using the manual Pages workflow. `node validate.mjs --publish` rejects known draft markers; it is not a legal-compliance validator.

GitHub Pages is free for public repositories on GitHub Free. The domain renewal remains separate. Select GitHub Actions as the Pages source, then run the included manual Publish GitHub Pages workflow. It publishes only `dist/` and uses scoped Pages/OIDC permissions. No deployment token is stored in source.

## Domain and HTTPS

Custom domain: `metaversalarts.io`.

## Project constellation

The Projects navigation opens `dist/projects.html`. Edit the names and provisional type assignments in `projects.mjs`, then run `node make-pages.mjs` to regenerate the directory and shared navigation. `dist/projects-scene.js` reads these names and types, assigning each type to a different inclined circular plane around the locally rendered Three.js volume. Names and ring geometry share the same orbit function. Styling is in `dist/projects.css`. Names are presented as a directory without assuming that every project has a public website.

The mist breathes over a ten-second cycle. Its density uses four-dimensional value noise (x, y, z, time), interpolating 16 lattice corners with quintic smoothing; three octaves and a domain warp let the internal shapes evolve continuously. Motion respects reduced-motion preferences, can be paused, and stops offscreen or when the tab is hidden. A static directory remains available without JavaScript or WebGL.

Category buttons preview an orbit on hover/focus and toggle a persistent selection on click/tap. The selection also highlights the corresponding directory entries. Labels ease apart with fine leader lines while their anchors stay on the orbital paths. Labels and rings use an analytic cloud-transmission approximation for depth fading; the cloud itself remains raymarched 4D noise, with tone-mapped ivory lighting and gold shadows. No preferences or visitor data are stored.

1. Verify domain ownership in the GitHub account's Pages settings using GitHub's unique TXT record. Keep this verification record.
2. Set the custom domain in the repository's Pages settings before pointing public DNS at it.
3. In the active DNS provider (Namecheap Advanced DNS if Namecheap hosts the nameservers), use four A records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Point `www` via CNAME to `rogerbootsma.github.io`.
4. Inspect existing records first. Preserve email MX/TXT records. Avoid wildcard records. Update only conflicting web-host records after confirming their purpose.
5. Wait for GitHub's certificate, enable Enforce HTTPS and verify the live apex/www redirects, certificate, asset loading and published pages. DNS/certificate propagation may take up to 24 hours.

## Security boundaries

Every page has a restrictive meta Content Security Policy, referrer policy, disabled objects and server form submissions, and same-origin assets. External new-tab links use `noopener noreferrer`. There are no site-owned accounts, stored data or secrets. Reduced motion is respected; rendering stops when hidden/offscreen and includes a pause control.

GitHub Pages manages TLS and server headers. Meta CSP cannot enforce `frame-ancestors`, and cannot supply arbitrary HTTP response headers such as Permissions-Policy. Do not claim the page has these controls or is fully security-audited. The final HTTPS and DNS settings require live verification after publishing. Keep GitHub/Namecheap account two-factor authentication enabled.

## References

- [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages)
- [Custom-domain configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub privacy](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [WKO legal notice guidance for sole proprietors](https://www.wko.at/oe/internetrecht/das-korrekte-website-impressum-nicht-fb-eingetr-eu.pdf)

Site content and original artwork: copyright Roger Bootsma / Metaversal Arts. Three.js retains its separate MIT licence.



