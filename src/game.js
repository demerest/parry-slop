"use strict";

window.PS = window.PS || {};

PS.game = (function () {
  const S = PS.SETTINGS;

  const DEFAULT_OPTIONS = {
    bigWindow: false,
    reducedShake: false,
    highContrast: false,
    flashSafe: false,
    audioCues: false
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
    parryAnimUntil: -1,
    hurtAnimUntil: -1,
    overClock: 0,
    deathText: "",
    newBest: false,
    nextSpawnAt: 0,
    lastInputClock: -1e9,
    lockoutUntil: 0,
    hitstopRequest: false,
    hitstopUntil: 0,
    act: 1,
    banner: null,
    boss: null,
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

  function addParticles(x, y, color, count, spread) {
    for (let i = 0; i < count; i++) {
      if (state.particles.length >= S.maxParticles) state.particles.shift();
      const angle = PS.rand(0, Math.PI * 2);
      const speed = PS.rand(1, spread || 6);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: PS.rand(250, 650), maxLife: 650,
        color, size: PS.rand(2, 5)
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

  function spawnAttack(def, opts) {
    opts = opts || {};
    const elapsed = state.clock / 1000;
    const telegraph = opts.telegraph !== undefined
      ? opts.telegraph
      : Math.max(S.minTelegraphMs, def.telegraph - elapsed * S.telegraphShrinkPerSecond + PS.rand(-50, 50));
    const windowMs = opts.window !== undefined ? opts.window : effectiveWindow(def, elapsed);
    const label = opts.label || (def.labelPool ? PS.pick(def.labelPool) : def.label);
    const layout = PS.layout || { H: 600, groundY: 430 };

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
      y: opts.y !== undefined ? opts.y : PS.rand(layout.H * 0.32, layout.H * 0.62),
      spin: PS.rand(0, Math.PI * 2),
      boss: Boolean(opts.boss)
    };
    state.attacks.push(attack);
    return attack;
  }

  function scheduleNext() {
    const elapsed = state.clock / 1000;
    const gapBase = Math.max(S.gapMinMs, S.gapBaseMs - elapsed * S.gapShrinkPerSecond);
    state.nextSpawnAt = state.clock + PS.rand(gapBase * 0.55, gapBase * 0.95);
  }

  function director() {
    if (state.banner && state.clock < state.banner.until) {
      state.nextSpawnAt = Math.max(state.nextSpawnAt, state.banner.until + 350);
      return;
    }
    const active = state.attacks.filter((a) => !a.resolved).length;
    if (state.clock >= state.nextSpawnAt && active < S.maxActiveAttacks) {
      const def = PS.pickAttackDef(state.act);
      spawnAttack(def);
      scheduleNext();
    }
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
    state.parryAnimUntil = -1;
    state.hurtAnimUntil = -1;
    state.lastInputClock = -1e9;
    state.lockoutUntil = 0;
    state.hitstopRequest = false;
    state.hitstopUntil = 0;
    state.act = 1;
    state.banner = null;
    state.boss = null;
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

    if (attack.hitsLeft > 1) {
      attack.hitsLeft--;
      attack.spawnClock = state.clock;
      attack.impactClock = state.clock + attack.hitGap;
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

    state.parryAnimUntil = state.clock + 150;
    state.flash = state.options.flashSafe ? 0.08 : perfect ? 0.26 : 0.14;
    state.shake = state.options.reducedShake ? 2 : perfect ? 12 : 7;
    if (perfect) state.hitstopRequest = true;

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

    if (state.boss) {
      state.boss.hp--;
      if (state.boss.hp <= 0) defeatBoss();
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
  }

  function update(now) {
    const dt = PS.clamp(now - state.lastNow, 0, 50);
    state.lastNow = now;

    if (state.screen === "playing") {
      if (state.hitstopRequest) {
        state.hitstopUntil = now + S.hitstopMs;
        state.hitstopRequest = false;
      }
      const scale = now < state.hitstopUntil ? S.hitstopScale : 1;
      state.clock += dt * scale;

      director();

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
      state.slop = Math.max(0, state.slop - S.slopDecayPerSecond * (dt / 1000));
      updateEffects(dt);
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
