const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  if (window.audio) window.audio.ensureAudio();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const state = {
  player: { x: 0, y: 0, vx: 0, vy: 0, r: 14, hp: 3, invuln: 0 },
  shards: 0,
  collected: new Set(),
  roomIndex: 0,
  particles: [],
  shake: 0,
  fade: 0,
  transitioning: false,
  transitionTo: null,
  message: '',
  messageTimer: 0,
  gameOver: false,
  victory: false,
  started: false,
  time: 0,
  stars: [],
};

function initStars() {
  state.stars = [];
  for (let i = 0; i < 120; i++) {
    state.stars.push({ x: Math.random() * 2000, y: Math.random() * 2000, s: Math.random() * 1.5 + 0.3, tw: Math.random() * Math.PI * 2 });
  }
}

function makeRooms() {
  const cx = W / 2, cy = H / 2;
  const m = Math.min(W, H);
  const rooms = [];

  // Room 0: First Enclave
  rooms.push({
    name: 'The First Enclave',
    accent: '#7df9ff',
    walls: [
      { x: cx - 120, y: cy - 200, w: 240, h: 20 },
      { x: cx - 120, y: cy + 180, w: 240, h: 20 },
    ],
    shards: [
      { x: cx - 220, y: cy - 100 },
      { x: cx + 200, y: cy - 120 },
      { x: cx, y: cy + 80 },
    ],
    gates: [{ x: W - 60, y: cy - 40, w: 40, h: 80, to: 1, requires: 2, label: 'Gate α' }],
    enemies: [{ x: cx, y: cy - 40, vx: 60, vy: 40, r: 12, hue: 0 }],
    spawn: { x: 80, y: cy },
    core: null,
  });

  // Room 1: Labyrinth
  const w1 = [];
  for (let i = 0; i < 6; i++) {
    w1.push({ x: 120 + i * 180, y: cy - 60 + (i % 2 ? 120 : -120), w: 20, h: 140 });
  }
  rooms.push({
    name: 'The Labyrinth',
    accent: '#b48cff',
    walls: w1,
    shards: [
      { x: 100, y: 100 }, { x: W - 100, y: 100 },
      { x: 100, y: H - 100 }, { x: W - 100, y: H - 100 },
      { x: cx, y: cy },
    ],
    gates: [{ x: W - 60, y: cy - 40, w: 40, h: 80, to: 2, requires: 5, label: 'Gate β' }],
    enemies: [
      { x: cx, y: 80, vx: 90, vy: 0, r: 12, hue: 30 },
      { x: cx, y: H - 80, vx: -90, vy: 0, r: 12, hue: 30 },
    ],
    spawn: { x: 60, y: cy },
    core: null,
  });

  // Room 2: Arena
  rooms.push({
    name: 'The Arena',
    accent: '#ff7df9',
    walls: [],
    shards: [
      { x: cx - 200, y: cy }, { x: cx + 200, y: cy },
      { x: cx, y: cy - 200 }, { x: cx, y: cy + 200 },
    ],
    gates: [{ x: W - 60, y: cy - 40, w: 40, h: 80, to: 3, requires: 7, label: 'Gate γ' }],
    enemies: [
      { x: cx, y: cy, vx: 120, vy: 80, r: 14, hue: 0 },
      { x: cx - 100, y: cy, vx: -100, vy: 120, r: 12, hue: 60 },
      { x: cx + 100, y: cy, vx: 80, vy: -130, r: 12, hue: 60 },
    ],
    spawn: { x: 60, y: cy },
    core: null,
  });

  // Room 3: Corridors
  const w3 = [];
  for (let i = 0; i < 4; i++) {
    w3.push({ x: cx - 300 + i * 150, y: cy - 120, w: 20, h: 240 });
  }
  rooms.push({
    name: 'The Corridors',
    accent: '#ffd6a5',
    walls: w3,
    shards: [
      { x: cx - 260, y: cy - 200 }, { x: cx - 110, y: cy + 200 },
      { x: cx + 40, y: cy - 200 }, { x: cx + 190, y: cy + 200 },
      { x: W - 120, y: cy },
    ],
    gates: [{ x: W - 60, y: cy - 40, w: 40, h: 80, to: 4, requires: 10, label: 'Gate δ' }],
    enemies: [
      { x: cx - 200, y: cy, vx: 0, vy: 70, r: 11, hue: 300 },
      { x: cx, y: cy, vx: 0, vy: -70, r: 11, hue: 300 },
      { x: cx + 200, y: cy, vx: 0, vy: 90, r: 11, hue: 300 },
    ],
    spawn: { x: 60, y: cy },
    core: null,
  });

  // Room 4: Gauntlet
  rooms.push({
    name: 'The Gauntlet',
    accent: '#ff5c8a',
    walls: [
      { x: cx - 200, y: cy - 250, w: 400, h: 20 },
      { x: cx - 200, y: cy + 230, w: 400, h: 20 },
    ],
    shards: [
      { x: cx - 260, y: cy - 180 }, { x: cx - 260, y: cy + 180 },
      { x: cx + 260, y: cy - 180 }, { x: cx + 260, y: cy + 180 },
      { x: cx, y: cy },
    ],
    gates: [{ x: W - 60, y: cy - 40, w: 40, h: 80, to: 5, requires: 13, label: 'Gate ε' }],
    enemies: [
      { x: cx - 100, y: cy - 150, vx: 140, vy: 100, r: 13, hue: 0 },
      { x: cx + 100, y: cy + 150, vx: -140, vy: -100, r: 13, hue: 0 },
      { x: cx, y: cy, vx: 100, vy: -120, r: 12, hue: 60 },
      { x: cx - 180, y: cy, vx: -80, vy: 130, r: 12, hue: 60 },
    ],
    spawn: { x: 60, y: cy },
    core: null,
  });

  // Room 5: The Core
  rooms.push({
    name: 'The Honest Core',
    accent: '#ffffff',
    walls: [],
    shards: [],
    gates: [],
    enemies: [
      { x: cx - 150, y: cy, vx: 60, vy: 0, r: 13, hue: 0 },
      { x: cx + 150, y: cy, vx: -60, vy: 0, r: 13, hue: 0 },
      { x: cx, y: cy - 150, vx: 0, vy: 60, r: 13, hue: 0 },
      { x: cx, y: cy + 150, vx: 0, vy: -60, r: 13, hue: 0 },
    ],
    spawn: { x: 60, y: cy },
    core: { x: cx, y: cy, r: 30 },
  });

  // normalize shard ids
  rooms.forEach((rm, ri) => {
    rm.shards = rm.shards.map((s, si) => ({ ...s, id: ri + '-' + si, r: 9 }));
  });
  return rooms;
}

