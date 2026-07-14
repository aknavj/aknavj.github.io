---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 3"
description: "Building an asset viewer for the NOD engine and reading what the data reveals — three playable levels, seventeen mission scripts, a reconstructed campaign structure, and the production snapshot of a game that never shipped."
tags: reverse-engineering starcraft ghost nod-engine nihilistic asset-formats tooling
categories: reverse-engineering
---

> The binary has scripts for seventeen missions. The build has three levels. I wanted to know what happened to the other fourteen.

---

## Building the Viewer

The leaked prototype's asset tree holds 7,535 files in more than twenty proprietary formats — far past the point where working in a hex editor stays fun.

So I wrote a viewer — a C++17 parser library covering every major NOD format, an OpenGL browser with an ImGui front end, and a Blender 4.x import plugin for the geometry formats (`.nod`, `.nmb`, `.nil`, `.nad`). Pointed at the extracted asset tree, it indexes everything: 6,811 of the 7,535 files parse cleanly. The rest are placeholder stubs and files with regions still undecoded.

![Asset browser rendering the Mar Sara canyon level](/assets/img/posts/scg_img0.png)
**Figure 1.** The asset browser rendering `1_2_1_Miners_Bunker.nil` — the Mar Sara canyon, with entity instances placed from the paired `.nsd` scene file.

The parsers turned out to be the easy part. Most NOD formats are honest — version field, count fields, fixed-size records, no compression, no encryption. This is a development build; the data was written to be debugged, not shipped. The hard part was the same thing it always is: figuring out which fields *mean* something. Once you know `.nsd` entities name their `.not` templates and templates name their `.nod` models, the browser can resolve an entire level — geometry, placement, materials, textures — from file names alone.

---

## The Inventory

**The content pipeline was running far ahead of level production.** Index the asset tree by type and the imbalance is immediate:

| Asset category | Files |
|---|---|
| Models (`.nod`, `.nmb`) | 1,861 |
| Animations (`.nad`, `.nnb`) | 1,595 |
| Materials (`.nsa`, `.dds`) | 1,100+ |
| UI layouts (`.nui`) | 298 |
| Cutscenes (`.nce`, `.ncs`) | 424 |
| Video (`.bik`, DivX) | 93 |
| Playable levels (`.nil`) | **3** |

That last row against the rest: character art, animation, and materials were in full production, and level content wasn't. Whatever was blocking *Ghost* in 2003, it wasn't the art team.

The material library says what kind of game this was:

| Material category | Count |
|---|---|
| Metal | 324 |
| Effects | 192 |
| Common | 131 |
| Colors | 81 |
| Lights | 53 |
| Stone | 45 |
| Terrain | 39 |
| Shaders | 30 |
| Organic | 12 |
| Wood | 3 |

Corridors, machinery, Zerg tissue. Three wood materials in the whole game. For a game that never got a release date, a lot of it was finished.

---

## Three Levels

The build contains three distinct locations plus the menu backdrop, each split into lettered streaming sections — `1_2_1_Miners_Bunker` with an `a` and `b` variant, `1_3_1_Hive_StationOuter` with the same split, and `2_2_2_THREAT_BASEUPPER`. Each section is a `.nil`/`.nsd`/`.npd` triplet — geometry, entity placement, AI navigation — with an optional `.nlfx` effect manifest.

**The Mar Sara canyon is the level everyone has seen.** `1_2_1_Miners_Bunker` opens on a rock canyon with gantry bridges, mining cranes, dead marines on the walkways, and a settlement sign reading *MAR SARA — POPULATION: 68*, with the number crossed out. Zerg growths hang off the canyon walls. It's a complete, art-finished environment — this is the level Blizzard showed the press.

**The geometry is small on purpose.** `2_2_2_THREAT_BASEUPPER.nil` — the largest of the three — breaks down like this:

| Metric | Value |
|---|---|
| File size | 1.9MB |
| Sectors | 43 |
| Vertices | 43,026 |
| Indices | 65,481 |
| Surface groups | 239 |
| Shaders | 41 |

A *Doom 3* scene from the same era carries more geometry in a single room. But NOD is a portal engine feeding an Xbox with 64MB of shared RAM — sectors are the unit of streaming, and 43 of them is a full-sized level for this engine.

**The `.nsd` files show a level being wired for gameplay.** Entity placement in the Miners Bunker scene includes the player start (`ghost`), corpse props flagged for AI attention (`ailook_corpse_prop`), scripted animation anchors (`script_object`, `script_target`), a break-apart Wraith for a cutscene (`wraith_cut_break`), a Dropship placed as scenery (`movenone_model`), and footlockers stocked with sniper and gauss ammunition (`ge_footlocker_grn_snip`, `ge_footlocker_grn_gauss`). Loot placement, scripted set pieces, AI stimuli — the level wasn't just built, it was already being set up for its mission.

---

## The Mission Scripts

The clearest picture of the planned campaign comes from the mission scripts — compiled C++, one module per mission. The module *names* survive in the debug strings, and they follow the same numbering as the level files: `m121_script` pairs with `1_2_1_Miners_Bunker`, `m131_script` with `1_3_1_Hive_StationOuter`, `m222_script` with `2_2_2_THREAT_BASEUPPER`. Three digits — act, mission, area.

