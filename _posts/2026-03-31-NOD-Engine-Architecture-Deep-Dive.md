---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 2"
description: "Following NOD from startup to a running scene: how resources, entities, simulation, and rendering connect in the surviving StarCraft Ghost prototype."
tags: reverse-engineering starcraft ghost nod-engine nihilistic disassembly
categories: reverse-engineering
---

The executable contains names for renderers, factories, templates, actors, and scripts. Listing them tells us what is present. Following a scene through them tells us how the engine works.

I wanted to trace that second path: how does a level on disk become a world Nova can move through?

---

## Following a Scene

[Part 1]({% post_url 2026-02-03-Reversing-Dead-Legend %}) introduced the project and the engine's broad structure. Here I follow one path through that structure: startup, level loading, entity construction, gameplay updates, and rendering.

This is a description of a recovered implementation, **not a tutorial for building an engine**. The names below come from the surviving debug executable, strings, and my reconstruction. The *Vampire: The Masquerade — Redemption* SDK provides useful comparisons, but it documents an earlier version of NOD, not Ghost's exact code.

Most of the architecture below is readable in the PC debug executable, `Star_d.exe`. The playable prototype targets Xbox. The two share engine concepts, but Win32 startup calls and DirectInput describe the PC path, not the Xbox implementation.

The route through the engine looks like this:

```text
Start the engine
  -> Load level geometry and resources
  -> Create and place entities
  -> Update input, gameplay, physics, and AI
  -> Draw the visible world and update audio
```

That is a reading map, not a complete call graph.

---

## Startup

In the PC executable, `WinMain` reads command-line options and configuration, then constructs `tSequence`. That object coordinates startup, the main loop, and shutdown.

The configuration filename is still `masquerade.ini`, inherited from *Vampire*. It is a clear trace of reuse, but an old filename is not itself a technical limitation.

Startup establishes the foundation first: debug output, memory, files, input, and timing. Rendering comes next, followed by game resources, entity and AI registries, and mission scripting. Later systems can then use services that are already available.

Two details helped me read the rest of the binary:

- **The debug allocator records where allocations came from.** Headers retain source locations and allocation identifiers; sentinel values and recognizable fill patterns help detect memory misuse. These are debugging aids, not guarantees that the build is free of memory errors.
- **Resource lookup repeatedly uses `stdHashtable`.** Models, templates, shaders, and AI types are registered by name or identifier. Recognizing that pattern made factory and loading code easier to follow.

Source-path strings also distinguish shared `std` modules from platform-specific `StdXbox` modules. They show an attempt to keep common services behind consistent interfaces. Directory names alone cannot establish how cleanly every platform dependency was isolated.

Once initialized, `tSequence` moves between menu, gameplay, cutscene, level-change, and exit states. The gameplay path coordinates input, simulation, drawing, audio, and UI. An ordered update path does not, by itself, prove deterministic behavior across runs.

---

## What a Level Loads

Loading a level means bringing several related files together. The most useful distinction is between the environment, the objects placed in it, and the definitions of those objects.

| File | Role in the scene |
|---|---|
| `.nil` | Level geometry, sectors, and related rendering data |
| `.nsd` | Entity placement and scene properties |
| `.not` | Templates describing entity types and their properties |
| `.nod` | Models used by those entities |
| `.nsa` | Material definitions |
| `.npd` | AI navigation data in Ghost |

A **sector** is a region of the world. Portals connect sectors and help determine which regions may be visible. `tWorld` holds the sectors and their relationships, along with entities, lighting references, and collision-related state.

The file layer, `stdFile`, resolves requests through typed search paths. It supports loose files and `.nob` archives, allowing game code to request a resource without having to choose its storage location. The development build's loose assets are particularly convenient for inspection.

Models, animations, and sounds can also be grouped in `.nmb`, `.nnb`, and `.nsb` bundles. Grouping resources helps manage level loading and memory on the Xbox's 64MB of shared RAM. It is one strategy used here, not the only possible way to stream a game.

The important connection is simple: **the level geometry does not contain the whole playable scene**. Placement data, templates, resources, navigation, and mission logic supply the rest.

---

## From a Template to a Marine

The central entity type is `tThing`. It carries identity, a transform, a sector relationship, and physics hooks. A transform describes an object's position and orientation.

The hierarchy then adds more specialized state:

```text
tThing                 identity, placement, physics hooks
  +-- tObject          model and animation-related state
        +-- tActor     health, team, perception, AI binding
        |     +-- tPlayer
        +-- tProp
        +-- tProjectile
        +-- tContainer
        +-- tSensor
        +-- tRegion
```

This is NOD's arrangement, not a recommendation that every engine use inheritance this way.

`gameTemplate` reads `.not` definitions. Templates inherit properties and select values such as a model, health, speed, team, and AI class. The recovered modifier table maps those properties to setter functions. In practical terms, much of the difference between two entity types is data applied to shared code.

`gameScene` reads the `.nsd` placement data. It supplies positions, rotations, sector assignments, and scene-wide properties such as fog and ambient lighting. `gameThing` maintains a GUID registry so gameplay systems can refer to entities by identifier rather than by name alone.

