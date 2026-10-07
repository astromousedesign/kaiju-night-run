// KAIJU NIGHT RUN: a one-button creature feature for the Gojira Games drive-in.
// Vanilla JS, one canvas, every pixel drawn from code. Original homage characters only.
(() => {
  "use strict";

  // ---------- config ----------
  const COUPON_CODE = "CREATURE10";
  const COUPON_SCORE = 1000;
  const ALLOWED_HOSTS = ["gojiragames.crystalcommerce.com", "localhost", "127.0.0.1"];
  const HI_KEY = "knr.hi";

  const W = 384, H = 216;
  const SCREEN = { x: 20, y: 10, w: 344, h: 140 };
  const PX = 2; // the film is projected at 2x: chunky 8-bit pixels
  const WORLD = { w: SCREEN.w / PX, h: SCREEN.h / PX };
  const GROUND = 64; // in world space
  const PLAYER_X = 20;

  const C = {
    k: "#000000",
    d: "#3a3a3a",
    g: "#8a8a8a",
    l: "#d8d8d8",
    w: "#ffffff",
    y: "#ffd21f",
  };

  // ---------- the store-only gate ----------
  function hostOf(url) {
    try { return new URL(url).hostname; } catch { return ""; }
  }

  function allowedToPlay() {
    const framed = window.top !== window.self;
    const isDevHost = ["localhost", "127.0.0.1"].includes(location.hostname);
    if (!framed) return isDevHost && new URLSearchParams(location.search).has("dev");
    const ancestors = location.ancestorOrigins ? Array.from(location.ancestorOrigins) : [];
    const hosts = ancestors.map(hostOf);
    if (!hosts.length && document.referrer) hosts.push(hostOf(document.referrer));
    return hosts.some((h) => ALLOWED_HOSTS.includes(h));
  }

  if (!allowedToPlay()) {
    document.querySelector(".stage").hidden = true;
    document.getElementById("gate").hidden = false;
    return;
  }

  // ---------- canvas ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  canvas.tabIndex = 0;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- sprites (palette-indexed, "." = transparent) ----------
  const S = {
    kaijuRun1: [
      "..........kkkkk...",
      "....k....kkkkkkkk.",
      "...kk...kkkkkwkkkk",
      "..kkk..kkkkkkkkkkk",
      ".kkkk.kkkkkkkkkkkk",
      "..kkkkkkkkkkkwkwkw",
      "..kkkkkkkkkkkk....",
      ".kkkkkkkkkkkkkk...",
      "kkkkkkkkkkkkkk.k..",
      "kkk.kkkkkdkkkk.k..",
      "kk...kkkkkdkkk....",
      "k....kkkkdkkkk....",
      "k...kkkkkkdkkk....",
      ".....kkkkkkkkk....",
      ".....kkk...kkk....",
      ".....kk.....kk....",
      "....kkk.....kk....",
      "............kkk...",
    ],
    kaijuRun2: [
      "..........kkkkk...",
      "....k....kkkkkkkk.",
      "...kk...kkkkkwkkkk",
      "..kkk..kkkkkkkkkkk",
      ".kkkk.kkkkkkkkkkkk",
      "..kkkkkkkkkkkwkwkw",
      "..kkkkkkkkkkkk....",
      ".kkkkkkkkkkkkkk...",
      "kkkkkkkkkkkkkk.k..",
      "kkk.kkkkkdkkkk.k..",
      "kk...kkkkkdkkk....",
      "k....kkkkdkkkk....",
      "k...kkkkkkdkkk....",
      ".....kkkkkkkkk....",
      "......kkk.kkk.....",
      "......kk...kk.....",
      ".....kkk...kk.....",
      "...........kkk....",
    ],
    kaijuDuck1: [
      ".....k.k.k............",
      "....kkkkkkkk...kkkkk..",
      "..kkkkkkkkkkkkkkkkwkk.",
      ".kkkkkkkkkkkkkkkkkkkkk",
      "kkkkkkkdkdkdkkkkkwkwkw",
      "kkk.kkkkkkkkkkkkk.k...",
      "kk...kkkkkkkkkkk......",
      "k....kkk....kkk.......",
      ".....kk......kk.......",
      "....kkk......kkk......",
    ],
    kaijuDuck2: [
      ".....k.k.k............",
      "....kkkkkkkk...kkkkk..",
      "..kkkkkkkkkkkkkkkkwkk.",
      ".kkkkkkkkkkkkkkkkkkkkk",
      "kkkkkkkdkdkdkkkkkwkwkw",
      "kkk.kkkkkkkkkkkkk.k...",
      "kk...kkkkkkkkkkk......",
      "k.....kkk..kkk........",
      "......kk...kk.........",
      ".....kkk...kkk........",
    ],
    kaijuDead: [
      "..........kkkkk...",
      "....k....kkkkkkkk.",
      "...kk...kkkkkgkkkk",
      "..kkk..kkkkgkgkkkk",
      ".kkkk.kkkkkkgkkkkk",
      "..kkkkkkkkkkkkkkkk",
      "..kkkkkkkkkkkkk...",
      ".kkkkkkkkkkkkkk.k.",
      "kkkkkkkkkkkkkk..k.",
      "kkk.kkkkkdkkkk....",
      "kk...kkkkkdkkk....",
      "k....kkkkdkkkk....",
      "k...kkkkkkdkkk....",
      ".....kkkkkkkkk....",
      ".....kkk...kkk....",
      ".....kk.....kk....",
      "....kkk.....kk....",
      "............kkk...",
    ],
    tank: [
      "........kkkk........",
      "kkkkkkkkkkkkk.......",
      "......kkkkkkkk......",
      "..kkkkkkkkkkkkkkkk..",
      ".kkkkkkkkkkkkkkkkkk.",
      "kddddddddddddddddddk",
      "kdkkdkkdkkdkkdkkdkdk",
      ".kkkkkkkkkkkkkkkkkk.",
    ],
    gill: [
      "..k...kk...k..",
      "..kk.kkkk.kk..",
      "...kkkkkkkk...",
      "...kwkkkkwk...",
      "...kkkkkkkk...",
      "....kdkdkdk...",
      "k...kkkkkk...k",
      "kk.kkkkkkkk.kk",
      ".kkkkkkkkkkkk.",
      "..kkkkkkkkkk..",
      "...kkkkkkkk...",
      "...kdkdkdkk...",
      "...kkkkkkkk...",
      "...kdkdkdkk...",
      "...kkkkkkkk...",
      "...kkk..kkk...",
      "...kk....kk...",
      "..kkk....kkk..",
    ],
    saucer: [
      ".......kkkk.......",
      "......kwwwwk......",
      "...kkkkkkkkkkkk...",
      ".kkwkkwkkwkkwkkwk.",
      "kkkkkkkkkkkkkkkkkk",
      "..kkkkkkkkkkkkkk..",
    ],
    bat1: [
      "k....kk....k",
      "kk..kkkk..kk",
      ".kkkkwkwkkk.",
      "..kk.kk.kk..",
    ],
    bat2: [
      "....kkkk....",
      "..kkkwkwkk..",
      ".kk..kk..kk.",
      "k..........k",
    ],
    pack: [
      "kkkkkkkk",
      "kyyyyyyk",
      "kywyyyyk",
      "kyykkyyk",
      "kykyykyk",
      "kykyykyk",
      "kyykkyyk",
      "kyyyyyyk",
      "kyyyyyyk",
      "kkkkkkkk",
    ],
  };

  // Pre-render each sprite to an offscreen canvas once.
  const sprite = {};
  for (const [name, rows] of Object.entries(S)) {
    const w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = rows.length;
    const cx = c.getContext("2d");
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === "." || !C[ch]) return;
        cx.fillStyle = C[ch];
        cx.fillRect(x, y, 1, 1);
      });
    });
    sprite[name] = c;
  }

  // ---------- 3x5 bitmap font ----------
  const FONT = {
    A: [".k.", "k.k", "kkk", "k.k", "k.k"], B: ["kk.", "k.k", "kk.", "k.k", "kk."],
    C: [".kk", "k..", "k..", "k..", ".kk"], D: ["kk.", "k.k", "k.k", "k.k", "kk."],
    E: ["kkk", "k..", "kk.", "k..", "kkk"], F: ["kkk", "k..", "kk.", "k..", "k.."],
    G: [".kk", "k..", "k.k", "k.k", ".kk"], H: ["k.k", "k.k", "kkk", "k.k", "k.k"],
    I: ["kkk", ".k.", ".k.", ".k.", "kkk"], J: ["..k", "..k", "..k", "k.k", ".k."],
    K: ["k.k", "k.k", "kk.", "k.k", "k.k"], L: ["k..", "k..", "k..", "k..", "kkk"],
    M: ["k.k", "kkk", "kkk", "k.k", "k.k"], N: ["kk.", "k.k", "k.k", "k.k", "k.k"],
    O: [".k.", "k.k", "k.k", "k.k", ".k."], P: ["kk.", "k.k", "kk.", "k..", "k.."],
    Q: [".k.", "k.k", "k.k", "kk.", ".kk"], R: ["kk.", "k.k", "kk.", "k.k", "k.k"],
    S: [".kk", "k..", ".k.", "..k", "kk."], T: ["kkk", ".k.", ".k.", ".k.", ".k."],
    U: ["k.k", "k.k", "k.k", "k.k", "kkk"], V: ["k.k", "k.k", "k.k", "k.k", ".k."],
    W: ["k.k", "k.k", "kkk", "kkk", "k.k"], X: ["k.k", "k.k", ".k.", "k.k", "k.k"],
    Y: ["k.k", "k.k", ".k.", ".k.", ".k."], Z: ["kkk", "..k", ".k.", "k..", "kkk"],
    0: ["kkk", "k.k", "k.k", "k.k", "kkk"], 1: [".k.", "kk.", ".k.", ".k.", "kkk"],
    2: ["kk.", "..k", ".k.", "k..", "kkk"], 3: ["kk.", "..k", ".k.", "..k", "kk."],
    4: ["k.k", "k.k", "kkk", "..k", "..k"], 5: ["kkk", "k..", "kk.", "..k", "kk."],
    6: [".kk", "k..", "kkk", "k.k", "kkk"], 7: ["kkk", "..k", ".k.", ".k.", ".k."],
    8: ["kkk", "k.k", "kkk", "k.k", "kkk"], 9: ["kkk", "k.k", "kkk", "..k", "kk."],
    " ": ["...", "...", "...", "...", "..."], ".": ["...", "...", "...", "...", ".k."],
    ":": ["...", ".k.", "...", ".k.", "..."], "!": [".k.", ".k.", ".k.", "...", ".k."],
    "?": ["kk.", "..k", ".k.", "...", ".k."], "-": ["...", "...", "kkk", "...", "..."],
    "·": ["...", "...", ".k.", "...", "..."], "'": [".k.", ".k.", "...", "...", "..."],
    ",": ["...", "...", "...", ".k.", "k.."], "/": ["..k", "..k", ".k.", "k..", "k.."],
  };

  function textWidth(str, scale = 1) {
    return str.length * 4 * scale - scale;
  }

  function drawText(str, x, y, color, scale = 1, align = "left") {
    str = String(str).toUpperCase();
    if (align === "center") x -= Math.floor(textWidth(str, scale) / 2);
    if (align === "right") x -= textWidth(str, scale);
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const glyph = FONT[str[i]] || FONT["?"];
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 3; gx++) {
          if (glyph[gy][gx] === "k") {
            ctx.fillRect(Math.round(x + (i * 4 + gx) * scale), Math.round(y + gy * scale), scale, scale);
          }
        }
      }
    }
  }

  // ---------- audio (muted until the player turns it on) ----------
  let muted = true;
  let audio = null;
  function beep(freqs, dur = 0.07, type = "square", vol = 0.05) {
    if (muted) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      freqs.forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(vol, t0 + i * dur);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (i + 1) * dur);
        o.connect(g).connect(audio.destination);
        o.start(t0 + i * dur);
        o.stop(t0 + (i + 1) * dur);
      });
    } catch {
      /* no audio: the movie is silent */
    }
  }
  const sfx = {
    jump: () => beep([330, 494], 0.05),
    pack: () => beep([659, 784, 988, 1319], 0.05),
    die: () => beep([392, 311, 233, 156], 0.12, "sawtooth", 0.06),
    coupon: () => beep([523, 659, 784, 1047, 784, 1047], 0.09),
  };

  // ---------- hi score ----------
  function loadHi() {
    try { return Number(localStorage.getItem(HI_KEY)) || 0; } catch { return 0; }
  }
  function saveHi(v) {
    try { localStorage.setItem(HI_KEY, String(v)); } catch { /* private mode */ }
  }

  // ---------- scenery (generated once, scrolled) ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const city = [];
  for (let x = 0; x < WORLD.w * 2; ) {
    const w = Math.round(rand(5, 12));
    city.push({ x, w, h: Math.round(rand(8, 24)), antenna: Math.random() < 0.25 });
    x += w + Math.round(rand(0, 2));
  }
  const cityLen = city.at(-1).x + city.at(-1).w;

  const trees = [];
  for (let x = 0; x < WORLD.w * 2; x += Math.round(rand(26, 52))) {
    trees.push({ x, h: Math.round(rand(26, 40)), w: Math.round(rand(14, 22)), seed: Math.random() });
  }
  const treesLen = WORLD.w * 2;

  const reeds = [];
  for (let x = 0; x < WORLD.w * 2; x += Math.round(rand(3, 9))) reeds.push({ x, h: Math.round(rand(1, 4)) });
  const reedsLen = WORLD.w * 2;

  const stars = Array.from({ length: 40 }, () => ({
    x: Math.round(rand(0, W)),
    y: Math.round(rand(0, 160)),
    p: rand(0, Math.PI * 2),
  })).filter((s) => !(s.x > SCREEN.x - 2 && s.x < SCREEN.x + SCREEN.w + 2 && s.y > SCREEN.y - 2 && s.y < SCREEN.y + SCREEN.h + 2));

  // ---------- game state ----------
  const state = {
    mode: "attract", // attract | play | paused | over
    t: 0,
    speed: 1.3,
    score: 0,
    hi: loadHi(),
    scroll: 0,
    entities: [],
    nextSpawn: 90,
    couponShown: false,
    couponTimer: 0,
    overAt: 0,
    deadFrames: 0,
  };

  const player = { y: 0, vy: 0, ducking: false, onGround: true, dead: false };

  const input = { jumpHeld: false, duck: false };

  function resetRun(mode) {
    state.mode = mode;
    state.speed = 1.3;
    state.score = 0;
    state.scroll = 0;
    state.entities = [];
    state.nextSpawn = 90;
    state.couponShown = false;
    state.couponTimer = 0;
    state.deadFrames = 0;
    Object.assign(player, { y: 0, vy: 0, ducking: false, onGround: true, dead: false });
  }

  // ---------- spawning ----------
  function spawn() {
    const s = state.score;
    const types = ["tank"];
    if (s > 120 || state.mode === "attract") types.push("gill");
    if (s > 260 || state.mode === "attract") types.push("batLow", "batHigh");
    if (s > 450 || state.mode === "attract") types.push("saucer");
    const type = pick(types);
    const x = WORLD.w + 10;

    switch (type) {
      case "tank":
        state.entities.push({ kind: "tank", x, y: GROUND - 8, w: 20, h: 8, deadly: true });
        if (Math.random() < 0.25 && s > 300) {
          state.entities.push({ kind: "tank", x: x + 22, y: GROUND - 8, w: 20, h: 8, deadly: true });
        }
        break;
      case "gill":
        state.entities.push({ kind: "gill", x, y: GROUND, w: 14, h: 18, rise: 0, deadly: true });
        break;
      case "batLow":
        state.entities.push({ kind: "bat", x, baseY: GROUND - 12, y: GROUND - 12, w: 12, h: 4, deadly: true, p: rand(0, 6) });
        break;
      case "batHigh":
        state.entities.push({ kind: "bat", x, baseY: GROUND - 16, y: GROUND - 16, w: 12, h: 4, deadly: true, p: rand(0, 6) });
        break;
      case "saucer":
        state.entities.push({ kind: "saucer", x, y: GROUND - 20, w: 18, h: 6, deadly: true });
        break;
    }

    if (Math.random() < 0.35) {
      state.entities.push({ kind: "pack", x: x + rand(34, 56), y: GROUND - 30, w: 8, h: 10, deadly: false, p: rand(0, 6) });
    }

    const gap = rand(72, 130) * (0.9 + state.speed / 6);
    state.nextSpawn = gap;
  }

  // ---------- player hitbox ----------
  function playerBox() {
    if (player.ducking && player.onGround) {
      return { x: PLAYER_X + 2, y: GROUND - 10 + 2, w: 18, h: 8 };
    }
    return { x: PLAYER_X + 4, y: GROUND - 18 + player.y + 2, w: 11, h: 15 };
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function entityBox(e) {
    if (e.kind === "gill") {
      const shown = Math.round(e.h * e.rise);
      return { x: e.x + 3, y: GROUND - shown, w: e.w - 6, h: shown };
    }
    if (e.kind === "saucer") return { x: e.x + 1, y: e.y + 2, w: e.w - 2, h: 4 };
    return { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 };
  }

  // ---------- actions ----------
  function jump() {
    if (state.mode === "attract") {
      resetRun("play");
    }
    if (state.mode === "over") {
      if (performance.now() - state.overAt > 450) resetRun("play");
      return;
    }
    if (state.mode === "paused") {
      state.mode = "play";
      return;
    }
    if (player.onGround && !player.dead) {
      player.vy = -4.4;
      player.onGround = false;
      sfx.jump();
    }
  }

  // Simple demo pilot for attract mode.
  function demoPilot() {
    input.duck = false;
    input.jumpHeld = false;
    const look = state.speed * 22;
    for (const e of state.entities) {
      if (!e.deadly) continue;
      const dx = e.x - (PLAYER_X + 16);
      if (dx < -10 || dx > look) continue;
      const high = (e.kind === "saucer") || (e.kind === "bat" && e.baseY < GROUND - 14);
      if (high) {
        input.duck = true;
      } else if (dx < look * 0.55 && player.onGround) {
        player.vy = -4.4;
        player.onGround = false;
      }
      input.jumpHeld = !player.onGround;
      break;
    }
  }

  // ---------- update ----------
  function update(dt) {
    state.t += dt;
    if (state.mode === "paused") return;

    if (state.mode === "over") {
      state.deadFrames += dt;
      return;
    }

    if (state.mode === "attract") demoPilot();

    // speed + score
    state.speed = Math.min(3.4, state.speed + 0.0006 * dt);
    state.scroll += state.speed * dt;
    if (state.mode === "play") {
      state.score += state.speed * dt * 0.17;
      if (!state.couponShown && state.score >= COUPON_SCORE) {
        state.couponShown = true;
        state.couponTimer = 240;
        sfx.coupon();
      }
    }
    if (state.couponTimer > 0) state.couponTimer -= dt;

    // player physics: hold jump for height, duck in air to drop fast
    const gravity = input.jumpHeld && player.vy < 0 ? 0.17 : 0.27;
    player.vy += (input.duck && !player.onGround ? 0.6 : gravity) * dt;
    player.y += player.vy * dt;
    if (player.y >= 0) {
      player.y = 0;
      player.vy = 0;
      player.onGround = true;
    }
    player.ducking = input.duck;

    // entities
    state.nextSpawn -= state.speed * dt;
    if (state.nextSpawn <= 0) spawn();

    const pb = playerBox();
    for (const e of state.entities) {
      e.x -= state.speed * dt;
      if (e.kind === "gill") {
        const near = e.x - PLAYER_X;
        const target = near < 60 && near > -20 ? 1 : 0;
        e.rise += (target - e.rise) * 0.12 * dt;
      }
      if (e.kind === "bat") {
        e.p += 0.15 * dt;
        e.y = e.baseY + Math.sin(e.p) * 2;
        e.x -= 0.25 * dt;
      }
      if (e.kind === "pack") e.p += 0.1 * dt;

      if (!e.gone && hit(pb, entityBox(e))) {
        if (e.deadly) {
          die();
          return;
        }
        e.gone = true;
        if (state.mode === "play") state.score += 50;
        sfx.pack();
      }
    }
    state.entities = state.entities.filter((e) => e.x > -40 && !e.gone);
  }

  function die() {
    player.dead = true;
    if (state.mode === "attract") {
      resetRun("attract");
      return;
    }
    state.mode = "over";
    state.overAt = performance.now();
    sfx.die();
    const s = Math.floor(state.score);
    if (s > state.hi) {
      state.hi = s;
      saveHi(s);
    }
  }

  // ---------- drawing ----------
  function drawNight() {
    ctx.fillStyle = C.k;
    ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
      const tw = reducedMotion ? 1 : (Math.sin(state.t * 0.05 + s.p) + 1) / 2;
      ctx.fillStyle = tw > 0.7 ? C.w : tw > 0.3 ? C.g : C.d;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
  }

  function drawScreenFrame() {
    // posts
    ctx.fillStyle = C.d;
    ctx.fillRect(SCREEN.x + 40, SCREEN.y + SCREEN.h, 4, 40);
    ctx.fillRect(SCREEN.x + SCREEN.w - 44, SCREEN.y + SCREEN.h, 4, 40);
    // frame
    ctx.fillStyle = C.d;
    ctx.fillRect(SCREEN.x - 3, SCREEN.y - 3, SCREEN.w + 6, SCREEN.h + 6);
    ctx.fillStyle = C.k;
    ctx.fillRect(SCREEN.x - 1, SCREEN.y - 1, SCREEN.w + 2, SCREEN.h + 2);
  }

  function drawFilm() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    ctx.clip();
    ctx.translate(SCREEN.x, SCREEN.y);

    // projected sky: bright B&W print, hotspot in the middle (screen space, smooth)
    const sky = ctx.createRadialGradient(SCREEN.w / 2, SCREEN.h * 0.45, 10, SCREEN.w / 2, SCREEN.h * 0.45, SCREEN.w * 0.7);
    sky.addColorStop(0, "#e9e9e9");
    sky.addColorStop(1, "#9a9a9a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, SCREEN.w, SCREEN.h);

    // everything that lives in the movie is drawn in chunky 2x world pixels
    ctx.save();
    ctx.scale(PX, PX);
    const ww = WORLD.w;

    // moon
    ctx.fillStyle = C.w;
    ctx.beginPath();
    ctx.arc(ww - 30, 15, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(ww - 29, 12, 2, 2);
    ctx.fillRect(ww - 34, 16, 2, 1);

    // far city, slowest parallax
    ctx.fillStyle = C.g;
    const cOff = (state.scroll * 0.15) % cityLen;
    for (const b of city) {
      for (const rep of [0, cityLen]) {
        const x = Math.round(b.x - cOff + rep);
        if (x > ww || x + b.w < 0) continue;
        ctx.fillRect(x, GROUND - 4 - b.h, b.w, b.h + 4);
        if (b.antenna) ctx.fillRect(x + Math.floor(b.w / 2), GROUND - 8 - b.h, 1, 4);
      }
    }
    // a few lit windows: the only light left on in town
    ctx.fillStyle = C.l;
    for (const b of city) {
      for (const rep of [0, cityLen]) {
        const x = Math.round(b.x - cOff + rep);
        if (x > ww || x + b.w < 0) continue;
        if (Math.round(b.x) % 3 === 0) ctx.fillRect(x + 2, GROUND - b.h + 2, 1, 1);
      }
    }

    // fog bands drifting through
    const fogX = (state.t * 0.15) % ww;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (const rep of [-ww, 0]) {
      ctx.fillRect(fogX + rep, GROUND - 12, ww * 0.6, 2);
      ctx.fillRect(((fogX * 1.3) % ww) + rep + 40, GROUND - 7, ww * 0.4, 1);
    }

    // bald cypress: flared trunk, flat-topped canopy, Spanish moss
    const tOff = (state.scroll * 0.45) % treesLen;
    for (const t of trees) {
      for (const rep of [0, treesLen]) {
        const x = Math.round(t.x - tOff + rep);
        if (x > ww + 20 || x + t.w < -20) continue;
        const cx = x + Math.floor(t.w / 2);
        const top = GROUND - t.h;
        ctx.fillStyle = C.d;
        ctx.fillRect(cx - 1, top + 4, 2, t.h - 4); // trunk
        ctx.fillRect(cx - 2, GROUND - 6, 4, 6); // flare
        ctx.fillRect(cx - 4, GROUND - 2, 8, 2); // knees
        // canopy: three overlapping flat clumps
        ctx.fillRect(x, top + 3, t.w, 3);
        ctx.fillRect(x + 2, top + 1, t.w - 5, 3);
        ctx.fillRect(x + Math.floor(t.w * 0.45), top, Math.ceil(t.w * 0.35), 2);
        ctx.fillRect(x - 2, top + 5, Math.ceil(t.w * 0.4), 2);
        ctx.fillRect(x + Math.floor(t.w * 0.6), top + 5, Math.ceil(t.w * 0.5), 2);
        // moss hanging in strands, swaying a touch
        ctx.fillStyle = "#5a5a5a";
        const sway = reducedMotion ? 0 : Math.round(Math.sin(state.t * 0.02 + t.seed * 6) * 0.6);
        for (let m = 0; m < t.w + 2; m += 2) {
          const len = 2 + Math.floor(((m * 7 + t.seed * 13) % 5));
          ctx.fillRect(x - 1 + m + sway, top + 7, 1, len);
        }
      }
    }

    // swamp ground
    ctx.fillStyle = C.d;
    ctx.fillRect(0, GROUND, ww, WORLD.h - GROUND);
    ctx.fillStyle = C.k;
    ctx.fillRect(0, GROUND, ww, 1);
    const rOff = state.scroll % reedsLen;
    for (const r of reeds) {
      const x = Math.round(r.x - rOff);
      const xx = x < -2 ? x + reedsLen : x;
      if (xx > ww) continue;
      ctx.fillRect(xx, GROUND - r.h, 1, r.h);
    }
    // water glints
    ctx.fillStyle = C.g;
    for (let i = 0; i < 6; i++) {
      const x = Math.round(((i * 31 - state.scroll * 0.9) % ww + ww) % ww);
      ctx.fillRect(x, GROUND + 2 + (i % 2) * 2, 2, 1);
    }

    drawEntities();
    drawPlayer();
    ctx.restore();

    drawHud();
    drawFilmDamage();

    ctx.restore();
  }

  function drawEntities() {
    for (const e of state.entities) {
      const x = Math.round(e.x);
      switch (e.kind) {
        case "tank":
          ctx.drawImage(sprite.tank, x, Math.round(e.y));
          break;
        case "gill": {
          // the puddle it lurks in
          ctx.fillStyle = C.k;
          ctx.beginPath();
          ctx.ellipse(x + 7, GROUND + 2, 11, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          const shown = Math.round(e.h * e.rise);
          if (shown > 0) {
            ctx.drawImage(sprite.gill, 0, 0, e.w, shown, x, GROUND - shown, e.w, shown);
          }
          break;
        }
        case "bat":
          ctx.drawImage(Math.floor(state.t / 6) % 2 ? sprite.bat1 : sprite.bat2, x, Math.round(e.y));
          break;
        case "saucer":
          ctx.fillStyle = C.k;
          ctx.fillRect(x + 9, 0, 1, Math.round(e.y)); // the wire. Every B-movie has one.
          ctx.drawImage(sprite.saucer, x, Math.round(e.y));
          break;
        case "pack": {
          const bob = Math.round(Math.sin(e.p) * 2);
          ctx.drawImage(sprite.pack, x, Math.round(e.y) + bob);
          if (Math.floor(state.t / 10) % 2) {
            ctx.fillStyle = C.w;
            ctx.fillRect(x - 2, Math.round(e.y) + bob + 1, 1, 1);
            ctx.fillRect(x + 9, Math.round(e.y) + bob + 7, 1, 1);
          }
          break;
        }
      }
    }
  }

  function drawPlayer() {
    let img;
    const frame = Math.floor(state.t / 6) % 2;
    if (player.dead && state.mode === "over") img = sprite.kaijuDead;
    else if (player.ducking && player.onGround) img = frame ? sprite.kaijuDuck1 : sprite.kaijuDuck2;
    else if (!player.onGround) img = sprite.kaijuRun1;
    else img = frame ? sprite.kaijuRun1 : sprite.kaijuRun2;
    ctx.drawImage(img, PLAYER_X, Math.round(GROUND - img.height + player.y));
  }

  function pad(n) {
    return String(Math.floor(n)).padStart(5, "0");
  }

  function drawHud() {
    if (state.mode !== "attract") {
      drawText(`HI ${pad(state.hi)}`, SCREEN.w - 72, 6, C.d);
      drawText(pad(state.score), SCREEN.w - 6, 6, C.k, 1, "right");
    }

    if (state.mode === "attract") {
      titleCard(["KAIJU NIGHT RUN"], 3, [
        [Math.floor(state.t / 30) % 2 ? "INSERT COIN · PRESS SPACE" : "", C.y],
        ["CLICK OR TAP TO PLAY", C.g],
      ]);
    }

    if (state.couponTimer > 0) {
      const flash = Math.floor(state.couponTimer / 8) % 2;
      ctx.fillStyle = C.k;
      ctx.fillRect(SCREEN.w / 2 - 92, 22, 184, 26);
      ctx.fillStyle = flash ? C.y : C.w;
      ctx.fillRect(SCREEN.w / 2 - 91, 23, 182, 1);
      ctx.fillRect(SCREEN.w / 2 - 91, 46, 182, 1);
      drawText("YOU SURVIVED THE LAGOON!", SCREEN.w / 2, 27, C.w, 1, "center");
      drawText(`CODE: ${COUPON_CODE}`, SCREEN.w / 2, 36, C.y, 1, "center");
    }

    if (state.mode === "paused") {
      titleCard(["INTERMISSION"], 2, [["PRESS P OR SPACE TO RESUME", C.y]]);
    }

    if (state.mode === "over") {
      const lines = [
        [`SCORE ${pad(state.score)}   HI ${pad(state.hi)}`, C.w],
      ];
      if (state.couponShown) lines.push([`YOUR CODE: ${COUPON_CODE}`, C.y]);
      lines.push([state.deadFrames > 25 && Math.floor(state.t / 30) % 2 ? "PRESS SPACE TO RE-ENTER THE LAGOON" : "", C.g]);
      titleCard(["THE END?"], 3, lines);
    }

    drawText(muted ? "M: SOUND OFF" : "M: SOUND ON", 6, SCREEN.h - 8, C.g);
  }

  // A 1950s title card: black slate, double rule, white type.
  function titleCard(titleLines, scale, subLines) {
    const titleH = titleLines.length * 6 * scale;
    const h = 14 + titleH + subLines.length * 9;
    const w = Math.max(
      ...titleLines.map((t) => textWidth(t, scale)),
      ...subLines.map(([t]) => textWidth(t)),
    ) + 28;
    const x = Math.round(SCREEN.w / 2 - w / 2);
    const y = Math.round(SCREEN.h * 0.42 - h / 2);
    ctx.fillStyle = C.k;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.w;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
    titleLines.forEach((t, i) => drawText(t, SCREEN.w / 2, y + 7 + i * 6 * scale, C.w, scale, "center"));
    subLines.forEach(([t, col], i) => drawText(t, SCREEN.w / 2, y + 9 + titleH + i * 9, col, 1, "center"));
  }

  // Grain, scratches and projector flicker: the print has been through a few summers.
  function drawFilmDamage() {
    if (reducedMotion) return;
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)";
      ctx.fillRect(Math.random() * SCREEN.w, Math.random() * SCREEN.h, 1, 1);
    }
    if (Math.random() < 0.06) {
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)";
      ctx.fillRect(Math.floor(Math.random() * SCREEN.w), 0, 1, SCREEN.h);
    }
    if (Math.random() < 0.02) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      const hx = Math.random() * SCREEN.w, hy = Math.random() * SCREEN.h;
      ctx.fillRect(hx, hy, 2, 1);
      ctx.fillRect(hx + 1, hy + 1, 1, 2);
    }
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
    ctx.fillRect(0, 0, SCREEN.w, SCREEN.h);
  }

  // The audience: convertibles, couples, 3-D glasses.
  function drawAudience() {
    // projector beam from the booth behind the cars
    const beam = ctx.createLinearGradient(0, H, 0, SCREEN.y + SCREEN.h);
    beam.addColorStop(0, "rgba(255,255,255,0.10)");
    beam.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 3, H);
    ctx.lineTo(SCREEN.x + 30, SCREEN.y + SCREEN.h);
    ctx.lineTo(SCREEN.x + SCREEN.w - 30, SCREEN.y + SCREEN.h);
    ctx.lineTo(W / 2 + 3, H);
    ctx.fill();

    // ground glow from the screen
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 180, W, H - 180);

    const cars = [{ x: 34, flip: false }, { x: 158, flip: false }, { x: 282, flip: true }];
    cars.forEach((car, i) => {
      const bob = reducedMotion ? 0 : Math.round(Math.sin(state.t * 0.03 + i) * 0.6);
      const x = car.x, y = 186 + bob;
      // body: low-slung convertible with tailfins
      ctx.fillStyle = C.d;
      ctx.fillRect(x, y, 68, 10);
      ctx.fillRect(x + 4, y - 3, 60, 3);
      ctx.fillRect(car.flip ? x + 62 : x, y - 7, 6, 4); // tailfin
      ctx.fillStyle = C.g;
      ctx.fillRect(x + 4, y - 3, 60, 1); // chrome trim catching the screen light
      // wheels
      ctx.fillStyle = C.k;
      ctx.fillRect(x + 10, y + 8, 10, 6);
      ctx.fillRect(x + 48, y + 8, 10, 6);
      // couple, rim-lit by the screen, wearing 3-D glasses
      [x + 24, x + 38].forEach((hx, j) => {
        ctx.fillStyle = C.d;
        ctx.fillRect(hx, y - 12, 8, 9);
        ctx.fillStyle = C.g;
        ctx.fillRect(hx + 1, y - 12, 6, 1);
        ctx.fillStyle = C.w;
        ctx.fillRect(hx + 1, y - 9, 2, 2);
        ctx.fillRect(hx + 5, y - 9, 2, 2);
        ctx.fillStyle = C.k;
        ctx.fillRect(hx + 3, y - 9, 2, 1);
        // one of them grabs the other's arm when things get scary
        if (j === 0 && state.mode === "over") {
          ctx.fillStyle = C.d;
          ctx.fillRect(hx + 7, y - 5, 4, 2);
        }
      });
    });

    // speaker post next to each car
    ctx.fillStyle = C.d;
    [24, 148, 272, 356].forEach((sx) => {
      ctx.fillRect(sx, 182, 2, 18);
      ctx.fillRect(sx - 2, 180, 6, 4);
    });

    // marquee under the screen
    const mx = W / 2 - 64, my = SCREEN.y + SCREEN.h + 8;
    ctx.fillStyle = C.k;
    ctx.fillRect(mx, my, 128, 15);
    ctx.fillStyle = C.d;
    ctx.fillRect(mx, my, 128, 1);
    ctx.fillRect(mx, my + 14, 128, 1);
    for (let i = 0; i < 16; i++) {
      const on = reducedMotion ? i % 2 : (i + Math.floor(state.t / 8)) % 3 === 0;
      ctx.fillStyle = on ? C.y : "#5c4d10";
      ctx.fillRect(mx + 4 + i * 8, my + 2, 2, 1);
      ctx.fillRect(mx + 4 + i * 8, my + 12, 2, 1);
    }
    drawText("GOJIRA GAMES DRIVE-IN", W / 2, my + 5, C.w, 1, "center");
  }

  function render() {
    drawNight();
    drawScreenFrame();
    drawFilm();
    drawAudience();
  }

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(3, (now - last) / (1000 / 60)));
    last = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- input ----------
  function toggleMute() {
    muted = !muted;
    document.getElementById("sound").textContent = muted ? "SOUND OFF" : "SOUND ON";
    if (!muted) beep([523, 784], 0.06);
  }

  function togglePause() {
    if (state.mode === "play") state.mode = "paused";
    else if (state.mode === "paused") state.mode = "play";
  }

  window.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code)) e.preventDefault();
    if (e.repeat && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) return;
    switch (e.code) {
      case "Space":
      case "ArrowUp":
      case "KeyW":
        input.jumpHeld = true;
        jump();
        break;
      case "ArrowDown":
      case "KeyS":
        if (state.mode === "play") input.duck = true;
        break;
      case "KeyP":
        togglePause();
        break;
      case "KeyM":
        toggleMute();
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) input.jumpHeld = false;
    if (["ArrowDown", "KeyS"].includes(e.code)) input.duck = false;
  });

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.focus();
    input.jumpHeld = true;
    jump();
  });
  window.addEventListener("pointerup", () => { input.jumpHeld = false; });

  const duckBtn = document.getElementById("duck");
  duckBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (state.mode === "play") input.duck = true;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    duckBtn.addEventListener(ev, () => { input.duck = false; }),
  );
  document.getElementById("sound").addEventListener("click", toggleMute);

  // Lose focus, take an intermission.
  const autoPause = () => { if (state.mode === "play") state.mode = "paused"; };
  window.addEventListener("blur", autoPause);
  document.addEventListener("visibilitychange", () => { if (document.hidden) autoPause(); });

  // Test hook for local playtesting only.
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    window.__knr = { state, player, input, resetRun };
  }
})();
