"use strict";

window.PS = window.PS || {};

PS.game = (function () {
  const S = PS.SETTINGS;

  const DEFAULT_OPTIONS = {
    bigWindow: false,
    reducedShake: false,
    highContrast: false,
    flashSafe: false,
    audioCues: false,
    slowMo: true
  };

  const state = {
    screen: "title",
    clock: 0,
    lastNow: 0,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    hp: S.startingHp,
    slop: 0,
    attacks: [],
    texts: [],
    particles: [],
    shake: 0,
    flash: 0,
    hitFlash: 0,
    fade: 0,
    parryAnimUntil: -1,
    hurtAnimUntil: -1,
    overClock: 0,
    deathText: "",
    newBest: false,
    nextSpawnAt: 0,
    lastInputClock: -1e9,
    lockoutUntil: 0,
    slowmoRequest: false,
    slowmoUntil: 0,
    ripple: null,
    stormActive: false,
    stormStart: -1,
    stormCharge: 0,
    stormFlash: 0,
    nextStormFlashAt: 0,
    bolts: [],
    implode: null,
    zaps: [],
    shock: null,
    act: 1,
    banner: null,
    boss: null,
    patternQueue: [],
    patternGap: 400,
    nextBossAt: 60000,
    bossIndex: 0,
    seenFake: false,
    weirdUntil: -1,
    stats: null,
    totalParries: 0,
    options: Object.assign({}, DEFAULT_OPTIONS, PS.storage.get("parrySlop.options", {})),
    settingsRow: 0,
    shareCopied: false
  };

  const legacyBest = Number(PS.storage.get("parrySlopBest", 0)) || 0;
  state.best = Math.max(Number(PS.storage.get("parrySlop.best", 0)) || 0, legacyBest);
  state.totalParries = Number(PS.storage.get("parrySlop.totalParries", 0)) || 0;

  function freshStats() {
    return { parries: 0, perfects: 0, weirds: 0, fakesPassed: 0, bosses: 0, time: 0 };
  }
  state.stats = freshStats();

  function stickmanX() {
    return PS.layout ? PS.layout.stickmanX : 200;
  }

  function addText(text, x, y, size, color, life, vy) {
    if (state.texts.length >= S.maxTexts) state.texts.shift();
    state.texts.push({
      text, x, y, size: size || 24, color: color || "#ffffff",
      life: life || 700, maxLife: life || 700, vy: vy === undefined ? -0.7 : vy
    });
  }

  function addParticles(x, y, color, count, spread, shape) {
    for (let i = 0; i < count; i++) {
      if (state.particles.length >= S.maxParticles) state.particles.shift();
      const angle = PS.rand(0, Math.PI * 2);
      const speed = PS.rand(1, spread || 6);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: PS.rand(250, 650), maxLife: 650,
        color, size: PS.rand(2, 5),
        shape: shape || "square"
      });
    }
  }

  function setBanner(title, sub, duration, color) {
    state.banner = { title, sub: sub || "", until: state.clock + duration, color: color || "#ffffff", start: state.clock };
  }

  function effectiveWindow(def, elapsed) {
    let w = Math.max(S.minWindowMs, def.window - elapsed * S.windowShrinkPerSecond);
    if (state.options.bigWindow) w *= 1.5;
    return w;
  }

  function spaceImpact(clock) {
    let t = clock;
    for (let guard = 0; guard < 8; guard++) {
      let moved = false;
      for (const a of state.attacks) {
        if (a.resolved) continue;
        if (Math.abs(a.impactClock - t) < 160) {
          t = a.impactClock + 160;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return t;
  }

  function spawnAttack(def, opts) {
    opts = opts || {};
    const elapsed = state.clock / 1000;
    const telegraph = opts.telegraph !== undefined
      ? opts.telegraph
      : Math.max(S.minTelegraphMs, def.telegraph - elapsed * S.telegraphShrinkPerSecond + PS.rand(-50, 50));
    const windowMs = opts.window !== undefined ? opts.window : effectiveWindow(def, elapsed);
    const label = opts.label || (def.labelPool ? PS.pick(def.labelPool) : def.label);
    const layout = PS.layout || { H: 600, groundY: 430 };

    let y;
    if (opts.y !== undefined) {
      y = opts.y;
    } else {
      const lanes = [0.34, 0.46, 0.58].map((f) => layout.H * f);
      let best = lanes[0];
      let bestGap = -1;
      for (const lane of lanes) {
        const cand = lane + PS.rand(-18, 18);
        let gap = Infinity;
        for (const other of state.attacks) {
          if (!other.resolved) gap = Math.min(gap, Math.abs(other.y - cand));
        }
        if (gap > bestGap) {
          bestGap = gap;
          best = cand;
        }
      }
      y = best;
    }

    const attack = {
      def,
      id: def.id,
      label,
      color: def.color,
      weird: Boolean(def.weird),
      kind: def.kind,
      behavior: opts.behavior || def.behavior || "standard",
      fake: Boolean(def.fake),
      spawnClock: state.clock,
      impactClock: state.clock + telegraph,
      window: windowMs,
      resolved: false,
      success: false,
      cued: false,
      hitsLeft: def.hits || 1,
      hitGap: def.hitGap || 380,
      y,
      spin: PS.rand(0, Math.PI * 2),
      boss: Boolean(opts.boss)
    };
    // impacts must stay farther apart than the input cooldown or chains become unparryable
    attack.impactClock = spaceImpact(attack.impactClock);
    state.attacks.push(attack);
    return attack;
  }

  function scheduleNext() {
    const elapsed = state.clock / 1000;
    const gapBase = Math.max(S.gapMinMs, S.gapBaseMs - elapsed * S.gapShrinkPerSecond);
    state.nextSpawnAt = state.clock + PS.rand(gapBase * 0.55, gapBase * 0.95);
  }

  function updateAct() {
    const secs = state.clock / 1000;
    for (const act of PS.ACTS) {
      if (act.n > state.act && secs >= act.at) {
        state.act = act.n;
        setBanner(act.name, act.sub, 1700, act.color);
        PS.audio.play("act");
      }
    }
  }

  function scheduleBoss() {
    if (state.boss || state.clock < state.nextBossAt) return;
    const spec = PS.BOSSES[state.bossIndex % PS.BOSSES.length];
    state.bossIndex++;
    const totalHits = spec.ids.reduce((n, id) => n + (PS.ATTACK_BY_ID[id].hits || 1), 0);
    state.boss = {
      name: spec.name,
      hp: totalHits,
      maxHp: totalHits,
      queue: spec.ids.slice(),
      downText: spec.downText
    };
    state.nextBossAt = state.clock + 75000;
    setBanner("BOSS // " + spec.name, spec.taunt, 1900, "#ff5252");
    PS.audio.play("boss");
  }

  function escapeBoss() {
    setBanner(state.boss.name + " ESCAPED", "it will remember this", 1500, "#ffd24d");
    state.boss = null;
    PS.audio.play("whiff");
  }

  function director() {
    if (state.banner && state.clock < state.banner.until) {
      state.nextSpawnAt = Math.max(state.nextSpawnAt, state.banner.until + 350);
      return;
    }
    updateAct();
    scheduleBoss();

    const active = state.attacks.filter((a) => !a.resolved).length;
    if (state.clock < state.nextSpawnAt || active >= S.maxActiveAttacks) return;

    if (state.boss) {
      if (state.boss.queue.length) {
        const def = PS.ATTACK_BY_ID[state.boss.queue.shift()];
        spawnAttack(def, {
          boss: true,
          telegraph: Math.max(S.minTelegraphMs, def.telegraph * 0.9)
        });
        state.nextSpawnAt = state.clock + 620;
      } else if (!state.attacks.some((a) => a.boss && !a.resolved)) {
        escapeBoss();
      }
      return;
    }

    if (state.patternQueue.length) {
      spawnAttack(PS.ATTACK_BY_ID[state.patternQueue.shift()]);
      state.nextSpawnAt = state.clock + state.patternGap;
      return;
    }

    const patterns = PS.PATTERNS.filter((p) => p.minAct <= state.act);
    if (patterns.length && PS.chance(0.14 + state.act * 0.04)) {
      const pattern = PS.pick(patterns);
      state.patternQueue = pattern.ids.slice();
      state.patternGap = pattern.gap;
      spawnAttack(PS.ATTACK_BY_ID[state.patternQueue.shift()]);
      state.nextSpawnAt = state.clock + state.patternGap;
      return;
    }

    const rares = PS.ATTACKS.filter((d) => d.rare && d.minAct <= state.act);
    const def = rares.length && PS.chance(0.04) ? PS.pick(rares) : PS.pickAttackDef(state.act);
    const opts = {};
    if (def.kind === "blade" && !def.hits && state.act >= 2 && PS.chance(0.22)) {
      opts.behavior = "delayed";
    }
    spawnAttack(def, opts);

    if (def.fake && !state.seenFake) {
      state.seenFake = true;
      const layout = PS.layout || { W: 800, H: 600 };
      addText("DASHED RING = FAKE. DO NOT PARRY.", layout.W * 0.5, layout.H * 0.42, 19, "#9a9aa2", 2400);
    }

    scheduleNext();
  }

  function startRun() {
    state.screen = "playing";
    state.clock = 0;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.hp = S.startingHp;
    state.slop = 0;
    state.attacks.length = 0;
    state.texts.length = 0;
    state.particles.length = 0;
    state.shake = 0;
    state.flash = 0;
    state.hitFlash = 0;
    state.fade = 1;
    state.parryAnimUntil = -1;
    state.hurtAnimUntil = -1;
    state.lastInputClock = -1e9;
    state.lockoutUntil = 0;
    state.slowmoRequest = false;
    state.slowmoUntil = 0;
    state.ripple = null;
    state.stormActive = false;
    state.stormStart = -1;
    state.stormCharge = 0;
    state.stormFlash = 0;
    state.nextStormFlashAt = 0;
    state.bolts.length = 0;
    state.implode = null;
    state.zaps.length = 0;
    state.shock = null;
    state.act = 1;
    state.banner = null;
    state.boss = null;
    state.patternQueue.length = 0;
    state.patternGap = 400;
    state.nextBossAt = 60000;
    state.bossIndex = 0;
    state.seenFake = false;
    state.weirdUntil = -1;
    state.stats = freshStats();
    state.newBest = false;
    state.shareCopied = false;
    state.nextSpawnAt = 1200;
    PS.audio.play("start");
    const layout = PS.layout || { W: 800, H: 600 };
    addText("YOU PARRIED THE START BUTTON", layout.W * 0.5, layout.H * 0.24, 22, "#ffffff", 1300);
    addText("PARRY EVERYTHING", layout.W * 0.5, layout.H * 0.32, 30, "#ffd24d", 1300);
  }

  function gameOver(killerLabel) {
    state.screen = "gameover";
    state.overClock = state.clock;
    state.stats.time = state.clock / 1000;
    state.deathText = killerLabel && PS.chance(0.5)
      ? "Parried by " + killerLabel + ". Embarrassing."
      : PS.pick(PS.TEXTS.death);
    state.newBest = state.score > state.best;
    state.best = Math.max(state.best, state.score);
    PS.storage.set("parrySlop.best", state.best);
    state.totalParries += state.stats.parries;
    PS.storage.set("parrySlop.totalParries", state.totalParries);
    state.shake = 20;
    PS.audio.play("over");
  }

  function milestoneCheck() {
    const msg = PS.TEXTS.milestones[state.combo];
    if (msg) {
      const layout = PS.layout || { W: 800, H: 600 };
      addText(msg, layout.W * 0.5, layout.H * 0.16, 26, "#ffd24d", 1200);
      PS.audio.play("milestone");
    }
  }

  function onParrySuccess(attack, diff) {
    const perfect = diff <= attack.window * S.perfectWindowRatio;

    if (state.boss && attack.boss) {
      state.boss.hp--;
      if (state.boss.hp <= 0) defeatBoss();
    }

    if (attack.hitsLeft > 1) {
      attack.hitsLeft--;
      attack.spawnClock = state.clock;
      attack.impactClock = spaceImpact(state.clock + attack.hitGap);
      attack.cued = false;
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      const gain = S.baseScore + state.combo * S.comboScoreStep;
      state.score += gain;
      state.stats.parries++;
      state.parryAnimUntil = state.clock + 140;
      state.shake = Math.max(state.shake, state.options.reducedShake ? 2 : 6);
      const layout = PS.layout || { W: 800 };
      addText("AGAIN! (" + attack.hitsLeft + " LEFT)", stickmanX() + 90, attack.y - 50, 22, attack.color, 600);
      addParticles(stickmanX() + 70, attack.y, attack.color, 10);
      PS.audio.play("parry");
      milestoneCheck();
      return;
    }

    attack.resolved = true;
    attack.success = true;
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.stats.parries++;
    if (perfect) state.stats.perfects++;
    const weird = attack.weird || state.clock < state.weirdUntil;
    if (attack.weird) state.stats.weirds++;

    const gain =
      S.baseScore +
      state.combo * S.comboScoreStep +
      (perfect ? S.perfectBonus : 0) +
      (weird ? S.weirdBonus : 0);
    state.score += gain;

    state.slop = PS.clamp(
      state.slop + (attack.weird ? S.slopGainWeird : S.slopGainNormal) + (perfect ? S.slopGainPerfect : 0),
      0, 1
    );
    if (state.slop >= 1 && state.clock >= state.weirdUntil) {
      state.weirdUntil = state.clock + S.stormMs;
      state.stormStart = state.clock;
      state.stormActive = true;
      state.slop = 0.55;
      setBanner("SLOP OVERFLOW", "THE GAME PARRIES FOR YOU", 1600, "#ff4dff");
    }

    state.parryAnimUntil = state.clock + 150;
    state.flash = state.options.flashSafe ? 0.08 : perfect ? 0.26 : 0.14;
    state.shake = state.options.reducedShake ? 2 : perfect ? 12 : 7;
    if (perfect && state.options.slowMo) {
      state.slowmoRequest = true;
      state.ripple = { x: stickmanX() + 80, y: attack.y, born: state.clock };
      PS.audio.play("slowmo");
    }
    if (state.stormActive && state.stormStart === state.clock) {
      state.flash = state.options.flashSafe ? 0.12 : 0.5;
      state.shake = state.options.reducedShake ? 5 : 24;
      state.slowmoRequest = true;
      state.shock = { x: stickmanX(), y: (PS.layout ? PS.layout.groundY : 430) - 60, born: state.clock };
      PS.audio.play("overflow");
    }

    const x = stickmanX() + 80;
    addParticles(x, attack.y, attack.color, perfect ? 26 : 16, perfect ? 8 : 6);
    addText(
      perfect ? PS.pick(PS.TEXTS.perfect) : PS.pick(PS.TEXTS.parry),
      x, attack.y - 44, perfect ? 32 : 26, perfect ? "#ffffff" : attack.color, 800
    );
    const sub = attack.def.parryPool ? PS.pick(attack.def.parryPool) : "+" + PS.fmt(gain);
    addText(attack.weird ? attack.label + " PARRIED" : sub, x, attack.y - 80, 17, "#ffffff", 700);
    if (weird) {
      const layout = PS.layout || { W: 800, H: 600 };
      addText(PS.pick(PS.TEXTS.weirdReact), layout.W * 0.5, layout.H * 0.2, 28, "#ffd24d", 800);
    }

    state.nextSpawnAt = Math.min(state.nextSpawnAt, state.clock + PS.rand(450, 900));

    if (state.stats.parries === 100) {
      setBanner("CREDITS", "thanks for parrying. there is no ending.", 2200, "#ffffff");
    }

    milestoneCheck();
    PS.audio.play(attack.weird ? "weird" : perfect ? "perfect" : "parry");
  }

  function defeatBoss() {
    const bonus = 1500;
    state.score += bonus;
    state.stats.bosses++;
    state.slop = PS.clamp(state.slop + 0.25, 0, 1);
    const layout = PS.layout || { W: 800, H: 600 };
    setBanner(state.boss.name + " PARRIED", "+" + bonus + " // " + state.boss.downText, 1800, "#7dff7d");
    addParticles(layout.W * 0.5, layout.H * 0.4, "#7dff7d", 40, 9);
    state.boss = null;
    PS.audio.play("bossDown");
  }

  function autoDestroy(attack, pos) {
    attack.resolved = true;
    attack.success = true;
    const hits = attack.hitsLeft;
    state.combo += hits;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.stats.parries += hits;
    if (attack.weird) state.stats.weirds += hits;
    const gain = hits * (S.baseScore + S.weirdBonus) + state.combo * S.comboScoreStep;
    state.score += gain;
    state.slop = PS.clamp(state.slop + S.stormSlopPerHit * hits, 0, 1);
    state.stormCharge = Math.min(S.stormMaxCharge, state.stormCharge + hits);
    state.shake = Math.max(state.shake, state.options.reducedShake ? 2 : Math.min(12, 6 + state.stormCharge * 0.5));
    state.bolts.push({
      x1: pos.x + PS.rand(-70, 70), y1: 24,
      x2: pos.x, y2: pos.y,
      born: state.clock, seed: PS.rand(0, 100), color: attack.color
    });
    if (state.bolts.length > 16) state.bolts.shift();
    state.zaps.push({ x: pos.x, y: pos.y, born: state.clock, color: attack.color });
    if (state.zaps.length > 12) state.zaps.shift();
    addParticles(pos.x, pos.y, attack.color, 26, 9, "shard");
    addParticles(pos.x, pos.y, "#ffffff", 12, 7);
    addText(
      attack.fake ? "IT WAS FINE. NOW IT IS NOT." : PS.pick(["VAPORIZED", "AUTO-PARRIED", "SLOP INCINERATED", "DELETE."]),
      pos.x, pos.y - 46, 22, "#ff4dff", 700
    );
    addText(attack.label + " +" + PS.fmt(gain), pos.x, pos.y - 78, 15, "#ffffff", 600);
    if (state.boss && attack.boss) {
      state.boss.hp -= hits;
      if (state.boss.hp <= 0) defeatBoss();
    }
    if (state.stats.parries === 100) {
      setBanner("CREDITS", "thanks for parrying. there is no ending.", 2200, "#ffffff");
    }
    milestoneCheck();
    PS.audio.play("stormHit", { cat: attack.def.category, combo: state.combo, charge: state.stormCharge });
    if (state.stormCharge % 3 === 0) PS.audio.play("thunder");
  }

  function whiff(attack) {
    state.combo = 0;
    state.lockoutUntil = state.clock + S.whiffLockoutMs;
    state.shake = Math.max(state.shake, state.options.reducedShake ? 1 : 3);
    const early = attack && attack.impactClock > state.clock;
    const fake = attack && attack.fake;
    let msg;
    if (fake) msg = PS.pick(PS.TEXTS.fakeParry);
    else if (early) msg = PS.pick(PS.TEXTS.early);
    else msg = PS.pick(PS.TEXTS.whiff);
    addText(msg, stickmanX() + 80, (PS.layout ? PS.layout.groundY : 430) - 170, 22, "#ff8888", 650);
    PS.audio.play("whiff");
  }

  function press() {
    PS.audio.ensure();

    if (state.screen === "title") {
      startRun();
      return;
    }
    if (state.screen === "gameover") {
      if (state.clock - state.overClock > S.restartDelayMs) startRun();
      return;
    }
    if (state.screen === "paused") {
      resume();
      return;
    }
    if (state.screen !== "playing") return;

    if (state.clock < state.lockoutUntil) return;
    if (state.clock - state.lastInputClock < S.inputCooldownMs) return;
    state.lastInputClock = state.clock;

    let bestAttack = null;
    let bestDiff = Infinity;
    for (const attack of state.attacks) {
      if (attack.resolved) continue;
      const diff = Math.abs(state.clock - attack.impactClock);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestAttack = attack;
      }
    }

    if (bestAttack && bestDiff <= bestAttack.window) {
      if (bestAttack.fake) {
        whiff(bestAttack);
        return;
      }
      onParrySuccess(bestAttack, bestDiff);
    } else {
      whiff(bestAttack);
    }
  }

  function resolveMisses() {
    for (const attack of state.attacks) {
      if (attack.resolved || state.clock <= attack.impactClock + attack.window) continue;

      attack.resolved = true;
      attack.success = false;

      if (attack.fake) {
        state.score += S.fakePassScore;
        state.stats.fakesPassed++;
        addText(PS.pick(PS.TEXTS.fakePass) + " +" + S.fakePassScore, stickmanX() + 90, attack.y - 40, 20, "#7dff7d", 800);
        PS.audio.play("fakePass");
        continue;
      }

      state.hp--;
      state.combo = 0;
      state.shake = state.options.reducedShake ? 4 : 18;
      state.hitFlash = state.options.flashSafe ? 0.12 : 0.35;
      state.hurtAnimUntil = state.clock + 260;

      const layout = PS.layout || { W: 800, H: 600 };
      addParticles(stickmanX() + 25, attack.y, "#ff4444", 24, 7);
      addText("HIT!", layout.W * 0.5, layout.H * 0.25, 38, "#ff4444", 900);
      const missMsg = attack.def.missPool ? PS.pick(attack.def.missPool) : PS.pick(PS.TEXTS.miss);
      addText(missMsg, layout.W * 0.5, layout.H * 0.33, 21, "#ffffff", 900);
      PS.audio.play("miss");

      if (state.hp <= 0) {
        gameOver(attack.label);
        return;
      }
    }
  }

  function updateEffects(dt) {
    const step = dt / 16.667;
    for (let i = state.texts.length - 1; i >= 0; i--) {
      const t = state.texts[i];
      t.life -= dt;
      t.y += t.vy * step;
      if (t.life <= 0) state.texts.splice(i, 1);
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vy += 0.12 * step;
      p.vx *= Math.pow(0.99, step);
    }
    state.shake *= Math.pow(0.86, step);
    state.flash *= Math.pow(0.85, step);
    state.hitFlash *= Math.pow(0.88, step);
    state.stormFlash *= Math.pow(0.82, step);
    state.fade = Math.max(0, state.fade - dt / 400);
  }

  function update(now) {
    const dt = PS.clamp(now - state.lastNow, 0, 50);
    state.lastNow = now;

    if (state.screen === "playing") {
      if (state.slowmoRequest) {
        state.slowmoUntil = now + S.slowmoMs;
        state.slowmoRequest = false;
      }
      let scale = 1;
      if (now < state.slowmoUntil) {
        const remain = (state.slowmoUntil - now) / S.slowmoMs;
        scale = 1 - (1 - S.slowmoScale) * Math.pow(remain, 1.6);
      }
      state.clock += dt * scale;

      director();

      if (state.stormActive) {
        if (state.clock >= state.weirdUntil) {
          state.stormActive = false;
          state.stormCharge = 0;
          state.implode = { born: state.clock };
          setBanner("SLOP CONTAINED", "back to manual parrying", 1500, "#7dff7d");
          PS.audio.play("contain");
        } else {
          const L = PS.layout || { W: 800, H: 600, s: 1, stickmanX: 200, groundY: 430 };
          if (state.clock >= state.nextStormFlashAt) {
            state.nextStormFlashAt = state.clock + PS.rand(900, 1900);
            state.stormFlash = state.options.flashSafe ? 0.22 : 0.5;
            state.bolts.push({
              ambient: true,
              x1: PS.rand(0, L.W), y1: 30,
              x2: PS.rand(0, L.W), y2: L.groundY + 40 * L.s,
              born: state.clock, seed: PS.rand(0, 100), color: "#59c2ff"
            });
            PS.audio.play("rumble");
          }
          if (state.clock >= state.stormStart + S.stormArmMs) {
            const fieldX = stickmanX() + S.stormFieldOffset * L.s;
            for (const a of state.attacks) {
              if (a.resolved) continue;
              const pos = PS.render.attackPos(a, state.clock, L);
              if (pos.x <= fieldX) autoDestroy(a, pos);
            }
          }
        }
      }

      if (state.options.audioCues) {
        for (const attack of state.attacks) {
          if (!attack.resolved && !attack.cued && state.clock >= attack.impactClock - attack.window) {
            attack.cued = true;
            PS.audio.play("tick");
          }
        }
      }

      resolveMisses();
      state.attacks = state.attacks.filter((a) => !(a.resolved && state.clock > a.impactClock + 450));
      state.zaps = state.zaps.filter((z) => state.clock - z.born < 420);
      state.bolts = state.bolts.filter((b) => state.clock - b.born < (b.ambient ? 260 : 320));
      if (state.shock && state.clock - state.shock.born > 900) state.shock = null;
      if (state.implode && state.clock - state.implode.born > 500) state.implode = null;
      if (state.ripple && state.clock - state.ripple.born > S.slowmoRippleMs) state.ripple = null;
      state.slop = Math.max(0, state.slop - S.slopDecayPerSecond * (dt / 1000));
      updateEffects(dt * scale);
    } else if (state.screen === "gameover") {
      state.clock += dt;
      updateEffects(dt);
    } else if (state.screen !== "paused") {
      updateEffects(dt);
    }
  }

  function pause() {
    if (state.screen === "playing") state.screen = "paused";
  }

  function resume() {
    if (state.screen === "paused") state.screen = "playing";
  }

  function togglePause() {
    if (state.screen === "playing") pause();
    else if (state.screen === "paused") resume();
  }

  function setOption(key, value) {
    if (!(key in DEFAULT_OPTIONS)) return;
    state.options[key] = value;
    PS.storage.set("parrySlop.options", state.options);
  }

  function openSettings() {
    if (state.screen === "title" || state.screen === "gameover") {
      state.screen = "settings";
      state.settingsRow = 0;
      PS.audio.play("ui");
    }
  }

  function closeSettings() {
    if (state.screen === "settings") {
      state.screen = "title";
      PS.audio.play("ui");
    }
  }

  return {
    state,
    DEFAULT_OPTIONS,
    startRun,
    press,
    update,
    pause,
    resume,
    togglePause,
    setOption,
    openSettings,
    closeSettings,
    spawnAttack,
    addText,
    addParticles,
    setBanner,
    effectiveWindow,
    stickmanX
  };
})();
