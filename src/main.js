"use strict";

(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  PS.render.attach(canvas);

  function resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    PS.layout = {
      W, H,
      u: PS.clamp(Math.min(W, H) / 720, 0.55, 1.5),
      s: PS.clamp(H / 720, 0.55, 1.25),
      stickmanX: W < 600 ? W * 0.2 : W * 0.24,
      groundY: H * 0.72
    };
    PS.render.buildVignette(W, H);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  resize();

  function shareScore() {
    const st = PS.game.state;
    const text =
      "I parried " + st.stats.parries + " things in PARRY SLOP. Score " +
      PS.fmt(st.score) + ". I am legally unstoppable. " + location.href;
    function done() {
      st.shareCopied = true;
      PS.audio.play("ui");
    }
    function fallback() {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch (error) {
        PS.game.addText(text, PS.layout.W / 2, PS.layout.H * 0.9, 12, "#ffffff", 4000, 0);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else {
      fallback();
    }
  }

  function handleRegion(id) {
    const game = PS.game;
    const st = game.state;
    if (id === "mute") {
      PS.audio.ensure();
      PS.audio.toggleMute();
      return true;
    }
    if (id === "pause") {
      game.pause();
      PS.audio.play("ui");
      return true;
    }
    if (id === "settings") {
      game.openSettings();
      return true;
    }
    if (id === "back") {
      game.closeSettings();
      return true;
    }
    if (id && id.indexOf("opt:") === 0) {
      const key = id.slice(4);
      game.setOption(key, !st.options[key]);
      PS.audio.play("ui");
      return true;
    }
    if (id === "share") {
      shareScore();
      return true;
    }
    if (id === "logo" && st.screen === "title") {
      game.startRun();
      st.score += 500;
      game.addText("YOU PARRIED THE LOGO +500", PS.layout.W / 2, PS.layout.H * 0.4, 24, "#ff66d9", 1500);
      return true;
    }
    if (id === "rip" && st.screen === "gameover") {
      game.startRun();
      game.addText("YOU PARRIED DEATH. RESPECT.", PS.layout.W / 2, PS.layout.H * 0.4, 24, "#7dff7d", 1500);
      return true;
    }
    return false;
  }

  function pointerXY(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    PS.audio.ensure();
    const p = pointerXY(event);
    const id = PS.render.hitRegion(p.x, p.y);
    if (id && handleRegion(id)) return;
    PS.game.press();
  }, { passive: false });

  canvas.addEventListener("pointermove", function (event) {
    const p = pointerXY(event);
    canvas.style.cursor = PS.render.hitRegion(p.x, p.y) ? "pointer" : "default";
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("gesturestart", (event) => event.preventDefault());

  window.addEventListener("keydown", function (event) {
    const st = PS.game.state;
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      if (event.repeat) return;
      if (st.screen === "settings") {
        const row = PS.render.OPTION_ROWS[st.settingsRow];
        PS.game.setOption(row.key, !st.options[row.key]);
        PS.audio.play("ui");
      } else {
        PS.game.press();
      }
      return;
    }
    if (st.screen === "settings" && (event.code === "ArrowUp" || event.code === "ArrowDown")) {
      event.preventDefault();
      const n = PS.render.OPTION_ROWS.length;
      st.settingsRow = (st.settingsRow + (event.code === "ArrowDown" ? 1 : n - 1)) % n;
      PS.audio.play("ui");
      return;
    }
    if (event.code === "Escape") {
      if (st.screen === "settings") PS.game.closeSettings();
      else PS.game.togglePause();
      return;
    }
    if (event.code === "KeyP") {
      PS.game.togglePause();
      return;
    }
    if (event.code === "KeyM") {
      PS.audio.ensure();
      PS.audio.toggleMute();
      return;
    }
    if (event.code === "KeyS" && st.screen === "title") {
      PS.game.openSettings();
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) PS.game.pause();
  });
  window.addEventListener("blur", function () {
    PS.game.pause();
  });

  function loop(now) {
    PS.game.update(now);
    PS.render.draw(now);
    requestAnimationFrame(loop);
  }

  if (!window.__PS_NO_LOOP) {
    requestAnimationFrame(loop);
  }

  window.__ps = {
    version: PS.VERSION,
    tick(now) {
      PS.game.update(now);
      PS.render.draw(now);
    },
    press() {
      PS.game.press();
    },
    startRun() {
      PS.game.startRun();
    },
    setSeed: PS.setSeed,
    resize,
    state: PS.game.state,
    game: PS.game,
    audio: PS.audio,
    render: PS.render
  };
})();
