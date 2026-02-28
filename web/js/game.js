// game.js — Aura: Out of the Grey — Top-down Pokémon-style engine
'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 900, H = 500;
canvas.width = W; canvas.height = H;

// ── State ─────────────────────────────────────────────────────────────────────
let state = 'start';     // start | playing | challenge | success | gamecomplete | paused
let currentDifficulty = 'moyen'; // facile | moyen | difficile
let LEVELS = []; // Will be populated dynamically based on difficulty
let levelIndex = 0, level = null;
let gateOpen = false, gateAlpha = 1;
let particles = [];
let ambientParticles = [];
let challengeNPC = null;
let wrongAttempts = 0;
let wordOrderTiles = [], wordOrderSlots = [], selectedTile = null;

// ── Player (top-down) ─────────────────────────────────────────────────────────
const P = { x: 430, y: 400, w: 28, h: 28, vx: 0, vy: 0, dir: 'down', step: 0, stepT: 0 };
const SPEED = 160;
const INTERACT_RANGE = 52;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Escape') handleEsc();
    if (state === 'playing' && e.code === 'KeyE') tryInteract();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function handleEsc() {
    if (state === 'challenge') { closeChallenge(); return; }
    if (state === 'playing') { state = 'paused'; document.getElementById('pauseOverlay').classList.remove('hidden'); return; }
    if (state === 'paused') { state = 'playing'; document.getElementById('pauseOverlay').classList.add('hidden'); }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
// Difficulty selector
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentDifficulty = btn.dataset.diff;
    });
});

document.getElementById('startBtn').onclick = () => {
    document.getElementById('startScreen').style.display = 'none';
    LEVELS = getLevelsData(currentDifficulty);
    loadLevel(0);

    // Initialize ambient aura particles
    ambientParticles = Array.from({ length: 40 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 10, vy: -10 - Math.random() * 20,
        r: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1
    }));

    requestAnimationFrame(loop);
};
document.getElementById('resumeBtn').onclick = () => { state = 'playing'; document.getElementById('pauseOverlay').classList.add('hidden'); };
document.getElementById('restartBtn').onclick = () => { document.getElementById('pauseOverlay').classList.add('hidden'); loadLevel(levelIndex); };
document.getElementById('nextLevelBtn').onclick = () => {
    document.getElementById('successBanner').classList.add('hidden');
    levelIndex + 1 < LEVELS.length ? loadLevel(levelIndex + 1) : showGameComplete();
};

// ── Load Level ────────────────────────────────────────────────────────────────
function loadLevel(idx) {
    levelIndex = idx;
    level = LEVELS[idx];
    gateOpen = false;
    gateAlpha = 1;
    wrongAttempts = 0;
    particles = [];
    challengeNPC = null;

    P.x = level.playerStart.x; P.y = level.playerStart.y;
    P.vx = P.vy = 0; P.dir = 'down'; P.step = 0;

    level.npcs.forEach(n => { n.done = false; n.talking = false; });

    document.getElementById('levelLabel').textContent = level.name;
    document.getElementById('successBanner').classList.add('hidden');
    closeChallenge();
    state = 'playing';
}

// ── Game Loop ─────────────────────────────────────────────────────────────────
let lastT = 0;
function loop(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    if (state === 'playing') update(dt);
    render();
    requestAnimationFrame(loop);
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
    // Movement
    P.vx = P.vy = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) { P.vx = -SPEED; P.dir = 'left'; }
    if (keys['ArrowRight'] || keys['KeyD']) { P.vx = SPEED; P.dir = 'right'; }
    if (keys['ArrowUp'] || keys['KeyW']) { P.vy = -SPEED; P.dir = 'up'; }
    if (keys['ArrowDown'] || keys['KeyS']) { P.vy = SPEED; P.dir = 'down'; }

    // Normalize diagonal
    if (P.vx && P.vy) { P.vx *= 0.707; P.vy *= 0.707; }

    // Walk cycle
    if (P.vx || P.vy) { P.stepT += dt * 6; if (P.stepT > 1) { P.stepT = 0; P.step = (P.step + 1) % 4; } }
    else P.step = 0;

    const nx = P.x + P.vx * dt;
    const ny = P.y + P.vy * dt;

    // Collide walls
    if (!hitWall(nx, P.y)) P.x = nx;
    if (!hitWall(P.x, ny)) P.y = ny;

    // Gate collision
    if (!gateOpen && gateAlpha > 0) {
        const g = level.gate;
        if (rectsOverlap(P.x, P.y, P.w, P.h, g.x, g.y, g.w, g.h))
            P.x -= P.vx * dt * 2, P.y -= P.vy * dt * 2;
    }

    // World bounds
    P.x = Math.max(2, Math.min(W - P.w - 2, P.x));
    P.y = Math.max(2, Math.min(H - P.h - 2, P.y));

    // Dissolve gate
    if (gateOpen && gateAlpha > 0) {
        gateAlpha -= dt / 1.5;
        if (gateAlpha <= 0) { gateAlpha = 0; spawnParticles(level.gate.x + level.gate.w / 2, level.gate.y + level.gate.h / 2, '#c084fc', 40); }
    }

    // Exit check
    const ex = level.exit;
    if (gateAlpha <= 0 && rectsOverlap(P.x, P.y, P.w, P.h, ex.x, ex.y, ex.w, ex.h)) {
        showSuccess();
        return;
    }

    // NPC proximity prompt
    level.npcs.forEach(n => {
        n.talking = !n.done && dist(P.x + P.w / 2, P.y + P.h / 2, n.x + 20, n.y + 20) < INTERACT_RANGE;
    });

    // Ambient particles
    ambientParticles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Slowly drift up and fade
        if (p.y < -10) {
            p.y = H + 10;
            p.x = Math.random() * W;
        }
    });

    // Particles
    particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.alpha = Math.max(0, p.life / p.maxLife); });
    particles = particles.filter(p => p.life > 0);
}

