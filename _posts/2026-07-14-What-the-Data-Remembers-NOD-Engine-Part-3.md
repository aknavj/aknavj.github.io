---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 3"
description: "Using an asset viewer to examine the surviving StarCraft Ghost content, separating what the files contain from what they suggest about the unfinished game."
tags: reverse-engineering starcraft ghost nod-engine nihilistic asset-formats tooling
categories: reverse-engineering
---

The binary contains mission names with no matching level in the asset tree. The asset tree contains animations with no matching mission script. I wanted to understand what those mismatches meant.

---

## From Engine Code to Game Content

[Part 1]({% post_url 2026-02-03-Reversing-Dead-Legend %}) introduced the investigation. [Part 2]({% post_url 2026-03-31-NOD-Engine-Architecture-Deep-Dive %}) followed how NOD loads and runs a scene. This final part of the original series looks at the other side of that process: the files available to load.

The first step was to stop reading files one at a time and see which ones connected.

This is an account of inspecting one development snapshot, not a tutorial for writing asset parsers or reconstructing an engine. **Missing from this build does not mean never created**, and present in this build does not mean complete.

---

## Building a Way to Look

The asset tree contains 7,535 files across more than twenty formats. A hex editor is useful for finding a version field or a record boundary. It cannot show whether a model is correctly placed in a canyon.

I built a C++17 parser library, an OpenGL asset browser with an ImGui interface, and a Blender 4.x import plugin for several geometry and animation formats.

In the indexed snapshot, 6,811 of the 7,535 files parse cleanly. The remainder includes placeholder stubs and files with undecoded regions. This measures parser coverage, not how much of the game was finished.

![Asset browser rendering the Mar Sara canyon level](/assets/img/posts/scg_img0.png)
**Figure 1.** The browser combines `1_2_1_Miners_Bunker.nil` geometry with entity placement from its paired `.nsd` scene file.

The most valuable step was connecting files, not opening more of them in isolation:

```text
Scene placement -> Entity template -> Model
Level geometry  -> Material        -> Texture
```

Those relationships let the browser assemble an environment with objects and materials. They do not recreate AI, physics, or mission execution. **An asset viewer showing a level is not the game running.**

---

## What Is in the Snapshot?

The inventory gives a sense of its breadth:

| Asset category | Files |
|---|---|
| Models (`.nod`, `.nmb`) | 1,861 |
| Animations (`.nad`, `.nnb`) | 1,595 |
| Materials and textures (`.nsa`, `.dds`) | 1,100+ |
| UI layouts (`.nui`) | 298 |
| Cutscene files (`.nce`, `.ncs`) | 424 |
| Video (`.bik`, DivX) | 93 |

These are file counts, not counts of unique, finished assets. Bundles, variants, shared resources, and placeholders make a direct comparison misleading. The two cutscene formats also describe related parts of cinematics; 424 files does not mean 424 separate scenes.

The level data represents three main locations, plus the menu backdrop:

- `1_2_1_Miners_Bunker` — the Mar Sara canyon.
- `1_3_1_Hive_StationOuter`.
- `2_2_2_THREAT_BASEUPPER`.

Some locations have lettered sections, so three locations should not be read as exactly three geometry files. Their associated files separate geometry (`.nil`), placement (`.nsd`), and navigation (`.npd`), sometimes with an effect manifest alongside them.

The contrast is worth investigating: a broad resource library accompanies a relatively small set of environments. It does not establish how far the entire production had progressed.

---

## Looking at Mar Sara

The Mar Sara canyon is a useful example because both its environment and its placement data survive.

The geometry includes rock walls, gantry bridges, mining machinery, and Zerg growths. A settlement sign reads *MAR SARA — POPULATION: 68*, with the number crossed out. These details give the location a clear identity even before gameplay runs.

The paired scene data adds the player start, corpse props, ammunition containers, scripted animation anchors, and vehicles used as scenery or in set pieces. A model of a footlocker is just a resource; a placed footlocker with a particular template becomes part of the scene's gameplay setup.

That is stronger evidence than an inventory alone. Geometry and placement show that this location was being assembled for a mission, not merely stored as disconnected art.

It still does not prove that all objectives, transitions, or encounters are complete. Those depend on runtime behavior that the viewer does not execute.

---

## Looking for the Other Missions

Mission-related C++ module names survive in the binary's debug strings. Several match the level filenames:

| Script name | Corresponding location |
|---|---|
| `m121_script` | `1_2_1_Miners_Bunker` |
| `m131_script` | `1_3_1_Hive_StationOuter` |
| `m222_script` | `2_2_2_THREAT_BASEUPPER` |

