# Parry Slop — Design & Implementation Review

Review of `game-design-document.md` and `implementation-phases.md` against the
single-file prototype, done before implementation. Amendments below were applied
during the build.

## Findings

### 1. Frame-rate-dependent simulation (bug)

The prototype decays the Slop Meter by a fixed `0.0004` per frame and ages
texts/particles by a fixed `16ms` per frame. On a 120Hz display the meter drains
twice as fast; on a slow device, half as fast.

**Amendment:** Phase 1's `slopDecayPerFrame` becomes `slopDecayPerSecond`, and all
aging/decay is driven by a clamped delta-time from a single clock.

### 2. Tab-switch deaths (bug)

`performance.now()` keeps advancing while the tab is hidden. Returning to the tab
resolves every pending attack as a miss at once — often an instant, unfair death.
Phase 9 lists visibility handling, but it is core fairness, not polish.

**Amendment:** gameplay runs on an accumulated play-clock that only advances while
the run is active. The game auto-pauses when the tab is hidden or the window loses
focus; all attack timings live in play-clock time, so pausing is free and exact.

### 3. Mash strategy is under-punished

With a 110ms input cooldown and ~190ms parry windows, pressing every ~110ms lands
inside almost every window. The GDD risk table names this but no concrete fix is
specified.

**Amendment:** a whiff (press with no attack in its window) resets combo AND locks
input for ~280ms. Mashing becomes strictly worse than timing. Perfect parries keep
the generous early windows from the GDD.

### 4. Perfect parry threshold is undocumented

The prototype uses `diff < window * 0.35`. Good value — now written into the GDD
timing model as the canonical definition (inner 35% of the window).

### 5. Fake attacks need a readable, fair cue

"Looks harmless but dangerous" must not become hidden-rule unfairness (GDD §12.1).

**Amendment:** fake attacks (duck, flower) render with a dashed grey timing ring
and a visible label. A one-time tutorial line explains: dashed ring = do not parry.
Parrying a fake is a whiff; letting it pass gives a small RESTRAINT bonus.

### 6. Multi-hit attacks: one damage event

A multi-hit attack that fails any hit deals 1 HP total (not 1 per hit), so a
missed triple slash is punishing but not run-ending. Successful hits re-arm the
timing ring for the next hit.

### 7. Structure choice

Phase 5 offers three structures. Built as recommended: endless arcade first, with
act-based progression layered on top (four acts, name cards, category unlocks).
Boss events fire at fixed intervals as short scripted parry chains with a boss HP
bar, per GDD §9.5.

### 8. Module format vs. "double-click to play"

The README promises `index.html` works from `file://`. ES modules are blocked on
`file://` by CORS.

**Amendment:** modularize into plain `src/*.js` files sharing one `PS` namespace,
loaded in dependency order. No build step, works from `file://` and GitHub Pages.

### 9. Release defaults

- License: MIT (README left it open).
- Favicon: inline SVG data URI, no external assets.
- Hosting: GitHub Pages from `main` root (already configured on the repo).

## Phase status

See the checkboxes in `implementation-phases.md` — updated as phases land.

## Verification limits

- Automated tests run in headless Chrome (`tests/run-tests.ps1`): 32 assertions
  covering timing, scoring, combos, whiff lockout, restart, pause, acts, patterns,
  multi-hit, fakes, bosses, slop overflow, determinism, and a frame-budget smoke
  test (update+draw averaged over 300 frames).
- Screenshots verified at 1280x800 and 500x900 (headless Chrome clamps viewports
  below 500px wide, so narrow-layout checks use 500px).
- Live hosting verified: Pages build `built`, index/src/screenshot return 200,
  and the live URL boots headlessly with zero console errors.
- NOT verified on real devices: mobile Safari, Android Chrome, desktop Firefox,
  low-end hardware. Those Phase 9 boxes stay unchecked on purpose.
- Object pooling for particles/texts was deemed unnecessary at the 280-particle
  cap; the cap plus splice-based aging keeps frame cost flat.
- Impact spacing: spawns and multi-hit re-arms are pushed apart to >=160ms so no
  chain can demand inputs faster than the 110ms cooldown (fairness, GDD §12.1).