// ── Wall/collision logic ──────────────────────────────────────────────────────
function hitWall(nx, ny) {
    if (!level) return false;
    return getWalls().some(([wx, wy, ww, wh]) => rectsOverlap(nx, ny, P.w, P.h, wx, wy, ww, wh));
}

function getWalls() {
    if (level.type === 'classroom') return classroomWalls();
    if (level.type === 'schoolyard') return schoolyardWalls();
    if (level.type === 'forest') return forestWalls();
    if (level.type === 'space') return spaceWalls();
    return [];
}

// ── Interact ──────────────────────────────────────────────────────────────────
function tryInteract() {
    const npc = level.npcs.find(n => n.talking && !n.done);
    if (!npc) return;
    challengeNPC = npc;
    wrongAttempts = 0;
    openChallenge(npc);
}

// ── Challenge System ──────────────────────────────────────────────────────────
function openChallenge(npc) {
    state = 'challenge';
    const ui = document.getElementById('sentenceUI');
    ui.classList.remove('hidden');

    document.getElementById('hintText').textContent = '';

    let html = `<div class="challenge-header">
    <span class="npc-name" style="color:${npc.color}">${npc.name}</span>
    dit…
  </div>
  <div class="scenario-box">${npc.scenario.replace(/\n/g, '<br>')}</div>`;

    if (npc.challengeType === 'emoji' && npc.emojiPairs?.length) {
        html += `<div class="emoji-row">`;
        npc.emojiPairs.forEach(pair => {
            html += `<div class="emoji-card" onclick="selectEmoji(this,'${pair.matches}','${npc.word}')">
        <div class="emoji-face">${pair.emoji}</div>
        <div class="emoji-label">${pair.situation}</div>
      </div>`;
        });
        html += `</div>`;
    } else if (npc.challengeType === 'wordorder' && npc.wordTiles?.length) {
        const shuffled = shuffle([...npc.wordTiles]);
        html += buildWordOrderHTML(shuffled, npc.correctOrder);
    } else {
        const choices = shuffle([...npc.choices]);
        html += `<div class="sentence-prompt">Comment se sent <strong>${npc.name}</strong> ?</div>
    <div id="wordChoices">`;
        choices.forEach(w => {
            html += `<button class="word-btn" onclick="checkChoice('${w}', this)">${w}</button>`;
        });
        html += `</div>`;
    }

    document.getElementById('sentenceText').innerHTML = html;
}

window.checkChoice = function (word, btn) {
    const npc = challengeNPC;
    if (word === npc.word) {
        btn.classList.add('correct');
        setTimeout(() => onChallengeWon(npc), 600);
    } else {
        wrongAttempts++;
        btn.classList.add('wrong');
        btn.disabled = true;
        setTimeout(() => btn.classList.remove('wrong'), 400);
        showHintFor(npc);
    }
};

window.selectEmoji = function (el, matchesWord, correctWord) {
    el.parentElement.querySelectorAll('.emoji-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    if (matchesWord === correctWord) {
        el.classList.add('correct');
        setTimeout(() => onChallengeWon(challengeNPC), 600);
    } else {
        wrongAttempts++;
        el.classList.add('wrong');
        setTimeout(() => el.classList.remove('wrong', 'selected'), 500);
        showHintFor(challengeNPC);
    }
};

function buildWordOrderHTML(tiles, correct) {
    wordOrderTiles = tiles.map((t, i) => ({ word: t, id: i, placed: false }));
    wordOrderSlots = correct.map((_, i) => ({ id: i, filled: null }));

    let html = `<div class="wo-instructions">Touche les mots pour former la phrase :</div>
  <div class="wo-slots" id="woSlots">`;
    correct.forEach((_, i) => { html += `<div class="wo-slot" id="woslot_${i}" onclick="fillSlot(${i})">___</div>`; });
    html += `</div><div class="wo-tiles" id="woTiles">`;
    tiles.forEach((t, i) => { html += `<div class="wo-tile" id="wotile_${i}" onclick="selectTile(${i})">${t}</div>`; });
    html += `</div>
  <button class="word-btn" style="margin-top:10px" onclick="checkWordOrder()">Vérifier ✓</button>`;
    return html;
}

window.selectTile = function (id) {
    document.querySelectorAll('.wo-tile').forEach(t => t.classList.remove('selected'));
    const el = document.getElementById(`wotile_${id}`);
    if (!el || el.classList.contains('used')) return;
    selectedTile = id;
    el.classList.add('selected');
};

window.fillSlot = function (slotId) {
    if (selectedTile === null) return;
    const slot = wordOrderSlots[slotId];
    if (slot.filled !== null) {
        const old = document.getElementById(`wotile_${slot.filled}`);
        if (old) { old.classList.remove('used'); old.textContent = wordOrderTiles[slot.filled].word; }
    }
    slot.filled = selectedTile;
    const slotEl = document.getElementById(`woslot_${slotId}`);
    slotEl.textContent = wordOrderTiles[selectedTile].word;
    slotEl.classList.add('filled');
    const tileEl = document.getElementById(`wotile_${selectedTile}`);
    tileEl.classList.add('used', 'selected');
    tileEl.classList.remove('selected');
    selectedTile = null;
    document.querySelectorAll('.wo-tile').forEach(t => t.classList.remove('selected'));
};

