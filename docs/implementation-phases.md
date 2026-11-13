# Parry Slop — Implementation Phases

This document describes how to build **Parry Slop** from the current simple prototype into a complete, polished web game.

The development philosophy is:

> Start tiny. Make it feel good. Add jokes only after the core timing feels fun.

---

## Phase 0: Project Setup

Goal: create a stable foundation for development.

### Tasks

- [x] Create repository
- [x] Create basic project structure
- [x] Add `README.md`
- [x] Add `docs/game-design-document.md`
- [x] Add current single-file prototype
- [x] Decide whether to keep single-file or modularize later
- [x] Test prototype on desktop browser
- [x] Test prototype on mobile browser

### Suggested file structure

```text
parry-slop/
  README.md
  index.html
  docs/
    game-design-document.md
    implementation-phases.md
```

### Optional expanded structure

Use this once the prototype grows:

```text
parry-slop/
  README.md
  index.html
  src/
    main.js
    state.js
    attacks.js
    audio.js
    drawing.js
    ui.js
  docs/
    game-design-document.md
    implementation-phases.md
```

### Acceptance criteria

- The game opens by loading `index.html`
- No console errors
- Click/tap/space input works
- Score and game over work
- The game is playable for at least one minute

---

## Phase 1: Stabilize the Core Prototype

Goal: make the current prototype reliable and easy to expand.

### Focus areas

- Timing correctness
- Input responsiveness
- State management
- Basic game loop
- Readable code

### Tasks

- [x] Use a single consistent time source, such as `performance.now()`
- [x] Make attack spawning deterministic enough for testing
- [x] Separate update and draw logic cleanly
- [x] Store attack definitions in data form
- [x] Add simple constants for difficulty tuning
- [x] Add safe local storage helper
- [x] Prevent duplicate inputs from causing issues
- [x] Add restart delay after game over to avoid accidental restart
- [x] Add basic debug display for FPS or timing if needed

### Tunable values to extract

```js
const SETTINGS = {
  startingHp: 3,
  inputCooldown: 110,
  baseScore: 100,
  perfectBonus: 150,
  weirdBonus: 250,
  comboScoreStep: 5,
  slopDecayPerFrame: 0.0004
};
```

### Acceptance criteria

- Parry timing feels consistent
- Input does not feel delayed
- Game can be restarted repeatedly without breaking
- Attack data is easy to modify
- No crashes during normal play

---

## Phase 2: Core Gameplay MVP

Goal: create the minimum version that proves the game is fun.

### Required features

- [x] Title screen
- [x] Playing state
- [x] Game over state
- [x] One-button parry input
- [x] Attack telegraphing
- [x] Parry window timing
- [x] Score
- [x] Combo
- [x] HP
- [x] At least 4 attack types
- [x] At least 1 weird attack type
- [x] Basic text feedback
- [x] Basic sound feedback

### Minimum attack set

| Attack | Purpose |
|---|---|
| Sword | Basic melee timing |
| Arrow | Basic projectile timing |
| Bullet | Faster projectile timing |
| Insult | First weird/concept attack |

### MVP gameplay rules

- Missed attack reduces HP by 1
- Successful parry increases combo
- Miss or whiff resets combo
- Game over at 0 HP
- Click to restart

### Acceptance criteria

- A new player understands the game without explanation
- The first death feels fair
- Successful parries feel satisfying
- The game can be played in under 5 seconds from page load
- The prototype is fun for at least 30–60 seconds

---

## Phase 3: Game Feel

Goal: make parrying feel excellent.

This phase is critical. The game is simple, so feedback must be strong.

### Visual feedback tasks

- [x] Screen shake on parry and hit
- [x] White flash on perfect parry
- [x] Red flash on player hit
- [x] Floating combat text
- [x] Particles on parry
- [x] Stickman parry animation
- [x] Stickman hurt animation
- [x] Attack impact flash
- [x] Timing ring around attacks
- [x] Slow-motion time dilation on perfect parry

### Audio feedback tasks

- [x] Normal parry sound
- [x] Perfect parry sound
- [x] Miss sound
- [x] Whiff sound
- [x] Weird attack sound
- [x] Game over sound
- [x] UI click sound

### Feedback examples

Normal parry:

```text
PARRY!
```

Perfect parry:

```text
PERFECT PARRY
```

Weird parry:

```text
NO U
```

Miss:

```text
YOU FAILED TO PARRY
```

### Acceptance criteria

- A successful parry feels better than pressing a button in an empty page
- A perfect parry feels distinctly rewarding
- A miss feels fair but noticeable
- The game has a clear rhythm and punch
- Feedback does not obscure attacks

---

## Phase 4: Content Expansion

Goal: add enough attacks and jokes to support full runs.

### Content categories

Add attacks across these categories:

#### Physical attacks

