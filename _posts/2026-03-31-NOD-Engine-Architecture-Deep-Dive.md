---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 2"
description: "A technical deep dive into the NOD engine architecture — boot sequence, debug memory allocator, shader factory, entity hierarchy, AI class system, simulation layer, audio pipeline, effect system, and 23 proprietary file formats reverse-engineered from a leaked Xbox prototype."
tags: reverse-engineering starcraft ghost nod-engine nihilistic disassembly
categories: reverse-engineering
---

> Part 1 covered the history and the high-level architecture. This one gets into the subsystems — how they're built, how they connect, and what the disassembly actually reveals.

---

## How It Wakes Up

The entire engine boots from a single constructor call. `WinMain` parses command-line options — resolution, window mode, level override — then reads `masquerade.ini` through `stdConfig`, a holdover configuration filename inherited directly from *Vampire: The Masquerade — Redemption*. After config parsing, `WinMain` constructs `tSequence`, and that one constructor brings every subsystem online in dependency order.

```
WinMain
  +-- mainOptions_ParseCommandLine()
  +-- stdConfig_Load("masquerade.ini")
  +-- tSequence::tSequence()
  |     +-- stdDebug_Startup()               (assert/trace output)
  |     +-- stdMemory_Open()                 (debug allocator)
  |     +-- stdFile_Startup()                (32 file types, NOB archives)
  |     +-- stdInput_Startup()               (DirectInput 8)
  |     +-- stdTime_Startup()                (QueryPerformanceCounter)
  |     +-- renderMain_Startup()
  |     |     +-- renderModel_Startup()       (model hashtable, 0x200 bins)
  |     |     +-- renderKeyframe_Startup()    (animation hashtable)
  |     |     +-- rlMain_Open()              (D3D8 device, base 640x480)
  |     +-- gameLib_Startup()
  |     |     +-- gameVoice_Startup()
  |     |     +-- gameTemplate_Startup()      (template hashtable, 0x200 bins)
  |     |     +-- gameThing_Startup()         (GUID hashtable, 0x400 bins)
  |     |     +-- aiMain_Startup()
  |     |           +-- aiClass_Startup()     (registers 27 AI types, 0x3F bins)
  |     +-- scriptMain_Startup()              (256-entry timer pool)
  |
  +-- tSequence::MainLoop()
  |     state machine:
  |       IDLE -> MAIN_MENU -> START_SINGLE_PLAYER
  |            -> PLAY_CUTSCENE -> CHANGE_LEVEL -> QUIT_GAME
  |     per frame:
  |       stdInput_Update()
  |       simUpdate()                        (physics, combat, AI)
  |       tWorld::Draw()                     (portal cull, sort, render)
  |       cStdMixer::Update()               (audio mix)
  |       uiUpdate()                         (HUD)
  |       renderMain_EndFrame()              (present)
  |
  +-- ~tSequence()                           (reverse order)
```

Debug before memory. Memory before files. Files before input. Each layer can only call into the layers below it. After the foundation, the renderer comes up — `renderModel_Startup()` creates its hashtable for model lookup, `renderKeyframe_Startup()` does the same for animations, and `rlMain_Open()` initializes the Direct3D 8 device at a base resolution of 640×480. Then the game layer: voices, templates, the entity factory, and the AI class registry. Finally, the script system with its 256-timer pool for mission logic.

**The main loop is a state machine wrapping a fixed pipeline.** `tSequence::MainLoop()` drives a game state machine — `IDLE` through `MAIN_MENU`, `START_SINGLE_PLAYER`, `PLAY_CUTSCENE`, `CHANGE_LEVEL`, and `QUIT_GAME`. Within the play state, every frame runs the same fixed sequence — read input, step the simulation (physics, combat, AI), draw the world through the portal system, update audio, update the HUD, flip the backbuffer. No job system, no parallel dispatch. A straight pipeline on a single thread.

**Shutdown is the exact reverse.** `~tSequence()` tears down scripts first, then game systems, the renderer, and finally the foundation — last in, first out. The engine is fully deterministic from boot to exit. If something leaks, `stdMemory` tells you exactly which allocation survived and who made it.

---

## The Foundation

**The foundation layer has a platform split.** Debug strings in the binary reveal two source paths: `C:\star\Code\std\` for shared modules and `C:\star\Code\StdXbox\` for the Win32/Xbox platform layer. The split is clean — `stdHashtable`, `stdConfig`, and `stdDebug` are platform-independent. `stdMemory`, `stdFile`, `stdInput`, and `stdMixer` have platform-specific implementations. This is how you build a portable engine in 2001 without `#ifdef` chaos — separate directories, same API headers.

