# Artistic planet study — 17 September 2026

## Research and design decisions

- [Three.js volume-cloud example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_volume_cloud.html): bounded ray traversal, density thresholding, front-to-back opacity accumulation and early termination provide a practical browser volume-rendering baseline. The existing local Three.js version is retained; no third-party textures or new remote scripts are loaded.
- [Vertex Shader Domain Warping with Automatic Differentiation](https://arxiv.org/abs/2405.07124): domain warping is a useful procedural modeling technique. Here, warped noise is used artistically in the density/color field, not as an implementation of the paper's automatic-differentiation method.
- [Bruneton, Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/): a reference for atmospheric density profiles and the appearance of planetary haze. The page uses an inexpensive artistic shell and directional shading, not Bruneton's physical scattering model or lookup tables.

## Implemented composition

A larger planetary volume with blue depths, amber mineral/continent fields, layered cloud density, luminous ribbon fields and a subtle ten-second atmosphere pulse. The body turns slowly while the four-dimensional cloud field evolves independently. The three project-type orbits remain intact. Camera framing favors a larger planet; label anchors stay on the rings while edge annotations use leader lines.

`dist/planet-volume.js` owns the original procedural shader. It uses 56 ray steps on initial narrow viewports and 72 on wider viewports, with early opacity termination. These are quality budgets, not performance claims. The surface/body and cloud shell are generated in the same raymarch. All resources are locally hosted.

## ASimulation interaction

`dist/project-links.js` owns the ordered X / Website / YouTube destinations and the disclosure state. The trigger is a button, not a navigation link. Hover/focus reveals the menu; click/tap pins it; Escape, outside activation and focus departure dismiss it. Orbit motion and satellite motion pause during choosing, preserving the user's explicit pause/reduced-motion state. The same links are available in the static directory without WebGL.

Destination https://asimulation.io/ was still awaiting GitHub's certificate at the initial check. The canonical HTTPS address is retained; HTTP and certificate-warning bypasses are not used. Destination availability is checked again before publication and reported separately from the menu's correctness.
