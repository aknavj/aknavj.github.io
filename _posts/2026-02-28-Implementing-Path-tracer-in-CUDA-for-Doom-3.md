---
layout: article
title: "Implementing a CUDA Path Tracer Inside Doom 3"
tags: cuda path-tracing doom3 idtech4 rendering dhewm3
categories: graphics
---

> I've been staring at *Doom 3*'s renderer since I was a teenager. Twenty years later, I finally replaced it.

---

## Why *Doom 3*?

I first played *Doom 3* on an AMD Duron 700 MHz with 768 MB of RAM and a Radeon 9250 — hardware I still have in the closet. It wasn't smooth. Didn't matter. The per-pixel lighting, the dynamic shadows, the way a single flashlight beam could make a hallway feel like a place — that was enough to rewire what I wanted to do with my life.

Instead of excelling in school, I was crying through the night trying to get OpenGL, GLSL, and rendering right for my very early primitive game engines — cobbled together from whatever source I could find. NeHe tutorials, gamedev.net forums, GPL'd idTech projects and SDKs. I read through *Mathematics for Game Developers*, *Game Engine Architecture*, *Game Programming Gems*, *Core Techniques and Algorithms in Game Programming* — anything that might explain why my renderer and game engine architecture wasn't quite there.

Around 2008, I was on my third attempt at a game engine and built it heavily around the *Doom 3* SDK. It wasn't much — normal and specular mapping from TGA textures was there, BSP loading worked, OBJ/LWO/MD5mesh static models were supported — but shadows were vague at best. Still, I was happy I'd made something *similar* with very limited knowledge. A year later I hacked together a primitive spherical path tracer, following [smallpt](http://www.kevinbeason.com/smallpt/) and [tokaspt](https://github.com/JarkkoPFC/tokaspt) as examples to learn from. The code was ugly. It rendered something. That was enough.

I always wanted to put a path tracer inside a real game engine — not a toy scene, not a Cornell box, but something people actually played. When I finally had the time to do it, combining the engine I grew up studying with the rendering technique I'd been circling for years felt inevitable. Projects like [Q2VKPT](https://github.com/cschied/q2vkpt) proved it could work. I just went for it.

The engine itself made the decision easy. The full source is GPL'd, the architecture is clean, and dhewm3 has kept it building on modern systems ever since. Every light is an explicit source with position, color, radius, and projection parameters. No baked lightmaps. No ambiguity. The scene data is right there in the draw call pipeline, waiting to be intercepted.

The approach: intercept the geometry and lights dhewm3 submits each frame, upload everything to CUDA, build a BVH, path trace the scene, and blit the result back through OpenGL. No engine rewrite. No new asset pipeline. Just a `renderer_cuda/` directory sitting next to the existing `renderer/` and a CMake flag to enable it.

**Source code:** [github.com/aknavj/dhewm3-cupt](https://github.com/aknavj/dhewm3-cupt)

---

## The Pipeline

The trick is to sit exactly where the GL rasterizer sits. dhewm3's backend calls `RB_DrawView()` once per frame to draw everything — I replaced that call with `RB_CUDA_DrawView()` and intercepted the entire pipeline. Here's what happens every frame:

```
 DOOM 3 FRAME                              CUDA PATH TRACER
 ===========================               ===========================

 idSession::Frame()
       |
       v
 idRenderWorld::
   GenerateAllInteractions()
       |
       v
 idRenderBackend::
   ExecuteBackEnd()
       |
       v
 +---RB_DrawView()---+                     RB_CUDA_DrawView()
 |  (GL rasterizer)  | --- replaced by --->       |
 |                    |                     +------+------+
 | for each drawSurf  |                     |             |
 |   GL_DrawElements  |                  iterate       iterate
 | for each light     |                  drawSurfs     viewLights
 |   stencil shadows  |                     |             |
 |   light pass       |                     v             v
 +--------------------+               AddTriangle()  AddLight()
       |                              GetOrSetMaterial()
       v                                    |
 GL SwapBuffers                             v
                                      EndFrame()
                                        | cudaMemcpy --> device
                                        | build LBVH
                                        v
                                      RenderView()
                                        | primary rays
                                        | BVH traversal
                                        | material eval
                                        | direct light + shadows
                                        | indirect bounce
                                        v
                                      ToneMap()
                                        | HDR --> LDR
                                        v
                                      CopyToBackbuffer()
                                        | cudaMemcpy --> host
                                        v
                                      glDrawPixels()
                                        |
                                        v
                                      [screen]
```

**1. Scene extraction.** I walk `backEnd.viewDef->drawSurfs` — the same list the GL renderer would consume — and copy vertex positions, normals, tangents, UVs, and indices into flat arrays. Entity transforms get baked into world space on the CPU. Materials come from idTech 4's `idMaterial` shader stages, flattened into a `cudaMaterial_t` struct. Lights come from `backEnd.viewDef->viewLights`, with point, directional, and projected types all mapped to a unified `cudaLight_t`.

**2. GPU upload.** Everything gets `cudaMemcpy`'d to device memory. Materials and textures are pointer-cached across frames so only new ones get uploaded. Lights are rebuilt every frame since they animate.

**3. BVH construction.** A Linear BVH is built entirely on the GPU using the Karras (2012) algorithm — four custom kernels plus a Thrust radix sort. More on this below.

**4. Path tracing.** One thread per pixel, launched in 16×16 tiles. Each thread fires a primary ray with sub-pixel jitter, traverses the BVH, evaluates materials, samples direct lighting, and optionally bounces for indirect illumination. Results accumulate into a float4 HDR framebuffer.

**5. Tone mapping.** A second kernel converts HDR to LDR — Reinhard, ACES, or Uncharted 2, selectable at runtime — plus gamma correction.

**6. Blit.** The final pixels get copied back to host memory and drawn with `glDrawPixels`. No GL-CUDA interop, no shared PBO — just a raw pixel copy. Not elegant. Works everywhere.

---

## Frame Breakdown

The renderer has eight selectable modes (`r_cuMode`), each showing a different stage of the pipeline. Here's what the same frame looks like across them:

![r_cuMode 1 — BVH debug: ray cast with random per-triangle coloring](/assets/img/posts/d3pt_bhvdebug.png)
**`r_cuMode 1` — BVH debug: ray cast with random per-triangle coloring**

![r_cuMode 4 — Albedo texture](/assets/img/posts/d3pt_albedo.png) **`r_cuMode 4` — Albedo texture**

![r_cuMode 5 — Normal map visualization](/assets/img/posts/d3pt_normal.png) **`r_cuMode 5` — Normal map visualization**

![r_cuMode 6 — Specular map visualization](/assets/img/posts/d3pt_specular.png) **`r_cuMode 6` — Specular map visualization**

![r_cuMode 7 — Whitted ray tracing: direct lighting, Blinn-Phong specular, mirror reflections](/assets/img/posts/d3pt_raytraced.png) **`r_cuMode 7` — Whitted ray tracing: direct lighting, Blinn-Phong specular, mirror reflections**

![r_cuMode 0 — Full PBR path tracing (converged, ~32 frames accumulated)](/assets/img/posts/d3pt_pathtraced.png) **`r_cuMode 0` — Full PBR path tracing (converged, ~32 frames accumulated)**

---

## The BVH

This is where I spent the most debugging time. *Doom 3* levels can push hundreds of thousands of triangles, and the BVH needs to be rebuilt every frame because entities move. A CPU build was out of the question — too slow by an order of magnitude.

I went with an LBVH — Linear Bounding Volume Hierarchy — following Karras's 2012 paper on parallel construction. The idea is beautiful on paper and miserable to debug on a GPU. The build breaks down into four custom kernels plus a Thrust sort:

**Morton codes.** Each triangle's centroid is normalized to [0,1] within the scene AABB and encoded into a 30-bit Morton code (10 bits per axis, interleaved with `expandBits`). This maps 3D proximity to 1D sort order along a space-filling Z-curve.

**Radix sort.** Thrust's `sort_by_key` sorts the Morton codes and their triangle indices in parallel. This is the most expensive step and the one that forces a host sync — the stream must drain before Thrust takes over the default stream. It's also the most heavily optimized, since Thrust's radix sort is a production-grade GPU primitive.

**Radix tree.** An internal node kernel determines the split position for each node using the delta function — `__clz` on XOR'd Morton codes, with index-based tiebreaking for duplicates. Each internal node gets left and right children, and parent pointers are stored for the bottom-up pass.

**Leaf initialization.** A separate kernel writes leaf nodes with per-triangle bounding boxes (epsilon-padded to avoid grazing-ray misses).

**Bottom-up propagation.** Starting from every leaf, each thread walks up the parent chain. An atomic counter per internal node ensures the second child to arrive computes the union AABB while the first one exits. This guarantees every internal node is visited exactly once.

The custom kernels run on a dedicated CUDA stream, but Thrust's `sort_by_key` forces a stream synchronization and runs on the default stream. I tried everything to avoid that stall — it's the one unavoidable host-side sync in the entire build pipeline. You just eat it.

The traversal itself is a stack-based walk with front-to-back ordering. Each thread maintains a 128-entry local stack and pushes the nearer child last so it gets popped first:

```cuda
int stack[128];
int stackPtr = 0;
stack[stackPtr++] = 0;  // root

while (stackPtr > 0 && stackPtr < 128) {
    int nodeIndex = stack[--stackPtr];
    const cudaBVHNode_t& node = nodes[nodeIndex];

    // slab test against node AABB
    float tmin = ray.tMin;
    float tmax = foundHit ? hitInfo.t : ray.tMax;
    for (int i = 0; i < 3; i++) {
        float invD = 1.0f / ray.direction[i];
        float t0 = (node.bounds[i] - ray.origin[i]) * invD;
        float t1 = (node.bounds[i + 3] - ray.origin[i]) * invD;
        if (invD < 0.0f) { float tmp = t0; t0 = t1; t1 = tmp; }
        tmin = fmaxf(tmin, t0);
        tmax = fminf(tmax, t1);
        if (tmax <= tmin) goto skip_node;
    }

    if (node.leftChild == -1) {
        // leaf — test triangles
        for (int i = node.firstPrimitive;
             i < node.firstPrimitive + node.primitiveCount; i++) {
            if (IntersectTriangle(ray, vertices, triangles[triIndices[i]],
                                  materials, hitInfo)) {
                hitInfo.triangleIndex = triIndices[i];
                foundHit = true;
            }
        }
    } else {
        // push children — nearer child on top
        float leftDot  = dot(leftNode.center  - ray.origin, ray.direction);
        float rightDot = dot(rightNode.center - ray.origin, ray.direction);
        if (leftDot < rightDot) {
            stack[stackPtr++] = node.rightChild;  // far
            stack[stackPtr++] = node.leftChild;   // near (popped first)
        } else {
            stack[stackPtr++] = node.leftChild;
            stack[stackPtr++] = node.rightChild;
        }
    }
    skip_node:;
}
```

The front-to-back ordering means early hits tighten `tmax` quickly, pruning large branches of the tree before any intersection test runs. For *Doom 3*'s indoor environments — lots of occluding walls — this cuts traversal cost roughly in half compared to arbitrary child ordering.

---

## Materials

This was the part I underestimated the most. *Doom 3*'s material system isn't a simple texture-per-surface setup — it's a multi-stage shader pipeline. A single material can have bump, diffuse, specular, and ambient interaction stages, blend modes, alpha tests, vertex colors, and animated texture registers. My path tracer needs something much simpler: an albedo, a normal, roughness, metallic, and a few flags. Bridging that gap is where most of the ugly judgment calls live.

The converter walks each `idMaterial`'s shader stages and extracts what it can.

**Diffuse stages** provide the albedo texture and base color tint. This is the straightforward case — one texture, one color multiplier.

**Bump stages** provide normal maps. *Doom 3* uses the RXGB format — the X component lives in the alpha channel, Y in green, Z in blue. The kernel reconstructs tangent-space normals accordingly and handles degenerate tangent frames by fabricating an orthonormal basis from the surface normal.

**Specular stages** provide a specular map. I derive roughness and metallic from specular luminance — brighter specular means smoother and more metallic. It's a heuristic. A real PBR artist would hate it. But it gets the visual weight right for most of *Doom 3*'s surfaces, and that's what matters.

**Coverage type** determines alpha test thresholds for perforated materials like grates, and blend modes for translucent glass and additive particles.

**Emission** comes from materials with no interaction stages — ambient-only materials like light panels and screens become emissive surfaces in the path tracer.

**Vertex colors** pass through for particles and decals that modulate per-vertex. **Texture transforms** — scale, rotation, scroll — are extracted from shader registers and applied in the kernel's UV computation.

Materials are pointer-cached with an `idHashIndex` keyed on the `idMaterial` pointer. A material is converted once and reused across frames until a texture overflow forces a full flush.

---

## Lighting

idTech 4 has three light types — point, parallel (directional), and projected (spotlight with a texture frustum). I extract all three from the engine's `viewLight_t` list each frame.

**Point lights** use *Doom 3*'s axis-aligned light radius as the falloff boundary. The attenuation follows a windowed quadratic: $(1 - (d/r)^2)^2$, which gives a smooth falloff to zero at the radius boundary — no hard cutoff, no inverse-square singularity.

**Projected lights** are the ones I found most interesting — and the trickiest to get right. Each carries four frustum planes (`lightProject[4]`) that define a textured light volume. The path tracer evaluates these planes to compute UV coordinates within the projection, samples the light texture there, and applies a falloff gradient along the frustum depth. Cone angle and edge softness are derived from the frustum geometry. Getting this wrong makes every spotlight in the game look like a featureless white cone. I got it wrong many times.

**Direct light sampling** casts shadow rays from each hit point toward up to `r_cuMaxLightSamples` randomly selected lights, weighted by `numLights / numSamples` to keep the estimator unbiased. The shadow test is transparency-aware — it walks through alpha-tested, transmissive, and blended surfaces, attenuating the shadow ray per-material rather than treating every intersection as fully opaque. This gives you correct shadows through chain-link fences, tinted glass, and particle effects.

**Soft shadows** come from jittering the light sample position within the light's volume. Point lights jitter within their `lightRadius3` extents; spotlights jitter along their right and up axes. The scale is controllable via `r_cuSoftShadowScale`.

**Indirect lighting** is a single-bounce GI pass — the feature that made the whole project worth doing, honestly. At the primary hit point, a cosine-weighted hemisphere sample is fired. The indirect ray walks through transparent surfaces (up to four steps) until it finds something opaque, evaluates direct lighting there with a shadow ray, and returns the result as incident radiance. It fires at a configurable probability (`r_cuIndirectProb`) — typically not every pixel — and it fills in the ambient that makes *Doom 3*'s pitch-black corridors feel like physical spaces instead of floating geometry. The first time I saw light bleeding around a door frame that the original renderer left pitch black, I knew the architecture was right.

The core of the path tracing kernel — primary ray generation through the bounce loop — looks like this:

```cuda
// per-pixel RNG seeded from pixel position + frame index
unsigned long long pixelSeed =
    (unsigned long long)(y * width + x) * 1000003ULL
    + (unsigned long long)frameIndex * 999983ULL;
curandState randState;
curand_init(pixelSeed, 0, 0, &randState);

for (int sample = 0; sample < samplesPerPixel; sample++) {
    // primary ray with sub-pixel jitter
    float jitterX = curand_uniform(&randState) - 0.5f;
    float jitterY = curand_uniform(&randState) - 0.5f;
    float u = ((float)(x) + 0.5f + jitterX) / (float)width  * 2.0f - 1.0f;
    float v = ((float)(y) + 0.5f + jitterY) / (float)height * 2.0f - 1.0f;

    cudaRay_t ray;
    ray.origin    = cameraPos;
    ray.direction = normalize(cameraForward
                   + u * cameraRight * tanHalfFovX
                   + v * cameraUp    * tanHalfFovY);

    float pathThroughput[3] = { 1, 1, 1 };
    float pathRadiance[3]   = { 0, 0, 0 };

    for (int iteration = 0; iteration < maxPasses && depth < maxDepth;
         iteration++) {
        cudaHitInfo_t hitInfo;
        if (!IntersectBVH(ray, vertices, triangles, bvhNodes,
                          triIndices, materials, hitInfo)) {
            // sky or miss — accumulate and break
            break;
        }
        // evaluate material, sample direct light, bounce...
    }
}
```

The outer `sample` loop runs the configured SPP count. The inner `iteration` loop handles bounces and transparent passes — alpha-tested surfaces, decals, and glass don't increment the bounce depth, so a ray can pass through many transparent layers before counting as a real bounce.

---

## The BRDF

I went with Cook-Torrance and GGX — the same shading model that Unreal Engine 4 and most modern PBR pipelines use. Nothing exotic. It handles rough diffuse and sharp metallic reflections in one framework, and there's plenty of reference material when something looks wrong at 2 AM.

**The normal distribution** uses GGX (Trowbridge-Reitz): $D = \frac{\alpha^2}{\pi((\mathbf{n} \cdot \mathbf{h})^2(\alpha^2 - 1) + 1)^2}$. GGX has heavier tails than Blinn-Phong, which means broader specular highlights at grazing angles — exactly what you need for the wet-looking metal floors in *Doom 3*'s Mars base.

**The geometry term** uses Smith's method with Schlick-GGX approximation: $G = G_1(\mathbf{n} \cdot \mathbf{v}) \cdot G_1(\mathbf{n} \cdot \mathbf{l})$. This accounts for microfacet self-shadowing and masking — the reason rough surfaces lose energy at steep viewing angles instead of blowing out.

**Fresnel** uses the Schlick approximation: $F = F_0 + (1 - F_0)(1 - \cos\theta)^5$. The diffuse component is energy-conserving Lambertian: $k_d = (1 - F)(1 - \text{metallic})$, scaled by $\frac{\text{albedo}}{\pi}$. Metals get no diffuse contribution — all their color comes through specular reflection.

I spent a frustrating week wondering why every metal surface looked dead before I found it: *Doom 3*'s original renderer doubles the specular contribution in its interaction shaders. `result = diffuse + specular * 2`. Every surface in the game was tuned under that assumption. Without the boost, the path-traced scene looked physically correct and emotionally flat. `r_cuSpecularBoost` (default 2.0×) fixes it — matching Doom 3's artists rather than the textbook.

---

## Volumetrics

This is pure indulgence — *Doom 3* doesn't have volumetric lighting, and adding it is expensive. But I wanted to see those flashlight beams cutting through darkness the way they do in my memory, not the way they actually rendered in 2004.

The system ray-marches between the camera and the first hit point. At each step, the kernel casts a shadow ray toward the light, computes distance attenuation, evaluates a Henyey-Greenstein phase function for directional scattering, and accumulates in-scattered radiance modulated by Beer's law transmittance. Spotlights force a minimum forward bias ($g \geq 0.7$) so their beams read as visible cones rather than diffuse fog.

Projected light textures are sampled during the march too — a light with a colored gel projects that color into the fog, not just onto surfaces. It's the most expensive feature in the renderer and the one I'm least willing to cut.

---

## Getting the Look Right

The math behind a path tracer is the easy part — there are textbooks for that. The hard part was making it look like *Doom 3*. Not like a generic PBR renderer that happens to load *Doom 3* assets. Like the actual game, with all its specific artistic choices baked in.

| *Doom 3* GL Renderer | CUDA Path Tracer |
|---|---|
| **No ambient term.** Every pixel is lit exclusively by placed `idLight` entities. Unlit surfaces are black. | **No ambient fill, no environment map, no sky bleed.** The path tracer trusts the placed lights. If a corridor has no lights, it stays black — matching *Doom 3*'s oppressive darkness. |
| **Windowed quadratic attenuation.** Light intensity reaches exactly zero at the radius boundary: $(1-(d/r)^2)^2$. | **Same windowed falloff reproduced exactly.** Inverse-square was tested and rejected — it bled light too far and collapsed the contrast between lit and unlit areas. The windowed curve is what creates *Doom 3*'s pools-of-light look. |
| **2× specular in interaction shaders.** `result = diffuse + specular * 2`. Artists tuned every surface under this assumption. | **Configurable `r_cuSpecularBoost` (default 2.0×)** applied to the Cook-Torrance specular term. Without it, metals look flat and matte — technically correct, visually dead. |
| **Specular maps** with RGB intensity. No roughness or metallic concept. | **Heuristic PBR derivation:** `roughness *= 1.0 - specLum * 0.6`, `metallic = max(metallic, specLum * 0.3)`. Maps the visual weight correctly — shiny stays shiny, rough stays rough. |
| **Projected light textures.** `lightProject[4]` frustum planes shape every spotlight — colored gels, gobos, falloff gradients. | **Same frustum planes evaluated per-ray** to compute projection UVs. The light texture is sampled during both surface shading and volumetric marching. Without this, spotlights become featureless cones. |
| **Draw-order compositing** of alpha-tested grates, additive particles, modulate-blended decals, translucent glass. | **Blend mode classification per-hit.** Pass-through (attenuate throughput), additive (add energy), modulate (multiply throughput), or bounce. Transparent passes don't consume bounce budget — a ray walks through 20 decals as one logical bounce. |
| **`noShadows` opaque decals** — blood splatters, bullet marks, signage drawn as opaque surfaces that don't cast shadows. | **Special-case detection:** `noShadows` + no alpha test + no transmission + opaque blend → light the decal, composite over throughput, continue ray through. Without this, every decal becomes an opaque wall. |
| **Ambient-only materials** for light panels, screens, HUD — stages with no diffuse/bump/specular interaction. | **`isAmbientOnly` detection** (`hasInteraction == false && numStages > 0`). Kernel treats these as self-illuminated emitters — albedo added directly to path radiance, ray passes through. Every screen glows without explicit emissive light entities. |
| **RXGB normal maps.** X in alpha, Y in green, Z in blue. Non-standard tangent-space encoding. | **Kernel reconstructs tangent-space normals from RXGB** and fabricates an orthonormal basis from the surface normal when the tangent frame is degenerate. Wrong format = wrong lighting on every surface. |

Every row in that table cost me at least a day. The common thread: it's about matching what the original renderer *did*, not what a physically based renderer *should* do. The artists at **id Software** tuned the game under specific assumptions. My job is to honor those assumptions while adding what the original couldn't — soft shadows, indirect light, volumetric scattering.

---

## Path Tracer Cutbacks

This is a real-time-ish path tracer for a game engine, not a production renderer. Every architectural decision reflects that.

**One-bounce indirect only.** The GI pass fires a single hemisphere sample at the primary hit and evaluates direct lighting at whatever it hits. No recursive multi-bounce GI, no photon mapping, no irradiance caching. One bounce fills the ambient enough to make rooms feel solid. More bounces would multiply ray count exponentially for marginal gain in *Doom 3*'s tight, heavily occluded corridors.

**Cosine-weighted hemisphere sampling everywhere.** Bounce directions are sampled proportional to $\cos\theta$ — the cheapest reasonable strategy. No BRDF importance sampling, no multiple importance sampling (MIS). MIS drastically reduces variance for glossy surfaces and small bright lights — it's the standard in production renderers. Without it, specular highlights converge slowly and caustics are effectively invisible. The tradeoff is simplicity — one sampling strategy, one PDF, no bookkeeping.

**No spectral rendering. No subsurface scattering. No caustics.** Everything is RGB — no wavelength-space dispersion or fluorescence. Every surface is opaque at the shading point — no internal scattering for skin, wax, or marble. Specular-to-diffuse light transport is invisible because the renderer only traces from the camera. For *Doom 3*'s metal corridors and demon-infested labs, none of this matters.

**No denoiser.** Production and real-time RT renderers run learned denoisers that reconstruct clean images from 1–4 SPP. This path tracer relies on temporal accumulation — brute-force sample count. A still camera converges cleanly. A moving camera sees full noise every frame.

**Hard caps everywhere.** The scene is bounded by compile-time constants — 1M triangles, 2K textures, 512 lights, 2M BVH nodes — `cudaMalloc`'d once at startup. Transparency-aware shadow rays walk through at most 8 surfaces before giving up. Every pixel gets the same SPP regardless of variance. A production renderer would stream geometry, use virtual texturing, and trace until the ray exits the scene. These limits are generous for *Doom 3* but make the architecture unsuitable for open-world scenes or film assets.

The result is a renderer that produces plausible images at interactive rates — good enough to walk through *Doom 3* and see real light bounce off real geometry. The missing features aren't optimizations to add later. They're architectural decisions that would require rewriting the kernel from scratch. This path tracer answers one question: what does *Doom 3* look like with real light transport? Everything else is a different project.

---

## Accumulation and Convergence

There's no denoiser. I rely on brute-force temporal accumulation instead — each frame's path-traced result adds to a persistent HDR buffer, and the tone mapper divides by the frame count before converting to LDR. Move the camera and it resets. Stand still and watch it converge.

At 4 SPP per frame, the first frame is grainy but recognizable. After 50 frames, direct lighting is clean. After a few hundred, indirect illumination and soft shadows settle. It's satisfying to watch — like developing a photograph, except each frame is another layer of exposure.

Russian roulette terminates low-energy paths probabilistically after a minimum bounce count, compensating with an inverse probability weight to keep the estimator unbiased. A firefly clamp caps individual sample brightness so one hot pixel doesn't blow out the average. Between these two, convergence is stable without visible bias.

---

## What It Costs

The whole thing is gated behind a CMake flag (`-DCUDA_PATHTRACER=ON`) and a runtime CVar (`r_cuDraw 1`). Turn it off and dhewm3 runs its normal OpenGL renderer, unchanged. Turn it on and CUDA takes over completely — GL only handles the final blit.

At 0.5× render scale (the default), I get interactive rates on my RTX hardware. Full resolution is slower but converges faster per frame. Around 50 CVars control everything — SPP, bounce depth, Russian roulette, soft shadow scale, sky color, fog density, tone mapping — all adjustable from the *Doom 3* console while you play.

The biggest embarrassment is `glDrawPixels`. Every frame copies the entire pixel buffer from device to host and back to the GPU through the GL pipeline. There's no GL-CUDA interop. It works. It's not fast. A shared PBO or Vulkan interop would kill that round trip, but for an experimental renderer, I picked the dumbest thing that worked and moved on.

---

## What I Learned

Building a path tracer inside a shipping engine — even one from 2004 — is a fundamentally different problem than building one from scratch. You don't get to define the scene format. You don't get to choose how materials work. You get `drawSurf_t` arrays and `idMaterial` pointers and you make them work.

The hardest part wasn't the BVH, or the kernel architecture, or even wiring CUDA into CMake. It was getting the *feel* right. *Doom 3* has a specific look — heavy specular on metal, pitch-black shadows with sharp falloff, warm orange light pooling on concrete. The algorithms are in every textbook. But a physically correct renderer doesn't automatically reproduce what id Software's artists intended. I kept producing frames that were technically right and emotionally dead. Matching artistic intent matters more than matching the equations.

idTech 4's material system is more complex than it looks. A single material can have dozens of shader stages with animated registers, conditional expressions, and blend operations that interact in ways the documentation doesn't cover. Mapping that down to a flat PBR struct means making judgment calls about what to keep and what to lose. I got many of those calls wrong before I got them right.

You learn more about a renderer by replacing it than by reading about it. That's why I put a path tracer in a 2004 game engine.

---

## What's Next

The current renderer rebuilds the entire BVH every frame. The obvious next step is a two-level acceleration structure — a static BLAS for the world geometry, rebuilt TLAS only for moving entities. That alone should cut construction time by an order of magnitude.

After that, `glDrawPixels` needs to die. CUDA-OpenGL interop through a shared PBO, or a full port to Vulkan compute, would eliminate the device-to-host-to-device round trip that currently bottlenecks every frame.

---

## References

- **Project source:** [aknavj/dhewm3-cupt](https://github.com/aknavj/dhewm3-cupt) — the full CUDA path tracing fork of dhewm3
- Christoph Schied, [Q2VKPT — Quake 2 Vulkan Path Tracer](https://github.com/cschied/q2vkpt), 2019
- Tero Karras, [Maximizing Parallelism in the Construction of BVHs, Octrees, and k-d Trees](https://research.nvidia.com/publication/2012-06_maximizing-parallelism-construction-bvhs-octrees-and-k-d-trees), NVIDIA Research, HPG 2012
- [dhewm3 — Doom 3 GPL Source Port](https://dhewm3.org/)
- id Software, [Doom 3 GPL Source Code](https://github.com/id-Software/DOOM-3), 2011
- Matt Pharr, Wenzel Jakob, Greg Humphreys, *Physically Based Rendering: From Theory to Implementation*, 4th Edition
- Brian Karis, [Real Shading in Unreal Engine 4](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf), SIGGRAPH 2013