`stdMemory` tells you a lot about how Nihilistic debugged. Every allocation gets a header — serial number, GUID (monotonic counter), source file and line (`__FILE__`, `__LINE__`), a doubly-linked list pointer for walking all live allocations, a self-validation pointer, and sentinel values (`0x12345678`) at both ends. Fresh memory fills with `0xCC`. Freed memory overwrites with `0xDD`. Touch an uninitialized variable and you get a recognizable pattern instead of random garbage. Stomp past a buffer and the sentinel catches it on the next pass. I also found a hard-coded GUID breakpoint at allocation 5886 — someone was hunting a specific bug and left the trap in the binary.

The other thing you run into constantly is `stdHashtable` — a chained hash table with string or integer keys, auto-sized to the next prime at creation. Models, templates, the GUID registry, the shader factory, AI classes, sound resources, keyframes. If you need to find something by name in this engine, you're going through one of these.

**The file system is a virtual I/O layer with typed search paths.** `stdFile` manages 32 file type categories, each with its own search directory stack — animations, models, templates, sounds, cutscenes, each mapped to a different base path. When the engine requests a file by type, `stdFile` walks the appropriate directory stack, checking loose files first, then falling back to `.nob` archives — ZIP-format packages with a hashtable directory for constant-time lookup. The development build has everything unpacked as loose files. A shipping build would bundle them into `.nob` archives, and the game code wouldn't know the difference.

Resource management follows one pattern everywhere — reference counting with fixed-size free lists. `AddRef()` on acquire, `Free()` on release. When the refcount hits zero, the object doesn't deallocate — it goes onto a free list. Next request for the same resource gets served from there before touching disk. This is why level transitions are fast: free the whole bundle, and the free list absorbs the churn.