window.checkWordOrder = function () {
    const npc = challengeNPC;
    const formed = wordOrderSlots.map(s => s.filled !== null ? wordOrderTiles[s.filled].word : '');
    if (JSON.stringify(formed) === JSON.stringify(npc.correctOrder)) {
        document.querySelectorAll('.wo-slot').forEach(s => s.classList.add('correct'));
        setTimeout(() => onChallengeWon(npc), 700);
    } else {
        wrongAttempts++;
        document.querySelectorAll('.wo-slot').forEach(s => { s.classList.add('wrong'); setTimeout(() => s.classList.remove('wrong'), 400); });
        showHintFor(npc);
    }
};

function showHintFor(npc) {
    const h = document.getElementById('hintText');
    switch (wrongAttempts) {
        case 1: h.textContent = npc.isPositive ? "Indice : c'est une émotion positive 😊" : "Indice : c'est une émotion difficile 😟"; break;
        case 2: h.textContent = `Indice : le mot commence par « ${(npc.word)[0].toUpperCase()} »`; break;
        default: h.textContent = `Indice : pense à ce que tu ressentirais dans cette situation.`; break;
    }
}

function onChallengeWon(npc) {
    npc.done = true;
    closeChallenge();
    spawnParticles(npc.x + 20, npc.y + 20, npc.color, 24);

    if (npc.word === level.targetWord) {
        gateOpen = true;
        document.getElementById('hintText').textContent = '';
    }
    state = 'playing';
}

function closeChallenge() {
    document.getElementById('sentenceUI').classList.add('hidden');
    document.getElementById('sentenceText').innerHTML = '';
    document.getElementById('hintText').textContent = '';
    challengeNPC = null;
    selectedTile = null;
    if (state === 'challenge') state = 'playing';
}

function showSuccess() {
    state = 'success';
    const banner = document.getElementById('successBanner');
    const sub = banner.querySelector('.success-sub');
    sub.textContent = level.levelSentence.replace('___', `«\u00A0${level.targetWord}\u00A0»`);
    banner.classList.remove('hidden');
}

function showGameComplete() {
    state = 'gamecomplete';
    document.getElementById('successBanner').classList.remove('hidden');
    document.querySelector('.success-title').textContent = '🌟 Tu as tout réussi ! 🌟';
    document.querySelector('.success-sub').textContent = 'Toutes les émotions ont été exprimées.';
    document.getElementById('nextLevelBtn').textContent = 'Rejouer depuis le début';
    document.getElementById('nextLevelBtn').onclick = () => {
        document.getElementById('successBanner').classList.add('hidden');
        document.querySelector('.success-title').textContent = '✨ Bravo ! ✨';
        document.getElementById('nextLevelBtn').textContent = 'Niveau suivant →';
        loadLevel(0);
    };
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
    if (!level) return;
    ctx.clearRect(0, 0, W, H);

    if (level.type === 'classroom') drawClassroomScene();
    else if (level.type === 'schoolyard') drawSchoolyardScene();
    else if (level.type === 'forest') drawForestScene();
    else if (level.type === 'space') drawSpaceScene();

    drawNPCs();
    drawGate();
    drawParticles();
    drawAmbientParticles();
    drawPlayer();
    drawInteractPrompts();
}

