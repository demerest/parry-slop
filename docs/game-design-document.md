<!-- File: docs/game-design-document.md -->

# Parry Slop — Game Design Document

## 1. Overview

**Working title:** Parry Slop  
**Genre:** One-button parody action / rhythm-reaction web game  
**Platform:** Web browser, desktop and mobile  
**Input:** One button — click, tap, or spacebar  
**Session length:** 30–120 seconds  
**Tone:** Deadpan, absurd, internet-native parody  
**Visual style:** Primitive, high-contrast, assetless web graphics  

### Elevator pitch

**Parry Slop** is a one-button game where everything is parryable.

You parry swords, arrows, bullets, fireballs, insults, pop-up ads, tax audits, UI elements, and eventually the game itself. The joke is that modern games love parry mechanics — so this game takes parrying to its most ridiculous extreme.

### Tagline candidates

- **Parry everything.**
- **One button. No restraint.**
- **If it exists, you can parry it.**
- **Parry the unparryable.**
- **Slop happens.**

---

## 2. Core Fantasy

The player should feel like:

> “I am parrying things that absolutely should not be parried, and the game is treating this completely seriously.”

The fantasy is not realistic combat mastery. It is comedic overreaction.

Every object, concept, interface element, and emotional inconvenience is treated as a hostile attack that can be defeated with one perfectly timed parry.

---

## 3. Design Pillars

### 3.1 One input, infinite absurdity

The player has only one meaningful verb:

> **Parry.**

No movement. No dodge. No attack button. No inventory.

All variety comes from:

- Timing
- Telegraphing
- Attack behavior
- Comedy
- Escalation

### 3.2 Readability above all

Because there is only one mechanic, every attack must be easy to understand.

The player should always know:

- What is attacking?
- When it will hit?
- Whether they timed the parry correctly?

Even the weirdest attacks must use clear visual and audio cues.

### 3.3 Escalation

The game starts familiar:

- Sword
- Arrow
- Bullet
- Fireball

Then becomes weird:

- Insult
- Pop-up ad
- Tax audit
- Health bar
- Pause menu
- The concept of Monday

Then becomes meta:

- The title screen
- The tutorial
- The parry button
- The game itself

### 3.4 Short, shareable, replayable

The game should be easy to try instantly and easy to restart after failure.

A good run should feel like a meme worth sharing.

---

## 4. Gameplay Summary

### 4.1 Core loop

1. An attack appears.
2. The attack telegraphs its arrival.
3. The player presses the parry button at the correct moment.
4. The stickman parries.
5. The game responds with feedback, score, and comedy.
6. A new, usually stranger, attack appears.
7. If the player misses too many attacks, the run ends.

### 4.2 Player objective

Survive as long as possible by parrying incoming attacks.

Secondary objectives:

- Increase score
- Build combo
- Achieve perfect parries
- Trigger rare joke attacks
- Fill the Slop Meter

---

## 5. Controls

### Primary input

Any of the following performs a parry:

- Mouse click
- Touch tap
- Spacebar
- Enter, optionally

### Design rule

There is only one gameplay input.

Menus may use the same input where possible. For example:

- Click title screen to start
- Click to restart
- Click to dismiss joke menus

The game should never require complex input.

---

## 6. Core Mechanic: Parry

## 6.1 Parry timing model

Each attack has:

| Property | Description |
|---|---|
| Spawn time | When the attack appears |
| Telegraph time | Time before impact |
| Impact time | Moment the attack hits the player |
| Parry window | Time around impact where input succeeds |
| Result | What happens when parried or missed |

### Example timing values

| Attack type | Telegraph | Parry window |
|---|---:|---:|
| Sword | 1000–1200 ms | 180–220 ms |
| Arrow | 850–1000 ms | 160–190 ms |
| Bullet | 650–850 ms | 130–160 ms |
| Insult | 1100–1300 ms | 200–240 ms |
| Meta UI attack | 1200–1500 ms | 220–260 ms |

These values should be adjusted for feel and accessibility.

---

## 6.2 Parry outcomes

### Perfect Parry

Input occurs very close to impact time.

Rewards:

- Extra score
- Stronger visual effect
- Bigger sound effect
- More Slop Meter gain

Example text:

- `PERFECT PARRY`
- `CLEAN`
- `CERTIFIED PARRY MOMENT`

### Normal Parry

Input occurs within the valid window but not perfect.

Rewards:

- Standard score
- Normal visual effect

