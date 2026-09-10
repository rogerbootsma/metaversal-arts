# Metaversal Arts

Static landing page for GitHub Pages. Original Three.js volumetric sculpture, responsive layout, reduced-motion support, and legal/privacy/credits pages. No analytics, cookies, remote fonts, remote scripts, forms, or backend.

## Local preview

Run `node preview.mjs` and visit `http://127.0.0.1:4173`.

Run `node validate.mjs` to check page links, assets, JavaScript syntax and security-policy presence. Browser rendering and GPU shader compilation have not yet been tested.

## Editing

- `dist/index.html`: landing-page copy and structure.
- `dist/style.css`: page appearance and responsive rules.
- `dist/scene.js`: original raymarched volume, curve geometry and motion.
- `make-pages.mjs`: legal/privacy/credits copy; run it to regenerate these pages after editing.
- `dist/vendor/`: locally served Three.js 0.180.0 and MIT licence.

Public positioning comes from the owner's Metaversalarts strategy. Planning targets, private business documents, credentials and unconfirmed launch claims are excluded.

## Publication status

The approved site is deployed from `rogerbootsma/metaversal-arts` using the manual Pages workflow. `node validate.mjs --publish` rejects known draft markers; it is not a legal-compliance validator.

GitHub Pages is free for public repositories on GitHub Free. The domain renewal remains separate. Select GitHub Actions as the Pages source, then run the included manual Publish GitHub Pages workflow. It publishes only `dist/` and uses scoped Pages/OIDC permissions. No deployment token is stored in source.

## Domain and HTTPS

Custom domain: `metaversalarts.io`.

1. Verify domain ownership in the GitHub account's Pages settings using GitHub's unique TXT record. Keep this verification record.
2. Set the custom domain in the repository's Pages settings before pointing public DNS at it.
3. In the active DNS provider (Namecheap Advanced DNS if Namecheap hosts the nameservers), use four A records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Point `www` via CNAME to `rogerbootsma.github.io`.
4. Inspect existing records first. Preserve email MX/TXT records. Avoid wildcard records. Update only conflicting web-host records after confirming their purpose.
5. Wait for GitHub's certificate, enable Enforce HTTPS and verify the live apex/www redirects, certificate, asset loading and published pages. DNS/certificate propagation may take up to 24 hours.

## Security boundaries

Every page has a restrictive meta Content Security Policy, referrer policy, disabled objects/forms, and same-origin assets. External new-tab links use `noopener noreferrer`. There are no site-owned accounts, stored data or secrets. Reduced motion is respected; rendering stops when hidden/offscreen and includes a pause control.

GitHub Pages manages TLS and server headers. Meta CSP cannot enforce `frame-ancestors`, and cannot supply arbitrary HTTP response headers such as Permissions-Policy. Do not claim the page has these controls or is fully security-audited. The final HTTPS and DNS settings require live verification after publishing. Keep GitHub/Namecheap account two-factor authentication enabled.

## References

- [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages)
- [Custom-domain configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [GitHub privacy](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [WKO legal notice guidance for sole proprietors](https://www.wko.at/oe/internetrecht/das-korrekte-website-impressum-nicht-fb-eingetr-eu.pdf)

Site content and original artwork: copyright Roger Bootsma / Metaversal Arts. Three.js retains its separate MIT licence.