function drawAmbientParticles() {
    ambientParticles.forEach(p => {
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.fillStyle = '#a5b4fc';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSROOM SCENE
// ─────────────────────────────────────────────────────────────────────────────
function drawClassroomScene() {
    // Stone tile floor with grout
    const TILE = 60;
    for (let tx = 0; tx < W; tx += TILE)
        for (let ty = 80; ty < H; ty += TILE) {
            const row = Math.floor((ty - 80) / TILE), col = Math.floor(tx / TILE);
            const base = (row + col) % 2 === 0 ? '#ede4d3' : '#e5d9c4';
            ctx.fillStyle = base;
            ctx.fillRect(tx, ty, TILE, TILE);
            // subtle inner grain lines
            ctx.strokeStyle = 'rgba(180,160,130,0.18)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(tx + 1, ty + 1, TILE - 2, TILE - 2);
        }
    // Grout lines
    ctx.strokeStyle = 'rgba(160,140,110,0.35)';
    ctx.lineWidth = 1.5;
    for (let tx = 0; tx <= W; tx += TILE) { ctx.beginPath(); ctx.moveTo(tx, 80); ctx.lineTo(tx, H); ctx.stroke(); }
    for (let ty = 80; ty <= H; ty += TILE) { ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke(); }

    // Wall / ceiling strip
    const wallGr = ctx.createLinearGradient(0, 0, 0, 82);
    wallGr.addColorStop(0, '#d8c9a4'); wallGr.addColorStop(1, '#c8b98e');
    ctx.fillStyle = wallGr;
    ctx.fillRect(0, 0, W, 80);

    // Blackboard
    drawRR(ctx, 60, 8, 780, 58, 4, '#1e3320');
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(64, 11, 772, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Comment tu te sens aujourd\'hui ?', W / 2, 42);
    ctx.textAlign = 'left';
    // Board frame
    ctx.strokeStyle = '#6b4c1e'; ctx.lineWidth = 5;
    ctx.strokeRect(60, 8, 780, 58);
    // Chalk tray
    ctx.fillStyle = '#8B6914'; ctx.fillRect(60, 64, 780, 6);

    // Teacher desk
    drawRR(ctx, W / 2 - 70, 90, 140, 50, 6, '#7a5c30');
    // Wood grain on desk
    ctx.strokeStyle = 'rgba(100,70,20,0.18)'; ctx.lineWidth = 1;
    for (let gi = 0; gi < 5; gi++) { ctx.beginPath(); ctx.moveTo(W / 2 - 68, 93 + gi * 9); ctx.lineTo(W / 2 + 68, 95 + gi * 9); ctx.stroke(); }
    ctx.fillStyle = '#5D4037'; ctx.fillRect(W / 2 - 60, 95, 120, 38);
    // Apple
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(W / 2 + 40, 110, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27ae60'; ctx.fillRect(W / 2 + 38, 100, 2, 7);
    ctx.fillStyle = '#a93226'; ctx.beginPath(); ctx.arc(W / 2 + 43, 106, 3, 0, Math.PI * 2); ctx.fill();

    // Windows
    [[18, 120], [18, 230], [862, 120], [862, 230]].forEach(([wx, wy]) => {
        ctx.fillStyle = '#d0ebf7'; ctx.fillRect(wx, wy, 24, 70);
        // sky gradient
        const wg = ctx.createLinearGradient(wx, wy, wx, wy + 70);
        wg.addColorStop(0, '#b8ddf5'); wg.addColorStop(1, '#e8f4fd');
        ctx.fillStyle = wg; ctx.fillRect(wx + 2, wy + 2, 20, 66);
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 3;
        ctx.strokeRect(wx, wy, 24, 70);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(wx + 12, wy); ctx.lineTo(wx + 12, wy + 70); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx, wy + 35); ctx.lineTo(wx + 24, wy + 35); ctx.stroke();
    });

    // Student desks with wood grain + chairs
    const deskRows = [[155, 170], [420, 170], [685, 170], [155, 265], [420, 265], [685, 265]];
    deskRows.forEach(([dx, dy]) => {
        // chair legs
        ctx.fillStyle = '#5a3e20';
        [[-22, dy + 52], [10, dy + 52], [-22, dy + 70], [10, dy + 70]].forEach(([lx, ly]) => ctx.fillRect(lx + dx, ly, 5, 12));
        // desk top
        drawRR(ctx, dx - 35, dy, 70, 40, 4, '#b8864e');
        ctx.strokeStyle = 'rgba(90,60,20,0.15)'; ctx.lineWidth = 0.8;
        for (let gi = 0; gi < 4; gi++) { ctx.beginPath(); ctx.moveTo(dx - 33, dy + 5 + gi * 9); ctx.lineTo(dx + 33, dy + 6 + gi * 9); ctx.stroke(); }
        // notebook on desk
        ctx.fillStyle = '#f0f4ff'; ctx.fillRect(dx - 18, dy + 4, 28, 20);
        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 0.6;
        for (let li = 0; li < 3; li++) { ctx.beginPath(); ctx.moveTo(dx - 16, dy + 8 + li * 5); ctx.lineTo(dx + 8, dy + 8 + li * 5); ctx.stroke(); }
    });

    // Bookshelf
    drawRR(ctx, 854, 310, 42, 140, 3, '#7a5c30');
    ctx.fillStyle = '#5D4037'; ctx.fillRect(856, 312, 38, 136);
    const bookColors = ['#c0392b', '#2980b9', '#27ae60', '#e67e22', '#8e44ad', '#16a085', '#d35400'];
    for (let bi = 0; bi < 7; bi++) {
        ctx.fillStyle = bookColors[bi];
        ctx.fillRect(857, 314 + bi * 18, 36, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(858, 315 + bi * 18, 8, 13);
    }

    // Front door
    drawRR(ctx, 400, 452, 100, 48, 5, '#7a5c30');
    ctx.fillStyle = '#5D4037'; ctx.fillRect(404, 455, 92, 42);
    // Door panels
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.strokeRect(408, 458, 38, 17); ctx.strokeRect(456, 458, 36, 17);
    ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.arc(448, 476, 4, 0, Math.PI * 2); ctx.fill();

    // Shadow under ceiling
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 78, W, 6);
}

function classroomWalls() {
    return [
        [0, 0, W, 80],
        [120, 165, 70, 45], [385, 165, 70, 45], [650, 165, 70, 45],
        [120, 260, 70, 45], [385, 260, 70, 45], [650, 260, 70, 45],
        [850, 310, 50, 140],
        [W / 2 - 75, 88, 150, 55],
        [0, 0, 14, H], [W - 14, 0, 14, H],
        [0, H - 14, W, 14],
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOLYARD SCENE
// ─────────────────────────────────────────────────────────────────────────────
function drawSchoolyardScene() {
    // Multi-tone grass base
    ctx.fillStyle = '#4a7c4e'; ctx.fillRect(0, 0, W, H);
    // Grass variation patches
    const gSeeds = [[80, 60], [200, 180], [380, 90], [550, 310], [700, 150], [850, 280], [140, 380], [450, 430], [760, 420]];
    gSeeds.forEach(([gx, gy]) => {
        const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 80);
        gr.addColorStop(0, 'rgba(90,155,70,0.3)'); gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx, gy, 80, 0, Math.PI * 2); ctx.fill();
    });
    // Darker patches
    [[300, 200], [600, 350], [150, 300]].forEach(([gx, gy]) => {
        ctx.fillStyle = 'rgba(40,80,40,0.2)';
        ctx.beginPath(); ctx.ellipse(gx, gy, 60, 30, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Grass blade dashes
    ctx.strokeStyle = 'rgba(80,160,60,0.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 60; i++) {
        const bx = 20 + i * 16 + Math.sin(i * 7.3) * 8, by = 20 + Math.cos(i * 5.7) * 200;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 2, by - 8); ctx.stroke();
    }

    // Court — sandy asphalt
    const courtGr = ctx.createLinearGradient(240, 140, 240, 360);
    courtGr.addColorStop(0, '#c8a860'); courtGr.addColorStop(1, '#b89850');
    ctx.fillStyle = courtGr; ctx.fillRect(240, 140, 420, 220);
    // Court surface texture
    ctx.fillStyle = 'rgba(200,180,120,0.12)';
    for (let ci = 0; ci < 6; ci++) ctx.fillRect(244 + ci * 68, 142, 64, 216);
    // Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5;
    ctx.strokeRect(240, 140, 420, 220);
    ctx.beginPath(); ctx.arc(450, 250, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(450, 140); ctx.lineTo(450, 360); ctx.stroke();
    // Goals
    [[240, 250], [660, 250]].forEach(([hx, hy]) => {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(hx, hy, 20, 0, Math.PI * 2); ctx.stroke();
    });

    // Trees — layered canopies
    [[60, 80], [820, 80], [60, 350], [820, 350]].forEach(([tx, ty]) => {
        // Trunk
        const tg = ctx.createLinearGradient(tx - 5, ty, tx + 5, ty);
        tg.addColorStop(0, '#5D4037'); tg.addColorStop(0.5, '#795548'); tg.addColorStop(1, '#5D4037');
        ctx.fillStyle = tg; ctx.fillRect(tx - 5, ty + 22, 10, 22);
        // Shadow canopy
        ctx.fillStyle = '#2d5a2d'; ctx.beginPath(); ctx.arc(tx, ty + 4, 34, 0, Math.PI * 2); ctx.fill();
        // Mid canopy
        ctx.fillStyle = '#3a7a3a'; ctx.beginPath(); ctx.arc(tx, ty, 28, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = '#5ca05c'; ctx.beginPath(); ctx.arc(tx - 6, ty - 6, 16, 0, Math.PI * 2); ctx.fill();
    });

    // Fence
    ctx.fillStyle = '#b8903a'; ctx.fillRect(W - 22, 0, 14, H);
    ctx.fillStyle = '#a07830'; ctx.fillRect(W - 22, 0, 14, 5);
    // Fence posts & rails
    for (let fy = 10; fy < H; fy += 28) {
        ctx.fillStyle = '#c8a048'; ctx.fillRect(W - 20, fy, 10, 22);
        ctx.fillStyle = 'rgba(255,220,120,0.15)'; ctx.fillRect(W - 19, fy + 2, 4, 18);
    }

    // Bench
    drawRR(ctx, 100, 380, 100, 28, 5, '#7a5c30');
    ctx.fillStyle = '#9e7c50';
    for (let bi = 0; bi < 5; bi++) ctx.fillRect(102 + bi * 20, 382, 17, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(102, 382, 96, 8);

    // Flag pole
    drawRR(ctx, W - 40, 160, 8, 180, 3, '#9e9e9e');
    ctx.fillStyle = '#5D4037'; ctx.fillRect(W - 36, 164, 4, 176);
    // Flag
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.moveTo(W - 36, 168); ctx.lineTo(W - 16, 175); ctx.lineTo(W - 36, 182); ctx.closePath(); ctx.fill();
}

function schoolyardWalls() {
    return [
        [0, 0, 14, H], [W - 22, 0, 22, H],
        [0, 0, W, 14], [0, H - 14, W, 14],
        [100, 378, 100, 32],
        [30, 70, 50, 60], [800, 70, 50, 60], [30, 330, 50, 60], [800, 330, 50, 60],
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// FOREST SCENE
// ─────────────────────────────────────────────────────────────────────────────
function drawForestScene() {
    const t = Date.now() * 0.0005;
    // Sky/canopy through-light
    const skyGr = ctx.createLinearGradient(0, 0, 0, H);
    skyGr.addColorStop(0, '#0d200d'); skyGr.addColorStop(1, '#1a3a1a');
    ctx.fillStyle = skyGr; ctx.fillRect(0, 0, W, H);

    // Dappled canopy light spots
    for (let i = 0; i < 14; i++) {
        const lx = 60 + i * 62 + Math.sin(t * 0.3 + i) * 12;
        const ly = 40 + Math.cos(t * 0.2 + i) * 18;
        const gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, 70);
        gr.addColorStop(0, 'rgba(180,240,120,0.12)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(lx, ly, 70, 0, Math.PI * 2); ctx.fill();
    }

    // Ground: mossy earth
    ctx.fillStyle = '#2a1a08';
    ctx.beginPath();
    ctx.moveTo(0, 390); ctx.bezierCurveTo(180, 370, 480, 410, 680, 372);
    ctx.bezierCurveTo(790, 358, 870, 415, W, 395);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // Moss top
    ctx.fillStyle = 'rgba(60,110,30,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 395); ctx.bezierCurveTo(200, 380, 500, 416, 700, 378);
    ctx.bezierCurveTo(800, 364, 880, 420, W, 400);
    ctx.lineTo(W, 395); ctx.bezierCurveTo(870, 415, 790, 358, 680, 372);
    ctx.bezierCurveTo(480, 410, 180, 370, 0, 390); ctx.closePath(); ctx.fill();
    // Undergrowth ferns
    ctx.strokeStyle = 'rgba(60,140,40,0.5)'; ctx.lineWidth = 1.5;
    for (let fi = 0; fi < 18; fi++) {
        const fbx = 30 + fi * 52 + Math.sin(fi * 3.7) * 20, fby = 400 + Math.cos(fi * 5.1) * 20;
        ctx.beginPath(); ctx.moveTo(fbx, fby); ctx.quadraticCurveTo(fbx + 8 + Math.sin(t + fi) * 5, fby - 20, fbx + 16, fby - 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fbx, fby); ctx.quadraticCurveTo(fbx - 8, fby - 18, fbx - 14, fby - 12); ctx.stroke();
    }

    // Trees with bark texture detail
    const trees = [[50, 60], [120, 200], [200, 350], [350, 80], [500, 300], [620, 140], [720, 360], [820, 100], [880, 250]];
    trees.forEach(([tx, ty]) => {
        const r = 30 + Math.sin(tx * 0.05) * 10;
        // Shadow under canopy
        ctx.fillStyle = '#0e280e'; ctx.beginPath(); ctx.arc(tx, ty, r + 14, 0, Math.PI * 2); ctx.fill();
        // Main canopy layers
        ctx.fillStyle = '#1e5c1e'; ctx.beginPath(); ctx.arc(tx, ty, r + 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2d7a2d'; ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a9a3a'; ctx.beginPath(); ctx.arc(tx - 4, ty - 4, r * 0.65, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(180,255,120,0.08)'; ctx.beginPath(); ctx.arc(tx - 6, ty - 8, r * 0.35, 0, Math.PI * 2); ctx.fill();
        // Trunk with bark lines
        const tg = ctx.createLinearGradient(tx - 7, 0, tx + 7, 0);
        tg.addColorStop(0, '#3e2208'); tg.addColorStop(0.4, '#6d4019'); tg.addColorStop(1, '#3e2208');
        ctx.fillStyle = tg; ctx.fillRect(tx - 7, ty + r - 6, 14, 22);
        ctx.strokeStyle = 'rgba(30,15,0,0.4)'; ctx.lineWidth = 0.8;
        for (let bi = 0; bi < 4; bi++) { ctx.beginPath(); ctx.moveTo(tx - 6, ty + r - 4 + bi * 5); ctx.lineTo(tx + 6, ty + r - 3 + bi * 5); ctx.stroke(); }
    });

    // Fireflies
    for (let f = 0; f < 10; f++) {
        const fx = 90 + f * 85 + Math.sin(t * 1.8 + f) * 28;
        const fy = 170 + f * 28 + Math.cos(t * 1.4 + f) * 18;
        const fa = 0.5 + 0.5 * Math.sin(t * 5 + f);
        const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 5);
        fg.addColorStop(0, `rgba(230,255,80,${fa})`); fg.addColorStop(1, 'transparent');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI * 2); ctx.fill();
    }

    if (gateAlpha <= 0) {
        const gr = ctx.createRadialGradient(870, 280, 0, 870, 280, 55);
        gr.addColorStop(0, 'rgba(160,255,120,0.35)'); gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(870, 280, 55, 0, Math.PI * 2); ctx.fill();
    }
}

function forestWalls() {
    return [
        [0, 0, 14, H], [W - 14, 0, 14, H], [0, 0, W, 14], [0, H - 14, W, 14],
        [30, 40, 90, 110], [100, 170, 90, 100], [180, 320, 90, 100],
        [330, 50, 90, 100], [480, 270, 90, 100], [600, 110, 90, 100],
        [700, 330, 90, 100], [800, 70, 90, 100], [860, 220, 90, 100]
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SPACE SCENE
// ─────────────────────────────────────────────────────────────────────────────
function drawSpaceScene() {
    // Deep space background
    const bgGr = ctx.createLinearGradient(0, 0, 0, H);
    bgGr.addColorStop(0, '#000510'); bgGr.addColorStop(1, '#000820');
    ctx.fillStyle = bgGr; ctx.fillRect(0, 0, W, H);

    // Nebula cloud
    const nb = ctx.createRadialGradient(200, 200, 0, 200, 200, 260);
    nb.addColorStop(0, 'rgba(60,20,120,0.18)'); nb.addColorStop(0.5, 'rgba(30,10,80,0.08)'); nb.addColorStop(1, 'transparent');
    ctx.fillStyle = nb; ctx.beginPath(); ctx.arc(200, 200, 260, 0, Math.PI * 2); ctx.fill();
    const nb2 = ctx.createRadialGradient(750, 350, 0, 750, 350, 200);
    nb2.addColorStop(0, 'rgba(20,60,120,0.15)'); nb2.addColorStop(1, 'transparent');
    ctx.fillStyle = nb2; ctx.beginPath(); ctx.arc(750, 350, 200, 0, Math.PI * 2); ctx.fill();

    if (!window._stars) {
        window._stars = Array.from({ length: 160 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.8 + 0.2, t: Math.random() * Math.PI * 2,
            bright: Math.random() > 0.85
        }));
    }
    const t = Date.now() * 0.001;
    window._stars.forEach(s => {
        const a = s.bright ? (0.6 + 0.4 * Math.sin(t * 2.5 + s.t)) : (0.3 + 0.2 * Math.sin(t + s.t));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.bright) {
            const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
            sg.addColorStop(0, `rgba(200,220,255,${a * 0.4})`); sg.addColorStop(1, 'transparent');
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
        }
    });

    // Planet
    const pgr = ctx.createRadialGradient(690, 108, 4, 700, 120, 88);
    pgr.addColorStop(0, '#6070cc'); pgr.addColorStop(0.5, '#2a3888'); pgr.addColorStop(1, '#0d1440');
    ctx.fillStyle = pgr; ctx.beginPath(); ctx.arc(700, 120, 88, 0, Math.PI * 2); ctx.fill();
    // Planet surface bands
    ctx.fillStyle = 'rgba(100,140,220,0.12)'; ctx.beginPath(); ctx.ellipse(700, 105, 70, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(80,100,180,0.1)'; ctx.beginPath(); ctx.ellipse(700, 130, 60, 10, 0, 0, Math.PI * 2); ctx.fill();
    // Ring
    ctx.strokeStyle = 'rgba(160,140,220,0.5)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.ellipse(700, 132, 128, 18, 0.18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,80,180,0.2)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(700, 132, 140, 20, 0.18, 0, Math.PI * 2); ctx.stroke();

    // Station floor panels
    const panelColors = ['#0e0e2e', '#0a0a28', '#121234'];
    for (let px = 0; px < W; px += 80)
        for (let py = 80; py < H; py += 80) {
            ctx.fillStyle = panelColors[Math.floor((px + py) / 80) % 3];
            ctx.fillRect(px, py, 78, 78);
            // Panel edge glow
            ctx.strokeStyle = 'rgba(80,100,220,0.18)'; ctx.lineWidth = 1;
            ctx.strokeRect(px + 1, py + 1, 76, 76);
            // Panel rivets
            ctx.fillStyle = 'rgba(100,120,220,0.25)';
            ctx.beginPath(); ctx.arc(px + 5, py + 5, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(px + 73, py + 5, 2, 0, Math.PI * 2); ctx.fill();
        }

    // Engine vents glow
    [[150, 460], [450, 460], [750, 460]].forEach(([vx, vy]) => {
        const vg = ctx.createLinearGradient(vx, vy, vx, vy - 40);
        vg.addColorStop(0, 'rgba(60,100,255,0.65)'); vg.addColorStop(1, 'rgba(60,100,255,0)');
        ctx.fillStyle = vg; ctx.fillRect(vx, vy - 30, 60, 30);
        ctx.fillStyle = 'rgba(180,200,255,0.4)'; ctx.fillRect(vx + 10, vy - 2, 40, 4);
    });

    // Control panel on right wall
    ctx.fillStyle = 'rgba(20,20,60,0.8)';
    ctx.fillRect(W - 52, 138, 46, 224);
    ctx.strokeStyle = 'rgba(100,120,255,0.6)'; ctx.lineWidth = 2;
    ctx.strokeRect(W - 52, 138, 46, 224);
    // Indicator lights
    const lightColors = ['#ff4444', '#44ff88', '#4488ff', '#ffcc00', '#ff44ff', '#44ffff'];
    for (let li = 0; li < 6; li++) {
        ctx.fillStyle = lightColors[li];
        const la = 0.6 + 0.4 * Math.sin(t * 3 + li * 1.2);
        ctx.globalAlpha = la;
        ctx.beginPath(); ctx.arc(W - 36, 154 + li * 30, 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = la * 0.3;
        ctx.beginPath(); ctx.arc(W - 36, 154 + li * 30, 10, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function spaceWalls() {
    return [
        [0, 0, 14, H], [W - 50, 0, 50, H], [0, 0, W, 80], [0, H - 14, W, 14],
    ];
}

// ── Draw NPCs ─────────────────────────────────────────────────────────────────
function drawNPCs() {
    level.npcs.forEach(npc => {
        const cx = npc.x + 20, cy = npc.y + 20;
        const bob = Math.sin(Date.now() * 0.002 + npc.id) * 3;
        const a = npc.done ? 0.4 : 1;
        ctx.globalAlpha = a;

        if (!npc.done) {
            const col = npc.talking ? npc.color : npc.color + '66';
            const gr = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, npc.talking ? 40 : 28);
            gr.addColorStop(0, npc.color + 'aa'); gr.addColorStop(1, 'transparent');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy + bob, npc.talking ? 40 : 28, 0, Math.PI * 2); ctx.fill();
        }

        drawCharacter(ctx, cx, cy + bob, npc.color, npc.done, npc.word);

        if (!npc.done) {
            ctx.fillStyle = 'rgba(10,8,30,0.75)';
            const tw = ctx.measureText(npc.name).width + 14;
            drawRR(ctx, cx - tw / 2, cy + bob + 22, tw, 18, 5, 'rgba(10,8,30,0.75)');
            ctx.fillStyle = npc.color;
            ctx.font = '10px Outfit,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, cx, cy + bob + 34);
            ctx.textAlign = 'left';
        }

        if (npc.done) {
            ctx.fillStyle = '#50dc78';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✓', cx, cy - 18);
            ctx.textAlign = 'left';
        }

        ctx.globalAlpha = 1;
    });
}

function drawCharacter(ctx, cx, cy, color, faded, word = "") {
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 14, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

    const gr = ctx.createRadialGradient(cx - 4, cy - 4, 0, cx, cy, 18);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, color); gr.addColorStop(1, darken(color, 0.5));
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();

    if (!faded) {
        ctx.fillStyle = '#1a0a30';
        ctx.strokeStyle = '#1a0a30';
        ctx.lineWidth = 1.5;

        // Check emotion to draw face
        const w = word.toLowerCase();
        const isSad = ['triste', 'seul(e)', 'marginalisé(e)', 'exclu(e)', 'découragé(e)', 'vaincu(e)', 'désespéré(e)', 'peur', 'angoissé(e)', 'anxieux/euse', 'désorienté(e)', 'inquiet(e)'].includes(w);
        const isAngry = ['fâché(e)', 'frustré(e)', 'en colère', 'exaspéré(e)', 'indigné(e)'].includes(w);
        const isHappy = ['content(e)', 'fier/fière', 'euphorique', 'triomphant(e)', 'bien', 'serein(e)', 'calme', 'rassuré(e)'].includes(w);

        // Eyes
        if (isHappy) {
            // Happy eyes ^ ^
            ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 3, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx + 5, cy - 2, 3, Math.PI, Math.PI * 2); ctx.stroke();
        } else if (isAngry) {
            // Angry eyes > <
            ctx.beginPath(); ctx.moveTo(cx - 8, cy - 5); ctx.lineTo(cx - 3, cy - 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 8, cy - 5); ctx.lineTo(cx + 3, cy - 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx - 5, cy, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 5, cy, 1.5, 0, Math.PI * 2); ctx.fill();
        } else if (isSad) {
            // Sad eyes / \
            ctx.beginPath(); ctx.moveTo(cx - 7, cy - 2); ctx.lineTo(cx - 3, cy - 4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 7, cy - 2); ctx.lineTo(cx + 3, cy - 4); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(cx - 5, cy, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 5, cy, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
        } else {
            // Default blinky dots
            ctx.beginPath(); ctx.ellipse(cx - 5, cy - 2, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(cx + 5, cy - 2, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();
        }

        // Mouth
        if (isHappy) {
            // Smile
            ctx.beginPath(); ctx.arc(cx, cy + 2, 5, 0.1, Math.PI - 0.1, false); ctx.stroke();
        } else if (isSad) {
            // Frown
            ctx.beginPath(); ctx.arc(cx, cy + 6, 4, Math.PI + 0.1, Math.PI * 2 - 0.1, false); ctx.stroke();
        } else if (isAngry) {
            // Straight line
            ctx.beginPath(); ctx.moveTo(cx - 3, cy + 3); ctx.lineTo(cx + 3, cy + 3); ctx.stroke();
        } else {
            // Neutral slight smile
            ctx.beginPath(); ctx.arc(cx, cy + 2, 4, 0.1, Math.PI - 0.1, false); ctx.stroke();
        }
    }
}

// ── Draw gate ─────────────────────────────────────────────────────────────────
function drawGate() {
    if (gateAlpha <= 0) return;
    const g = level.gate;
    ctx.globalAlpha = gateAlpha;
    const t = Date.now() * 0.002;
    for (let i = 0; i < 4; i++) {
        const ox = Math.sin(t + i) * 6;
        const gr = ctx.createLinearGradient(g.x, g.y, g.x + g.w, g.y + g.h);
        gr.addColorStop(0, 'rgba(80,60,120,0.7)'); gr.addColorStop(1, 'rgba(40,30,80,0.7)');
        drawRR(ctx, g.x + ox, g.y - i * 4, g.w, g.h + i * 8, 8, gr);
    }
    ctx.fillStyle = 'rgba(180,150,220,0.15)';
    ctx.beginPath(); ctx.arc(g.x + g.w / 2, g.y + g.h / 2, g.w * 0.6 + Math.sin(t) * 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
}

// ── Draw player ───────────────────────────────────────────────────────────────
function drawPlayer() {
    const cx = P.x + P.w / 2;
    const cy = P.y + P.h / 2;
    const legSwing = Math.sin(P.stepT * Math.PI * 2) * 6;
    const moving = P.vx !== 0 || P.vy !== 0;

    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(cx, cy + 14, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

    if (moving) {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 8, cy + 8, 7, 10 + legSwing);
        ctx.fillRect(cx + 1, cy + 8, 7, 10 - legSwing);
    } else {
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(cx - 8, cy + 8, 7, 10); ctx.fillRect(cx + 1, cy + 8, 7, 10);
    }

    const bodyGr = ctx.createLinearGradient(cx - 10, cy - 8, cx + 10, cy + 8);
    bodyGr.addColorStop(0, '#d8b4fe'); bodyGr.addColorStop(1, '#7c3aed');
    drawRR(ctx, cx - 11, cy - 6, 22, 18, 5, bodyGr);

    ctx.beginPath(); ctx.arc(cx, cy - 12, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#e9d5ff'; ctx.fill();

    ctx.fillStyle = '#1e0a40';
    if (P.dir === 'down' || P.dir === 'right' || P.dir === 'left') {
        const blink = Math.sin(Date.now() * 0.003) > 0.98 ? 1 : 3;
        ctx.beginPath(); ctx.ellipse(cx - 4, cy - 13, 2, blink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 4, cy - 13, 2, blink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e0a40'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy - 9, 3, 0.1, Math.PI - 0.1, false); ctx.stroke();
    }

    const aGr = ctx.createRadialGradient(cx, cy - 12, 0, cx, cy - 12, 26);
    aGr.addColorStop(0, 'rgba(192,132,252,0.3)'); aGr.addColorStop(1, 'transparent');
    ctx.fillStyle = aGr; ctx.beginPath(); ctx.arc(cx, cy - 12, 26, 0, Math.PI * 2); ctx.fill();
}

function drawInteractPrompts() {
    level.npcs.forEach(npc => {
        if (!npc.talking || npc.done) return;
        const cx = npc.x + 20;
        const cy = npc.y - 30 + Math.sin(Date.now() * 0.004) * 3;
        ctx.fillStyle = 'rgba(10,8,30,0.85)';
        drawRR(ctx, cx - 28, cy - 14, 56, 20, 8, 'rgba(10,8,30,0.85)');
        ctx.fillStyle = '#c084fc'; ctx.font = 'bold 11px Outfit,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('[ E ] Parler', cx, cy); ctx.textAlign = 'left';
    });
}

function spawnParticles(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const s = 40 + Math.random() * 80;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 2 + Math.random() * 3, color, life: 0.6 + Math.random() * 0.4, maxLife: 1, alpha: 1 });
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) { return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }
function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function darken(hex, f) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgb(${~~(r * f)},${~~(g * f)},${~~(b * f)})`; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = ~~(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function drawRR(ctx, x, y, w, h, r, fill) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