Example text:

- `PARRY!`
- `NICE`
- `OKAY`

### Early Parry / Whiff

Player presses too early or when no attack is active.

Effects:

- Combo reset
- Small punishment
- Funny feedback

Example text:

- `TOO EARLY`
- `WHIFF`
- `CALM DOWN`

### Miss

Attack connects because the player did not parry in time.

Effects:

- Lose HP
- Combo reset
- Screen shake
- Red flash
- Funny failure text

Example text:

- `YOU FAILED TO PARRY`
- `UNPARRIED SLOP`
- `THAT WAS PARRYABLE`

---

## 7. Health, Combo, Score, and Slop

## 7.1 Health

The player has a simple health system.

Default:

- 3 HP

Each missed attack removes 1 HP.

When HP reaches zero:

- Game over
- Show score
- Show funny death message
- Allow instant restart

### Optional future variations

- One-hit death mode for hardcore players
- Assist mode with more HP
- Slop-based death instead of HP
- Boss fights with special damage rules

---

## 7.2 Combo

Combo increases with every successful parry.

Combo resets on:

- Miss
- Whiff
- Some special joke attacks, if desired

Combo provides:

- Score multiplier
- Visual intensity
- Funny milestone messages

Combo milestones:

| Combo | Message |
|---:|---|
| 5 | `Okay.` |
| 10 | `Pretty good.` |
| 25 | `Stop showing off.` |
| 50 | `Parry criminal.` |
| 100 | `The developers are concerned.` |
| 200 | `This is your identity now.` |

---

## 7.3 Score

Score is gained from successful parries.

Basic scoring:

| Action | Score |
|---|---:|
| Normal parry | 100 |
| Perfect parry bonus | +150 |
| Weird attack bonus | +250 |
| Combo bonus | +5 per combo level |

Score is meant to be fast and arcade-like.

---

## 7.4 Slop Meter

The **Slop Meter** represents the game filling with parry nonsense.

It increases when:

- Parrying successfully
- Parrying weird attacks
- Achieving perfect parries

It slowly decreases over time.

At high Slop levels:

- Background may become unstable
- Fake attacks may appear
- Text becomes weirder
- Visuals may glitch slightly
- Special Slop events can trigger

The Slop Meter is both a joke system and a light risk/intensity system.

---

## 8. Attack Design

## 8.1 Attack categories

### Normal attacks

Teach the core mechanic.

Examples:

- Sword slash
- Arrow
- Bullet
- Fireball
- Axe swing
- Thrown knife

### Absurd physical attacks

Escalate the comedy while remaining visually readable.

Examples:

- Falling anvil
- Thrown chair
- Microwave
- Refrigerator
- Wet fish
- Piano
- Shopping cart
- Traffic cone

### Conceptual attacks

Non-physical things treated as attacks.

Examples:

- Insult
- Rejection
- Existential dread
- Regret
- Awkward silence
- “We need to talk”
- Monday

### Internet attacks

Examples:

- Pop-up ad
- Cookie banner
- Fake close button
- Sponsored content
- Comment section
- Notification spam
- “Accept all cookies”

### Adult responsibility attacks

Examples:

- Tax audit
- Rent
- Jury duty
- Invoice
- Medical bill
- Student loan
- Parking ticket

### Game meta attacks

Examples:

- Health bar
- Combo counter
- Pause button
- Tutorial text
- Settings menu
- Loading screen
- Error message
- Final boss health bar
- The word “PARRY”

---

## 8.2 Attack behavior archetypes

### Standard

Moves toward the player at a consistent speed.

Example:

- Arrow
- Bullet
- Fireball

### Delayed

Telegraphs, pauses, then strikes.

Used to punish panic pressing.

Example:

- Enemy raises sword...
- ...
- ...
- attacks

### Rhythm chain

Several attacks arrive in a rhythmic sequence.

Example:

- Sword, sword, arrow
- Bullet, bullet, insult

### Multi-hit

One attack requires several timed parries.

Example:

- Triple slash
- Rapid notifications

### Fake attack

Looks dangerous but may be harmless, or harmless-looking but dangerous.

Examples:

- Innocent duck
- Flower
- Tutorial prompt
- Fake restart button

### Meta attack

The interface or game itself becomes the attack.

Examples:

- The title screen flies at the player
- A settings slider attacks
- The pause menu tries to pause the player

---

## 9. Progression Structure

## 9.1 Opening sequence

