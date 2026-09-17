# Artistic planet study — 17 September 2026

## Research and design decisions

- [Three.js volume-cloud example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_volume_cloud.html): bounded ray traversal, density thresholding, front-to-back opacity accumulation and early termination provide a practical browser volume-rendering baseline. The existing local Three.js version is retained; no third-party textures or new remote scripts are loaded.
- [Vertex Shader Domain Warping with Automatic Differentiation](https://arxiv.org/abs/2405.07124): domain warping is a useful procedural modeling technique. Here, warped noise is used artistically in the density/color field, not as an implementation of the paper's automatic-differentiation method.
- [Bruneton, Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/): a reference for atmospheric density profiles and the appearance of planetary haze. The page uses an inexpensive artistic shell and directional shading, not Bruneton's physical scattering model or lookup tables.

## Implemented composition

The final user reference replaces the detached atmosphere with a dense, granular gas-giant body: turquoise upper bands, copper/gold lower bands, and warped pearl strata. A 4D field changes slowly with a gentle ten-second modulation. `dist/planet-volume.js` raymarches the body's density in 56 narrow-screen or 72 desktop steps with early opacity termination. Finite-difference relief shading gives the dense skin a pebbled appearance. This is an artistic approximation, not a physically accurate scattering or atmosphere model.

Each of twelve projects has a unique radius and inclined orbital plane in `dist/project-orbits.js`. A small solid sphere with a seeded procedural texture follows each path. Its label follows the same coordinates with a fixed vertical offset, with no avoidance or screen-edge clamping. Absolute camera depth determines label stacking. Saturn-inspired thin ring meshes use antialiased radial strata and subdued group colour variations. Sparse dust and four comet trails are soft three-dimensional particles, not volumetric gas simulations. Analytic body intersections occlude the moons, dust and rings behind the dense planet.

The earlier Three.js volume and domain-warp references inform this implementation. Bruneton remains background research only; no atmospheric shell or scattering lookup tables are included. All resources are locally hosted. The visual references are guidance only; no reference artwork is embedded in the website.

## ASimulation interaction

`dist/project-links.js` owns the ordered X / Website / YouTube destinations and the disclosure state. The trigger is a button, not a navigation link. Hover/focus reveals the menu; click/tap pins it; Escape, outside activation and focus departure dismiss it. Orbit motion and satellite motion pause during choosing, preserving the user's explicit pause/reduced-motion state. The same links are available in the static directory without WebGL.

Destination https://asimulation.io/ was still awaiting GitHub's certificate at the initial check. The canonical HTTPS address is retained; HTTP and certificate-warning bypasses are not used. Destination availability is checked again before publication and reported separately from the menu's correctness.
