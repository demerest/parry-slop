"use strict";

window.PS = window.PS || {};

PS.VERSION = "0.2.0";

PS.SETTINGS = {
  startingHp: 3,
  inputCooldownMs: 110,
  whiffLockoutMs: 280,
  baseScore: 100,
  perfectBonus: 150,
  weirdBonus: 250,
  comboScoreStep: 5,
  perfectWindowRatio: 0.35,
  fakePassScore: 50,
  slopDecayPerSecond: 0.03,
  slopGainNormal: 0.055,
  slopGainWeird: 0.12,
  slopGainPerfect: 0.035,
  restartDelayMs: 650,
  maxParticles: 280,
  maxTexts: 40,
  maxActiveAttacks: 2,
  slowmoMs: 420,
  slowmoScale: 0.22,
  slowmoRippleMs: 520,
  stormMs: 8000,
  stormFieldOffset: 150,
  stormArmMs: 250,
  stormSlopPerHit: 0.02,
  stormMaxCharge: 12,
  minTelegraphMs: 480,
  minWindowMs: 95,
  telegraphShrinkPerSecond: 8,
  windowShrinkPerSecond: 0.6,
  gapBaseMs: 1350,
  gapShrinkPerSecond: 12,
  gapMinMs: 620
};

PS.rng = Math.random;

PS.setSeed = function (seed) {
  let a = seed >>> 0;
  PS.rng = function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

PS.rand = (a, b) => a + PS.rng() * (b - a);
PS.randInt = (a, b) => Math.floor(PS.rand(a, b + 1));
PS.pick = (arr) => arr[Math.floor(PS.rng() * arr.length)];
PS.chance = (p) => PS.rng() < p;
PS.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
PS.lerp = (a, b, t) => a + (b - a) * t;

PS.weightedPick = function (items, weightOf) {
  let total = 0;
  for (const item of items) total += weightOf(item);
  let roll = PS.rng() * total;
  for (const item of items) {
    roll -= weightOf(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1];
};

PS.storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // storage unavailable (private mode, sandbox) — play on without persistence
    }
  }
};

PS.fmt = (n) => Math.floor(n).toLocaleString("en-US");