That correspondence supports reading the digits as act, mission, and area identifiers. Other names extend across prefixes 1 through 4, suggesting a campaign structure broader than the included locations.

Some names are more specific: `m232_goliathmain`, `m423_lurkermain`, and `m441_brainmain` associate script code with named boss encounters. They are clues about intended content, not proof of a finalized boss order or a complete campaign.

`TGS222_script` suggests a separate presentation path for the `2_2_2` location, consistent with a trade-show variant. `testsiegetank` points to a development test path. Neither should be counted as an additional finished campaign mission just because it has a script name.

The module list is therefore a map of code to investigate, not a campaign completion percentage. A mission needs more than a named routine: it needs an environment, resources, and working connections between them.

---

## A Cinematic Without Its Level

The animation directory contains a group prefixed `1_1_g_`, despite there being no matching mission 1-1 level or script in this snapshot.

![NAD animation inspector showing 1_1_g_Nova.nad](/assets/img/posts/scg_img2.png)
**Figure 2.** The inspector reads 28 bone tracks and 3,950 frames from `1_1_g_Nova.nad`.

The group includes Nova, a camera track, an Artemis, a Goliath, a Hauler, and twenty numbered marines. Five marines also have short `dead` variants. Taken together, these files suggest a substantial choreographed sequence.

My interpretation is that they may belong to an opening cinematic. The shared prefix and camera track support that reading, but do not establish the intended placement or explain why the corresponding level is absent. Content could have been omitted, renamed, superseded, or left unfinished.

The tree also includes empty files such as the 12-byte `1_1_1a_War_Dropship.nnb` animation bundle. A header-only bundle is evidence that no animation content is stored in that file. It is not enough to recover the export history or production schedule behind it.

The useful finding is the mismatch itself: animation can survive without the environment or mission that would give it context.

---

## Checking Against Audio

The Xbox audio data includes XACT wave banks (`.xwb`) and associated cue banks (`.xsb`). Waves hold sound data; cues describe how playback is addressed.

The `1_2_1` wave bank is 18.6MB and contains 71 waves. The inspected banks use PCM, Xbox ADPCM, and WMA, reflecting different storage and playback needs.

The mission-specific bank names align with the three included locations: `1_2_1`, `1_3_1`, and `2_2_2`. There are also banks for individual weapons and props.

Audio gives us an independent check: the same three location identifiers appear in geometry, scripts, and mission-specific banks. That is a stronger connection than a script name alone, although it still says nothing about banks absent from this snapshot.

---

## What the Evidence Supports

The findings are easier to follow when observation and interpretation stay separate:

| Observation | What it supports | What it does not establish |
|---|---|---|
| Thousands of resource files survive | A broad content library existed | That every asset was finished |
| Three main level locations have related scene data | Those environments were assembled beyond isolated geometry | That every mission in them is complete |
| Script names extend beyond the included levels | The code reflects a larger intended structure | A finalized campaign or completion percentage |
| Mission 1-1 animation has no matching level here | Content survives without its full context | Why that context is missing |
| Audio banks match the included locations | Supporting sound data exists for those locations | The state of all audio production |

My reading is that this build preserves both playable work and traces of a wider plan. The viewer makes that distinction easier to see, but it cannot turn a partial snapshot into a complete production history.

It cannot assign responsibility for the cancellation, clear a department of every production problem, or establish what existed at the later handover to Swingin' Ape. Those would require evidence beyond these files.

---

## Where I Left It

The result is a working inspection toolchain and a clearer map of how the surviving content connects. It is not a recovered game engine or a completed version of Ghost.

There are still undecoded regions in the level files and unfinished work on cutscene event data. Reassembling a cinematic outside the original runtime would be another investigation, not an automatic consequence of having its animations.

This was where the original three-part investigation paused. I later returned with a different goal: [getting the Xbox prototype running through XboxRecomp]({% post_url 2026-10-10-Nova-signing-off %}). That later effort deals with runtime behavior; this one explains what I could learn by reading and viewing the assets.

The distinction matters throughout the series: understanding the architecture, inspecting the content, and running the game are related efforts, but they are not the same result.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- NOD Engine SDK v1.0, Nihilistic Software, 2000 — file format specifications and authoring tools
- OpenNOD SDK — SC:Ghost Reversed *(asset parsers, viewer, Blender plugin — private, under development)*
- Starev — StarCraft Ghost Reversed *(private, under development)*
