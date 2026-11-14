"use strict";

window.PS = window.PS || {};

PS.render = (function () {
  const canvas = null;
  let ctx = null;
  let vignette = null;
  const regions = [];

  function attach(c) {
    ctx = c.getContext("2d");
  }

  function buildVignette(W, H) {
    if (!ctx) return;
    vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
  }

  function font(px) {
    return "bold " + Math.round(px) + 'px "Courier New", ui-monospace, monospace';
  }

  function fitFont(text, maxW, px) {
    ctx.font = font(px);
    while (ctx.measureText(text).width > maxW && px > 9) {
      px -= 1;
      ctx.font = font(px);
    }
    return px;
  }

  function outlinedText(text, x, y, px, color, align) {
    ctx.font = font(px);
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(3, px / 8);
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function region(id, x, y, w, h) {
    regions.push({ id, x, y, w, h });
  }

  function hitRegion(px, py) {
    for (let i = regions.length - 1; i >= 0; i--) {
      const r = regions[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r.id;
    }
    return null;
  }

  function attackPos(a, clock, L) {
    const total = Math.max(1, a.impactClock - a.spawnClock);
    const t = PS.clamp((clock - a.spawnClock) / total, 0, 1.2);
    const startX = L.W + 120;
    const targetX = L.stickmanX + 65 * L.s;
    let x = PS.lerp(startX, targetX, Math.min(t, 1));
    let y = a.y;

    if (a.behavior === "delayed") {
      let p;
      if (t < 0.45) p = (t / 0.45) * 0.55;
      else if (t < 0.75) p = 0.55 + Math.sin((t - 0.45) * 60) * 0.004;
      else p = 0.55 + ((t - 0.75) / 0.25) * 0.45;
      x = PS.lerp(startX, targetX, PS.clamp(p, 0, 1));
    } else if (a.behavior === "lobbed") {
      const startY = Math.max(a.y - L.H * 0.42, 150);
      y = PS.lerp(startY, a.y, Math.min(t, 1)) - Math.sin(Math.PI * Math.min(t, 1)) * 36;
    } else if (a.behavior === "wobble") {
      y += Math.sin(t * 9 + a.spin) * 20;
    } else if (a.behavior === "homing") {
      const tt = Math.min(t, 1);
      y = PS.lerp(a.y, L.groundY - 70 * L.s, tt * tt);
    } else if (a.behavior === "fake") {
      y += Math.sin(clock / 180 + a.spin) * 4;
    }
    return { x, y, t };
  }

  function drawBackground(now, L, st) {
    const hc = st.options.highContrast;
    let base = "#101014";
    if (hc) base = "#000000";
    else if (st.screen === "playing" && (st.slop > 0.75 || st.clock < st.weirdUntil)) {
      base = "hsl(" + ((now / 15) % 360) + ", 32%, 8%)";
    }
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, L.W, L.H);

    if (st.screen === "playing" && st.clock < st.weirdUntil && !hc) {
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,77,255,0.07)" : "rgba(89,194,255,0.07)";
        ctx.fillRect(0, PS.rand(0, L.H), L.W, PS.rand(2, 10));
      }
    }

    if (st.screen === "playing" && now < st.slowmoUntil) {
      ctx.fillStyle = hc ? "rgba(89,194,255,0.1)" : "rgba(89,194,255,0.05)";
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const y = (i * 137 + now * 0.02) % L.H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(L.W, y);
        ctx.stroke();
      }
    }

    const groundLine = L.groundY + 52 * L.s;

    ctx.fillStyle = hc ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)";
    for (let i = 0; i < 16; i++) {
      const bw = 40 + ((i * 67) % 70);
      const bh = 30 + ((i * 97) % 110);
      const bx = ((i * 173 + (st.screen === "playing" ? st.clock * 0.006 : now * 0.004)) % (L.W + 160)) - 80;
      ctx.fillRect(bx, groundLine - bh, bw, bh);
    }

    ctx.strokeStyle = hc ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundLine);
    ctx.lineTo(L.W, groundLine);
    ctx.stroke();

    ctx.strokeStyle = hc ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const y = groundLine + i * i * 7 * L.s;
      if (y > L.H) break;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(L.W, y);
      ctx.stroke();
    }
    for (let i = 0; i < 13; i++) {
      const x = (i / 12) * L.W;
      ctx.beginPath();
      ctx.moveTo(x, groundLine);
      ctx.lineTo(L.W / 2 + (x - L.W / 2) * 2.4, L.H);
      ctx.stroke();
    }

    if (st.screen === "playing" && st.combo >= 10 && !hc) {
      const a = Math.min(st.combo / 120, 0.22);
      ctx.fillStyle = "rgba(255,210,77," + a.toFixed(3) + ")";
      ctx.fillRect(0, 0, L.W, 3);
      ctx.fillRect(0, L.H - 3, L.W, 3);
      ctx.fillRect(0, 0, 3, L.H);
      ctx.fillRect(L.W - 3, 0, 3, L.H);
    }

    if (!st.options.flashSafe && !hc) {
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      for (let y = 0; y < L.H; y += 4) ctx.fillRect(0, y, L.W, 1);
    }

    if (vignette && !hc) {
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, L.W, L.H);
    }
  }

  function drawStickman(now, L, st, ox, oy, os) {
    const x = ox === undefined ? L.stickmanX : ox;
    const y = oy === undefined ? L.groundY : oy;
    const s = os === undefined ? L.s : os;
    const clock = st.clock;
    const parrying = st.screen === "playing" && clock < st.parryAnimUntil;
    const hurt = st.screen === "playing" && clock < st.hurtAnimUntil;
    const dead = st.screen === "gameover";
    const bob = dead ? 0 : Math.sin(now / 480) * 2.2 * s;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);

    if (dead) {
      const p = PS.clamp((clock - st.overClock) / 650, 0, 1);
      ctx.rotate(-1.45 * p);
      ctx.translate(0, 20 * p);
    } else if (hurt) {
      ctx.rotate(-0.12);
      ctx.translate(PS.rand(-2, 2), 0);
    }

    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.strokeStyle = dead ? "#8a8a92" : hurt ? "#ff5252" : parrying ? "#ffffff" : st.options.highContrast ? "#ffffff" : "#e8e8e8";

    ctx.beginPath();
    ctx.arc(0, -95, 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -77);
    ctx.lineTo(0, -18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-22, 45);
    ctx.moveTo(0, -18);
    ctx.lineTo(22, 45);
    ctx.stroke();

    if (parrying) {
      ctx.beginPath();
      ctx.moveTo(0, -65);
      ctx.lineTo(58, -78);
      ctx.moveTo(0, -58);
      ctx.lineTo(38, -38);
      ctx.stroke();

      ctx.lineWidth = 5;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(58, -108);
      ctx.lineTo(75, -38);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(70, -72, 42, -1.1, 1.1);
      ctx.stroke();

      if (now < st.slowmoUntil) {
        ctx.strokeStyle = "rgba(255,102,217,0.35)";
        ctx.beginPath();
        ctx.arc(66, -72, 42, -1.1, 1.1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(89,194,255,0.35)";
        ctx.beginPath();
        ctx.arc(74, -72, 42, -1.1, 1.1);
        ctx.stroke();
      }
    } else if (dead) {
      ctx.beginPath();
      ctx.moveTo(0, -65);
      ctx.lineTo(-30, -45);
      ctx.moveTo(0, -60);
      ctx.lineTo(32, -50);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -65);
      ctx.lineTo(-28, -30);
      ctx.moveTo(0, -60);
      ctx.lineTo(30, -30);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAttackShape(a, now) {
    ctx.fillStyle = a.color;
    ctx.strokeStyle = a.color;

    if (a.kind === "blade") {
      ctx.save();
      ctx.rotate(Math.sin(now / 60 + a.spin) * 0.2 + 0.5);
      if (a.id === "axe") {
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(40, -40);
        ctx.lineTo(-30, 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(28, -46);
        ctx.quadraticCurveTo(54, -20, 30, 4);
        ctx.lineTo(16, -14);
        ctx.closePath();
        ctx.fill();
      } else if (a.id === "spear") {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(55, -20);
        ctx.lineTo(-45, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(58, -21);
        ctx.lineTo(38, -24);
        ctx.lineTo(42, -6);
        ctx.closePath();
        ctx.fill();
      } else if (a.id === "knife") {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(28, -28);
        ctx.lineTo(-16, 16);
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.lineTo(-26, 26);
        ctx.stroke();
      } else if (a.id === "triple") {
        ctx.lineWidth = 6;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(38 + i * 15, -38 + i * 10);
          ctx.lineTo(-30 + i * 15, 30 + i * 10);
          ctx.stroke();
        }
      } else {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(45, -45);
        ctx.lineTo(-35, 35);
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-15, 15);
        ctx.lineTo(15, 45);
        ctx.stroke();
      }
      ctx.restore();
    } else if (a.kind === "arrow") {
      if (a.id === "paperplane") {
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(-30, -16);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-30, 16);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(-14, 0);
        ctx.stroke();
      } else {
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(55, 0);
        ctx.lineTo(-45, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(55, 0);
        ctx.lineTo(32, -12);
        ctx.lineTo(32, 12);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-45, 0);
        ctx.lineTo(-55, -9);
        ctx.moveTo(-45, 0);
        ctx.lineTo(-55, 9);
        ctx.stroke();
      }
    } else if (a.kind === "spin") {
      ctx.save();
      ctx.rotate(now / 90 + a.spin);
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-30, -6);
      ctx.lineTo(0, 0);
      ctx.lineTo(26, -22);
      ctx.stroke();
      ctx.restore();
    } else if (a.kind === "crate") {
      const px = fitFont(a.label, 260, 15);
      const w = ctx.measureText(a.label).width + 40;
      ctx.fillStyle = "#191920";
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 3;
      roundRect(-w / 2, -38, w, 76, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 3;
      if (a.id === "piano") {
        for (let i = 0; i < 6; i++) ctx.strokeRect(-27 + i * 9, -30, 9, 16);
      } else if (a.id === "anvil") {
        ctx.beginPath();
        ctx.moveTo(-24, -28);
        ctx.lineTo(24, -28);
        ctx.lineTo(14, -18);
        ctx.lineTo(8, -18);
        ctx.lineTo(12, -10);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-8, -18);
        ctx.lineTo(-16, -18);
        ctx.closePath();
        ctx.fill();
      } else if (a.id === "fish") {
        ctx.beginPath();
        ctx.ellipse(-4, -22, 16, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, -22);
        ctx.lineTo(24, -30);
        ctx.lineTo(24, -14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#191920";
        ctx.beginPath();
        ctx.arc(-12, -24, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (a.id === "microwave") {
        ctx.strokeRect(-26, -32, 36, 22);
        ctx.fillRect(14, -32, 10, 22);
      }
      ctx.fillStyle = a.color;
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.label, 0, 18);
    } else if (a.kind === "word") {
      const px = fitFont(a.label, 340, 34);
      ctx.save();
      ctx.rotate(Math.sin(now / 300 + a.spin) * 0.06);
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.strokeText(a.label, 0, 0);
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = a.color;
      ctx.fillText(a.label, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    } else if (a.kind === "critter") {
      if (a.id === "duck") {
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.ellipse(0, 6, 20, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-14, -10, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff9933";
        ctx.beginPath();
        ctx.moveTo(-22, -10);
        ctx.lineTo(-32, -7);
        ctx.lineTo(-22, -5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#101014";
        ctx.beginPath();
        ctx.arc(-16, -12, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = "#7dff7d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 24);
        ctx.lineTo(0, 2);
        ctx.stroke();
        ctx.fillStyle = a.color;
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2 + now / 900;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 10, -6 + Math.sin(ang) * 10, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#ffd24d";
        ctx.beginPath();
        ctx.arc(0, -6, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (a.kind === "bullet") {
      if (a.id === "sniper") {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(140, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (a.id === "shotgun") {
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.arc(i * 6, i * 12, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (a.id === "homing") {
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(50, -18, 90, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(90, 0);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else if (a.kind === "orb") {
      if (a.id === "grenade") {
        ctx.fillStyle = "#3a4a3a";
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(6, -24);
        ctx.stroke();
        ctx.fillStyle = "#ffd24d";
        ctx.beginPath();
        ctx.arc(6 + Math.sin(now / 40) * 2, -26, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 16 + Math.sin(now / 45 + a.spin) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(26, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (a.kind === "bubble") {
      const px = fitFont(a.label, 300, 19);
      const w = ctx.measureText(a.label).width + 30;
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = "#15151a";
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 3;
      roundRect(-w / 2, -24, w, 44, 12);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-22, 36);
      ctx.lineTo(4, 20);
      ctx.closePath();
      ctx.fillStyle = "#15151a";
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = a.color;
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.label, 0, -2);
      ctx.globalAlpha = 1;
    } else if (a.kind === "card") {
      const px = fitFont(a.label, 280, 16);
      const w = ctx.measureText(a.label).width + 48;
      ctx.fillStyle = "#1b1b22";
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 3;
      roundRect(-w / 2, -34, w, 68, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = a.color;
      ctx.fillRect(-w / 2, -34, w, 14);
      ctx.fillStyle = "#1b1b22";
      ctx.beginPath();
      ctx.arc(w / 2 - 10, -27, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = a.color;
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.label, 0, -4);
      ctx.fillStyle = "#ffffff";
      ctx.font = font(11);
      ctx.fillText("[PARRY TO CLOSE]", 0, 20);
    } else if (a.kind === "widget") {
      const px = fitFont(a.label, 280, 17);
      const w = ctx.measureText(a.label).width + 34;
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.fillRect(-w / 2, -24, w, 48);
      ctx.strokeRect(-w / 2, -24, w, 48);
      ctx.fillStyle = a.color;
      ctx.font = font(px);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.label, 0, 0);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function attackHalfWidth(a) {
    if (a.kind === "bubble") return a.label.length * 6 + 24;
    if (a.kind === "card") return a.label.length * 5 + 30;
    if (a.kind === "widget") return a.label.length * 5.5 + 22;
    if (a.kind === "crate") return a.label.length * 4.5 + 24;
    if (a.kind === "word") return a.label.length * 10 + 12;
    if (a.kind === "critter") return 32;
    return 36;
  }

  function drawBolt(b, st, mul) {
    const age = st.clock - b.born;
    const life = b.ambient ? 260 : 320;
    if (age > life) return;
    const a = (1 - age / life) * mul;
    const flick = 0.7 + 0.3 * Math.sin(age * 0.9 + b.seed);
    ctx.save();
    ctx.globalAlpha = a * flick;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowColor = b.color || "#ff4dff";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    const segs = 9;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const edge = i === 0 || i === segs;
      const x = PS.lerp(b.x1, b.x2, t) + (edge ? 0 : Math.sin(b.seed * 7 + i * 13.7) * 26 * (1 - t * 0.4));
      const y = PS.lerp(b.y1, b.y2, t) + (edge ? 0 : Math.cos(b.seed * 5 + i * 9.1) * 10);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = a * flick * 0.5;
    ctx.strokeStyle = b.color || "#ff4dff";
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  function drawStormBack(now, L, st) {
    if (!st.stormActive) return;
    const inA = PS.clamp((st.clock - st.stormStart) / 400, 0, 1);
    const outA = PS.clamp((st.weirdUntil - st.clock) / 500, 0, 1);
    const a = Math.min(inA, outA);
    if (a <= 0) return;
    const charge = st.stormCharge;

    ctx.save();
    ctx.globalAlpha = a;
    for (let layer = 0; layer < 2; layer++) {
      ctx.fillStyle = layer ? "rgba(30,10,40,0.55)" : "rgba(18,6,28,0.7)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(L.W, 0);
      ctx.lineTo(L.W, 40 + layer * 26);
      for (let x = L.W; x >= 0; x -= 40) {
        const y = 40 + layer * 26 +
          Math.sin(x * 0.013 + now * 0.0016 * (layer + 1)) * 14 +
          Math.sin(x * 0.031 - now * 0.001) * 8;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,77,255," + ((0.1 + 0.05 * Math.sin(now / 120)) * a).toFixed(3) + ")";
    ctx.fillRect(0, 0, L.W, 70);

    const n = Math.min(90, 34 + charge * 5);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < n; i++) {
      const speed = 0.9 + (i % 5) * 0.12;
      const y = ((now * speed * 0.9 + i * 173) % (L.H + 80)) - 40;
      const x = ((i * 211 + now * 0.25 * speed) % (L.W + 80)) - 40;
      const col = i % 3 === 0 ? "rgba(255,77,255," : i % 3 === 1 ? "rgba(89,194,255," : "rgba(140,255,77,";
      ctx.strokeStyle = col + ((0.1 + 0.1 * ((i % 4) / 3)) * a).toFixed(3) + ")";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 26);
      ctx.stroke();
    }

    for (const b of st.bolts) {
      if (b.ambient) drawBolt(b, st, a * 0.5);
    }

    const cx = L.stickmanX;
    const cy = L.groundY - 60 * L.s;
    const spin = now * 0.004 * (1 + charge * 0.06);
    for (let r = 0; r < 3; r++) {
      const rad = (46 + r * 26) * L.s;
      const ang = spin * (r % 2 ? -1 : 1) + r;
      ctx.strokeStyle = r === 1 ? "rgba(89,194,255," + (0.5 * a).toFixed(3) + ")" : "rgba(255,77,255," + (0.45 * a).toFixed(3) + ")";
      ctx.lineWidth = 3 - r * 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, ang, ang + 4.2);
      ctx.stroke();
    }
    const shards = 8 + charge;
    for (let i = 0; i < shards; i++) {
      const ang = spin * 1.6 + i * (Math.PI * 2 / shards);
      const rad = (60 + (i % 3) * 24) * L.s;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * 0.6;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255," + (0.5 * a).toFixed(3) + ")" : "rgba(255,210,77," + (0.5 * a).toFixed(3) + ")";
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang * 2);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, 3);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawAttack(a, now, L, st, fade) {
    fade = fade === undefined ? 1 : fade;
    const pos = attackPos(a, st.clock, L);
    const k = PS.clamp(L.u, 0.72, 1.15);
    const ringBase = Math.max(36, attackHalfWidth(a) + 8);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(k, k);
    ctx.globalAlpha = fade;

    if (a.resolved && a.success) {
      ctx.globalAlpha = fade * PS.clamp(1 - (st.clock - a.impactClock) / 300, 0, 1) * 0.6;
    }

    if (a.id === "sniper" && !a.resolved) {
      const targetLocal = (L.stickmanX + 65 * L.s - pos.x) / k;
      ctx.globalAlpha = fade * 0.3;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(targetLocal, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = fade;
    }

    drawAttackShape(a, now);

    if (!a.resolved) {
      const remain = a.impactClock - st.clock;
      const total = Math.max(1, a.impactClock - a.spawnClock);
      const p = PS.clamp(remain / total, 0, 1);

      ctx.globalAlpha = fade * (a.fake ? 0.5 : 0.6);
      ctx.lineWidth = 4;
      if (a.fake) {
        ctx.strokeStyle = "#9a9aa2";
        ctx.setLineDash([7, 7]);
      } else {
        ctx.strokeStyle = p < 0.18 ? "#ffffff" : a.color;
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(0, 0, ringBase + p * 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - p));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = fade;

      if (a.hitsLeft > 1) {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < a.hitsLeft; i++) {
          ctx.fillRect(-12 + i * 10, ringBase + 12, 6, 6);
        }
      }

      if (a.behavior === "delayed" && pos.t >= 0.45 && pos.t < 0.75) {
        outlinedText("...", 0, -(ringBase + 16), 24, "#ffd24d");
      }
    }

    ctx.restore();

    if (!a.resolved && (a.kind === "blade" || a.kind === "arrow" || a.kind === "bullet" || a.kind === "orb")) {
      ctx.globalAlpha = fade;
      outlinedText(a.label, pos.x, pos.y - (ringBase + 34) * k, 13 * k, a.color);
      ctx.globalAlpha = 1;
    }
  }

  function drawMuteButton(L) {
    const size = 40;
    const x = L.W - size - 12;
    const y = 12;
    const muted = PS.audio.isMuted();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.strokeStyle = muted ? "#ff8888" : "#7dff7d";
    ctx.lineWidth = 2;
    ctx.stroke();

    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.fillStyle = muted ? "#ff8888" : "#7dff7d";
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 4);
    ctx.lineTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 2, cy - 10);
    ctx.lineTo(cx + 2, cy + 10);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.lineTo(cx - 10, cy + 4);
    ctx.closePath();
    ctx.fill();
    if (muted) {
      ctx.strokeStyle = "#ff8888";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy - 6);
      ctx.lineTo(cx + 14, cy + 6);
      ctx.moveTo(cx + 14, cy - 6);
      ctx.lineTo(cx + 6, cy + 6);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#7dff7d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx + 4, cy, 8, -0.7, 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 4, cy, 12, -0.7, 0.7);
      ctx.stroke();
    }
    region("mute", x, y, size, size);
  }

  function drawPauseButton(L) {
    const size = 40;
    const x = L.W - size * 2 - 20;
    const y = 12;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(x + 13, y + 11, 5, 18);
    ctx.fillRect(x + 22, y + 11, 5, 18);
    region("pause", x, y, size, size);
  }

  function drawHUD(now, L, st) {
    const u = L.u;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    ctx.font = font(22 * u);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SCORE " + PS.fmt(st.score), 16, 14);
    ctx.font = font(14 * u);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("BEST " + PS.fmt(st.best), 16, 14 + 27 * u);

    ctx.font = font(18 * u);
    ctx.fillStyle = st.combo >= 5 ? "#ffd24d" : "#ffffff";
    ctx.fillText("COMBO " + st.combo, 16, 14 + 49 * u);
    if (st.combo >= 5) {
      ctx.font = font(12 * u);
      ctx.fillStyle = "rgba(255,210,77,0.7)";
      ctx.fillText("+" + st.combo * PS.SETTINGS.comboScoreStep + " PER PARRY", 16, 14 + 73 * u);
    }

    const act = PS.ACTS[st.act - 1];
    ctx.font = font(12 * u);
    ctx.fillStyle = act.color;
    ctx.fillText(L.W < 700 ? act.name : act.name + " · " + act.sub, 16, 14 + (st.combo >= 5 ? 91 : 73) * u);

    if (st.boss) {
      const bw = Math.min(L.W * 0.5, 420);
      const bx = L.W / 2 - bw / 2;
      const by = 16;
      outlinedText(st.boss.name, L.W / 2, by + 6, 15 * u, "#ff5252");
      const seg = bw / st.boss.maxHp;
      for (let i = 0; i < st.boss.maxHp; i++) {
        ctx.fillStyle = i < st.boss.hp ? "#ff5252" : "rgba(255,255,255,0.15)";
        ctx.fillRect(bx + i * seg + 1, by + 18, seg - 2, 10);
      }
    }

    const heartY = 64;
    for (let i = 0; i < PS.SETTINGS.startingHp; i++) {
      const hx = L.W - 30 - i * 30;
      const hy = heartY + 8;
      ctx.fillStyle = i < st.hp ? "#ff4d4d" : "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.moveTo(hx, hy + 4);
      ctx.bezierCurveTo(hx, hy, hx - 9, hy - 2, hx - 9, hy + 4);
      ctx.bezierCurveTo(hx - 9, hy + 9, hx, hy + 13, hx, hy + 17);
      ctx.bezierCurveTo(hx, hy + 13, hx + 9, hy + 9, hx + 9, hy + 4);
      ctx.bezierCurveTo(hx + 9, hy - 2, hx, hy, hx, hy + 4);
      ctx.fill();
    }

    const mw = Math.min(220, L.W * 0.34);
    const mx = 16;
    const my = L.H - 34;
    ctx.font = font(12 * u);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("SLOP", mx, my - 18);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(mx, my, mw, 14);
    const slopColor = st.slop > 0.8 ? "#ff4dff" : "#8cff4d";
    ctx.fillStyle = slopColor;
    ctx.fillRect(mx, my, mw * st.slop, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, 14);
    if (st.stormActive) {
      ctx.font = font(12 * u);
      ctx.fillStyle = "#ff4dff";
      ctx.fillText(
        "SLOP STORM " + Math.max(0, (st.weirdUntil - st.clock) / 1000).toFixed(1) + "s",
        mx + mw + 10, my
      );
      for (let i = 0; i < st.stormCharge; i++) {
        ctx.fillStyle = i % 2 ? "#59c2ff" : "#ff4dff";
        ctx.fillRect(mx + mw + 10 + i * 6, my + 18, 4, 6);
      }
    }

    drawMuteButton(L);
    if (st.screen === "playing") drawPauseButton(L);

    if (L.W > 640) {
      ctx.font = font(11);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "right";
      ctx.fillText("SPACE parry · P pause · M mute", L.W - 16, L.H - 24);
      ctx.textAlign = "left";
    }
  }

  function drawBanner(L, st) {
    const b = st.banner;
    if (!b || st.clock >= b.until) return;
    const life = b.until - st.clock;
    const total = b.until - b.start;
    const inT = PS.clamp((st.clock - b.start) / 200, 0, 1);
    const outT = PS.clamp(life / 250, 0, 1);
    const alpha = Math.min(inT, outT);
    const y = L.H * 0.3 - (1 - inT) * 24;

    ctx.globalAlpha = alpha * 0.88;
    ctx.fillStyle = "#0a0a0e";
    const w = Math.min(L.W * 0.86, 560);
    roundRect(L.W / 2 - w / 2, y - 44, w, 92, 10);
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    outlinedText(b.title, L.W / 2, y - 12, Math.min(26, L.W / 18), b.color);
    if (b.sub) outlinedText(b.sub, L.W / 2, y + 22, Math.min(15, L.W / 26), "rgba(255,255,255,0.85)");
    ctx.globalAlpha = 1;
  }

  function drawTitle(now, L, st) {
    const ts = L.s * 0.85;
    drawStickman(now, L, st, L.W * (L.W < 700 ? 0.16 : 0.12), L.groundY + 52 * L.s - 45 * ts, ts);

    const cx = L.W / 2;
    const logoPx = Math.min(64 * L.u, L.W / 7.2);
    const word = "PARRY SLOP";
    ctx.font = font(logoPx);
    const totalW = ctx.measureText(word).width;
    let x = cx - totalW / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const logoY = L.H * 0.3;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const w = ctx.measureText(ch).width;
      const jy = Math.sin(now / 340 + i * 0.9) * 4 * L.u;
      ctx.lineWidth = logoPx / 9;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.font = font(logoPx);
      ctx.strokeText(ch, x, logoY + jy);
      ctx.fillStyle = i < 5 ? "#ffffff" : "#ff5252";
      ctx.fillText(ch, x, logoY + jy);
      x += w;
    }
    region("logo", cx - totalW / 2 - 10, logoY - logoPx * 0.7, totalW + 20, logoPx * 1.4);

    const sweep = (now / 1400) % 1;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, logoY, logoPx * 1.5, -0.6 + sweep * 2.4, -0.2 + sweep * 2.4);
    ctx.stroke();

    outlinedText("one button. one mistake repeated forever.", cx, L.H * 0.41, Math.min(19 * L.u, L.W / 26), "rgba(255,255,255,0.85)");

    const pulse = 0.6 + Math.sin(now / 280) * 0.4;
    ctx.globalAlpha = pulse;
    outlinedText("CLICK / TAP / SPACE", cx, L.H * 0.56, 26 * L.u, "#ffd24d");
    ctx.globalAlpha = 1;
    outlinedText("parry when the ring closes around the attack", cx, L.H * 0.605, Math.min(14 * L.u, L.W / 30), "rgba(255,255,255,0.55)");

    if (L.W < 700) {
      outlinedText("parry swords, bullets, pop-ups,", cx, L.H * 0.64, Math.min(15 * L.u, L.W / 26), "rgba(255,255,255,0.6)");
      outlinedText("taxes, and the concept of responsibility", cx, L.H * 0.675, Math.min(15 * L.u, L.W / 26), "rgba(255,255,255,0.6)");
    } else {
      outlinedText("parry swords, bullets, pop-ups, taxes, and the concept of responsibility", cx, L.H * 0.65, Math.min(15 * L.u, L.W / 34), "rgba(255,255,255,0.6)");
    }

    if (st.best > 0) {
      outlinedText("BEST " + PS.fmt(st.best), cx, L.H * 0.73, 18 * L.u, "#7dff7d");
    }
    if (st.totalParries >= 500) {
      outlinedText("CERTIFIED PARRY CRIMINAL", cx, L.H * 0.79, 13 * L.u, "#ff66d9");
    }

    const gs = 40;
    const gx = L.W - gs - 12;
    const gy = L.H - gs - 12;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(gx, gy, gs, gs, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "#e8e8e8";
    ctx.beginPath();
    ctx.arc(gx + gs / 2, gy + gs / 2, 8, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + now / 3000;
      ctx.beginPath();
      ctx.moveTo(gx + gs / 2 + Math.cos(ang) * 10, gy + gs / 2 + Math.sin(ang) * 10);
      ctx.lineTo(gx + gs / 2 + Math.cos(ang) * 14, gy + gs / 2 + Math.sin(ang) * 14);
      ctx.stroke();
    }
    region("settings", gx, gy, gs, gs);
    outlinedText("PAR ASSIST", gx - 8, gy + gs / 2, 12, "rgba(255,255,255,0.55)", "right");

    outlinedText("v" + PS.VERSION, 16, L.H - 20, 11, "rgba(255,255,255,0.3)", "left");
    drawMuteButton(L);
  }

  function drawGameOver(now, L, st) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, L.W, L.H);

    const cx = L.W / 2;
    const ready = st.clock - st.overClock > PS.SETTINGS.restartDelayMs;
    const u = L.u;

    outlinedText("YOU DIED", cx, L.H * 0.24, 52 * u, "#ff5252");
    outlinedText(st.deathText, cx, L.H * 0.33, Math.min(18 * u, L.W / 30), "rgba(255,255,255,0.9)");

    outlinedText("SCORE " + PS.fmt(st.score), cx, L.H * 0.44, 30 * u, "#ffffff");
    outlinedText(
      (st.newBest ? "NEW BEST! " : "BEST ") + PS.fmt(st.best),
      cx, L.H * 0.51, 19 * u, st.newBest ? "#ffd24d" : "#7dff7d"
    );

    const s = st.stats;
    outlinedText(
      s.parries + " PARRIED · " + s.perfects + " PERFECT · x" + st.maxCombo + " COMBO · " + Math.floor(s.time) + "s",
      cx, L.H * 0.58, Math.min(14 * u, L.W / 34), "rgba(255,255,255,0.65)"
    );

    if (ready) {
      const pulse = 0.6 + Math.sin(now / 260) * 0.4;
      ctx.globalAlpha = pulse;
      outlinedText("CLICK TO PARRY AGAIN", cx, L.H * 0.69, 24 * u, "#ffd24d");
      ctx.globalAlpha = 1;
    } else {
      outlinedText("...", cx, L.H * 0.69, 24 * u, "rgba(255,255,255,0.4)");
    }

    const bw = 150 * u;
    const bh = 38 * u;
    const bx = cx - bw / 2;
    const by = L.H * 0.77;
    ctx.fillStyle = st.shareCopied ? "rgba(125,255,125,0.18)" : "rgba(255,255,255,0.08)";
    roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = st.shareCopied ? "#7dff7d" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    outlinedText(st.shareCopied ? "COPIED!" : "SHARE SCORE", cx, by + bh / 2, 15 * u, st.shareCopied ? "#7dff7d" : "#ffffff");
    region("share", bx, by, bw, bh);

    region("rip", cx - 160 * u, L.H * 0.24 - 34 * u, 320 * u, 68 * u);
    drawMuteButton(L);
  }

  function drawPaused(now, L, st) {
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, L.W, L.H);
    outlinedText("PAUSED", L.W / 2, L.H * 0.42, 44 * L.u, "#ffffff");
    const pulse = 0.6 + Math.sin(now / 300) * 0.4;
    ctx.globalAlpha = pulse;
    outlinedText("CLICK TO RESUME", L.W / 2, L.H * 0.53, 20 * L.u, "#ffd24d");
    ctx.globalAlpha = 1;
    outlinedText("the attacks are waiting. patiently.", L.W / 2, L.H * 0.61, 14 * L.u, "rgba(255,255,255,0.55)");
    drawMuteButton(L);
  }

  const OPTION_ROWS = [
    { key: "bigWindow", label: "BIG PARRY WINDOW", hint: "1.5x wider timing" },
    { key: "reducedShake", label: "REDUCED SHAKE", hint: "calmer camera" },
    { key: "highContrast", label: "HIGH CONTRAST", hint: "brighter lines, no noise" },
    { key: "flashSafe", label: "FLASH SAFE", hint: "no full-screen flashes" },
    { key: "audioCues", label: "AUDIO CUES", hint: "tick when the window opens" },
    { key: "slowMo", label: "SLOW MOTION", hint: "time dilation on perfect parry" }
  ];

  function drawSettings(now, L, st) {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, L.W, L.H);

    const pw = Math.min(L.W * 0.92, 470);
    const rowH = PS.clamp((L.H - 210) / OPTION_ROWS.length, 34, 52);
    const ph = 100 + OPTION_ROWS.length * rowH + 56;
    const px = L.W / 2 - pw / 2;
    const py = Math.max(12, L.H / 2 - ph / 2);

    ctx.fillStyle = "#14141a";
    roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = "#ffd24d";
    ctx.lineWidth = 2;
    ctx.stroke();

    outlinedText("PAR ASSIST", L.W / 2, py + 34, 26, "#ffd24d");
    outlinedText("accessibility is a parryable concept", L.W / 2, py + 60, 12, "rgba(255,255,255,0.55)");

    OPTION_ROWS.forEach((row, i) => {
      const ry = py + 84 + i * rowH;
      const selected = st.settingsRow === i;
      ctx.fillStyle = selected ? "rgba(255,210,77,0.1)" : "rgba(255,255,255,0.03)";
      roundRect(px + 14, ry, pw - 28, rowH - 8, 8);
      ctx.fill();
      if (selected) {
        ctx.strokeStyle = "rgba(255,210,77,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const on = st.options[row.key];
      const bx = px + 28;
      const by = ry + (rowH - 8) / 2 - 11;
      ctx.fillStyle = on ? "#7dff7d" : "rgba(255,255,255,0.12)";
      roundRect(bx, by, 22, 22, 5);
      ctx.fill();
      ctx.strokeStyle = on ? "#7dff7d" : "rgba(255,255,255,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (on) {
        ctx.strokeStyle = "#0a0a0e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 5, by + 11);
        ctx.lineTo(bx + 9, by + 16);
        ctx.lineTo(bx + 17, by + 6);
        ctx.stroke();
      }

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = font(15);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(row.label, bx + 36, ry + (rowH - 8) / 2 - 7);
      ctx.font = font(11);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(row.hint, bx + 36, ry + (rowH - 8) / 2 + 11);

      region("opt:" + row.key, px + 14, ry, pw - 28, rowH - 8);
    });

    const bw = 130;
    const bh = 40;
    const bx = L.W / 2 - bw / 2;
    const by = py + ph - 52;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    outlinedText("BACK", L.W / 2, by + bh / 2, 16, "#ffffff");
    region("back", bx, by, bw, bh);

    drawMuteButton(L);
  }

  function draw(now) {
    if (!ctx) return;
    const st = PS.game.state;
    const L = PS.layout;
    regions.length = 0;

    ctx.save();
    const shakeAmp = st.options.reducedShake ? st.shake * 0.25 : st.shake;
    if (shakeAmp > 0.5) {
      ctx.translate(PS.rand(-shakeAmp, shakeAmp), PS.rand(-shakeAmp, shakeAmp));
    }

    drawBackground(now, L, st);
    drawBanner(L, st);
    drawStormBack(now, L, st);

    if (st.screen === "title" || st.screen === "settings") {
      drawTitle(now, L, st);
      if (st.screen === "settings") drawSettings(now, L, st);
    } else {
      const fade = st.screen === "gameover" ? 0.35 : 1;
      for (const a of st.attacks) drawAttack(a, now, L, st, fade);
      drawStickman(now, L, st);

      if (st.ripple) {
        const age = st.clock - st.ripple.born;
        const r = 20 + age * 0.85;
        const a = PS.clamp(1 - age / PS.SETTINGS.slowmoRippleMs, 0, 1);
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(st.ripple.x, st.ripple.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = a * 0.3;
        ctx.strokeStyle = "#59c2ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(st.ripple.x, st.ripple.y, r * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const b of st.bolts) {
        if (!b.ambient) drawBolt(b, st, 1);
      }

      if (st.implode) {
        const age = st.clock - st.implode.born;
        const r = Math.max(4, 300 * (1 - age / 500));
        const al = PS.clamp(1 - age / 500, 0, 1);
        ctx.globalAlpha = al * 0.6;
        ctx.strokeStyle = "#7dff7d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(L.stickmanX, L.groundY - 60 * L.s, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (st.shock) {
        const age = st.clock - st.shock.born;
        const r = 30 + age * 3;
        const al = PS.clamp(1 - age / 900, 0, 1);
        ctx.globalAlpha = al * 0.6;
        ctx.strokeStyle = "#ff4dff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(st.shock.x, st.shock.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = al * 0.35;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(st.shock.x, st.shock.y, r * 0.86, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const z of st.zaps) {
        const age = st.clock - z.born;
        const r = 12 + age * 0.6;
        const al = PS.clamp(1 - age / 420, 0, 1);
        ctx.globalAlpha = al * 0.7;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = al * 0.45;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(z.x, z.y, r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const p of st.particles) {
        ctx.globalAlpha = PS.clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        if (p.shape === "shard") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx));
          ctx.beginPath();
          ctx.moveTo(p.size * 1.6, 0);
          ctx.lineTo(-p.size, p.size * 0.8);
          ctx.lineTo(-p.size, -p.size * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;

      for (const t of st.texts) {
        ctx.globalAlpha = PS.clamp(t.life / t.maxLife, 0, 1);
        outlinedText(t.text, t.x, t.y, t.size * L.u, t.color);
      }
      ctx.globalAlpha = 1;

      drawHUD(now, L, st);

      if (st.flash > 0.01) {
        if (st.options.flashSafe) {
          ctx.strokeStyle = "rgba(255,255,255," + Math.min(st.flash * 2, 0.5).toFixed(3) + ")";
          ctx.lineWidth = 10;
          ctx.strokeRect(5, 5, L.W - 10, L.H - 10);
        } else {
          ctx.fillStyle = "rgba(255,255,255," + st.flash.toFixed(3) + ")";
          ctx.fillRect(0, 0, L.W, L.H);
        }
      }
      if (st.hitFlash > 0.01) {
        if (st.options.flashSafe) {
          ctx.strokeStyle = "rgba(255,60,60," + Math.min(st.hitFlash * 2, 0.6).toFixed(3) + ")";
          ctx.lineWidth = 12;
          ctx.strokeRect(6, 6, L.W - 12, L.H - 12);
        } else {
          ctx.fillStyle = "rgba(255,0,0," + st.hitFlash.toFixed(3) + ")";
          ctx.fillRect(0, 0, L.W, L.H);
        }
      }

      if (st.stormFlash > 0.02) {
        if (st.options.flashSafe) {
          ctx.strokeStyle = "rgba(89,194,255," + Math.min(st.stormFlash, 0.4).toFixed(3) + ")";
          ctx.lineWidth = 8;
          ctx.strokeRect(4, 4, L.W - 8, L.H - 8);
        } else {
          ctx.fillStyle = "rgba(200,220,255," + (st.stormFlash * 0.18).toFixed(3) + ")";
          ctx.fillRect(0, 0, L.W, L.H);
        }
      }

      if (st.screen === "playing" && now < st.slowmoUntil) {
        const remain = (st.slowmoUntil - now) / PS.SETTINGS.slowmoMs;
        ctx.strokeStyle = "rgba(89,194,255," + (0.35 * remain).toFixed(3) + ")";
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, L.W - 6, L.H - 6);
      }

      if (st.screen === "gameover") drawGameOver(now, L, st);
      if (st.screen === "paused") drawPaused(now, L, st);
    }

    if (st.fade > 0.01) {
      ctx.fillStyle = "rgba(0,0,0," + (st.fade * 0.85).toFixed(3) + ")";
      ctx.fillRect(0, 0, L.W, L.H);
    }

    ctx.restore();
  }

  return { attach, draw, buildVignette, hitRegion, regions, OPTION_ROWS, attackPos };
})();