**The only official documentation for any of this is the NOD Engine SDK v1.0**, shipped with *Vampire: The Masquerade — Redemption* in 2000. Nihilistic released it as an unsupported modding kit — a level editor called **Embrace** (built on id Software's QERadiant), a Maya export plugin (`nodExport.mll`), a template editor, and file format specifications for most of the engine's binary and text formats. The SDK confirms the naming: the engine is named after the Book of Nod from White Wolf's game system, while the `.nod` file extension stands for Nihilistic Object Description. Comparing the VtMR specs against what I've reconstructed from the Ghost binary reveals how far the formats evolved between 2000 and 2004 — and what stayed exactly the same.

---

## The Shader Factory

The renderer splits into two layers, which you can see from the source paths in the debug strings. `render/` handles high-level resource management — model loading with ref-counted hashtables and free lists, keyframe animation, terrain, and a light style system with per-frame callbacks for animated lighting. `render/direct/` is the Direct3D 8 backend.

**`cShader` holds up to four texture stages,** a sub-shader pointer for multi-pass rendering, and a virtual render pipeline. The factory maintains two hashtables — one for the 44 registered shader types, one for live shader instances. When the engine needs a material, it resolves the class by name, instantiates through the factory, and the new instance enters the instance table for reuse.

**44 shader types are registered.** Each is its own class with its own render method, state setup, and texture stage configuration.

| Category | Shader Types |
|---|---|
| Standard | `default`, `detail`, `fullbright`, `masked`, `alpha`, `add`, `blend` |
| Environment | `envmap`, `glossenvmap`, `glossenvmapdetail`, `metalenvmap`, `metalgloss` |
| Bump Mapping | `bump`, `bumpenv`, `bumpenvmetal`, `embump` |
| Transparency | `glass`, `etchedglass`, `etchedmasked`, `invis`, `cloak` |
| Animated | `anim`, `dynamic`, `pageflip` |
| Sky / Water | `sky`, `skybox`, `water`, `bumpwater`, `lava` |
| Special FX | `glow`, `scanline`, `sight`, `lockdown`, `lockdownredux`, `silhouette`, `ghostsuit`, `speed`, `psishieldhit`, `lightvolume`, `fogcolor`, `membrane`, `motionblur`, `teleport`, `screeneffect` |

**Models use three vertex formats** to balance memory against visual fidelity. The baseline carries position, normal, and UV. The second adds a vertex color channel for baked lighting. The third adds tangent-space data for bump mapping. Each model also carries a bounding box, bone hierarchy, and marker points for attachment slots. The loader enforces a minimum file version of 10 — every VtMR-era model (version 7) is incompatible without re-export.

Every shader type also includes a surface sound enum — `METAL`, `WOOD`, `DIRT`, `STONE`, and so on. When Nova walks on a surface, the renderer doesn't need to query a separate audio system — the material already carries the foley type. In VtMR this was handled separately through NAG files (Nihilistic Audio Group), which mapped gameplay events to sound files per object type with separate modes for every surface and impact material. For Ghost, Nihilistic folded it directly into the shader. One lookup instead of two, and zero risk of the audio and visual surface types falling out of sync.

**The rendering pipeline sorts before it draws.** `tSortList` maintains a depth-sorted queue with three entry types — surface groups, things, and effects. Every visible sector pushes its transparent surfaces and entities onto the sort list; after all sectors are traversed, the list renders back-to-front in one pass. Opaque geometry renders front-to-back per sector. This is the classic portal-engine split: opaque first for early-Z rejection, transparent sorted globally.

**The shadow pipeline offers six quality levels** — from blob drop-shadows to full hardware-accelerated shadows. `tRenderOptions` also exposes a rich set of debug flags that survive in the build — wireframe, color-coded sectors, freeze visibility, vertex-only lighting, among others. These exist because it's a development build — and they reveal exactly what the developers needed to diagnose during production.

**42 vertex shader programs,** each compiled at four LOD levels, loaded from disk on demand. Twelve pixel shader programs handle the complex surface types — bump reflections, ghost suit Fresnel, lava, animated water normal mapping. Everything else falls back to fixed-function multi-texturing. For Xbox hardware in 2002, this is a well-budgeted split.

---

## The Entity Hierarchy

**`tThing` is the base entity class.** Every entity in the game inherits from it — a GUID, a name, a 4×3 transform, a sector link, and hooks for Havok physics. `tObject` adds a model instance, modifier state, foley binding, and motion playback. From there the hierarchy branches:

```
tThing  (GUID, name, transform, sector link, physics hooks)
  +-- tObject  (+model, modifiers, foley, motion)
        +-- tActor       (+health, psi, AI, speed, team, sight/hearing)
        |     +-- tPlayer  (+weapons[4], ammo[2], inventory, powers, calldowns)
        +-- tProp         (static/interactive props)
        +-- tProjectile   (projectiles)
        +-- tContainer    (lootable containers)
        +-- tSensor       (trigger volumes)
        +-- tRegion       (spatial trigger zones)
```

The thing type enum defines thirteen IDs, but three — Camera (type 1), Effect (type 5), and Light (type 10) — are unsupported. They were likely active entity types in VtMR that became dedicated subsystems in Ghost. Camera entities became `simCamera`. Effects became `cEffectManager` with its own pooled allocation. Lights became the sector-embedded render light array. The enum slots remain allocated; the factory refuses to instantiate them.

**`tActor` adds AI-specific state** — health, psi energy, speed, sight distance, hearing distance, AI binding, a vox set for bark audio, and faction affiliation. `tPlayer` extends it with weapon slots (melee, gauss rifle, katana, psi blade), ammo pools, first-person weapon models, psi power slots, inventory, and orbital calldown slots.

**The entity factory is `gameThing`.** A GUID registry backed by a `stdHashtable`. When the world loads, every entity gets a GUID and a slot in the hashtable. Any system — AI, scripting, physics — can look up any entity by GUID in constant time. The factory also supports spawning — `gameThing_Spawn()` creates a new entity from a template and attaches it to a parent, used for projectiles, dropped items, and dynamically created props.

**`gameTemplate` drives entity construction.** Template files (`.not`) define entity types through an inheritance tree — 1224 templates descending from eight root classes (`_ACTOR`, `_EFFECT`, `_PROJECTILE`, `_PROP`, `_REGION`, `_SENSOR`, `_UIELEMENT`, and a base). The VtMR SDK shipped a dedicated NOT Editor for authoring these files, with one critical requirement documented in the readme: `global.not` must be loaded first, or the inheritance chain breaks. Ghost's `global.not` grew to 1224 templates, but the mechanism is the same — a 177-entry modifier table where each entry maps a property ID to a setter function on the target entity. Model path, health, speed, AI class, team, scale — every attribute that makes a Marine different from a Zealot is just a different modifier value in the template. It's a hand-rolled property reflection system — data-driven entity creation, built before any C++ engine had runtime reflection as a standard feature.

`gameScene` loads `.nsd` files — entity positions, rotations, sector assignments, model references. Each scene also packs in global rendering state: sun direction, ambient color, fog, skybox, environment maps. There are typed spawn points for player starts, conversation starts, and AI interest spots. The loader rejects anything below scene version 9.

`tWorld` holds everything together — the sector array, portal links, terrain references, lightmap and environment map arrays, player start points, interest spots, and three entity lists: active, inactive, and hibernating. That three-list design is a streaming trick. Entities in visible sectors are active. Entities in adjacent sectors stay loaded but inactive. Everything else hibernates. When portal visibility changes, entities move between lists with a pointer swap — no allocation, no deserialization. The world also owns a Havok `GeometricPrimitive` for level-wide collision clipping, and tracks initial GUID values for both entity and script systems to keep serialization consistent across save/load.

---

## The AI Class System

**`cAIClass` is a factory base with one virtual method:** `NewInstance()`. Each AI class carries a name, a prototype pointer, and a reference count, stored in a hashtable capped at 128 classes. Intermediate base classes define locomotion — `aiClassBaseWalker` for ground infantry, `aiClassBaseFlyer` for air units, `aiClassBaseVehicle` for ground vehicles, `aiClassBaseFloorGun` for turrets, boss-specific bases for the Goliath and Brain encounters, and `aiClassBaseWanderer` for patrol loops.

**45 AI classes span five factions.**

| Faction | Count | AI Classes |
|---|---|---|
| Terran | 14 | Marine, MarineSidekick, MarineTurret, Firebat, LightInfantry, Rebel, SCV, SCV121, Ghost, GhostClose, Scientist, Vulture, Goliath, SiegeTank |
| Protoss | 9 | Zealot, Purifier, Dragoon, HighTemplar, Observer, Scout, Cannon, Pylon, ShieldBattery |
| Zerg | 10 | Zergling, ZerglingRushing, Hydralisk, InfestedTerran, Scourge, TankCritter, Flyer, Pustule, Spore, SunkenColony |
| Bosses | 7 | BossGoliath, BossBrain, BossLurker, BossTanagazj, BossUltralisk, BossHauler, BossSniper |
| Utility | 5 | Camera, Turret, Detector, Mine, DemoAnims |

At startup, `aiClass_Startup()` registers 27 of these into the factory. The remainder — fully implemented C++ classes with complete behavior — exist in the binary but aren't wired into the registration call. Cut content, deferred work, or dead code. The disassembly doesn't say why.

Perception runs through `aiAwareness`, which manages two fixed arrays — eight instant events and eight recurring events — each carrying event type, 3D position, perception radius, stimulus intensity, falloff rate, repeat interval, source and target GUIDs, and an expiration time. When Nova fires a weapon, an instant event spawns at her position with radius and intensity proportional to the weapon type. When a Marine patrols, a recurring event ticks on its interval. AI entities sample these against their sight and hearing distances to decide if they've detected a threat. This is how Ghost's stealth works at the lowest level: the cloak reduces Nova's event intensity, and the Marine's perception check either clears the threshold or it doesn't.

`aiVox` handles the bark system — 40 distinct voice line types split into three categories: single-AI (a unit reacting to its own state), AI-to-AI (one unit calling out to another), and player-event (a unit reacting to something the player did). A global cooldown prevents cross-talk — no two AI voices can overlap within 1.5 seconds — and each actor has its own per-actor cooldown on top of that. Bark requests carry a probability parameter, so callouts fire stochastically, not every time.

**`aiEffects` spawns visual effects on AI state changes** — shields flaring, lockdown sparks, psi energy flashes. The entire AI stack — classes, perception, barks, effects — wires up from a single factory call at startup.

---

## The Simulation Layer

**The player control system is a 47-state machine.** `cPlayerControl` inherits from `cControl` and dispatches per-state update functions — idle, walk, run, crouch-idle, crouch-walk, fall, jump, first-person, gun-aim, sniper scope, ground pound, and dozens of transitional states between them. Each locomotion state carries its own speed blend constant and analog dead zone. The state machine handles fidget animations — if the player stands still long enough, Nova shifts her weight or adjusts her grip.

Six control modes effectively rewire how the player interacts with the game. `simControlCombat` is standard third-person shooting. `simControlAcro` takes over for jumping, climbing, wall-running. `simControlSniper` locks into a scope. `simControlSpecial` handles psi abilities. `simControlVulture` and `simGoliathControl` pilot the hover-bike and mech respectively, each with its own physics model. `simControlZTarget` adds lock-on targeting. Mode switches happen based on gameplay state, not direct player input — the system figures out which mode you should be in.

**Physics runs through Havok 2.1.0.** `simPhysics` manages the Havok world lifecycle — startup, per-level initialization with collision group setup, per-frame stepping, and shutdown. Nine collision groups separate the player body, player feet, projectiles, sensors, and AI actors. The physics step is clamped to prevent tunneling on frame drops, and deformable body simulation runs at a fixed sub-step rate. The Havok integration lives in `game/gamelib/havok/` with dedicated wrappers for collision filtering, mass adjustment, and shape caching.

The camera has its own collision system. `tSimCamera` does per-frame checks against world geometry with skin, minimum distance, and repositioning thresholds to keep it from clipping through walls. It's sector-aware and uses portal visibility to decide what to render. Full-screen effects — flash, fade — draw as a screen-aligned quad.

The rest of the simulation splits across focused modules — ragdoll for death and hit reactions, a spring chain for hair and cloth physics, AI steering for pathfinding, water interaction, damage and hit detection, aim tracking for auto-aim and turrets. All of it runs through `simUpdate()`, one call per frame.

---

## Sound and Effects

The audio stack sits between `stdMixer` (the platform layer) and the game. `cVoice` is the base playback object — volume, pitch with random variation, pan, fade state. `c3dVoice` adds positional audio with distance attenuation and listener-relative panning. `cSound` wraps the actual audio resource with reference counting and LRU eviction when memory gets tight. `cSoundBundle` loads grouped sounds from `.nsb`/`.xsb` files so an entire level's audio can be loaded and freed as one unit. `cStream` handles music and dialog — fading, channel assignment, queuing.

The effect system has a hard 250KB memory budget and a pool of 800 concurrent slots. `cEffectManager` prioritizes — particles and footprints get evicted when the budget runs out; psi shield hits and explosion flashes don't. Definitions come from `game.nfx`, a text block format with over 1100 entries and 144 controllers. The types are what you'd expect — particle systems, explosions, energy beams, psi effects, trails, motion blur, lightning arcs, heat shimmer, footprints. A recycled mesh pool handles debris without per-frame allocation, and a laser sight subsystem tracks Nova's targeting overlay.

`cGameScript` isn't interpreted — it's compiled C++ exposing engine functionality through 20 domain-specific binding modules covering entities, AI, physics, world, cutscenes, sound, and system utilities. A timer pool handles delayed and recurring mission events. Script parameters are typed — integer, float, enum, string, boolean, reference — and loaded from `.nsd` scene files alongside entity data. No Lua, no bytecode, no hot-reloading. Every gameplay tweak means a full recompile.

---

## Twenty-Three Formats

Every proprietary format starts with N. Nihilistic's naming convention is consistent to a fault — makes identifying their files trivial in a hex editor.

| Extension | Type | Content |
|---|---|---|
| `.nod` | Binary | 3D model — skeleton, materials, six vertex types, indexed meshes, bone palettes |
| `.nad` | Binary | Skeletal animation — cubic polynomial keyframes per bone track |
| `.nil` | Binary | Indoor level — sector/portal geometry, baked lighting, lightmaps |
| `.nsd` | Binary | Scene data — entity positions, rotations, sector assignments, model refs |
| `.not` | Binary | Entity templates — 1224 definitions in an eight-root inheritance tree |
| `.nfx` | Text | Effect definitions — particle systems, energy beams, explosions |
| `.nsa` | Text | Shader archive — material properties in Quake 3 style syntax |
| `.nob` | Binary | Asset archive — ZIP format with hashtable directory |
| `.nmb` | Binary | Model bundle — multi-LOD model variants for level streaming |
| `.nnb` | Binary | Animation bundle — paired 1:1 with `.nmb` bundles |
| `.nsb` | Binary | Sound bundle — grouped audio for level-atomic load/free |
| `.noc` | Binary | Collision mesh — simplified per-model physics geometry |
| `.npd` | Binary | Patrol data — AI waypoint graph with adjacency lists |
| `.nce` | Binary | Cutscene events — actors, camera, sound cues (207 files) |
| `.ncs` | Binary | Cutscene scripts — structured shot/camera data (216 files) |
| `.nms` | Text | Motion set — maps animation states to `.nad` files |
| `.nui` | Text | UI layout — screen definitions for menus and HUD |
| `.nls`/`.nlu` | Text | Localization — key-value string tables |
| `.nlt` | Text | Localization text — raw dialogue and UI strings |
| `.nak` | Text | Camera keyframes — FOV and clip plane animation |
| `.nrt`/`.nut` | Binary | Terrain — heightmap patches and texture layers |
| `.xpr` | Binary | Xbox packed textures — GPU-native format with D3D descriptors |
| `.dds`/`.tga` | Binary | Standard texture formats (DXT1, DXT5, uncompressed) |

**The VtMR SDK documents many of these formats.** The `.nod` model format went from version 7 in VtMR to version 10+ in Ghost, adding the six vertex types and bone palettes needed for Xbox hardware skinning. The original spec confirms the 64-bone limit per model, two-bone-maximum vertex weighting, and the Z-up / Y-forward coordinate system — all unchanged in Ghost. The `.nil` level format jumped from version 27 to version 35, gaining the Xbox-specific overbright vertex color encoding and lightmap patches that don't appear in the VtMR spec. The `.nad` animation format kept its cubic polynomial keyframes — each storing base value plus three coefficient vectors evaluated as $v + t \cdot b + t^2 \cdot c + t^3 \cdot d$ — but the VtMR docs reveal a detail the Ghost binary obscured: bone tracks carry a type field for rotation, translation, or scale, with scale listed as "currently not supported by the engine." Four years later, it still isn't.

**Some extensions were reused for different data.** In VtMR, `.npd` stood for Nihilistic Particle Definition — a text format defining emitter types like gas, fire, flame, liquid, and rain. In Ghost, the same extension means Nihilistic Patrol Data — a binary format for AI waypoint graphs with adjacency lists. Same three letters, completely different file. The particle system moved to `.nfx` (Nihilistic Effects), a text block format with over 1100 effect definitions and 144 controllers. Meanwhile, the cutscene system went from VtMR's conversation files (`.nco`) with branching dialogue trees driven by Java-based Codex scripts to Ghost's binary `.nce`/`.ncs` pairs encoding camera shots, actor animations, and sound cues — no scripting language, no branching, just linear cinematics.

**`.nil` levels remain partially undecoded.** After the sector geometry, a significant chunk of each file — anywhere from a tenth to nearly half — is still unstructured. The VtMR SDK documents the sector format in detail: sector-bounding planes, a per-sector BSP tree used only for collision (not rendering), separate vertex position and surface-vertex arrays, and per-surface material groups. Ghost's version extends this with portal connectivity, environment map references, and the Xbox overbright lighting — but the post-sector data that makes up the remainder of each file is absent from both the SDK and anything I've reconstructed so far.

**Bundles make streaming possible.** `.nmb`, `.nnb`, and `.nsb` pack models, animations, and sounds per level. Loading and freeing are both atomic per bundle — on 64MB of Xbox RAM, per-level atomic allocation is the only sane memory strategy.

The VtMR SDK also documents formats Ghost doesn't use at all — `.ndd` for discipline definitions, `.ncd` for vampire clan data, `.ntt` for random treasure tables, `.nqd` for quest definitions, `.nco`/`.nvo` for conversation trees — the RPG scaffolding that was stripped when the engine pivoted to a console action game. Twenty-three formats survived into Ghost, all proprietary, and until the SDK surfaced, undocumented outside Nihilistic's walls.

---

## What's Next

The architecture is documented. The formats are mapped. The simulation, audio, effects, and scripting layers are catalogued. The next question is what's actually inside the data — what 8 levels, 4500 textures, and 207 cutscenes tell you about a game that was being built and abandoned at the same time.

Templates reference AI types that never spawn. Effect controllers sit defined in `.nfx` with no level to trigger them. Model files exist with no template to instantiate them. Control modes for the Vulture and Siege Tank are fully implemented but only one level has the vehicles to use them. The build is a mid-development snapshot, and the gaps are as telling as the data.

That's Part 3: what the data says about the game they were trying to make.

---

## References

- [StarCraft: Ghost — What Went Wrong](http://www.polygon.com/2016/7/5/11819438/starcraft-ghost-what-went-wrong), Polygon, July 2016
- [StarCraft: Ghost](https://starcraft.fandom.com/wiki/StarCraft:_Ghost), StarCraft Wiki
- [NStigate Games (Nihilistic Software)](https://en.wikipedia.org/wiki/NStigate_Games), Wikipedia
- Jason Schreier, *Play Nice: The Rise, Fall, and Future of Blizzard Entertainment*, Grand Central Publishing, 2024
- NOD Engine SDK v1.0, Nihilistic Software, 2000 — file format specifications, Embrace level editor, NODExport Maya plugin
- Starev — StarCraft Ghost Reversed *(private, under development)*
