<!-- File: README.md -->

# Parry Slop

**Parry Slop** is a one-button web game where everything is parryable.

Parry swords. Parry arrows. Parry bullets. Parry insults. Parry pop-up ads. Parry tax audits. Parry the UI. Eventually, parry the game itself.

The game is a small, primitive, assetless browser parody of modern action games that treat parrying as the ultimate mechanic.

> **If it exists, you can parry it.**

---

## Play

Open `index.html` in a browser.

No build step required.

---

## Controls

| Input | Action |
|---|---|
| Click | Parry |
| Tap | Parry |
| Space | Parry |
| Enter | Parry, optional |

That is the entire game.

---

## Current Features

The prototype currently includes:

- One-button parry gameplay
- Stickman protagonist
- Primitive canvas graphics
- No external assets
- Score system
- Combo system
- HP system
- Slop Meter
- Normal attacks:
  - Sword
  - Arrow
  - Bullet
  - Fireball
- Weird attacks:
  - Insults
  - Pop-ups
  - Taxes
  - UI elements
- Simple generated sound effects
- Game over and restart
- Local best score storage

---

## Quick Start

### Option 1: Direct file

1. Save the prototype as `index.html`
2. Double-click it
3. Play

### Option 2: Local server

If you prefer serving it locally:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

---

## How the Game Works

An attack appears and moves toward the stickman.

Each attack has:

- A telegraph
- An impact moment
- A parry window

Press the parry button when the attack reaches the stickman.

### Timing results

| Result | Meaning |
|---|---|
| Perfect Parry | Very close to impact |
| Normal Parry | Within valid window |
| Too Early | Pressed before valid window |
| Whiff | Pressed with no relevant attack |
| Miss | Failed to parry in time |

Missing attacks reduces HP.

When HP reaches zero, the run ends.

---

## Slop Meter

The **Slop Meter** fills as you parry more nonsense.

At high Slop levels, the game becomes more unstable and weird.

This is both a joke system and a light intensity system.

---

## Project Structure

Minimal version:

```text
parry-slop/
  README.md
  index.html
  docs/
    game-design-document.md
    implementation-phases.md
```

Future version may become:

```text
parry-slop/
  README.md
  index.html
  src/
    main.js
    attacks.js
    audio.js
    drawing.js
    state.js
    ui.js
  docs/
    game-design-document.md
    implementation-phases.md
```

---

## Design Goals

- One input only
- Instant restart
- Clear telegraphs
- Strong feedback
- Escalating absurdity
- No external assets
- Playable on desktop and mobile
- Funny even after failing

---

## Development Roadmap

### Phase 1: Core Prototype

Stable one-button parry loop.

### Phase 2: Game Feel

Screen shake, particles, text, sound, timing feedback.

### Phase 3: Content Expansion

More attacks, more jokes, more weirdness.

### Phase 4: Difficulty and Structure

Better pacing, acts, patterns, bosses.

### Phase 5: Polish and Release

Accessibility, performance, mobile compatibility, deployment.

For full details, see:

```text
docs/implementation-phases.md
```

---

## Adding New Attacks

Attacks should be data-driven.

Example:

```js
{
  kind: "popup",
  label: "COOKIE PREFERENCES",
  color: "#7dff7d",
  telegraph: 1300,
  window: 230,
  weird: true
}
```

Good attack ideas:

- Are easy to read
- Have a clear impact moment
- Are funny when parried
- Fit the game’s deadpan tone

Bad attack ideas:

- Are impossible to read
- Require memorization too early
- Use unfair hidden timing
- Need extra input types
- Overload the screen with noise

---

## Tone

The game should feel like:

- A web joke
- A rhythm game
- A deadpan parody
- A Flash-era browser game
- A game jam experiment

The game should not feel like a serious action game.

The stickman remains calm. The world becomes increasingly stupid.

---

## Accessibility

Planned or recommended options:

- Larger parry window
- Reduced screen shake
- High contrast mode
- Flash-safe mode
- Audio timing cues
- Practice mode

Because the game is timing-based, accessibility is important.

---

## Technical Notes

Built with:

- HTML
- CSS
- JavaScript
- Canvas API
- WebAudio API

No required dependencies.

No external images.

No sprite sheets.

No build tools required for the prototype.

---

## Browser Support

Target:

- Desktop Chrome
- Desktop Firefox
- Mobile Safari
- Mobile Chrome

Known concerns:

- Audio may require user interaction before starting
- `localStorage` may be unavailable in some sandboxed contexts
- Touch input should use pointer events and prevent default scrolling
- Timing should use `performance.now()`

---

## License

Choose one before public release.

Possible options:

- MIT
- CC0
- A custom “parry the license” joke, if appropriate

---

## FAQ

### Why is it called Parry Slop?

Because the game is about drowning in parry nonsense.

### Is it finished?

No. It is a prototype / vertical slice.

### Can I add attacks?

Yes. The game is designed around adding more ridiculous attacks.

### Should it be serious?

No. The game should be mechanically tight but emotionally stupid.