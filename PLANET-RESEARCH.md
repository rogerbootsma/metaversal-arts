# Artistic planet study — 17 September 2026

## Research and design decisions

- [Three.js volume-cloud example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_volume_cloud.html): bounded ray traversal, density thresholding, front-to-back opacity accumulation and early termination provide a practical browser volume-rendering baseline. The existing local Three.js version is retained; no third-party textures or new remote scripts are loaded.
- [Vertex Shader Domain Warping with Automatic Differentiation](https://arxiv.org/abs/2405.07124): domain warping is a useful procedural modeling technique. Here, warped noise is used artistically in the density/color field, not as an implementation of the paper's automatic-differentiation method.
- [Bruneton, Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/): a reference for atmospheric density profiles and the appearance of planetary haze. The page uses an inexpensive artistic shell and directional shading, not Bruneton's physical scattering model or lookup tables.

## Approved composition

The planet has plum/copper strata, white volumetric cloud strips, a thick blue atmosphere and a soft halo. Twelve flat but shallow ring volumes share the planet's front-to-back density integration, so front arcs cover the disc and back arcs are absorbed by the core. Each ring has layered density, a cubic Bezier feather on both edges and subtly different pearl, champagne or copper colouring. Outer rings are lighter and their opacity varies gently.

A separate cirrus field between radii 1.78 and 2.25 uses tilted latitude coordinates, differential rotation and warped four-dimensional noise. Its clock runs at 24 percent of scene time, independently of the faster underlying planet rotation. Evolving billows and fine strands reveal density and internal detail. White highlights and blue-grey interiors retain the coloured surface beneath. A broad blue Gaussian rim and a smooth atmosphere envelope ending at radius 2.42 provide the halo falloff.

The adaptive integration ceiling is 640 steps at initial desktop widths and 400 at narrow widths. Finer steps resolve the atmosphere and shallow rings; larger steps cross empty space. This is an artistic density/lighting approximation rather than a physical scattering solver. The ceiling and pixel-ratio caps are quality budgets, not measured performance claims.

## Orbits and debris

The twelve project paths have different radii and world-space planes using explicit ZXY rotation order. Radius spans 2.28 to 5.81, with slower outer orbital speeds and perspective size changes. The second dense belt has radius 3.08, inclination 68 degrees and position angle 8 degrees; its moon and debris follow that same path. The broad visible outer rim has radius 5.45, with reference framing retained from 6.35 to preserve the approved planet scale.

Names follow their moons with fixed offsets and depth ordering, without avoidance motion. Desktop camera zoom is 1.8x relative to the fitted overview; narrow screens ease toward 1.15x. The scene may overlap the heading or crop outer paths, while every project remains accessible in the directory. Four comet trails and 6,720 dust motes use soft particles; 156 small rocks use instanced solid geometry. Dust and rocks rotate within their fixed planes. Motion stops while paused, offscreen, tab-hidden or choosing a menu destination, and respects reduced-motion preferences.

## Destination menus

ASimulation offers X / Website / YouTube. BlenderMonk offers Facebook / Superhive / YouTube, with Superhive central. Both share a component with unique accessible names and IDs. Hover/focus reveals a menu; click/tap pins it; Escape and outside activation dismiss it. Only one menu is open at a time, and all orbital animation freezes while choosing. The same links are available in the static directory without WebGL. External links use HTTPS, open in a new tab, and include noopener/noreferrer.

## Validation and publication

The user approved publication on 17 September 2026 after preview review. Existing checks cover page assets, JavaScript syntax, CSP, disclosure behavior, exact destination URLs, independent plane normals and crossings of the planet silhouette. Desktop and narrow browser inspection additionally check shader compilation, rendering, menu bounds, pause and overflow.

The Three.js volume and domain-warp references inform the implementation. Bruneton remains background research; no physical scattering lookup tables are included. All runtime resources are locally hosted and no reference artwork is embedded.
