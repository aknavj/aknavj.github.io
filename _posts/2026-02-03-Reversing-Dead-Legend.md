---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 1"
description: "Reading the surviving StarCraft Ghost debug executable to understand NOD's architecture, its reuse from Vampire, and the limits of what a binary can explain."
tags: reverse-engineering starcraft ghost nod-engine nihilistic disassembly
categories: reverse-engineering
---

In 2020, a *StarCraft: Ghost* development build surfaced with something particularly useful: a PC debug executable. The game did not run correctly, but enough names and diagnostic strings survived to make its engine readable.

I spent two years studying it. What had Nihilistic carried over from its previous game, and what had changed to support Nova?

This series records what I found. It is a reverse-engineering case study, not an engine-building tutorial. This part introduces NOD; [Part 2]({% post_url 2026-03-31-NOD-Engine-Architecture-Deep-Dive %}) follows a scene through its systems; [Part 3]({% post_url 2026-07-14-What-the-Data-Remembers-NOD-Engine-Part-3 %}) examines the surviving content.

---

## The Build in Context

StarCraft: Ghost was announced on September 19, 2002 — a third-person stealth-action game that would put you behind the eyes of Nova, a Terran ghost operative, instead of the god's-eye view of the RTS.

The game was pitched to Blizzard by **Nihilistic Software**, a studio founded in 1998 by Ray Gresko, Robert Huebner, and Steve Tietze — LucasArts veterans who had shipped *Star Wars Jedi Knight: Dark Forces II*. Their first title as Nihilistic was *Vampire: The Masquerade — Redemption* (2000), built on a proprietary engine called **NOD**. When the Ghost contract came in, they brought that engine along.

