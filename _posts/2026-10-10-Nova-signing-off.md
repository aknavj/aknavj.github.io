---
layout: article
title: "Nova, Signing Off: One Last Shot at StarCraft Ghost"
description: "Taking StarCraft Ghost from an Xbox prototype to a native Windows executable with XboxRecomp, a Direct3D 11 backend, and one last round of late-night debugging."
tags: reverse-engineering starcraft ghost nod-engine recompilation xbox directx
categories: reverse-engineering
---

The asset viewer could show Nova's model and the Mar Sara canyon. It could not run their gameplay. For that, I needed the original code to execute and receive the platform behavior it expected.

XboxRecomp offered a way to try it: translate the Xbox executable into code compiled for Windows, then supply a compatibility runtime. Could I get the surviving Ghost prototype through its menu and into a level?

---

## One Last Shot

The [earlier investigation]({% post_url 2026-07-14-What-the-Data-Remembers-NOD-Engine-Part-3 %}) had left me with Starev's architecture skeleton and an asset viewer, OpenNOD SDK. Neither was a reconstructed runtime capable of playing Ghost.

Later, I came across **XboxRecomp**, a fresh project bringing original Xbox titles to modern platforms. Its existence was the spark: it looked worth trying as a wild experiment, using what I had learned without waiting for a manual source reconstruction to be complete.

This time, the result I wanted was a running game, not a reconstruction of what its files described.

I returned to IDA and the notes from my earlier architecture and file-format work. This was my first XboxRecomp approach, growing naturally from those investigations rather than another retry of the same port. The scope was the existing Xbox prototype running as a native Windows executable, not finishing the cancelled game.

It was also a chance to test XboxRecomp's capabilities and push my own boundaries with recompilation. My usual area of expertise is elsewhere, so digging into emulation and the low-level mechanics behind this runtime was a learning process, not familiar ground. That made each working piece especially rewarding.

**The targets were specific:**

- XInput support, tested with an Xbox One controller.
- Translate the Xbox's NV2A graphics commands into Direct3D 11.
- Aim for a correctly rendered, sustained **30 FPS**.
- Leave keyboard controls, a second debug controller, and extra features out of scope.

No new missions. No attempt to turn the prototype into the game Blizzard never shipped. Just let Nova walk around what is already there.

---

## Recompilation, Not Recovered Source

XboxRecomp reads an **XBE**, the original Xbox executable format, disassembles its code, recovers function boundaries and calling conventions, and generates C that can be compiled for Windows. A compatibility runtime supplies the Xbox kernel and hardware behavior that the generated code still expects.

That distinction matters. This is not the original NOD source code, cleaned up and rebuilt with a newer compiler. The game still thinks it lives on an Xbox. Its memory layout, device registers, graphics commands, and callbacks all have to make sense in the new environment.

Ghost was an interesting test case: an early Nihilistic-era development build, built against **Xbox SDK 5659**, with the custom NOD engine rather than something widely used like RenderWare. The lack of optimization helps when reading the code, but it does not make the platform dependencies disappear.

Within about an hour of following the initial guide, I had something getting through the boot sequence. The first problem was file paths. Fixing those felt reassuringly ordinary.

Then the rest of the game arrived.

```text
Intro movies -> Splash -> Main menu -> Level loading
                                           |
                                      Cinematic
                                           |
                                        Gameplay
                                           |
                            Pause / death / next level
```

Every arrow is another place where the game can wait for hardware, reach an undiscovered callback, or submit something the renderer does not understand. Getting through boot was not the same as getting through any of those transitions.

The intro had a separate presentation path: the game decoded the video and packed it as YUY2, a format storing brightness and shared color information, then programmed the NV2A's PVIDEO overlay. Capturing the draw surface before that overlay was composited produced a black image even when the window showed video. The runtime needed to read the live overlay registers and composite the guest-decoded frame. A black intermediate buffer was not proof that decoding had failed.

---

## The Missing Menu Scene

NOD already manages entities, visibility, animation, and material selection. I did not need to replace those systems. The graphics backend needed to reproduce what the game submitted.