- [x] Axe
- [x] Spear
- [x] Thrown knife
- [x] Boomerang
- [x] Grenade
- [x] Falling piano
- [x] Microwave
- [x] Wet fish

#### Ranged attacks

- [x] Laser
- [x] Sniper shot
- [x] Shotgun spread
- [x] Homing bullet
- [x] Paper airplane
- [x] Angry email

#### Emotional attacks

- [x] Insult
- [x] Rejection
- [x] Awkward silence
- [x] “We need to talk”
- [x] Regret
- [x] Existential dread

#### Internet attacks

- [x] Pop-up ad
- [x] Cookie banner
- [x] Fake close button
- [x] Notification spam
- [x] Sponsored post
- [x] Comment section

#### Responsibility attacks

- [x] Tax audit
- [x] Rent
- [x] Invoice
- [x] Jury duty
- [x] Parking ticket
- [x] Student loan

#### Meta attacks

- [x] Health bar
- [x] Combo counter
- [x] Pause button
- [x] Settings menu
- [x] Tutorial text
- [x] Loading screen

### Content implementation tasks

- [x] Create reusable attack schema
- [x] Create attack text pools
- [x] Add weighted random selection
- [x] Add pattern-based sequences
- [x] Add delayed attacks
- [x] Add multi-hit attacks
- [x] Add fake attacks
- [x] Add rare special attacks

### Example attack schema

```js
{
  id: "tax-audit",
  kind: "tax",
  labelPool: ["TAX AUDIT", "IRS NOTICE"],
  telegraph: 1300,
  window: 240,
  weird: true,
  scoreBonus: 250,
  parryTextPool: ["AUDIT DEFLECTED", "NOT TODAY"],
  missTextPool: ["FINANCIALLY HIT"]
}
```

### Acceptance criteria

- At least 12 total attacks exist
- At least 5 attacks are weird or meta
- Runs feel varied
- New attacks are easy to add through data
- The comedy escalates over time

---

## Phase 5: Difficulty and Structure

Goal: turn random attacks into a satisfying progression.

### Difficulty systems

- [x] Reduce telegraph time over elapsed time
- [x] Reduce parry window over elapsed time
- [x] Increase spawn frequency over elapsed time
- [x] Introduce delayed attacks after early game
- [x] Introduce rhythm chains after mid game
- [x] Introduce meta attacks after player understands basics
- [x] Add boss or special event at fixed intervals

### Structure options

#### Option A: Endless arcade

- Endless run
- Difficulty scales over time
- Score attack
- Simplest implementation

#### Option B: Act-based endless

- Endless run divided into acts
- Each act introduces new joke category
- Acts have name cards

Example acts:

```text
ACT I: NORMAL GAME STUFF
ACT II: WHY IS THERE A TAX AUDIT?
ACT III: THE INTERFACE IS HOSTILE
ACT IV: PARRY GOD
```

#### Option C: Micro-campaign

- Short fixed levels
- Each level is a joke
- 10–30 seconds per level
- More authored experience

### Recommendation

Start with **endless arcade**, then add act-based progression.

### Acceptance criteria

- First 10 seconds are easy
- Difficulty rises smoothly
- Player can feel escalation
- Runs do not become chaotic too early
- Death feels like a result of player mistake

---

## Phase 6: UI, Menus, and Screens

Goal: make the game feel complete.

### Required screens

- [x] Title screen
- [x] Gameplay screen
- [x] Game over screen

### Optional screens

- [x] Settings screen
- [x] Accessibility options
- [ ] Credits
- [ ] Help / how to play
- [ ] Fake patch notes
- [ ] Fake legal screen that can be parried

### HUD tasks

- [x] Score display
- [x] Best score display
- [x] Combo display
- [x] HP display
- [x] Slop Meter
- [x] Mute button, if audio becomes more complex

### Game over tasks

- [x] Show score
- [x] Show best score
- [x] Show random death message
- [x] Show restart prompt
- [x] Add restart delay to prevent accidental input

### Example death messages

```text
You failed to parry.
The attack was legally binding.
You became slop.
The parry button abandoned you.
You thought about parrying too late.
```

### Acceptance criteria

- The player can start, play, die, and restart without confusion
- UI is readable on desktop and mobile
- No important element overlaps attack visuals
- Game over is instant and funny

---

## Phase 7: Audio and Accessibility

Goal: make the game more polished and playable for more people.

### Audio tasks

- [x] Create unified sound manager
- [x] Add master mute
- [x] Add sound effects for all core actions
- [x] Add randomized weird attack sounds
- [ ] Add optional simple background loop
- [x] Ensure audio starts only after user gesture
- [x] Handle browsers blocking audio gracefully

### Accessibility tasks