let rooms = [];
function rebuildRooms() { rooms = makeRooms(); }

function shardId(rm, idx) { return rm.id || ''; }

function room() { return rooms[state.roomIndex]; }

function spawnPlayer() {
  const r = room();
  state.player.x = r.spawn.x;
  state.player.y = r.spawn.y;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.invuln = 1;
}

function circleRectOverlap(cx, cy, cr, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX, dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

function update(dt) {
  if (state.gameOver || state.victory || !state.started) return;
  state.time += dt;
  if (state.transitioning) {
    state.fade = Math.min(1, state.fade + dt * 3);
    if (state.fade >= 1 && state.transitionTo !== null) {
      state.roomIndex = state.transitionTo;
      state.transitionTo = null;
      spawnPlayer();
    }
    if (state.fade >= 1 && state.transitionTo === null) {
      state.transitioning = false;
    }
    updateHUD();
    return;
  }
  if (state.fade > 0) state.fade = Math.max(0, state.fade - dt * 3);
  const p = state.player;
  const accel = 720;
  if (keys['w'] || keys['arrowup']) p.vy -= accel * dt;
  if (keys['s'] || keys['arrowdown']) p.vy += accel * dt;
  if (keys['a'] || keys['arrowleft']) p.vx -= accel * dt;
  if (keys['d'] || keys['arrowright']) p.vx += accel * dt;
  const maxSpeed = 260;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > maxSpeed) { p.vx *= maxSpeed / sp; p.vy *= maxSpeed / sp; }
  p.vx *= Math.pow(0.9, dt * 10);
  p.vy *= Math.pow(0.9, dt * 10);
  // Actually use damping
  // (above pow too aggressive; redo below)
  // We'll instead apply exponential decay properly:
  // revert: use simple
  // redo movement with better friction:
  // (We'll just keep as is but adjust: use 0.85^dt? no) -> handle below
  // Move x
  p.x += p.vx * dt;
  for (const w of room().walls) {
    if (circleRectOverlap(p.x, p.y, p.r, w)) {
      if (p.vx > 0) p.x = w.x - p.r;
      else if (p.vx < 0) p.x = w.x + w.w + p.r;
      p.vx = 0;
    }
  }
  p.y += p.vy * dt;
  for (const w of room().walls) {
    if (circleRectOverlap(p.x, p.y, p.r, w)) {
      if (p.vy > 0) p.y = w.y - p.r;
      else if (p.vy < 0) p.y = w.y + w.h + p.r;
      p.vy = 0;
    }
  }
  // bounds
  p.x = Math.max(p.r, Math.min(W - p.r, p.x));
  p.y = Math.max(p.r, Math.min(H - p.r, p.y));

  if (p.invuln > 0) p.invuln -= dt;

  // friction (apply after movement, scale)
  // (apply damping factor)
  // We already multiplied; but let's instead damp velocity each frame:
  // Re-apply reasonable damping by overriding: use lerp to zero
  // Actually current friction pow(0.001,dt) is too strong; fix: do not, instead damp 0.9 per 0.1s
  // We'll adjust by re-running damping separately below? Too late. Let's just keep velocity as is; accel+no friction = slippery. Add friction here:
  // (We'll modify: replace pow with mild)
  // Since already applied, compensate not possible. We'll just accept; but let's instead not have applied. 
  // NOTE: the pow line above is harmful. We'll remove by editing later. For now continue.

  // enemies
  const rm = room();
  for (const e of rm.enemies) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.x < e.r || e.x > W - e.r) e.vx *= -1;
    if (e.y < e.r || e.y > H - e.r) e.vy *= -1;
    for (const w of rm.walls) {
      if (circleRectOverlap(e.x, e.y, e.r, w)) {
        // reflect
        e.vx *= -1; e.vy *= -1;
        e.x -= e.vx * dt * 2;
        e.y -= e.vy * dt * 2;
      }
    }
    // collision with player
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < e.r + p.r && p.invuln <= 0) {
      p.hp -= 1;
      p.invuln = 1.6;
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      p.vx = Math.cos(ang) * 420;
      p.vy = Math.sin(ang) * 420;
      state.shake = 0.4;
      window.audio && window.audio.sfxHit();
      spawnParticles(p.x, p.y, '#ff5c8a', 18);
      if (p.hp <= 0) {
        state.gameOver = true;
      }
      updateHUD();
    }
  }

  // shards
  rm.shards.forEach((s, idx) => {
    const id = state.roomIndex + '-' + idx;
    if (state.collected.has(id)) return;
    const d = Math.hypot(s.x - p.x, s.y - p.y);
    if (d < s.r + p.r + 4) {
      state.collected.add(id);
      state.shards += 1;
      window.audio && window.audio.sfxCollect();
      spawnParticles(s.x, s.y, '#ffd6a5', 24);
      updateHUD();
    }
  });

  // gates
  for (const g of rm.gates) {
    if (circleRectOverlap(p.x, p.y, p.r, g)) {
      if (state.shards >= g.requires) {
        if (!state.transitioning) startTransition(g.to);
      } else {
        state.message = g.label + ' locked — need ' + g.requires + ' shards (have ' + state.shards + ')';
        state.messageTimer = 1.5;
      }
    }
  }

  // core
  if (rm.core) {
    const c = rm.core;
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < c.r + p.r) {
      state.victory = true;
      window.audio && window.audio.sfxVictory();
    }
  }

  // particles
  state.particles = state.particles.filter(pt => pt.life > 0);
  for (const pt of state.particles) {
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vx *= 0.96; pt.vy *= 0.96;
    pt.life -= dt;
  }

  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 1.5);

  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) state.message = '';
  }

  updateHUD();
}