The game begins with a fake normal title screen:

```text
PARRY SLOP
CLICK TO START
```

After clicking, the start prompt itself can become the first attack.

This immediately establishes the tone:

```text
YOU PARRIED THE START BUTTON
```

---

## 9.2 Early game

Goal: teach timing.

Attacks:

- Sword
- Arrow
- Fireball
- Bullet

Feedback should be generous and clear.

---

## 9.3 Mid game

Goal: introduce absurdity.

Attacks:

- Insults
- Pop-ups
- Taxes
- Falling objects
- Fake UI elements

Timing becomes tighter and patterns become more rhythmic.

---

## 9.4 Late game

Goal: break the rules.

Attacks:

- Health bar
- Score counter
- Pause menu
- Tutorial text
- Error messages
- Browser-like elements
- The word PARRY

The game may begin to fake out the player:

- Fake game over
- Fake restart button
- Fake pause screen
- Fake credits

---

## 9.5 Boss concepts

Bosses should be short, funny, and built around parry timing.

### Sir Parryalot

A serious knight who believes in honorable combat.

Attacks:

- Sword
- Shield bash
- Lance
- Dramatic monologue

### Bullet Billiam

A gunfighter who fires increasingly ridiculous bullets.

Attacks:

- Normal bullet
- Shotgun spread
- Homing bullet
- Bullet with a mortgage
- Bullet that wants to talk

### The Algorithm

Attacks with internet nonsense.

Attacks:

- Sponsored post
- Cookie banner
- Engagement bait
- Notification swarm

### The UI

The game interface becomes hostile.

Attacks:

- Health bar
- Combo counter
- Settings slider
- Pause button

### The Parry Button

Final boss.

The parry mechanic itself becomes the enemy.

Attacks:

- Giant button
- “PARRY” text
- Previous attack patterns
- The player’s cursor

Final message:

```text
YOU PARRIED THE PARRY
```

---

## 10. Presentation

## 10.1 Visual direction

The game should look intentionally primitive, but confident.

Style:

- Stickman protagonist
- Simple geometric attacks
- High-contrast colors
- Large text
- Minimal detail
- Strong readability
- No required external assets

Visual references:

- Stick figure animations
- Early web games
- MS Paint comedy
- Minimalist rhythm games
- Internet meme graphics

### Color language

| Color | Meaning |
|---|---|
| Red | Dangerous physical attack |
| Yellow | Fast or tricky attack |
| Blue | Projectile or technical attack |
| Pink / magenta | Emotional or weird attack |
| Green | Internet / UI attack |
| White | Meta / perfect / final |

Colors should not be the only indicator. Shape, motion, and timing ring cues are also important.

---

## 10.2 Stickman

The main character is a simple stickman.

Core poses:

- Idle
- Parry
- Hurt
- Death
- Perfect parry flash

The stickman should remain mostly expressionless. The comedy comes from the world being ridiculous while the character remains committed to parrying.

---

## 10.3 Text

Text is a major part of the presentation.

Use large floating words for feedback:

- `PARRY!`
- `PERFECT`
- `NO U`
- `STOP.`
- `OKAY.`
- `TOO FAR.`
- `CERTIFIED SLOP.`
- `PARRY AGAIN?`

Death messages should be varied and funny.

Examples:

```text
YOU DIED
You failed to parry the floor.
```

```text
YOU DIED
The pop-up ad got your credit card.
```

```text
YOU DIED
You parried in the wrong timeline.
```

```text
YOU DIED
The attack was legally binding.
```

---

## 10.4 Audio

Audio should be generated procedurally where possible.

Sound effects:

- Parry click
- Perfect parry chime
- Miss buzz
- UI boop
- Weird attack random blip
- Game over sting

Audio should be:

- Short
- Punchy
- Retro
- Slightly stupid
- No voice acting required

Optional future audio:

- Procedural background beat
- Intensity layers based on combo or Slop Meter
- Boss-specific audio motifs

---

## 11. User Interface

## 11.1 HUD

Minimal HUD elements:

- Score
- Best score
- Combo
- HP
- Slop Meter

The HUD should be simple enough for mobile.

---

## 11.2 Menus

The game should have very few menus.

Required screens:

- Title
- Gameplay
- Game over

Optional joke screens:

- Fake settings menu
- Fake tutorial
- Fake patch notes
- Fake credits
- Fake cookie consent banner

Menus can become attacks in later runs.

---

