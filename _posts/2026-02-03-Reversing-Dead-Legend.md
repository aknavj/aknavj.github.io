---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 1"
tags: reverse-engineering starcraft ghost nod-engine nihilistic disassembly
categories: reverse-engineering
---

> Two years of late-night disassembly sessions on a leaked Xbox prototype. This is what I found inside the engine that powered Blizzard's most infamous cancelled game.

---

## A Brief History of a Long Failure

StarCraft: Ghost was announced on September 19, 2002 — a third-person stealth-action game that would put you behind the eyes of Nova, a Terran ghost operative, instead of the god's-eye view of the RTS.

The game was pitched to Blizzard by **Nihilistic Software**, a studio founded in 1998 by Ray Gresko, Robert Huebner, and Steve Tietze — LucasArts veterans who had shipped *Star Wars Jedi Knight: Dark Forces II*. Their first title as Nihilistic was *Vampire: The Masquerade — Redemption* (2000), built on a proprietary engine called **NOD**. When the Ghost contract came in, they brought that engine along.

What followed is one of the most documented development disasters in gaming history. [Polygon's exposé](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong) and Jason Schreier's *Play Nice* cover it thoroughly. The short version:

- **2001** — Development begins. Monthly cheques from Blizzard, no fixed deadline.
- **2002** — Playable build at Tokyo Game Show. Blizzard keeps adding features. Splinter Cell ships and suddenly every feedback session mirrors it.
- **2003–2004** — Levels feel cobbled together from different games. Story rewritten multiple times. Nihilistic is looking for an exit.
- **Mid-2004** — Nihilistic ceases work. Blizzard hands the project to **Swingin' Ape Studios**.
- **2005** — Blizzard acquires Swingin' Ape. BlizzCon demo looks promising — but World of Warcraft has launched and is devouring every available resource.
- **2006** — Indefinitely postponed. Xbox 360 and PS3 are arriving. Ghost targets Xbox, PS2, and GameCube — already obsolete hardware.
- **2014** — Mike Morhaime quietly uses the word "cancelled."

In February 2020, a functional build from Nihilistic's era leaked online: an original Xbox prototype with a PC debug executable (`Star_d.exe`), working levels, models, and character data — debug symbols still partially intact. Being a development build, all assets sit unpacked as loose files on disk rather than bundled into `.nob` archives. Every model, texture, map, and template file is immediately browsable without writing an unpacker first.

The leak only covers the Xbox and D3D8 codebase. PS2 and GameCube ports were reportedly in development, and it would be fascinating to see how those were implemented — radically different hardware, likely a fair amount of duplicated effort solving the same problems on each platform. But for now, Xbox is what we have.

---

## Why Bother?

I started **Starev** — my reverse engineering effort on the NOD engine, currently private and under development — about two years after the leak. Not to resurrect the game. Not to ship anything. To understand how an early-2000s game engine was put together — and to see firsthand why this particular project collapsed.

The NOD engine was built between 1998 and 2000 for a PC RPG, then carried into 2001–2004 for a multi-platform console action game it was never designed for. The codebase reflects that journey: heavy C foundations with C++ appearing mid-stream as the team experimented during development. If you've read through the [Rebellion AVP source code](https://github.com/aknavj/avp), you'll recognize the pattern — raw, low-level, functional, with object-oriented structures surfacing in unexpected places.

Nihilistic rose from legends who brought us *Dark Forces*. That pedigree is impressive — but I think it also became their Achilles' heel. They didn't start on a greenfield. They carried their existing engine forward, and that decision cost the project dearly.

Back in 2004, like many StarCraft fans, I was thrilled when the E3 trailer dropped — excited enough to start saving for a PS2 just to play it. All my early 3D graphics experiments from that point were aimed at trying to recreate the Ghost universe. I just wanted to play the thing so badly. You can imagine how I felt diving into the Xbox leak almost 16 years later, armed with actual experience in the field — a far cry from the 13-year-old me who could only watch trailers and dream.

---

## The Binary

`Star_d.exe` is a Win32 debug-compiled executable. It doesn't run correctly out of the box — but that's exactly why it's useful. Debug builds are far easier to read in a disassembler. Function names survive. Structures are transparent. The compiler hasn't scrambled everything for speed.

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
|  +- direct/    D3D8 backend + 44-type shader system         |
+------------------------------------------------------------+
|  misc/         Audio classes: cSound, cVoice, cStream       |
+------------------------------------------------------------+
|  math/         Vectors, matrices, trig (SSE), intersection  |
+------------------------------------------------------------+
|  std/          Foundation: memory, files, NOB archives,     |
|                hashtable, input, audio mixer, timing, debug |
+------------------------------------------------------------+
```

The same patterns recur at every layer: `stdHashtable` for resource lookup, reference counting with free lists, and bundled archives (`.nmb`, `.nnb`, `.nsb`) for level-atomic asset streaming. The config parser still reads `masquerade.ini` — a filename inherited directly from *Vampire: The Masquerade — Redemption*. Nobody renamed it. The vampire's config file lives inside the NOD's StarCraft Ghost engine.

On paper, a textbook architecture. In practice, the details tell a different story.

---

## What Stands Out

I'll save the subsystem-by-subsystem breakdown for a follow-up article. At the architecture level, after two years of reconstruction, here's what I see.

**The renderer is competent.** A D3D8 backend with a 44-type shader factory, 42 vertex shaders at 4 LODs each, 12 pixel shaders, and a material system that ties rendering to audio — a shader defines what a surface *looks like* and what it *sounds like* when you walk on it. For 2001, solid work.

**`tWorld` is sector-based.** The world is divided into sectors, each carrying its own geometry, portal links to neighbors, and surface groups tied to shaders. Sectors are the spatial unit: streaming, visibility, and collision all operate at sector granularity. It's a classic portal-based partition, not unlike Quake's BSP leaves, but with Nihilistic's own level format and tooling behind it.

**Everything is a `tThing`.** The central entity type carries a GUID, transform, sector link, and physics interactions. Objects, actors, props, projectiles all inherit from it. AI classes attach to a `tThing` to define behavior — movement, awareness, reactions — while `tThing` itself handles the physics side: collision responses, Havok integration, spatial queries. Each `tThing` lives inside a sector, and `tWorld` owns the relationship between the two.

**The scope is enormous.** 40+ AI class types across three StarCraft factions plus boss fights. Six player control modes: combat, acrobatics, sniping, psi powers, Siege Tank, Vulture hover-bike. 30+ effect types with an 800-instance cap and 250KB memory budget. Three target platforms.

Three full factions, boss fights, vehicle systems — all for a stealth-action game that couldn't decide if it wanted to be Splinter Cell or Halo.

**Scripting is compiled C++.** `cGameScript` is a standalone gameplay system that defines behavior and events for maps and entities, with 20 domain-specific binding modules. It works — but it's compiled code. No Lua, no bytecode, no hot-reloading. Every gameplay tweak means a recompile. When your publisher is constantly requesting changes, that iteration cost compounds.

**No integration with Blizzard's pipeline.** The engine uses proprietary Nihilistic formats (`.nod`, `.nad`, `.nsd`, `.ntb`...) instead of Blizzard's `.mpq`-based toolchain. Every asset flowed through Nihilistic's own pipeline, completely disconnected from Blizzard's workflows.

---

## Why It Could Never Be Saved

When Ghost was indefinitely postponed in 2006 — and silently cancelled in 2014 — Blizzard reportedly considered bringing it to Xbox 360 and PS3. Having spent two years inside this codebase, I can see why that didn't happen.

The rendering backend is hard-wired to D3D8. The platform layer is a source fork, not a clean abstraction. The physics middleware is a dead version of Havok. A next-gen port wouldn't be a port — it would be a rewrite.

No individual system is terrible. Many parts are competently engineered. But the whole doesn't cohere into the game it's supposed to be. An engine built for a PC RPG was asked to run a multi-platform console action game with three factions, vehicles, stealth, multiplayer, and six camera modes. The foundation never matched the ambition.

---

## What I Took Away

Carry-forward engines are a gamble. Reusing VtMR's codebase saved months upfront, then cost years as every original design assumption became a constraint on the new project.

Scope without focus kills. The sheer number of AI types, control modes, effect systems, and platform targets is impressive on paper — and impossible to ship when the team can't agree on what the game *is*.

Outsourced development compounds every problem. Incompatible asset pipelines, compiled-only scripting, no shared tools. Every iteration loop carries friction that an in-house team never faces.

None of this is meant to disparage the developers. I admire them. The NOD engine is a time capsule of how games were built when C++ was still new, when 64MB of RAM was generous, and when a 44-type shader system on D3D8 was cutting edge. The people who built engines like this are the reason we have the tools and techniques we use today.

That's why I reverse engineer dead games. Not to judge, but to learn — and to make sure the knowledge doesn't disappear.

---

## What's Next

This article covers the *why* and the *what*. The follow-up gets into the *how* — the NOD engine's subsystems: memory, shaders, the entity hierarchy, AI, the boot sequence, and 15+ proprietary file formats. If you're interested in how to approach reversing a game engine binary from scratch, that's where the real fun starts.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [Why Was StarCraft: Ghost Cancelled](https://www.rockpapershotgun.com/why-was-starcraft-ghost-cancelled), Rock Paper Shotgun, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- [NStigate Games (Nihilistic Software)](https://en.wikipedia.org/wiki/NStigate_Games), Wikipedia
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- Starev — StarCraft Ghost Reversed *(private, under development)*