The Xbox graphics path is not a collection of desktop Direct3D 8 calls waiting to be renamed. The game writes command buffers for the **NV2A**, and the backend has to interpret those commands and reproduce their behavior through D3D11. Texture layouts, fixed-function lighting, blending, stencil, clipping, and shader combinations all matter. So does keeping GPU output consistent with memory the game can read or modify.

The most useful lesson came from the main menu. The logo and *Press Start* were visible, but Nova and most of the room were missing. It looked like a renderer problem.

**It was a CPU translation problem.**

The x86 instruction `LAHF` copies status flags into the `AH` register. In the generated code, it had been translated as a no-op. Ghost's camera math used the comparison results carried through those flags to choose a branch. Instead, it read stale bits and built the wrong camera matrix.

```text
Comparison -> Status flags -> LAHF -> Branch -> Camera matrix
                               |
                         Translated as no-op
```

Repairing one set of floating-point comparisons brought Nova and the room back. Repairing the other put the camera the right way up.

Those were two different instruction paths: SSE comparisons and x87 comparisons that transfer their results into the CPU flags. Before the repair, the camera matrix was already wrong when it reached D3D11, giving scene geometry a negative homogeneous `W` value. That value participates in clipping and perspective division, so valid draw submissions could still leave the scene missing. This was why counting successful draws did not locate the fault.

Changing the renderer's projection matrix would have treated the symptom. Repairing the flag handling let the original camera code choose the intended branch.

---

## A Controller, a Level, and Some Sound

Input had its own version of the same problem. Mapping XInput buttons was only part of it: several original Xbox USB controller callbacks had not been discovered during translation. Recovering those routines and fixing transfer completion handling got the original input path moving. The physical Xbox One controller now works well, although its face buttons cannot reproduce the pressure-sensitive buttons of the original Xbox controller.

Recovering the callbacks also changed allocation order and exposed an audio assumption: a diagnostic DSP acknowledgement used a fixed guest address for its command mailbox. The correct location came from the programmed scratch-memory mapping, not a constant that happened to work earlier. Resolving that mapping fixed the initialization wait. It was still an acknowledgement passthrough, not execution of the Xbox's audio DSP.

Level loading exposed more missing pieces. A broken translation of `memmove` produced an access violation. An audio command acknowledgement could leave loading stuck. Once those were repaired, the renderer reached line and point submissions it did not yet support.

The copy failure began in instruction discovery. Resynchronizing after a switch table had left supposed instruction starts inside other decoded instructions. The repair removed those overlapping starts and regenerated the affected copy routine, rather than replacing it with a workaround for this level.

These were separate dependencies in the loading path, not one renderer bug. Repairing them let execution reach the next unsupported operation.

Eventually, **Scattered Forces**, the Mar Sara canyon level, got through its briefing and into rendered gameplay. Not proof that every level works. But a substantial step beyond looking at its geometry in my asset viewer.

Sound was less cooperative.

The intro became audible, but gameplay effects were still largely absent. The Windows audio output kept receiving packets, which looked healthy in the logs. That did not mean the game was actually starting the sounds.

The missing gameplay cues came down to another translation error: a state transition used an unassigned comparison result and rejected the requested starts. Restoring the original transition rules brought gameplay sounds back.

A separate register-access bug explained some of the broken streaming. A native 64-bit access covered two adjacent Xbox audio registers, but the device bridge handled only the first half. Reading and writing both halves improved the sound considerably.

The access width was part of the device behavior, not just a C type detail. Both adjacent 32-bit registers needed their own operation, and paired writes needed to hold the audio-device lock across both. Otherwise the audio worker could observe a half-updated pair even after the missing second write was restored.

**Audible does not mean finished.** Occasional crackles remain, and the Xbox audio DSP effects are not fully implemented. A continuously fed Windows audio queue is not proof of a correct soundtrack.

---

## Reducing Work, Measuring the Right Thing

The performance work was mostly less glamorous than shader translation: stop recreating resources, stop uploading unchanged data, and stop doing diagnostic work inside hot loops.

In one comparable Debug replay, reusing texture resources and updating their contents changed the number of objects created:

| Metric | Before | After |
|---|---|---|
| Texture objects created | 17,096 | 82 |

A separate gameplay replay avoided just over half of the constant-buffer uploads by checking whether the data had changed. These measurements describe reduced API work. Neither is a frame-rate result.