## 12. Difficulty and Balancing

## 12.1 Difficulty sources

Difficulty should come from:

- Shorter telegraphs
- Tighter parry windows
- More complex rhythms
- Delayed attacks
- Fake attacks
- Multiple overlapping attacks
- Meta distractions

Not from:

- Unfair randomness
- Unclear telegraphs
- Input complexity
- Hidden rules

---

## 12.2 Difficulty curve

### First 10 seconds

Teach:

- Attacks come from the right
- Press when the attack reaches the stickman
- Timing matters

### 10–30 seconds

Introduce:

- Faster projectiles
- Weird attacks
- Combo scoring

### 30–60 seconds

Introduce:

- Delayed attacks
- Rhythm chains
- UI jokes
- Slop effects

### 60+ seconds

Escalate:

- Tighter timing
- Fakeouts
- Meta attacks
- High combo pressure

---

## 13. Accessibility

Because the game is timing-based, accessibility options are important.

Recommended options:

| Option | Purpose |
|---|---|
| Larger parry window | Easier timing |
| Reduced screen shake | Comfort |
| High contrast mode | Readability |
| Colorblind-safe cues | Avoid color-only signaling |
| Audio cues | Support timing by sound |
| Slow mode | Lower intensity |
| Practice mode | Learn attack patterns |
| Flash reduction | Photosensitivity safety |

Possible parody names:

```text
PAR ASSIST MODE
```

```text
SLOP REDUCTION MODE
```

```text
I JUST WANT TO SEE THE JOKES MODE
```

---

## 14. Technical Direction

## 14.1 Platform

Primary target:

- Browser

Supported inputs:

- Mouse
- Touch
- Keyboard

No installation required.

---

## 14.2 Technology

Recommended stack:

- HTML
- CSS
- JavaScript or TypeScript
- Canvas API
- WebAudio API
- LocalStorage for best score and settings

No external assets required.

Optional future stack:

- Vite for development
- TypeScript for maintainability
- Web Components or plain ES modules
- GitHub Pages or itch.io for hosting

---

## 14.3 Architecture

The game should remain data-driven.

Example attack definition:

```js
{
  kind: "insult",
  label: "YOUR GAME IS MID",
  color: "#ff66ff",
  telegraph: 1200,
  window: 220,
  weird: true
}
```

Example sequence definition:

```js
[
  { attack: "sword", delay: 0 },
  { attack: "arrow", delay: 1000 },
  { attack: "insult", delay: 1200 },
  { attack: "popup", delay: 1400 }
]
```

This allows rapid addition of new joke attacks.

---

## 14.4 Game states

Required states:

- `title`
- `playing`
- `gameover`

Optional future states:

- `bossIntro`
- `cutsceneParody`
- `settings`
- `credits`
- `fakeCrash`
- `fakeDesktop`

---

## 15. Content Plan for First Release

Minimum funny release version:

### Attacks

At least:

- 4 normal attacks
- 4 absurd attacks
- 4 meta attacks

### Text

At least:

- 20 parry reactions
- 10 death messages
- 10 weird attack labels
- 5 combo milestone messages

### Screens

- Title
- Game
- Game over

### Run length

- 60–120 seconds for a good run
- Instant restart

---

## 16. Success Metrics

For a web prototype:

- Player understands the game within 5 seconds
- First death feels funny, not frustrating
- Average session lasts at least 30 seconds
- Players restart voluntarily
- The game is easy to share
- The joke remains readable

---

## 17. Risks and Solutions

| Risk | Solution |
|---|---|
| One button becomes boring | Add comedy, timing variation, and meta escalation |
| Joke gets old too fast | Keep runs short and save best jokes for later |
| Timing feels unfair | Use clear telegraphs and forgiving early-game windows |
| Mash strategy dominates | Add cooldown, whiff penalty, or Slop Meter consequences |
| Too many random attacks | Use scripted patterns and weighted randomization |
| Mobile input issues | Test pointer events, touch-action, and latency |
| Flash/screen shake overload | Add accessibility options |

---

## 18. Future Ideas

- Daily parry challenge
- Endless mode with seeded patterns
- Boss rush mode
- “No Parry Mode” where the game keeps asking you to parry
- Shareable death cards
- Fake multiplayer race using ghost scores
- Moddable attack JSON
- Community-submitted absurd attacks
- Secret ending where the stickman parries the browser window
- Physical merchandise joke: “Parry Slop” fake energy drink