"use strict";

window.PS = window.PS || {};

PS.audio = (function () {
  let ctx = null;
  let master = null;
  let muted = PS.storage.get("parrySlop.muted", false);

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ctx.destination);
      } catch (error) {
        ctx = null;
        return false;
      }
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return true;
  }

  function tone(freq, dur, type, gain, slide, delay) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    }
    g.gain.setValueAtTime(gain || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function noise(dur, gain, freq, delay) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq || 800;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.04, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  const recipes = {
    parry() {
      tone(620, 0.06, "square", 0.05, 140);
      tone(930, 0.07, "triangle", 0.03, 120, 0.01);
    },
    perfect() {
      tone(880, 0.07, "square", 0.05, 220);
      tone(1320, 0.09, "triangle", 0.04, 180, 0.02);
      tone(1760, 0.12, "sine", 0.03, 0, 0.05);
    },
    miss() {
      tone(150, 0.16, "sawtooth", 0.07, -90);
      noise(0.12, 0.05, 300);
    },
    whiff() {
      tone(200, 0.06, "sine", 0.035, -60);
    },
    weird() {
      const f = 300 + PS.rng() * 700;
      tone(f, 0.08, "square", 0.04, f * 0.5);
    },
    over() {
      tone(330, 0.18, "sawtooth", 0.06, -120);
      tone(220, 0.22, "sawtooth", 0.06, -80, 0.16);
      tone(110, 0.4, "sawtooth", 0.07, -40, 0.34);
    },
    ui() {
      tone(520, 0.04, "square", 0.03, 60);
    },
    start() {
      tone(440, 0.07, "square", 0.04, 220);
      tone(660, 0.09, "square", 0.04, 220, 0.07);
    },
    tick() {
      tone(1100, 0.03, "sine", 0.025, 0);
    },
    act() {
      tone(523, 0.09, "square", 0.04, 0);
      tone(659, 0.09, "square", 0.04, 0, 0.09);
      tone(784, 0.14, "square", 0.05, 0, 0.18);
    },
    boss() {
      tone(196, 0.15, "sawtooth", 0.06, 0);
      tone(185, 0.2, "sawtooth", 0.06, 0, 0.16);
    },
    bossDown() {
      tone(784, 0.1, "square", 0.05, 0);
      tone(988, 0.1, "square", 0.05, 0, 0.1);
      tone(1175, 0.2, "square", 0.06, 0, 0.2);
    },
    fakePass() {
      tone(700, 0.05, "sine", 0.03, 100);
    },
    milestone() {
      tone(988, 0.06, "triangle", 0.04, 0);
      tone(1319, 0.1, "triangle", 0.04, 0, 0.06);
    },
    overflow() {
      tone(60, 0.6, "sine", 0.09, -20);
      tone(220, 0.5, "sawtooth", 0.05, 880);
      noise(0.5, 0.06, 900);
      tone(440, 0.12, "square", 0.04, 0, 0.1);
      tone(660, 0.12, "square", 0.04, 0, 0.22);
      tone(880, 0.2, "square", 0.05, 0, 0.34);
    },
    zap() {
      const f = 500 + PS.rng() * 900;
      tone(f, 0.09, "square", 0.05, -f * 0.6);
      noise(0.08, 0.04, 2000 + PS.rng() * 1500);
    },
    contain() {
      tone(880, 0.12, "triangle", 0.04, -200);
      tone(440, 0.2, "triangle", 0.04, -100, 0.12);
    },
    slowmo() {
      tone(1400, 0.34, "sine", 0.03, -1100);
      tone(700, 0.4, "triangle", 0.02, -520, 0.02);
      noise(0.3, 0.018, 420);
    }
  };

  return {
    ensure,
    play(name) {
      if (muted) return;
      if (!ensure()) return;
      const recipe = recipes[name];
      if (recipe) {
        try {
          recipe();
        } catch (error) {
          // audio is decorative — never let it break gameplay
        }
      }
    },
    toggleMute() {
      muted = !muted;
      PS.storage.set("parrySlop.muted", muted);
      if (master) master.gain.value = muted ? 0 : 1;
      if (!muted) {
        ensure();
        this.play("ui");
      }
      return muted;
    },
    isMuted() {
      return muted;
    },
    available() {
      return !!ctx;
    }
  };
})();
