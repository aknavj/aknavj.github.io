---
layout: article
title: "Reversing a Dead Legend: Inside StarCraft Ghost's NOD Engine - PART 2"
description: "Mapping NOD as a black box: how Starev reconstructs the application boundary, staged startup, main loop, and connections between engine subsystems."
tags: reverse-engineering starcraft ghost nod-engine nihilistic disassembly
categories: reverse-engineering
---

The hardest part of reconstructing an engine is not finding a function to translate. It is knowing where that function belongs and what the surrounding code expects from it.

After the spare-time investigation described in [Part 1]({% post_url 2026-02-03-Reversing-Dead-Legend %}), I stopped trying to expand in every direction. Starev needed a coherent outline before it needed more subsystem internals.

---

## Treating the Engine as a Black Box

I used the engine's boundaries as a starting point. What enters a system? What does it call? Which resources does it need, and when does it release them?

This is a black-box view of the architecture, informed by disassembly. I can inspect the code, but do not need to understand every internal algorithm before identifying a module's role.

For example, a physics startup call establishes that physics participates in application initialization. It does not establish how collision detection works. Recording the call and its surrounding dependencies is useful even while the physics implementation remains outside the reconstruction's scope.

The process was to follow a known entry point, inspect its immediate calls, and turn those relationships into declarations and basic code structure. When a dependency led into a large subsystem, I recorded the boundary rather than treating a partial reading as a completed reconstruction.

The result is deliberately limited. **Starev describes the shape of the application more completely than it implements the game.**

---

## The Application Boundary

The PC path begins in `WinMain`. It establishes the window and platform handles, starts the application through `tSequence`, and enters the Windows message loop.

Window handling and frame handling are related but separate responsibilities:

```text
WinMain
  -> Establish the window and platform context
  -> Start the application through tSequence
  -> Process window messages
  -> When active and no messages are pending:
       call tSequence::MainLoop
```

The window procedure handles events such as activation and input-device reacquisition. The sequence handles the application's engine work.

This division gave the reconstruction a useful outer boundary. Win32 owns the message mechanism; the engine decides what to do during a frame. It also explains why the PC entry path should not be described as the Xbox implementation.

---

## Startup Happens in Stages

In the current reconstruction, `tSequence` does not bring the entire engine online in its constructor. Startup is divided between `StartApplication` and `StartApplication2`.

The first stage establishes services and the initial presentation path. It opens memory support, reads options, starts debug and file services, and enters platform and renderer initialization. It also reaches input, camera and control startup, audio, effects, and the shell.

Resource handling appears in that path too: menu bundles are loaded, or resource logging is enabled instead. Initialization therefore involves both services and content.

The main loop then handles the initial video/state transition and reaches the second startup stage. That stage calls into UI, the game library, saves, scripting, additional simulation services, world rendering, and animation-related support before marking the application initialized.

The useful relationship is:

```text
StartApplication
  -> Initial services, resources, and presentation

MainLoop
  -> Initial video/state handling
  -> StartApplication2
       -> Additional game-facing services
       -> Initialized state
```

This is an outline of the reconstructed path, not a claim that all those services are complete in Starev. It also makes the dependencies more concrete than saying "the engine starts everything."

---

## The Main Loop Is a Dispatcher

The next layer is `tSequence::MainLoop`. Its job is to coordinate work, not perform every subsystem's work itself.

The current reconstruction advances timing, handles initial state, and checks flags before dispatching input, cutscene, sound, simulation, rendering, and UI work. It also performs video-related work, effect updates, and sequence updates.

The flags matter. A frame is not an unconditional list of "input, physics, draw, sound." Some work is enabled only in the relevant application state; the skip-render path also bypasses input and presentation portions of this reconstruction.

| Boundary | Responsibility visible from the loop |
|---|---|
| Input | Refresh the input path when enabled |
| Cutscene | Advance the active cutscene path |
| Sound | Dispatch audio work |
| Simulation | Dispatch game-state updates |
| Rendering | Update presentation and full-screen effects |
| Shell and UI | Update and draw the interface |
| End of frame | Present through the renderer when appropriate |

The table describes what the coordinator asks for. It does not describe the algorithms inside those systems.

This was a manageable way to reconstruct the first few layers: establish the conditions and calls at the top, then preserve the interfaces below them.

---

## The Services Underneath

The foundation gives the higher layers common operations: memory management, debugging, file access, timing, input, and resource lookup. Math code supplies shared calculations rather than belonging to one gameplay subsystem.

These services matter because calls to them recur throughout the application. Understanding file lookup once is more useful than treating every model or sound load as an unrelated operation.

Rendering has another boundary: higher-level model and animation handling sits above the Direct3D-facing code. A request involving a model does not belong at the same level as a device or texture operation, even if both ultimately contribute to the same frame.

The game-facing layer brings together worlds, scenes, entities, and templates. Simulation, AI, effects, and mission logic connect to that layer. In my work, these connections were primarily a map of responsibilities and interfaces; the deeper implementations were not comprehensively reconstructed.

```text
Platform and application sequence
              |
      Subsystem entry points
       /        |         \
 Presentation  Game state  Interface
       \        |         /
      Shared foundation and math
```

This is a responsibility map, not a complete dependency graph. The actual code has cross-system calls that need to be followed individually.

---

## A Skeleton Is Useful, but Not a Running Engine

Source reconstruction has several different levels of progress:

- A name and source path can identify a module.
- A declaration can record an interface.
- A reconstructed function can preserve a piece of control flow.
- A working implementation must also satisfy its dependencies and behave correctly.

Starev contains work at different points along that progression. A source tree with files for physics, AI, or scripts should not be read as a completed implementation of those systems. Some files preserve little more than structure.

The skeleton helped me stop restarting. I could return to a known boundary and extend it in small steps instead of reopening the whole engine as an undifferentiated problem.

It did not make the remaining task small. Restoring the internals of a game library, renderer, simulation, and mission system would be a much larger effort than mapping their entry points.

---

## A Smaller Way to Test the Understanding

The reconstruction also raised questions about the custom files those systems consume. A plausible loader in pseudo-code is not enough to know that I have interpreted its data correctly.

Rather than wait for a reconstructed engine to run, I could test that understanding independently: read a model, inspect an animation, or assemble a level in a viewer.

That became the next step. [Part 3]({% post_url 2026-07-14-What-the-Data-Remembers-NOD-Engine-Part-3 %}) describes OpenNOD SDK, a tool for making those file structures and relationships visible.

---

## Basis for This Reconstruction

- The development build's `Star_d.exe`, studied through disassembly and decompiled pseudo-code
- [Starev source code (scghost-rev)](https://github.com/aknavj/scghost-rev): reconstructed platform entry, `tSequence`, and surrounding subsystem interfaces
- NOD Engine SDK v1.0 for *Vampire: The Masquerade - Redemption*, used as historical context rather than an exact specification for Ghost