Lay out every script module in the binary and the campaign skeleton falls out:

```
Act 1              Act 2                 Act 3        Act 4
+-- mtraining      +-- m222  (shipped)   +-- m311     +-- m411
+-- m121 (shipped) +-- m223              +-- m321     +-- m422
+-- m131 (shipped) +-- m231              +-- m332     +-- m423 (Lurker boss)
                   +-- m232 (Goliath     +-- m341     +-- m431
                   |         boss)                    +-- m432
                   +-- TGS222                         +-- m441 (Brain boss)
```

Sixteen numbered missions plus a training level, spread over four acts. Three of the modules are named after bosses — `m232_goliathmain`, `m423_lurkermain`, `m441_brainmain` — which places the Goliath fight at the end of act 2, the Lurker in act 4, and the Brain Boss as the campaign finale. The remaining boss AI classes (Tanagazj, Ultralisk, Hauler, Sniper) have no mission script of their own; those encounters presumably belonged to one of the numbered missions, but nothing in the binary confirms it.

**`TGS222_script` sits outside the numbering** — a second script for the `2_2_2` level. *Ghost* was unveiled at the Tokyo Game Show in September 2002, and `2_2_2` is the level Blizzard demoed there. A separate script maintained for exactly that level, prefixed TGS, points to a trade-show build. `testsiegetank` is a developer sandbox for the Siege Tank control mode, still linked into the build.

**The numbering has holes.** No `m111`, no `m122`, nothing between `m232` and `m311`. Missions were either planned but never scripted, or renumbered as the design churned. And `m111` is a particularly interesting hole, because the *assets* for mission 1-1 exist.

---

## The Mission 1-1 Animations

The animation directory holds 1,595 files, and the prefixes tell you which mission each clip belongs to. A large block starts with `1_1_g_` — mission 1-1, a mission with no level in the build and no script in the binary.

![NAD animation inspector showing 1_1_g_Nova.nad](/assets/img/posts/scg_img2.png)
**Figure 2.** `1_1_g_Nova.nad` in the inspector — 28 bone tracks, 3,950 frames, keyframe counts per track.

The `1_1_g_` set is a full cutscene cast: Nova — a 1.1MB clip, 3,950 frames — plus a camera track, an Artemis, a Goliath, a Hauler, and twenty individually numbered marines, five of them with short `dead` variants. That's a long, fully choreographed scene for a mission that exists nowhere else in the build. My reading: the game's opening cinematic, animated before its level was built and left behind when the design moved on. The `g` prefix likely marks cutscene animation, matching the paired `1_1_g_camera` track.

The directory also shows the opposite case — files that exist with nothing in them. `1_1_1a_War_Dropship.nnb` is 12 bytes: an empty animation bundle, a header with nothing behind it. The export pipeline ran, found no content, and wrote a stub. Multiply that pattern across the tree and you can watch the production schedule in the file sizes.

---

## The Audio Banks

Audio ships in per-mission wave banks — Microsoft's XACT format, `.xwb` data plus `.xsb` cue banks. The bank for mission 1-2-1 alone is 18.6MB holding 71 waves, and each codec has a clear job:

| Codec | Format | Used for |
|---|---|---|
| PCM | stereo, 24kHz | music, ambience |
| Xbox ADPCM | mono, 24–44kHz | effects, barks |
| WMA | stereo, 44.1kHz | long streams |

The split is the 64MB memory budget at work — full quality for music, 4:1 compression for one-shot effects, streaming for anything too big to keep resident.

The bank list matches the level list, not the mission list: `1_2_1`, `1_3_1`, and `2_2_2` — exactly the three levels in the build — plus per-weapon and per-prop banks like `WeaponGauss` and `doorBroken01`. Nothing for acts 3 or 4. Audio production followed the levels.

---

## What the Data Adds Up To

Line the inventories up and the state of the project in early 2004 is plain. Art, animation, materials, UI, and cutscene production were mature — thousands of finished assets. The mission scripting skeleton was complete: seventeen scripts, four acts, bosses placed, a trade-show branch maintained. But only three levels' worth of world existed, and the audio banks confirm it wasn't a packaging accident — sound was only ever produced for the levels that were real.

Seen from the inside, the 2004 handover to **Swingin' Ape Studios** reads differently: Blizzard wasn't discarding a nearly finished game — it was discarding an engine and a pipeline attached to a world that was still mostly a plan. The data can't say whose fault that was, but it does clear one department: the art team held up their end.

---

## What's Next

There's still plenty the viewer can't open: the undecoded regions of the `.nil` levels, the full event streams in those 424 cutscene files, and the question of whether the mission 1-1 animations can be re-staged on a reconstructed set. The Blender plugin already imports models and levels; a cutscene playing outside the engine would be the natural next milestone.

For now, though, this is where the series stops. Three articles and a working toolchain is a lot of effort to spend on a game that was cancelled twenty years ago, and my enthusiasm has run its course. If it comes back, reassembling that opening cutscene is where I'd pick up. No promises.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- NOD Engine SDK v1.0, Nihilistic Software, 2000 — file format specifications, Embrace level editor, NODExport Maya plugin
- OpenNOD SDK — SC:Ghost Reversed *(asset parsers, viewer, Blender plugin — private, under development)*
- Starev — StarCraft Ghost Reversed *(private, under development)*