Tracing also checked an environment variable for every graphics command parameter, even when disabled. Moving that lookup out of the hot path removed diagnostic work from ordinary execution.

But the **30 FPS target is still not achieved**. Early steady-menu measurements were in single digits, and later intervals from lighter scenes cannot honestly be presented as proof that the whole game is now playable at the target speed.

Correctness stays ahead of the frame counter. Skipping a synchronization point or ignoring an unsupported draw might make the numbers nicer, but it would also make them meaningless.

---

## Working with an Agent

Agentic pair programming helped a lot with this effort: tracing generated code, narrowing down access violations, writing focused repairs, and keeping the repetitive work manageable.

I usually knew which problem to tackle next. The agent accelerated the cycle of investigating a failure, implementing a repair, and testing again. That was a substantial change in how quickly I could reach a functional demo, not a substitute for checking its correctness.

It did not replace the loop of checking the original instructions in IDA, comparing behavior with Cxbx-Reloaded, and looking at what actually appeared on screen. The missing menu scene was a good reminder: thousands of successful draws can still produce the wrong picture. Audio packets can still carry silence.

The useful loop was:

```text
Observe a failure
  -> Inspect the original and generated code
  -> Form an explanation
  -> Implement a focused repair
  -> Check the running game
```

The agent helped with investigation and implementation. The original instructions and the game's behavior remained the checks on the result.

---

## Someone Else Continued

Once I had a functional demo, I made my changes available as open source. Within days, a fellow developer picked up where I had left off, introduced enhancements, and shared their updates while crediting the initial work.

That handoff was one of the most rewarding results. Another developer could start from a working baseline instead of repeating the investigation. It is a concrete reason I value open source: my stopping point does not have to be the project's stopping point.

---

## The Code

The effort lives in two repositories:

- **[XboxRecomp fork](https://github.com/aknavj/xboxrecomp/tree/impl-scghost)** — use the `impl-scghost` branch, which contains the runtime and recompilation changes for Ghost.
- **[scghost-recomp](https://github.com/aknavj/scghost-recomp)** — the game-specific recompilation project.

Keep both checkouts side by side under the same parent directory, not nested inside one another:

```text
    my-dir
    |
    +-- xboxrecomp       (branch: impl-scghost)
    |
    +-- scghost-recomp
```

From your chosen parent directory, you can clone that layout with:

```powershell
git clone --branch impl-scghost https://github.com/aknavj/xboxrecomp.git xboxrecomp
git clone https://github.com/aknavj/scghost-recomp.git scghost-recomp
```

To recompile the game yourself, follow the README and supporting documentation included in both projects for prerequisites, setup, and build instructions.

These are the code repositories, not a bundled copy of the game. Recompilation requires the Xbox prototype's executable and assets separately. That build surfaced through an unofficial leak, not an authorized release; these projects do not include or distribute it.

For a look at the demo and the work shared around it:

- **[Video demo](https://lnkd.in/dbSFK2bN)**
- **[Community discussion](https://lnkd.in/dbPWs-RE)**
- **[Pull request](https://lnkd.in/dfMw8HVt)**

---

## Signing Off

As of October 4, the result is:

| Area | Observed state |
|---|---|
| Intro and menu | Visible video and restored 3D menu |
| Input | Working Xbox One controller |
| Gameplay | Scattered Forces reaches rendered gameplay |
| Audio | Audible gameplay sounds, with occasional glitches |
| Rendering | Compatibility failures remain |
| Performance | Sustained 30 FPS target not achieved |
| Completion | No verified full playthrough |

That is the honest state of it. This is a working recompilation effort, not a finished PC port, and certainly not a completed *StarCraft Ghost*. The game data is still required separately; none of this makes Blizzard's assets mine to redistribute.

When I began studying the binary, I just wanted to understand how Nihilistic had built it. The architecture skeleton and viewer each made part of that understanding tangible. Recompilation took a different route and finally brought the original gameplay into the experiment.

There are more things to fix. There always will be.

But the goal was never to spend the rest of my life finishing somebody else's cancelled game. It was to give this particular prototype one last chance to run, and to learn something along the way.

Nova, signing off.