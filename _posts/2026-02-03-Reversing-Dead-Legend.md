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

What followed has been well-documented. [Polygon's exposé](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong) and Jason Schreier's *Play Nice* cover it in detail. The short version:

- **2001** — Development begins. Monthly cheques from Blizzard, no fixed deadline.
- **2002** — Playable build at Tokyo Game Show. Blizzard keeps adding features. *Splinter Cell* ships, and comparisons to it start dominating every feedback session.
- **2003–2004** — Levels feel cobbled together from different games. Story rewritten multiple times. Nihilistic is looking for an exit.
- **Mid-2004** — Nihilistic ceases work. Blizzard hands the project to **Swingin' Ape Studios**.
- **2005** — Blizzard acquires Swingin' Ape. The BlizzCon demo looks promising — but *World of Warcraft* has launched and is absorbing every available resource.
- **2006** — Indefinitely postponed. Xbox 360 and PS3 are arriving. Ghost targets Xbox, PS2, and GameCube — already obsolete hardware.
- **2014** — Mike Morhaime quietly uses the word "cancelled."

In February 2020, a build from Nihilistic's era leaked online: a functional Xbox prototype and a broken PC debug executable (`Star_d.exe`), with working levels, models, and character data — debug symbols still partially intact. Because it's a development build, every model, texture, map, and template sits unpacked on disk as loose files instead of bundled `.nob` archives, so nothing needs to be extracted before you can start reading it.

The leak only covers the Xbox and D3D8 codebase. PS2 and GameCube ports were reportedly in development — radically different hardware, and presumably a lot of duplicated effort solving the same problems per platform — but none of that code has surfaced. Xbox is what we have.

---

## Why Bother?

I started **Starev** — my reverse engineering effort on the NOD engine, currently private and under development — about two years after the leak. The goal was never to resurrect the game or to ship anything. I wanted to understand how an early-2000s game engine was put together, and to see firsthand why this particular project collapsed.

The NOD engine was built between 1998 and 2000 for a PC RPG, then carried into 2001–2004 for a multi-platform console action game it was never designed for. The codebase reflects that journey: heavy C foundations with C++ appearing mid-stream as the team experimented during development. If you've read through the [Rebellion AVP source code](https://github.com/aknavj/avp), you'll recognize the pattern — raw, low-level, functional, with object-oriented structures surfacing in unexpected places.

Nihilistic's founders had shipped *Jedi Knight* at LucasArts, and I think that experience cut both ways. Rather than starting from scratch for Ghost, they carried their existing engine forward — and the cost of that decision shows up throughout this article.

Back in 2004, like many StarCraft fans, I was thrilled when the E3 trailer dropped — thrilled enough to start saving for a PS2 just to play it. Most of my early 3D graphics experiments were attempts to recreate the Ghost universe. Sixteen years later, the leak finally gave me the chance to look inside the real thing.

---

## The Binary

`Star_d.exe` is a Win32 debug-compiled executable. It doesn't run correctly out of the box, but for disassembly that barely matters — debug builds keep their function names, leave structures transparent, and skip the optimization passes that scramble release code.

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

There is nothing wrong with this layering — it's textbook. The problems live inside the individual subsystems, and that's what the rest of this series digs into.

---

## What Stands Out

I'll save the subsystem-by-subsystem breakdown for a follow-up article. At the architecture level, after two years of reconstruction, here's what I see.

**The renderer is competent.** Every material type is its own shader class with its own render path — glass, lava, the cloak effect, the ghost suit's shimmer each get dedicated code instead of flags on a generic shader. Materials also carry a surface sound type, so a shader defines both what a surface *looks like* and what it *sounds like* when you walk on it. For 2001, solid work.

The world is sector-based. Each sector carries its own geometry, portal links to neighbors, and surface groups tied to shaders. Streaming, visibility, and collision all operate at sector granularity — a classic portal-based partition, not unlike Quake's BSP leaves, but with Nihilistic's own level format and tooling behind it.

**Everything is a `tThing`.** The central entity type carries a GUID, transform, sector link, and physics interactions. Objects, actors, props, projectiles all inherit from it. AI classes attach to a `tThing` to define behavior — movement, awareness, reactions — while `tThing` itself handles the physics side: collision responses, Havok integration, spatial queries. Each `tThing` lives inside a sector, and `tWorld` owns the relationship between the two.

**The scope is enormous.** The binary carries more than 40 AI classes across three factions plus bosses, player control modes for everything from stealth and acrobatics to piloting a Siege Tank or a Vulture hover-bike, dozens of effect types, and three target platforms — all for a stealth-action game that couldn't decide whether it wanted to be *Splinter Cell* or *Halo*.

**Scripting is compiled C++.** `cGameScript` is a standalone gameplay system that defines behavior and events for maps and entities, with 20 domain-specific binding modules. It works, but there is no interpreter and nothing to hot-reload — every gameplay tweak means recompiling the game. With a publisher constantly requesting changes, that iteration cost compounds.

There's also no integration with Blizzard's pipeline. Every asset flowed through Nihilistic's proprietary formats (`.nod`, `.nad`, `.nsd`, `.not`, ...) and Nihilistic's own tools, entirely separate from Blizzard's `.mpq`-based workflow.

---

## Why It Could Never Be Saved

When Ghost was indefinitely postponed in 2006 — and silently cancelled in 2014 — Blizzard reportedly considered bringing it to Xbox 360 and PS3. Having spent two years inside this codebase, I can see why that didn't happen. The rendering backend is hard-wired to D3D8, the platform layer is a source fork rather than a clean abstraction, and the physics middleware is a dead version of Havok. Moving that to new hardware would have meant rewriting most of the engine.

Most of these systems are solid work in isolation. Together, though, they amounted to an engine built for a PC RPG carrying a multi-platform console action game with three factions, vehicles, stealth, and multiplayer. The foundation was never going to hold all of that.

---

## What I Took Away

Reusing the VtMR codebase saved Nihilistic months upfront and cost them years afterward, as design assumptions from the RPG hardened into constraints on the action game.

The sheer number of AI types, control modes, effect systems, and platform targets is impressive on paper — and unshippable when nobody can agree on what the game actually *is*.

Outsourced development made all of it worse. Incompatible asset pipelines, compiled-only scripting, no shared tools — every iteration loop carried friction that an in-house team would never face.

None of this is a knock on the developers — I genuinely admire them. The NOD engine is a time capsule of how games were built when C++ was still new, 64MB of RAM was generous, and D3D8 was the modern API.

That's why I reverse engineer dead games: to learn from them, and to make sure the knowledge doesn't disappear.

---

## What's Next

The follow-up digs into the subsystems themselves — the boot sequence, the debug memory allocator, the shader factory, the entity hierarchy, the AI class system, and more than twenty proprietary file formats. If you're interested in how to approach reversing a game engine binary from scratch, that's where it gets practical.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [Why Was StarCraft: Ghost Cancelled](https://www.rockpapershotgun.com/why-was-starcraft-ghost-cancelled), Rock Paper Shotgun, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- [NStigate Games (Nihilistic Software)](https://en.wikipedia.org/wiki/NStigate_Games), Wikipedia
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- Starev — StarCraft Ghost Reversed *(private, under development)*