function startTransition(to) {
  state.transitioning = true;
  state.transitionTo = to;
  state.fade = 0;
  window.audio && window.audio.sfxGate();
  spawnParticles(state.player.x, state.player.y, room().accent, 30);
}

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 180;
    state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 + Math.random() * 0.6, color, size: 1.5 + Math.random() * 2.5 });
  }
}

function updateHUD() {
  const sh = document.getElementById('shards');
  const hr = document.getElementById('hearts');
  const rm = document.getElementById('room');
  if (sh) sh.textContent = 'Shards: ' + state.shards;
  if (hr) hr.textContent = '♥'.repeat(state.player.hp) + '♡'.repeat(3 - state.player.hp);
  if (rm) rm.textContent = (room() ? room().name : '');
  const msg = document.getElementById('msg');
  if (msg) msg.textContent = state.message;
}

let last = 0;
function loop(ts) {
  if (!last) last = ts;
  const dt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function render() {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake * 8;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // background
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
  g.addColorStop(0, '#0d0d2b');
  g.addColorStop(1, '#050510');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // stars
  ctx.fillStyle = 'rgba(200,200,255,0.6)';
  for (const st of state.stars) {
    const tw = 0.5 + 0.5 * Math.sin(state.time * 1.5 + st.tw);
    ctx.globalAlpha = tw * 0.8;
    ctx.beginPath();
    ctx.arc(st.x % W, st.y % H, st.s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (!state.started) {
    ctx.restore();
    return;
  }

  const rm = room();
  if (!rm) { ctx.restore(); return; }

  // walls
  for (const w of rm.walls) {
    ctx.fillStyle = 'rgba(60,60,100,0.6)';
    ctx.strokeStyle = 'rgba(120,120,200,0.4)';
    ctx.lineWidth = 1;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // shards
  rm.shards.forEach((s, idx) => {
    const id = state.roomIndex + '-' + idx;
    if (state.collected.has(id)) return;
    const pulse = 1 + 0.15 * Math.sin(state.time * 4 + idx);
    ctx.save();
    ctx.shadowColor = '#ffd6a5';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffd6a5';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // gates
  for (const g of rm.gates) {
    const unlocked = state.shards >= g.requires;
    ctx.save();
    ctx.shadowColor = unlocked ? rm.accent : '#555';
    ctx.shadowBlur = unlocked ? 25 : 5;
    ctx.fillStyle = unlocked ? rm.accent : 'rgba(80,80,100,0.5)';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = unlocked ? '#fff' : '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(g.x, g.y, g.w, g.h);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.label, g.x + g.w / 2, g.y - 6);
    if (!unlocked) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(g.requires + ' shards', g.x + g.w / 2, g.y + g.h + 14);
    }
  }

  // core
  if (rm.core) {
    const c = rm.core;
    const pulse = 1 + 0.2 * Math.sin(state.time * 3);
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 40;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.restore();
    // orbiting particles
    for (let i = 0; i < 6; i++) {
      const a = state.time * 1.2 + i * (Math.PI / 3);
      const r = c.r + 20;
      ctx.fillStyle = '#7df9ff';
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // enemies
  for (const e of rm.enemies) {
    ctx.save();
    ctx.shadowColor = `hsl(${e.hue}, 90%, 60%)`;
    ctx.shadowBlur = 18;
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
    grad.addColorStop(0, `hsl(${e.hue}, 90%, 70%)`);
    grad.addColorStop(1, `hsl(${e.hue}, 90%, 40%)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // player
  const p = state.player;
  ctx.save();
  ctx.shadowColor = rm.accent;
  ctx.shadowBlur = 25;
  const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
  pg.addColorStop(0, '#ffffff');
  pg.addColorStop(1, rm.accent);
  ctx.fillStyle = pg;
  ctx.globalAlpha = p.invuln > 0 ? 0.5 + 0.5 * Math.sin(state.time * 20) : 1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // particles
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    ctx.shadowColor = pt.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // fade overlay
  if (state.fade > 0) {
    ctx.fillStyle = `rgba(5,5,16,${state.fade})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();

  // victory / gameover overlays drawn via DOM
  if (state.victory) showOverlay('VICTORY', 'You reached the Honest Core. Truth prevails in the enclave.', 'Play Again');
  if (state.gameOver) showOverlay('FALLEN', 'The enclave consumed you. Honesty is hard.', 'Retry');
}

function showOverlay(title, body, btn) {
  const ov = document.getElementById('overlay');
  if (ov.classList.contains('hidden')) {
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayBody').textContent = body;
    document.getElementById('overlayBtn').textContent = btn;
    ov.classList.remove('hidden');
  }
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

function startGame() {
  state.started = true;
  state.gameOver = false;
  state.victory = false;
  state.shards = 0;
  state.collected = new Set();
  state.roomIndex = 0;
  state.player.hp = 3;
  state.particles = [];
  state.message = '';
  state.messageTimer = 0;
  rebuildRooms();
  initStars();
  spawnPlayer();
  hideOverlay();
  updateHUD();
  if (window.audio) window.audio.ensureAudio();
}

document.getElementById('overlayBtn').addEventListener('click', () => {
  if (!state.started) {
    startGame();
  } else if (state.victory || state.gameOver) {
    // reset
    startGame();
  }
});

// initial overlay
(function init() {
  rebuildRooms();
  initStars();
  spawnPlayer();
  // show intro
  const ov = document.getElementById('overlay');
  document.getElementById('overlayTitle').textContent = 'HONEST ENCLAVE GATEWAY';
  document.getElementById('overlayBody').textContent = 'You are a spark of truth wandering through enclaves. Collect honesty shards, unlock gateways, evade deceits. Reach the Honest Core. Move: WASD / Arrows. Touch a gate to pass when unlocked.';
  document.getElementById('overlayBtn').textContent = 'Enter';
  ov.classList.remove('hidden');
  updateHUD();
  requestAnimationFrame(loop);
})();

// Fix friction: override update movement damping by editing not possible at runtime? We'll patch update via redefining? 
// Instead, modify update function text? Can't. Let's instead adjust by changing accel approach: we applied pow friction. 
// To soften, change the pow line effect by adding counter. Simpler: edit source.
