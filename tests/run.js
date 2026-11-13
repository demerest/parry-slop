"use strict";

(function () {
  const g = window.__ps;
  const state = g.state;
  const results = [];
  let now = 1000;

  function test(name, fn) {
    try {
      fn();
      results.push("PASS " + name);
    } catch (error) {
      results.push("FAIL " + name + " :: " + error.message);
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "assertion failed");
  }

  function eq(actual, expected, msg) {
    if (actual !== expected) throw new Error((msg || "eq") + " :: got " + actual + ", want " + expected);
  }

  function advance(ms, step) {
    step = step || 16;
    const target = now + ms;
    while (now < target) {
      now = Math.min(now + step, target);
      g.tick(now);
    }
  }

  function fresh() {
    g.startRun();
  }

  function firstAttack() {
    let guard = 0;
    while (!state.attacks.some((a) => !a.resolved) && guard++ < 400) advance(25);
    const a = state.attacks.find((x) => !x.resolved);
    assert(a, "no attack spawned");
    return a;
  }

  test("boot: namespace, canvas, title screen", function () {
    assert(window.PS, "PS missing");
    assert(g, "__ps hook missing");
    eq(state.screen, "title", "initial screen");
    const canvas = document.getElementById("game");
    assert(canvas.width > 0 && canvas.height > 0, "canvas not sized");
    assert(PS.layout && PS.layout.W > 0, "layout missing");
  });

  test("attack data sanity", function () {
    assert(PS.ATTACKS.length >= 8, "need >= 8 attacks");
    let weird = 0;
    for (const def of PS.ATTACKS) {
      assert(def.id && def.kind && def.color, "def missing fields: " + def.id);
      assert(def.telegraph > def.window && def.window > 0, "bad timing: " + def.id);
      assert(def.weight > 0, "bad weight: " + def.id);
      if (def.weird) weird++;
    }
    assert(weird >= 4, "need >= 4 weird attacks");
    assert(PS.TEXTS.death.length >= 10, "need >= 10 death messages");
    assert(PS.TEXTS.parry.length + PS.TEXTS.perfect.length >= 14, "need parry reaction pools");
  });

  test("press on title starts run", function () {
    g.press();
    eq(state.screen, "playing", "screen after start");
    eq(state.hp, 3, "hp");
    eq(state.score, 0, "score");
    assert(state.texts.some((t) => t.text === "YOU PARRIED THE START BUTTON"), "start button joke missing");
  });

  test("attacks spawn with telegraph", function () {
    advance(2500);
    assert(state.attacks.length >= 1, "no attacks after 2.5s");
    const a = state.attacks[0];
    assert(a.impactClock > a.spawnClock, "impact must follow spawn");
    assert(a.window > 0, "window");
  });

  test("perfect parry at exact impact", function () {
    fresh();
    const a = firstAttack();
    advance(a.impactClock - state.clock, 4);
    g.press();
    assert(a.resolved && a.success, "attack not parried");
    eq(state.combo, 1, "combo");
    eq(state.stats.perfects, 1, "perfects");
    assert(state.score >= 255, "perfect score too low: " + state.score);
    assert(state.slop > 0, "slop should increase");
  });

  test("normal parry inside window edge", function () {
    fresh();
    const a = firstAttack();
    advance(a.impactClock - a.window * 0.6 - state.clock, 4);
    g.press();
    assert(a.resolved && a.success, "attack not parried");
    eq(state.stats.perfects, 0, "should not be perfect");
    eq(state.combo, 1, "combo");
  });

  test("missed attack costs 1 HP and resets combo", function () {
    fresh();
    const a = firstAttack();
    state.combo = 4;
    advance(a.impactClock + a.window + 80 - state.clock, 4);
    assert(a.resolved && !a.success, "attack should be missed");
    eq(state.hp, 2, "hp after miss");
    eq(state.combo, 0, "combo reset");
  });

  test("whiff resets combo and locks input", function () {
    fresh();
    advance(300);
    state.combo = 7;
    g.press();
    eq(state.combo, 0, "combo after whiff");
    assert(state.lockoutUntil > state.clock, "whiff lockout not applied");
    const lastInput = state.lastInputClock;
    advance(100);
    g.press();
    eq(state.lastInputClock, lastInput, "input during lockout should be ignored");
    advance(300);
    g.press();
    assert(state.lastInputClock > lastInput, "input after lockout should register");
  });

  test("input cooldown blocks double press", function () {
    fresh();
    advance(300);
    g.press();
    const t1 = state.lastInputClock;
    advance(20);
    g.press();
    eq(state.lastInputClock, t1, "cooldown ignored");
  });

  test("death, best score, restart delay, clean restart", function () {
    fresh();
    state.score = 1234;
    let guard = 0;
    while (state.screen === "playing" && guard++ < 2000) advance(50);
    eq(state.screen, "gameover", "should be dead after ignoring everything");
    assert(state.best >= 1234, "best not updated");
    eq(PS.storage.get("parrySlop.best", 0), state.best, "best not persisted");
    assert(state.deathText.length > 0, "death message missing");
    g.press();
    eq(state.screen, "gameover", "restart before delay should be ignored");
    advance(800);
    g.press();
    eq(state.screen, "playing", "restart after delay");
    eq(state.hp, 3, "hp reset");
    eq(state.score, 0, "score reset");
    eq(state.attacks.length, 0, "attacks not cleared");
    eq(state.combo, 0, "combo reset");
  });

  test("difficulty scaling shrinks telegraph and window", function () {
    fresh();
    const sword = PS.ATTACK_BY_ID.sword;
    const wEarly = g.game.effectiveWindow(sword, 2);
    const wLate = g.game.effectiveWindow(sword, 90);
    assert(wLate < wEarly, "window should shrink");
    const a1 = g.game.spawnAttack(sword);
    const t1 = a1.impactClock - a1.spawnClock;
    state.clock = 90000;
    const a2 = g.game.spawnAttack(sword);
    const t2 = a2.impactClock - a2.spawnClock;
    assert(t2 < t1, "telegraph should shrink: " + t1 + " -> " + t2);
    assert(t2 >= PS.SETTINGS.minTelegraphMs, "telegraph below floor");
  });

  test("slop decays over time (dt-based)", function () {
    fresh();
    const a = firstAttack();
    advance(a.impactClock - state.clock, 4);
    g.press();
    const before = state.slop;
    assert(before > 0, "slop should be positive after parry");
    advance(1000);
    const expected = before - PS.SETTINGS.slopDecayPerSecond;
    assert(Math.abs(state.slop - expected) < 0.006, "slop decay wrong: " + state.slop + " vs " + expected);
  });

  test("particle cap respected", function () {
    g.game.addParticles(100, 100, "#fff", 500);
    assert(state.particles.length <= PS.SETTINGS.maxParticles, "particle cap exceeded");
    state.particles.length = 0;
  });

  test("storage helper roundtrip", function () {
    PS.storage.set("parrySlop.test", { a: 1, b: "x" });
    const v = PS.storage.get("parrySlop.test", null);
    eq(v.a, 1, "storage roundtrip");
    eq(v.b, "x", "storage roundtrip b");
    eq(PS.storage.get("parrySlop.missing", 42), 42, "storage fallback");
  });

  test("seeded runs are deterministic", function () {
    function snapshot() {
      return JSON.stringify({
        score: state.score,
        hp: state.hp,
        combo: state.combo,
        slop: Math.round(state.slop * 10000),
        parries: state.stats.parries,
        attacks: state.attacks.map((a) => [a.id, Math.round(a.impactClock), Math.round(a.y * 100)])
      });
    }
    g.setSeed(42);
    fresh();
    advance(6000, 50);
    const s1 = snapshot();
    g.setSeed(42);
    fresh();
    advance(6000, 50);
    const s2 = snapshot();
    eq(s1, s2, "seeded runs diverged");
    PS.rng = Math.random;
  });

  test("big window option widens parry window", function () {
    fresh();
    const sword = PS.ATTACK_BY_ID.sword;
    const normal = g.game.effectiveWindow(sword, 0);
    g.game.setOption("bigWindow", true);
    const big = g.game.effectiveWindow(sword, 0);
    eq(big, normal * 1.5, "big window multiplier");
    const a = g.game.spawnAttack(sword);
    eq(a.window, big, "spawn uses option");
    g.game.setOption("bigWindow", false);
    assert(PS.storage.get("parrySlop.options", {}).bigWindow === false, "option not persisted");
  });

  test("pause freezes play-clock and resume preserves timing", function () {
    fresh();
    const a = firstAttack();
    g.game.pause();
    eq(state.screen, "paused", "pause screen");
    const clockBefore = state.clock;
    const impactBefore = a.impactClock;
    advance(2000);
    eq(state.clock, clockBefore, "clock advanced while paused");
    eq(a.impactClock, impactBefore, "impact shifted while paused");
    g.press();
    eq(state.screen, "playing", "resume via press");
    advance(a.impactClock - state.clock, 4);
    g.press();
    assert(a.resolved && a.success, "parry after resume failed");
  });

  test("settings screen navigation state", function () {
    state.screen = "title";
    g.game.openSettings();
    eq(state.screen, "settings", "open settings");
    g.game.setOption("reducedShake", true);
    eq(state.options.reducedShake, true, "option set");
    g.game.setOption("reducedShake", false);
    g.game.closeSettings();
    eq(state.screen, "title", "close settings");
  });

  test("resize keeps layout consistent", function () {
    g.resize();
    eq(PS.layout.W, window.innerWidth, "layout W");
    eq(PS.layout.H, window.innerHeight, "layout H");
    assert(PS.layout.stickmanX > 0 && PS.layout.groundY > 0, "layout anchors");
  });

  test("repeated restarts stay stable", function () {
    for (let i = 0; i < 5; i++) {
      fresh();
      advance(3000, 50);
      eq(state.screen, "playing", "run " + i + " should still be playing");
      assert(state.attacks.length <= 4, "attack accumulation on run " + i);
    }
  });

  test("no runtime errors", function () {
    eq(window.__errors.length, 0, "errors: " + window.__errors.join(" | "));
  });

  const fails = results.filter((r) => r.indexOf("FAIL") === 0).length;
  const out = document.getElementById("out");
  out.textContent = results.join("\n") + "\n\n" + (results.length - fails) + "/" + results.length + " PASS";
  document.title = fails === 0 ? "ALL PASS (" + results.length + ")" : "FAILURES: " + fails;
  window.__done = true;
})();
