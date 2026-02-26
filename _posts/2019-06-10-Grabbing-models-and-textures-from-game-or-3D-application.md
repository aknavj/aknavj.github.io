---
layout: article
title: Grabbing models and textures from games
tags: grabbing models 3d application textures
categories: 3d
---

> A summary of methods and techniques for extracting 3D models and textures from games and 3D applications — from GPU rippers to photogrammetry.

## Introduction

There are several ways to grab models and textures from a running game. I split them into two groups:

* [Lethal way](#lethal-way) — breaks the EULA
  * [Graphics analyzers](#graphics-analyzers)
  * [Ripper tools](#ripper-tools)
  * [Comparing data](#comparing-data)
* [Non-lethal way](#non-lethal-way) — no reverse engineering involved
  * [Photogrammetry](#photogrammetry)

Why would you want to do this?

* **For fun** — just mess around with the assets.
* **Study how GFX is made** — topology, UV layouts, level design.
* **Study how the engine works** — see Adrian Courrèges' [GTA V rendering study](http://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/) for a great example.
* **Learn programming** — nobody wants to stare at a textured cube forever. Use real assets.
* **Speedrun optimization** — some tools expose trigger volumes and collision boxes. Useful for finding exploits.
* **3D printing** — [guide here](https://www.instructables.com/id/3D-Printing-Models-from-video-game/).
* **3D edits / cinematics** — e.g. [CS:GO 3D-Edit](https://www.youtube.com/watch?v=R-fq8o4Do3g).
* **Total conversions** — e.g. [Duke Nukem 3D 'Forever' in Serious Sam 3](https://www.youtube.com/watch?v=BDSUeD-WErY).

---

## Lethal way

This breaks every legal agreement with the vendor. You're not supposed to reverse engineer or redistribute their intellectual property. But it's fun, most hardcore fans don't care, and as long as you don't share ripped content commercially — nobody is going to come after you.

### Tools

**File extraction tools** — purpose-built reverse engineering tools that crack proprietary formats.
* [Xentax Forum](https://forum.xentax.com/) — large community focused on game file format RE.

**Graphics analyzers / profilers** — capture everything the GPU processes in a single frame: geometry, textures, shaders, draw calls.
* [Intel GPA](https://software.intel.com/en-us/gpa)
* [AMD GPU PerfStudio](https://gpuopen.com/archive/gpu-perfstudio/)
* [NVIDIA Nsight](https://developer.nvidia.com/nsight-graphics)
* [RenderDoc](https://renderdoc.org/)

**Ripper tools** — grab geometry directly from the video buffer. Same principle as analyzers, but focused on asset extraction.
* [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm) — old but works for DX6/8/9 titles.
  > Installation password: **ripper**
* [Ninja Ripper](https://gamebanana.com/tools/5638) — DX9, 10, 11 and newer. [Source on GitHub](https://github.com/riccochicco/ninjaripper).
  * [Official guide](http://cgig.ru/en/2012/10/ho-to-use-ninja-ripper/) · [Nero's guide](https://nerotips.tumblr.com/post/159024040760/ninja-ripper-guide)
* [GameAssassin](http://www.mediafire.com/file/0a4104rb1ukczas/GameAssassin.zip) — [Xentax usage guide](https://forum.xentax.com/viewtopic.php?t=5913)

### Before you start

A few things to keep in mind before using any ripper or analyzer:

1. **Know which Graphics API the game uses.** If the tool doesn't support it, it won't work.
   > Some games ship with anti-RE protection that blocks profilers or disassemblers entirely.

2. **Frame capture freezes the application.** You can't capture in real-time — every grab pauses the game for seconds or even minutes.

3. **Everything you grab comes through the rendering engine.** The engine manages all vertex data, polygons, UVs, and textures before sending them to the GPU. You're intercepting that pipeline.

Because of this, you'll also capture hidden data that exists in video memory but isn't visually shown:
* Light cones (volumetric effects)
* Portal volumes (indoor/outdoor culling)
* Trigger areas (boxes, null axes)
* LOD meshes
* Collision shapes (boxes, cylinders, spheres)

### Example: Alien Isolation + Dead Space 2

I picked these titles not out of love, but because they lack community extraction tools. This proves the approach works even without dedicated format support.

* **Graphics analyzer** — [Alien: Isolation](https://store.steampowered.com/app/214490/Alien_Isolation/) (DX11, Creative Assembly)
* **Ripper tools** — [Dead Space 2](https://store.steampowered.com/app/47780/Dead_Space_2/) (DX9, Visceral Games / EA)

#### Graphics Analyzers

[RenderDoc](https://renderdoc.org/) was used to capture frames from Alien: Isolation. It intercepts DX/GL/VK calls and lets you inspect every draw call, texture, shader, and buffer in the captured frame.

#### Ripper Tools

Software used:
* [Dead Space 2](https://store.steampowered.com/app/47780/Dead_Space_2/) — Steam version
* [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm)
* [Ninja Ripper](https://gamebanana.com/tools/5638)
* Autodesk 3D Studio Max 2010 — import/export
* Maxon Cinema 4D — viewing

##### 3D Ripper DX

Grabs frame data — models, textures, and shaders. Models are saved as `.3DR` files, which require 3D Studio Max 2009–2014 with the included import plugin. Textures come as DDS, shaders as plain text.

> Shaders are in compiled bytecode. To read them you need to understand the DX9 HLSL fixed-function instruction set. See [this reference](https://drivers.amd.com/misc/samples/dx9/FixedFuncShader.pdf).

For detailed usage, follow [this guide](http://cgig.ru/en/2012/10/ho-to-use-ninja-ripper/).

![3D Ripper DX capture](/assets/img/posts/gmt_3dripper-first.png)

##### Ninja Ripper

Same principle as 3D Ripper DX, but no wireframe mode. Outputs `.RIP` files — importable via a Python plugin for 3D Studio Max (included in the `/tool` directory).

For detailed usage, follow [this guide](http://www.deep-shadows.com/hax/3DRipperDX.htm#quickstartguide).

![Ninja Ripper capture](/assets/img/posts/gmt_ninjaripper-first.png)

#### Comparing Data

The key difference: **Ninja Ripper** captures the scene *before* GPU shader transforms — characters stay in T-pose, geometry has no deformation or rotation applied. **3D Ripper DX** captures what's on screen after all transforms.

![Comparison](/assets/img/posts/gmt_compare-first.png)

#### Conclusion

Each tool has its use case. Need a "diorama" with models in motion? **3D Ripper DX**. Need clean, undeformed assets in their bind pose? **Ninja Ripper**.

---

## Non-lethal way

### Photogrammetry

Take hundreds of screenshots from different camera angles, feed them into a reconstruction tool, and get a textured 3D model out. Simple concept, heavy on compute time. See the [Agisoft guide](https://www.agisoft.com/pdf/photoscan-pro_1_3_en.pdf) (page 8, chapter 2) for the theory.

> You're not reverse engineering anything or cracking file formats — you're just taking screenshots.

##### Software
* [Agisoft Metashape](https://www.agisoft.com/) — used in the examples below
* [3DF Zephyr Free](https://www.3dflow.net/3df-zephyr-free/)
* [Autodesk 123D Catch](https://www.autodesk.com/solutions/123d-apps)
* [OpenMVG](https://github.com/openMVG/openMVG)
* [VisualSFM](http://ccwu.me/vsfm/)

#### Example: Doom 2016

> New to Metashape? Follow [this video guide](https://www.youtube.com/watch?v=Uny9nTr22go).

I used [Doom 2016](https://store.steampowered.com/app/379720/DOOM/) (Steam) with the built-in Photo Mode. Around 300 screenshots from the free camera. Most are slightly blurred because I forgot to disable motion blur — still worked fine.

![Game screenshot](/assets/img/posts/gmt_game_screenshot.jpg)

![Captured screenshots](/assets/img/posts/gmt_grabbed_screenshots.png)

Drop the photos into Agisoft Metashape and run **Photo Alignment** to generate a point cloud:

![Photo alignment](/assets/img/posts/gmt_image_alignment.png)

Then **Build Mesh** from the point cloud:

![Mesh output](/assets/img/posts/gmt_output.jpg)

For higher texture resolution, run **Build Texture** at a larger size. I used 8K (4× the source resolution of 1920×1080):

![Screenshot path](/assets/img/posts/gmt_screenshoted_path.png)
![Recomputed 8K textures](/assets/img/posts/gmt_output_recomputed_textures_8k.png)

Final quality comparison:

![Comparison](/assets/img/posts/gmt_comparsion.png)

For mesh optimization, use [Simplygon](https://www.simplygon.com/), [InstaLOD](https://instalod.com/), or Cinema 4D's built-in [Polygon Reduction](http://www.maxon.net):

![Reduced polygons in C4D](/assets/img/posts/gmt_reduced_polygons_c4d.png)

#### Summary

| Data | Pros | Cons | Note |
|------|------|------|------|
| Models | Generated | Single mesh | Can be large, needs optimization |
| Textures | Generated | Single atlas | May have incorrect UVs |
| Shaders | Baked into texture | Not extracted | Lighting is baked in |
| Legal | No EULA violation | — | Just screenshots |