- [x] Add reduced screen shake option
- [x] Add larger parry window option
- [x] Add high contrast mode
- [x] Add colorblind-friendly attack shapes or labels
- [x] Add flash reduction
- [x] Add optional audio timing cues
- [x] Test touch targets on mobile
- [x] Ensure text remains readable at small screen sizes

### Recommended settings menu

```text
PAR ASSIST
  [ ] Big Parry Window
  [ ] Reduced Shake
  [ ] High Contrast
  [ ] Flash Safe Mode
  [ ] Audio Cues
```

### Acceptance criteria

- The game is playable with sound off
- The game is playable with sound on
- Options do not break core gameplay
- The game is more comfortable for sensitive players

---

## Phase 8: Polish and Juice

Goal: make the game feel like a finished meme product.

### Polish tasks

- [x] Add title screen animation
- [x] Add idle stickman animation
- [x] Add background variation based on Slop Meter
- [x] Add fake browser-like joke UI
- [x] Add secret rare attacks
- [x] Add milestone taunts
- [x] Add screen transitions
- [x] Add death animation
- [x] Add perfect parry freeze frame
- [x] Add combo-based background intensity
- [x] Add shareable score text

### Example share text

```text
I parried 147 things in PARRY SLOP.
I am legally unstoppable.
```

### Secret ideas

- [x] Parry the title logo
- [ ] Parry the mute button
- [x] Parry the game over screen
- [ ] Parry 999 things to unlock fake ending
- [x] Let the Slop Meter max out to trigger weird mode

### Acceptance criteria

- The game feels lively
- The player notices new details after repeated runs
- The game remains readable despite extra effects
- The joke does not overpower the gameplay

---

## Phase 9: Performance and Compatibility

Goal: make the game run smoothly everywhere.

### Performance tasks

- [x] Limit particle count
- [ ] Reuse text/particle objects if needed
- [x] Avoid layout thrashing
- [x] Use Canvas only, not DOM animation, for gameplay
- [ ] Test low-end device performance
- [ ] Test mobile Safari
- [ ] Test Android Chrome
- [ ] Test desktop Firefox
- [x] Test desktop Chrome
- [x] Test resizing and orientation changes

### Compatibility tasks

- [x] Handle `AudioContext` unavailable
- [x] Handle `localStorage` unavailable
- [x] Handle pointer events safely
- [x] Prevent touch scrolling during play
- [x] Prevent double-tap zoom
- [x] Handle visibility change by pausing or muting

### Acceptance criteria

- Stable frame rate on common devices
- No major input latency issues
- Game does not scroll or zoom unexpectedly
- Game recovers gracefully if tab is hidden and refocused

---

## Phase 10: Release

Goal: publish the game.

### Release checklist

- [x] Finalize title
- [x] Create short description
- [x] Add favicon
- [x] Add page title
- [x] Add meta description
- [ ] Add social sharing image, optional
- [x] Test on live hosting
- [ ] Test mobile link opening
- [x] Add itch.io page or GitHub Pages deployment
- [x] Add screenshot or animated GIF
- [ ] Add feedback link, optional

### Possible hosting options

- GitHub Pages
- itch.io
- Netlify
- Vercel
- Cloudflare Pages

### Recommended first release scope

- Endless mode
- 12–20 attacks
- Score and best score
- A few secret jokes
- Mobile support
- No account system
- No backend

### Acceptance criteria

- A stranger can open the link and play immediately
- The game works on mobile
- The game works in fullscreen browser
- The game can be shared as a URL

---

## Post-Release Ideas

After the first public version:

### Content updates

- [ ] New boss
- [ ] New attack packs
- [ ] Seasonal joke attacks
- [ ] Community-submitted attacks
- [ ] Daily challenge mode

### Modes

- [ ] Boss rush
- [ ] Hardcore one-hit mode
- [ ] Zen mode
- [ ] No Whiff mode
- [ ] Slop Storm mode

### Meta features

- [ ] Local achievements
- [ ] Share cards
- [ ] Ghost score replay
- [ ] Fake leaderboard
- [ ] Fake DLC joke

---

## Milestone Summary

| Milestone | Goal |
|---|---|
| Phase 0 | Project setup |
| Phase 1 | Stable prototype |
| Phase 2 | Core MVP |
| Phase 3 | Game feel |
| Phase 4 | Content expansion |
| Phase 5 | Difficulty and structure |
| Phase 6 | UI and screens |
| Phase 7 | Audio and accessibility |
| Phase 8 | Polish |
| Phase 9 | Performance and compatibility |
| Phase 10 | Release |

---

## Definition of Fun

The prototype is successful if:

1. A player understands it in under 5 seconds.
2. A successful parry feels satisfying.
3. A failed parry feels funny.
4. The player wants to try again immediately.
5. The player says something like:
   - “Wait, I can parry that?”
   - “This is stupid. Another run.”
   - “Why is there a tax audit boss?”