What followed has been well-documented. [Polygon's exposé](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong) and Jason Schreier's *Play Nice* cover it in detail. The short version:

- **2001** — Development begins. Monthly cheques from Blizzard, no fixed deadline.
- **2002** — Playable build at Tokyo Game Show. Blizzard keeps adding features. *Splinter Cell* ships, and comparisons to it start dominating every feedback session.
- **2003–2004** — Levels feel cobbled together from different games. Story rewritten multiple times. Nihilistic is looking for an exit.
- **Mid-2004** — Nihilistic ceases work. Blizzard hands the project to **Swingin' Ape Studios**.
- **2005** — Blizzard acquires Swingin' Ape. The BlizzCon demo looks promising — but *World of Warcraft* has launched and is absorbing every available resource.
- **2006** — Indefinitely postponed. Xbox 360 and PS3 are arriving. Ghost targets Xbox, PS2, and GameCube — already obsolete hardware.
- **2014** — Mike Morhaime quietly uses the word "cancelled."

In February 2020, a build from Nihilistic's era leaked online: a functional Xbox prototype and a broken PC debug executable (`Star_d.exe`), with working levels, models, and character data — debug symbols still partially intact. Because it's a development build, every model, texture, map, and template sits unpacked on disk as loose files instead of bundled `.nob` archives, so nothing needs to be extracted before you can start reading it.

The material examined here covers the Xbox prototype and the PC D3D8 path. PS2 and GameCube versions were reportedly in development, but those implementations are not available in this snapshot.

---

## Why I Looked Inside

I started **Starev** — my reverse engineering effort on the NOD engine, currently private and under development — about two years after the leak. The goal was never to resurrect the game or to ship anything. I wanted to understand how an early-2000s game engine was put together. The binary could show me its implementation, but not explain the project's collapse on its own.

The NOD engine was built between 1998 and 2000 for a PC RPG, then adapted during 2001–2004 for a multi-platform console action game. The codebase reflects that journey: C-style foundations alongside C++ class hierarchies. If you've read through the [Rebellion AVP source code](https://github.com/aknavj/avp), you'll recognize the mixture of low-level functions and object-oriented systems.

Nihilistic's founders had shipped *Jedi Knight* at LucasArts. Carrying their own engine forward gave them an existing renderer, resource system, and tools. The interesting question is not whether reuse was wrong, but which parts transferred well and which needed adaptation.

There was a personal reason too. In 2004, the E3 trailer persuaded me to start saving for a PS2. Some of my early graphics experiments tried to recreate Ghost's environments. Sixteen years later, I could finally study the implementation behind them.

---

## The Binary

`Star_d.exe` is a Win32 debug executable. Its surviving names and diagnostics give routines recognizable roles. With less optimization than a release build, the code is also easier to follow. Neither advantage recovers the original source, but both reduce the amount of guesswork.

Debug strings throughout the binary reveal the original source tree at `C:\star\Code\`. The engine is layered cleanly:

```
+------------------------------------------------------------+
|  gamescript/   Mission-specific logic (per-level scripts)   |
+------------------------------------------------------------+
|  game/                                                      |
|  +- main/      Entry point, state machine, saves, video     |
|  |  +- divx/   DivX video playback subsystem                |
|  +- gamelib/   Entity model, templates, scenes, worlds      |
|  |  +- havok/  Havok physics wrappers & collision filters   |
|  +- ai/        40+ AI class types with base class layer     |
|  +- sim/       Physics, camera, 6 control modes, ragdoll    |
|  +- effect/    30+ effect types                             |
|  +- script/    Script API, 20 domain-specific bindings      |
|  +- shell/     Menu system (cShell + widget modules)        |
|  +- ui/        In-game HUD (18 vui components)              |
|  +- world/     World rendering, lighting, debug viz         |
+------------------------------------------------------------+
|  render/       Model/keyframe/terrain/camera/font/mesh      |
|  +- direct/    D3D8 backend + shader class factory          |
+------------------------------------------------------------+
|  misc/         Audio classes: cSound, cVoice, cStream       |
+------------------------------------------------------------+
|  math/         Vectors, matrices, trig (SSE), intersection  |
+------------------------------------------------------------+
|  std/          Foundation: memory, files, NOB archives,     |
|                hashtable, input, audio mixer, timing, debug |
+------------------------------------------------------------+
```

The same patterns show up everywhere: `stdHashtable` for resource lookup, reference counting with free lists, and bundled archives (`.nmb`, `.nnb`, `.nsb`) for level-atomic asset streaming. The config parser still reads `masquerade.ini` — a filename inherited from *Vampire: The Masquerade — Redemption*. Nobody ever renamed it; the vampire game's config file lives on inside *StarCraft Ghost*.

The layering itself is not evidence of a design failure. The rest of this series looks inside those subsystems to understand how this particular implementation worked.

---

## Four Connections Worth Following

The source-tree outline is a useful map. The relationships inside it are more interesting.

**Materials select rendering behavior.** Glass, lava, cloak, and Nova's suit have dedicated shader classes. Here, "shader class" means engine-side code configuring a rendering path, not necessarily one GPU program. Materials also carry surface-sound information, connecting a surface's appearance with the footsteps it should produce.

The world is sector-based. Each sector carries its own geometry, portal links to neighbors, and surface groups tied to shaders. Streaming, visibility, and collision all operate at sector granularity — a classic portal-based partition, not unlike Quake's BSP leaves, but with Nihilistic's own level format and tooling behind it.

**Entities connect resources to gameplay.** The central entity type, `tThing`, carries an identifier, a transform, a sector link, and physics hooks. Objects, actors, props, and projectiles extend it. Templates supply properties; scene files supply placement; AI supplies behavior. A model becomes a gameplay object through those connections.

**Player control is specialized.** Movement, aiming, acrobatics, psi abilities, and vehicles have their own control paths. These are not generic resource-loading concerns. They show where Ghost's specific requirements meet the shared engine.

**Mission logic calls into those systems.** `cGameScript` exposes functionality through 20 domain-specific binding modules. Its mission routines are compiled C++. Changing that code requires a rebuild; changing a data-driven parameter is a different matter. The binary reveals the runtime interface more clearly than the complete authoring workflow.

The surviving assets use Nihilistic's proprietary formats (`.nod`, `.nad`, `.nsd`, `.not`, ...). They reveal a distinct content pipeline, but not enough to reconstruct how the two studios exchanged work.

---

## What This Build Cannot Tell Us

The surviving build contains a D3D8 rendering backend, platform-specific modules, and an old Havok integration. A move to different hardware would require work in those areas. That does not tell me how much of the engine could have been retained, or whether a port would have been commercially worthwhile.

More importantly, this is a Nihilistic-era snapshot, not the final state of the later Swingin' Ape project. It cannot establish why the whole game was cancelled. The production histories provide context; the disassembly answers narrower implementation questions.

---

## What I Took Away

**An engine used for an RPG is not inherently unsuitable for an action game.** Resource loading, rendering, entity placement, and many other systems can serve both. Reuse becomes costly when a concrete assumption no longer fits the new requirements and changing it affects several connected systems.

When I discuss technical debt here, I mean the maintenance and adaptation costs of this particular implementation, not a rule against cross-genre engines. Legacy format compatibility, platform-specific rendering, and rebuilding compiled mission logic are places to examine those costs. None of them, alone, proves that NOD prevented Ghost from shipping.

For someone building a genre-agnostic engine, the useful question is which assumptions belong in shared infrastructure and which belong in the game. A reusable resource loader does not need to know whether the player is a vampire or a ghost operative. A player controller necessarily knows much more about the game it serves. That distinction is a design consideration, not a blueprint recovered from this binary.

I admire the developers' work. NOD is a useful snapshot of early-2000s engine development: explicit memory budgets, custom tools, and systems adapted as a project changed. My aim is to understand those choices without turning hindsight into certainty.

That's why I reverse engineer dead games: to learn from them, and to make sure the knowledge doesn't disappear.

---

## What's Next

[Part 2]({% post_url 2026-03-31-NOD-Engine-Architecture-Deep-Dive %}) follows the engine from startup to a running scene: loading resources, constructing entities, updating gameplay, and drawing the world. It explains the relationships I recovered, rather than walking through an engine implementation or a disassembly tutorial.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [Why Was StarCraft: Ghost Cancelled](https://www.rockpapershotgun.com/why-was-starcraft-ghost-cancelled), Rock Paper Shotgun, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- [NStigate Games (Nihilistic Software)](https://en.wikipedia.org/wiki/NStigate_Games), Wikipedia
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- Starev — StarCraft Ghost Reversed *(private, under development)*