For a Marine placed in a level, these responsibilities line up:

| Question | Where NOD gets the answer |
|---|---|
| Where is it? | Placement in the `.nsd` scene |
| What does it look like? | A model selected through its template |
| Which properties does it start with? | The `.not` template |
| How does it react? | Its AI binding and runtime state |
| How can other systems refer to it? | Its GUID in the entity registry |

No single file contains the Marine as a complete gameplay object. Loading connects its definition, resources, and placement; the runtime supplies its behavior.

That separation is one of the more reusable ideas in this implementation. The specific actor properties and inheritance tree remain game-dependent.

---

## Updating the Marine and the Player

Once the scene exists, several systems act on it each frame.

**Player control chooses how Nova moves and interacts.** The simulation contains control paths for movement, aiming, acrobatics, psi abilities, and vehicles. These are specialized gameplay systems layered on top of the shared entity and world infrastructure.

**Physics handles physical interactions.** The build integrates Havok 2.1.0 through wrappers for world setup, collision filtering, and stepping. The camera also checks world geometry to avoid passing through walls. Recovering those interfaces does not recover every tuning decision behind them.

**AI combines entity state with perception and behavior.** `aiAwareness` represents stimuli with properties such as position, radius, intensity, and lifetime. Actor sight and hearing settings affect how those stimuli are evaluated. This gives a concrete place to investigate detection behavior rather than treating stealth as a single feature switch.

The distinction between code being present and code being used matters here. I identified 45 AI classes in the binary, but the recovered startup call registers 27. The remaining classes are evidence of additional implementation, not proof that every corresponding unit or encounter works in this build.

**Mission logic connects events to objectives and sequences.** `cGameScript` exposes functionality through bindings for entities, AI, physics, sound, cutscenes, and other systems. The mission routines are compiled C++, with a timer pool for delayed or recurring events. Scene data also supplies typed parameters.

Changing compiled mission code requires a rebuild. That is different from changing a parameter in a data file. Without the full development tools, I cannot say how every mission-editing task worked or how costly its iteration loop was.

Together, these systems explain the difference between a scene full of models and a playable level: objects have state, react to events, and participate in mission logic.

---

## Drawing What Changed

The renderer separates higher-level resource and scene work from the Direct3D 8 backend. Sector visibility narrows the world considered for drawing.

Opaque and transparent surfaces then follow different paths. An opaque surface can hide geometry behind it. A transparent surface must blend with what is already there, so drawing it in the wrong order changes the result. NOD uses a depth-sorted list for transparent surfaces, entities, and effects.

Materials select shader classes through a factory. Here, a **shader class** is an engine-side rendering implementation; it is not necessarily one GPU shader program. The registered types include ordinary surfaces, glass, water, cloak effects, and Nova's suit.

I found 44 registered material shader types. The useful point is the mechanism, not the count: a material name selects code that configures how a surface is drawn. Models and materials therefore meet at the renderer, after the loading and entity systems have established what is in the scene.

Materials also carry surface-sound information. That gives gameplay a way to distinguish, for example, metal footsteps from dirt footsteps using the surface definition. Playback still goes through the audio system; the material does not replace it.

The audio layer manages sound resources, voices, positional playback, and streams. Effects have their own definitions and pooled runtime objects. Those systems turn gameplay events into audible and visible feedback.

Our placed Marine now has a model to draw, state to update, and sound and effects to request. The same connections that made it an entity make its behavior visible and audible.

---

## What Reuse Looks Like Here

The comparison with *Vampire* shows both continuity and change. Shared resource patterns and template-driven construction survived. Model and level formats evolved. RPG-specific formats did not all carry over.

Even an extension can mislead: `.npd` meant particle definitions in the older SDK, but navigation data in Ghost. The older documentation is a starting point to check against the newer loaders, not a specification to apply unchanged.

There are limits to the reconstruction too. Parts of the `.nil` level files remain undecoded. Debug names reveal interfaces and organization more readily than authoring workflows or the reasons behind a design decision.

So the lesson is not that an RPG engine cannot support an action game. It is that **shared infrastructure and game-specific assumptions need to be examined separately**. NOD reused the former while changing substantial parts of the latter. The binary shows some of that adaptation, but cannot measure its total production cost.

---

## Where This Leads

We now have a route through the engine rather than a catalogue of every class: initialize services, resolve files, construct a world, update its entities, and present it.

[Part 3]({% post_url 2026-07-14-What-the-Data-Remembers-NOD-Engine-Part-3 %}) uses that understanding to inspect the surviving content. It asks a different question: what is actually present in this snapshot, and how much can that tell us about the game being made?

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- [NStigate Games (Nihilistic Software)](https://en.wikipedia.org/wiki/NStigate_Games), Wikipedia
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- NOD Engine SDK v1.0, Nihilistic Software, 2000 — file format specifications and authoring tools for *Vampire: The Masquerade — Redemption*
- Starev — StarCraft Ghost Reversed *(private, under development)*
