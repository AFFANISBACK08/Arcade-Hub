// ============================================================
//  PRO STRIKER – ULTIMATE EDITION
//  SOUND EDITION · TOUCH CONTROLS ONLY ON SMALL SCREENS
//  Merged: Game logic (halves, AI) + SoundManager + No-scroll How-to
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 900,
    H = 600;
canvas.width = W;
canvas.height = H;

// ─── MOBILE DETECTION ───
const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const isSmallScreen = () => window.innerWidth < 1024; // phones & tablets

// ============================================================
//  SOUND SYSTEM (from Sound Edition)
// ============================================================
const SoundManager = {
    sounds: {},
    musicEnabled: true,
    sfxEnabled: true,
    isMusicPlaying: false,
    currentMusic: null,
    initialized: false,
    crowdPlaying: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;
        const files = {
            menuMusic: 'sounds/Game music.mp3',
            crowd: 'sounds/When game is in play crowd sound.mp3',
            victory: 'sounds/Victory music.mp3',
            defeat: 'sounds/Defeat music.mp3',
            kick: 'sounds/kick sound.mp3',
            goalCheer: 'sounds/Goal scored cheering.mp3',
            goalNet: 'sounds/Goal strike the net sound.mp3',
            whistleStart: 'sounds/Referee whistle game starting.mp3',
            whistleStop: 'sounds/Referee whistle at halftime or end of match.mp3',
            menuClick: 'sounds/Cinematic click sound.mp3',
            confirm: 'sounds/confirm selection sound.mp3',
        };
        for (let [name, path] of Object.entries(files)) {
            try {
                const audio = new Audio(path);
                audio.preload = 'auto';
                if (name === 'menuMusic' || name === 'crowd' || name === 'victory' || name === 'defeat') {
                    audio.loop = true;
                }
                this.sounds[name] = audio;
            } catch (e) { console.warn('Sound load error:', name, e); }
        }
        this.updateMusicForState(currentState);
    },

    playMusic(name) {
        if (!this.musicEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;
        if (this.currentMusic && this.currentMusic !== sound) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }
        if (sound.paused || sound.currentTime === 0) {
            sound.volume = 0.5;
            sound.play().catch(() => {});
            this.currentMusic = sound;
            this.isMusicPlaying = true;
            this.crowdPlaying = (name === 'crowd');
        }
    },

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.isMusicPlaying = false;
        }
        this.crowdPlaying = false;
    },

    playSFX(name, volume = 0.6) {
        if (!this.sfxEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;
        try {
            const clone = sound.cloneNode();
            clone.volume = volume;
            clone.play().catch(() => {});
        } catch (e) {
            if (sound.paused) {
                sound.volume = volume;
                sound.currentTime = 0;
                sound.play().catch(() => {});
            }
        }
    },

    playGoalSounds() {
        this.playSFX('goalCheer', 0.7);
        this.playSFX('goalNet', 0.6);
        this.stopCrowd();
    },

    stopCrowd() {
        if (this.sounds.crowd) {
            this.sounds.crowd.pause();
            this.sounds.crowd.currentTime = 0;
            this.crowdPlaying = false;
        }
    },

    resumeCrowd() {
        if (this.musicEnabled && this.sounds.crowd && !this.crowdPlaying) {
            this.sounds.crowd.volume = 0.5;
            this.sounds.crowd.play().catch(() => {});
            this.crowdPlaying = true;
            this.currentMusic = this.sounds.crowd;
            this.isMusicPlaying = true;
        }
    },

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) this.stopMusic();
        else this.updateMusicForState(currentState);
        return this.musicEnabled;
    },

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    },

    updateMusicForState(state) {
        if (!this.musicEnabled) { this.stopMusic(); return; }
        switch (state) {
            case 'MENU':
            case 'SETTINGS':
            case 'INSTRUCTIONS':
            case 'DIFFICULTY_SELECT':
                this.playMusic('menuMusic');
                break;
            case 'PLAY':
                if (!this.crowdPlaying && currentState !== 'GOAL_SCORED') {
                    this.playMusic('crowd');
                }
                break;
            case 'MATCH_END':
                const isVSComputer = gameMode === 'pve';
                const winner = lastScorer || '';
                if (isVSComputer) {
                    if (winner.includes('RED')) this.playMusic('victory');
                    else this.playMusic('defeat');
                } else {
                    this.playMusic('victory');
                }
                break;
            default:
                this.stopMusic();
        }
    }
};

// ─── INIT SOUND ON USER INTERACTION ───
function initSoundOnInteraction() {
    if (!SoundManager.initialized) SoundManager.init();
    SoundManager.updateMusicForState(currentState);
}
document.addEventListener('click', initSoundOnInteraction);
document.addEventListener('keydown', initSoundOnInteraction);
document.addEventListener('touchstart', initSoundOnInteraction);

// ============================================================
//  GAME STATE (from Sound Edition, extended)
// ============================================================
let currentState = 'MENU';
let gameMode = '1v1';
let difficulty = 'EASY';          // EASY, MEDIUM, HARD
let score = { red: 0, blue: 0 };
let halfDuration = 45;            // seconds per half
let matchClock = halfDuration;
let currentHalf = 1;
let matchState = 'PLAY';          // PLAY, HALFTIME, MATCH_END
let halftimeTimer = 0;
const HALFTIME_BREAK = 3;         // seconds
let kickoffTeam = 'red';
let nextKickoffTeam = null;
let kickoffDelay = 0.5;           // seconds before play starts
let goalBannerTimer = 0;
let lastScorer = '';
let particles = [];
let screenShake = { duration: 0, intensity: 0, x: 0, y: 0 };
let goalZoomScale = 1.0;

// AI difficulty mapping (from first code, but we keep EASY/MEDIUM/HARD)
let aiDifficulty = 'normal';      // used in some places, but we'll use 'difficulty' string

// ─── BALL ───
const ball = {
    x: 450, y: 300, radius: 9,
    vx: 0, vy: 0,
    owner: null,
    speed: 13,
    cooldownPlayer: null,
    cooldownTimer: 0
};

// ─── PLAYERS ───
let players = [];
let arrowAngle = 0;
let gkSpeed = 2.5;
let gkDirection = { red: 1, blue: -1 };
let gkTimer = 0;
let aiTimer = 0;
let aiReactionTimer = 20;
let aiStartDelay = 60;
let aiDribbleTime = 0;
let aiPassCooldown = 0;
let aiState = 'CHASE';
let aiStateTimer = 0;
let aiHoldBallTimer = 0;
let aiTargetOffset = { x: 0, y: 0 };
let aiTargetX = 0, aiTargetY = 0;

let activeLocks = { red: { player: null, timer: 0 }, blue: { player: null, timer: 0 } };

const posts = [
    { x: 25, y: 200, radius: 7 },
    { x: 25, y: 400, radius: 7 },
    { x: 875, y: 200, radius: 7 },
    { x: 875, y: 400, radius: 7 }
];

// ─── KEYS ───
const keys = {
    w: false, a: false, s: false, d: false, space: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, enter: false,
    p: false, Escape: false
};

// ─── MOUSE / SLIDER (for settings) ───
let mouseX = 0, mouseY = 0;
let isDraggingSlider = false;
let sliderBounds = null;

// ─── PARTICLES ───
let menuBgParticles = [];
for (let i = 0; i < 40; i++) {
    menuBgParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.5 + 0.2
    });
}

// ─── PAUSE BUTTON ───
let pauseButton = {
    x: 860, y: 15, width: 30, height: 30,
    hover: false
};

// ============================================================
//  GAME HELPERS (from both versions)
// ============================================================
function createPlayers() {
    players = [
        { team: 'red', x: 50, y: 300, radius: 16, color: '#e74c3c', gradColor: '#c0392b', isGk: true, num: '1', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'red', x: 250, y: 150, radius: 16, color: '#ff5252', gradColor: '#d63031', isGk: false, num: '7', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'red', x: 250, y: 450, radius: 16, color: '#ff5252', gradColor: '#d63031', isGk: false, num: '9', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'red', x: 380, y: 300, radius: 16, color: '#ff5252', gradColor: '#d63031', isGk: false, num: '10', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'blue', x: 850, y: 300, radius: 16, color: '#3498db', gradColor: '#2980b9', isGk: true, num: '1', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'blue', x: 650, y: 150, radius: 16, color: '#48dbfb', gradColor: '#0984e3', isGk: false, num: '8', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'blue', x: 650, y: 450, radius: 16, color: '#48dbfb', gradColor: '#0984e3', isGk: false, num: '11', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 },
        { team: 'blue', x: 520, y: 300, radius: 16, color: '#48dbfb', gradColor: '#0984e3', isGk: false, num: '10', ejecting: false, ejectTargetX: 0, ejectTargetY: 0 }
    ];
}

function initMatch() {
    score = { red: 0, blue: 0 };
    nextKickoffTeam = kickoffTeam;
    matchClock = halfDuration;
    currentHalf = 1;
    matchState = 'PLAY';
    halftimeTimer = 0;
    kickoffDelay = 0.5;
    resetField();
    SoundManager.updateMusicForState('PLAY');
}

function resetField() {
    createPlayers();
    ball.x = 450; ball.y = 300;
    ball.vx = 0; ball.vy = 0;
    ball.cooldownPlayer = null;
    ball.cooldownTimer = 0;
    aiTimer = 0;
    aiDribbleTime = 0;
    aiPassCooldown = 0;
    aiHoldBallTimer = 0;
    aiState = 'CHASE';
    aiStateTimer = 0;
    gkTimer = 0;
    aiStartDelay = 60;
    aiReactionTimer = 20;
    activeLocks.red = { player: null, timer: 0 };
    activeLocks.blue = { player: null, timer: 0 };
    let outfielders = players.filter(p => !p.isGk);
    if (nextKickoffTeam) {
        outfielders = outfielders.filter(p => p.team === nextKickoffTeam);
    }
    ball.owner = outfielders[Math.floor(Math.random() * outfielders.length)];
}

function spawnGoalConfetti(originX, originY) {
    particles = [];
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#e056fd', '#ffffff', '#ff9f43'];
    for (let i = 0; i < 140; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 22 + 4;
        particles.push({
            x: originX, y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.3,
            life: 110
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.rotation += p.vRot;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
}

function getActivePlayer(team) {
    if (ball.owner && ball.owner.team === team) return ball.owner;
    let lock = activeLocks[team];
    if (lock.timer > 0 && lock.player && !lock.player.ejecting) return lock.player;
    let eligible = players.filter(p => p.team === team && !p.isGk && !p.ejecting);
    if (eligible.length === 0) return null;
    let candidates = eligible.map(p => ({ player: p, dist: Math.hypot(p.x - ball.x, p.y - ball.y) }));
    candidates.sort((a, b) => a.dist - b.dist);
    let chosen = candidates[0].player;
    let threshold = 25;
    let equidistant = candidates.filter(c => c.dist - candidates[0].dist <= threshold);
    if (equidistant.length >= 2) {
        let idx = Math.floor(Math.random() * equidistant.length);
        chosen = equidistant[idx].player;
        lock.player = chosen;
        lock.timer = 18;
    } else {
        lock.player = chosen;
        lock.timer = 0;
    }
    return chosen;
}

function shootBall(passer) {
    // Play kick sound (but not for GK steal – handled with flag)
    if (!window._gkStealInProgress) {
        SoundManager.playSFX('kick', 0.8);
    }
    let d = passer.radius + ball.radius + 6;
    ball.x = passer.x + Math.cos(arrowAngle) * d;
    ball.y = passer.y + Math.sin(arrowAngle) * d;
    ball.vx = Math.cos(arrowAngle) * ball.speed;
    ball.vy = Math.sin(arrowAngle) * ball.speed;
    ball.cooldownPlayer = passer;
    ball.cooldownTimer = 20;
    ball.owner = null;
    if (passer.isGk) gkTimer = 0;
    aiReactionTimer = 20;
}

function doAiGkPass(gk) {
    if (Math.random() < 0.50) {
        let teammates = players.filter(p => p.team === gk.team && !p.isGk);
        let target = teammates[Math.floor(Math.random() * teammates.length)];
        if (target) arrowAngle = Math.atan2(target.y - gk.y, target.x - gk.x);
        else arrowAngle = Math.atan2((Math.random() - 0.5), -1);
    } else {
        arrowAngle = Math.atan2((Math.random() - 0.5), -1);
    }
    shootBall(gk);
}

function triggerGoal(scorerText, concedingTeam, originX, originY) {
    SoundManager.playGoalSounds();
    lastScorer = scorerText;
    nextKickoffTeam = concedingTeam;
    goalZoomScale = 2.8;
    screenShake = { duration: 32, intensity: 22, x: 0, y: 0 };
    // Flash effect (optional)
    const flash = document.getElementById('goalFlash');
    if (flash) { flash.classList.remove('active'); void flash.offsetWidth; flash.classList.add('active'); }
    spawnGoalConfetti(originX, originY);
    currentState = 'GOAL_SCORED';
    goalBannerTimer = 0;
}

function getEjectTarget(player, box) {
    let dLeft = Math.abs(player.x - box.minX);
    let dRight = Math.abs(player.x - box.maxX);
    let dTop = Math.abs(player.y - box.minY);
    let dBottom = Math.abs(player.y - box.maxY);
    let min = Math.min(dLeft, dRight, dTop, dBottom);
    let tx = player.x, ty = player.y;
    if (min === dLeft) tx = box.minX - player.radius - 2;
    else if (min === dRight) tx = box.maxX + player.radius + 2;
    else if (min === dTop) ty = box.minY - player.radius - 2;
    else ty = box.maxY + player.radius + 2;
    tx = Math.max(25 + player.radius, Math.min(875 - player.radius, tx));
    ty = Math.max(player.radius, Math.min(H - player.radius, ty));
    return { x: tx, y: ty };
}

function resolveBoxCollision(p, box) {
    let cx = Math.max(box.minX, Math.min(p.x, box.maxX));
    let cy = Math.max(box.minY, Math.min(p.y, box.maxY));
    let dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
    if (d < p.radius) {
        if (d === 0) {
            let dl = Math.abs(p.x - box.minX), dr = Math.abs(p.x - box.maxX);
            let dt = Math.abs(p.y - box.minY), db = Math.abs(p.y - box.maxY);
            let m = Math.min(dl, dr, dt, db);
            if (m === dl) p.x = box.minX - p.radius;
            else if (m === dr) p.x = box.maxX + p.radius;
            else if (m === dt) p.y = box.minY - p.radius;
            else p.y = box.maxY + p.radius;
        } else {
            let o = p.radius - d;
            p.x += (dx / d) * o;
            p.y += (dy / d) * o;
        }
    }
}

// ============================================================
//  AI CONFIG
// ============================================================
function getAIConfig() {
    switch (difficulty) {
        case 'EASY':
            return {
                speedMultiplier: 0.58, shootRange: 360, panicTimer: 120,
                perfectShotRate: 0.35, missError: 0.5, passTriggerDist: 70,
                perfectPassRate: 0.50, passError: 1.2, passCooldown: 140,
                gkHoldTime: 360, reactionDelay: 20, chaseRate: 0.30,
                retreatRate: 0.50, hesitateRate: 0.20, lockThreshold: 25,
                lockTimer: 18, stateSwitchCooldown: 20, movementSmoothness: 0.3
            };
        case 'MEDIUM':
            return {
                speedMultiplier: 0.72, shootRange: 360, panicTimer: 100,
                perfectShotRate: 0.45, missError: 0.5, passTriggerDist: 100,
                perfectPassRate: 0.60, passError: 1.0, passCooldown: 110,
                gkHoldTime: 360, reactionDelay: 12, chaseRate: 0.45,
                retreatRate: 0.35, hesitateRate: 0.20, lockThreshold: 25,
                lockTimer: 18, stateSwitchCooldown: 15, movementSmoothness: 0.4
            };
        case 'HARD':
        default:
            return {
                speedMultiplier: 0.86, shootRange: 360, panicTimer: 80,
                perfectShotRate: 0.55, missError: 0.4, passTriggerDist: 130,
                perfectPassRate: 0.70, passError: 0.8, passCooldown: 80,
                gkHoldTime: 360, reactionDelay: 6, chaseRate: 0.60,
                retreatRate: 0.25, hesitateRate: 0.15, lockThreshold: 25,
                lockTimer: 18, stateSwitchCooldown: 10, movementSmoothness: 0.5
            };
    }
}

// ============================================================
//  UPDATE
// ============================================================
function update(dt) {
    if (currentState === 'PAUSED') return;
    const ai = getAIConfig();
    updateParticles();

    // Screen shake
    if (screenShake.duration > 0) {
        screenShake.duration--;
        let damp = screenShake.duration / 32;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * damp;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * damp;
    } else {
        screenShake.x = 0; screenShake.y = 0;
    }

    if (goalZoomScale > 1.0) {
        goalZoomScale += (1.0 - goalZoomScale) * 0.16;
    }

    if (currentState === 'MATCH_END') return;

    // Halftime
    if (matchState === 'HALFTIME') {
        halftimeTimer -= dt;
        if (halftimeTimer <= 0) {
            SoundManager.playSFX('whistleStart', 0.7);
            currentHalf = 2;
            matchClock = halfDuration;
            matchState = 'PLAY';
            kickoffDelay = 0.5;
            nextKickoffTeam = (kickoffTeam === 'red') ? 'blue' : 'red';
            resetField();
            SoundManager.resumeCrowd();
        }
        return;
    }

    if (currentState === 'GOAL_SCORED') {
        goalBannerTimer += dt * 60;
        if (goalBannerTimer > 110) {
            goalBannerTimer = 0;
            resetField();
            currentState = 'PLAY';
            SoundManager.resumeCrowd();
            SoundManager.playSFX('whistleStart', 0.7);
        }
        return;
    }

    if (currentState !== 'PLAY') return;

    // Kickoff delay
    if (kickoffDelay > 0) {
        if (kickoffDelay < 0.1 && kickoffDelay > 0) {
            SoundManager.playSFX('whistleStart', 0.7);
        }
        kickoffDelay -= dt;
    } else {
        matchClock -= dt;
        if (matchClock <= 0) {
            matchClock = 0;
            if (currentHalf === 1) {
                SoundManager.playSFX('whistleStop', 0.7);
                matchState = 'HALFTIME';
                halftimeTimer = HALFTIME_BREAK;
                return;
            } else {
                SoundManager.playSFX('whistleStop', 0.7);
                const isVSComputer = gameMode === 'pve';
                const winner = (score.red > score.blue) ? 'RED' : (score.blue > score.red) ? 'BLUE' : 'DRAW';
                if (isVSComputer) {
                    if (winner === 'RED') SoundManager.playMusic('victory');
                    else SoundManager.playMusic('defeat');
                } else {
                    SoundManager.playMusic('victory');
                }
                matchState = 'MATCH_END';
                currentState = 'MATCH_END';
                let winnerText = '';
                if (score.red > score.blue) winnerText = 'RED TEAM WINS!';
                else if (score.blue > score.red) winnerText = 'BLUE TEAM WINS!';
                else winnerText = 'DRAW!';
                lastScorer = winnerText;
                return;
            }
        }
    }

    // ─── Core game logic ───
    if (activeLocks.red.timer > 0) activeLocks.red.timer--;
    if (activeLocks.blue.timer > 0) activeLocks.blue.timer--;

    for (let p of players) {
        if (p.ejecting) {
            let dx = p.ejectTargetX - p.x;
            let dy = p.ejectTargetY - p.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 5) {
                p.x = p.ejectTargetX;
                p.y = p.ejectTargetY;
                p.ejecting = false;
            } else {
                let speed = 5 + (dist * 0.05);
                if (speed > 8) speed = 8;
                p.x += (dx / dist) * speed;
                p.y += (dy / dist) * speed;
            }
        }
    }

    if (ball.cooldownTimer > 0) {
        ball.cooldownTimer--;
        if (ball.cooldownTimer <= 0) ball.cooldownPlayer = null;
    }

    if (aiStartDelay > 0) aiStartDelay--;
    if (aiReactionTimer > 0) aiReactionTimer--;
    if (aiPassCooldown > 0) aiPassCooldown--;

    // GK idle movement
    for (let p of players) {
        if (p.isGk && ball.owner !== p) {
            if (p.team === 'red') {
                p.y += gkSpeed * gkDirection.red;
                if (p.y <= 210) { p.y = 210; gkDirection.red = 1; }
                else if (p.y >= 390) { p.y = 390; gkDirection.red = -1; }
                p.x = 50;
            } else {
                p.y += gkSpeed * gkDirection.blue;
                if (p.y <= 210) { p.y = 210; gkDirection.blue = 1; }
                else if (p.y >= 390) { p.y = 390; gkDirection.blue = -1; }
                p.x = 850;
            }
        }
    }

    let activeRed = getActivePlayer('red');
    let activeBlue = getActivePlayer('blue');
    let playerSpeed = 4.5;
    let redGkHasBall = ball.owner && ball.owner.team === 'red' && ball.owner.isGk;
    let blueGkHasBall = ball.owner && ball.owner.team === 'blue' && ball.owner.isGk;

    // Red player (human)
    if (activeRed && !activeRed.ejecting) {
        let nx = activeRed.x, ny = activeRed.y;
        if (keys.w) ny -= playerSpeed;
        if (keys.s) ny += playerSpeed;
        if (keys.a) nx -= playerSpeed;
        if (keys.d) nx += playerSpeed;
        activeRed.x = nx;
        activeRed.y = ny;
        if (activeRed.isGk) {
            activeRed.x = Math.max(25 + activeRed.radius, Math.min(100 - activeRed.radius, activeRed.x));
            activeRed.y = Math.max(150 + activeRed.radius, Math.min(450 - activeRed.radius, activeRed.y));
        } else {
            activeRed.x = Math.max(25 + activeRed.radius, Math.min(875 - activeRed.radius, activeRed.x));
            activeRed.y = Math.max(activeRed.radius, Math.min(H - activeRed.radius, activeRed.y));
            if (blueGkHasBall) resolveBoxCollision(activeRed, { minX: 775, maxX: 875, minY: 150, maxY: 450 });
        }
    }

    // Blue player (human or AI)
    if (activeBlue && !activeBlue.ejecting) {
        let nx = activeBlue.x, ny = activeBlue.y;
        if (gameMode === '1v1') {
            if (keys.ArrowUp) ny -= playerSpeed;
            if (keys.ArrowDown) ny += playerSpeed;
            if (keys.ArrowLeft) nx -= playerSpeed;
            if (keys.ArrowRight) nx += playerSpeed;
        } else {
            // AI
            if (aiReactionTimer <= 0 && aiStartDelay <= 0) {
                let aiSpeed = playerSpeed * ai.speedMultiplier;
                if (ball.owner === activeBlue) {
                    aiHoldBallTimer++;
                    aiDribbleTime += 0.04;
                    let curveY = Math.sin(aiDribbleTime) * 130;
                    let targetY = 300 + curveY;
                    if (activeBlue.x > 160) nx -= aiSpeed;
                    if (activeBlue.y < targetY - 15) ny += aiSpeed;
                    else if (activeBlue.y > targetY + 15) ny -= aiSpeed;
                    arrowAngle = Math.atan2(300 - activeBlue.y, 25 - activeBlue.x);
                    let isCloseToGoal = activeBlue.x < ai.shootRange;
                    if (aiPassCooldown <= 0 && activeBlue.x > 380) {
                        let teammates = players.filter(p => p.team === 'blue' && !p.isGk && p !== activeBlue);
                        let randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];
                        let distToHuman = activeRed ? Math.hypot(activeRed.x - activeBlue.x, activeRed.y - activeBlue.y) : 999;
                        if (randomTeammate && (distToHuman < ai.passTriggerDist || Math.random() < 0.005)) {
                            let passAngle = Math.atan2(randomTeammate.y - activeBlue.y, randomTeammate.x - activeBlue.x);
                            if (Math.random() < (1 - ai.perfectPassRate)) passAngle += (Math.random() - 0.5) * ai.passError;
                            arrowAngle = passAngle;
                            shootBall(activeBlue);
                            aiPassCooldown = ai.passCooldown;
                        }
                    }
                    let forcePanicShot = (isCloseToGoal && aiHoldBallTimer > ai.panicTimer);
                    if ((forcePanicShot || (isCloseToGoal && Math.random() < 0.03)) && ball.owner === activeBlue) {
                        if (Math.random() < (1 - ai.perfectShotRate)) arrowAngle += Math.random() > 0.5 ? ai.missError : -ai.missError;
                        shootBall(activeBlue);
                        aiHoldBallTimer = 0;
                        aiPassCooldown = 60;
                    }
                } else {
                    aiHoldBallTimer = 0;
                    aiStateTimer -= dt * 60;
                    if (aiStateTimer <= 0) {
                        aiStateTimer = Math.floor(Math.random() * 50) + 30;
                        let roll = Math.random();
                        if (activeRed && activeRed.x > 350 && roll < ai.retreatRate) aiState = 'RETREAT';
                        else if (roll < (ai.retreatRate + ai.chaseRate)) {
                            aiState = 'CHASE';
                            aiTargetOffset = { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 };
                        } else aiState = 'HESITATE';
                        if (aiState === 'RETREAT') {
                            aiTargetX = 680 + (Math.random() - 0.5) * 40;
                            aiTargetY = 300 + (Math.random() - 0.5) * 80;
                        } else if (aiState === 'CHASE') {
                            aiTargetX = ball.x + aiTargetOffset.x;
                            aiTargetY = ball.y + aiTargetOffset.y;
                        } else {
                            aiTargetX = activeBlue.x + (Math.random() - 0.5) * 80;
                            aiTargetY = activeBlue.y + (Math.random() - 0.5) * 80;
                        }
                    }
                    let dx = aiTargetX - activeBlue.x;
                    let dy = aiTargetY - activeBlue.y;
                    let distToTarget = Math.hypot(dx, dy);
                    if (distToTarget > 15) {
                        let moveSpeed = aiSpeed * (0.8 + Math.random() * 0.4);
                        if (distToTarget > 100) moveSpeed *= 1.2;
                        nx += (dx / distToTarget) * moveSpeed;
                        ny += (dy / distToTarget) * moveSpeed;
                    }
                }
            }
        }
        activeBlue.x = nx;
        activeBlue.y = ny;
        if (activeBlue.isGk) {
            activeBlue.x = Math.max(800 + activeBlue.radius, Math.min(875 - activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(150 + activeBlue.radius, Math.min(450 - activeBlue.radius, activeBlue.y));
        } else {
            activeBlue.x = Math.max(25 + activeBlue.radius, Math.min(875 - activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(activeBlue.radius, Math.min(H - activeBlue.radius, activeBlue.y));
            if (redGkHasBall) resolveBoxCollision(activeBlue, { minX: 25, maxX: 125, minY: 150, maxY: 450 });
        }
    }

    // ─── BALL PHYSICS ───
    if (ball.owner) {
        ball.x = ball.owner.x;
        ball.y = ball.owner.y;
        if (ball.owner.isGk) {
            gkTimer--;
            let gk = ball.owner;
            let canPass = gkTimer <= 300;
            if (!(gameMode === 'pve' && gk.team === 'blue')) arrowAngle += 0.08;
            if (gkTimer <= 0) {
                if (gameMode === 'pve' && gk.team === 'blue') doAiGkPass(gk);
                else shootBall(gk);
            } else if (canPass) {
                if (gk.team === 'red' && keys.space) { shootBall(gk); keys.space = false; }
                else if (gk.team === 'blue') {
                    if (gameMode === '1v1' && keys.enter) { shootBall(gk); keys.enter = false; }
                    else if (gameMode === 'pve') { aiTimer++; if (aiTimer > 50) { doAiGkPass(gk); aiTimer = 0; } }
                }
            }
        } else {
            if (!(gameMode === 'pve' && ball.owner.team === 'blue')) arrowAngle += 0.08;
            if (ball.owner.team === 'red' && keys.space) { shootBall(ball.owner); keys.space = false; }
            else if (ball.owner.team === 'blue' && gameMode === '1v1' && keys.enter) { shootBall(ball.owner); keys.enter = false; }
        }
    } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.985;
        ball.vy *= 0.985;
        if (Math.hypot(ball.vx, ball.vy) > 6 && Math.random() < 0.4) {
            particles.push({
                x: ball.x, y: ball.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 2,
                color: 'rgba(255,255,255,0.5)',
                rotation: 0, vRot: 0, life: 15
            });
        }
        for (let post of posts) {
            let d = Math.hypot(ball.x - post.x, ball.y - post.y);
            if (d < ball.radius + post.radius) {
                let a = Math.atan2(ball.y - post.y, ball.x - post.x);
                let s = Math.max(4, Math.hypot(ball.vx, ball.vy));
                ball.vx = Math.cos(a) * s;
                ball.vy = Math.sin(a) * s;
                let o = ball.radius + post.radius - d + 1;
                ball.x += Math.cos(a) * o;
                ball.y += Math.sin(a) * o;
                SoundManager.playSFX('kick', 0.3);
            }
        }
        if (ball.y <= ball.radius) { ball.y = ball.radius; ball.vy *= -1; }
        else if (ball.y >= H - ball.radius) { ball.y = H - ball.radius; ball.vy *= -1; }
        if (ball.x - ball.radius <= 25) {
            if (ball.y >= 200 && ball.y <= 400) {
                if (ball.y - ball.radius <= 200) { ball.y = 200 + ball.radius; ball.vy *= -1; }
                else if (ball.y + ball.radius >= 400) { ball.y = 400 - ball.radius; ball.vy *= -1; }
                if (ball.x - ball.radius <= 5) {
                    score.blue++;
                    triggerGoal('BLUE TEAM SCORES!', 'red', 25, ball.y);
                    return;
                }
            } else { ball.x = 25 + ball.radius; ball.vx *= -1; }
        }
        if (ball.x + ball.radius >= 875) {
            if (ball.y >= 200 && ball.y <= 400) {
                if (ball.y - ball.radius <= 200) { ball.y = 200 + ball.radius; ball.vy *= -1; }
                else if (ball.y + ball.radius >= 400) { ball.y = 400 - ball.radius; ball.vy *= -1; }
                if (ball.x + ball.radius >= 895) {
                    score.red++;
                    triggerGoal('RED TEAM SCORES!', 'blue', 875, ball.y);
                    return;
                }
            } else { ball.x = 875 - ball.radius; ball.vx *= -1; }
        }
        for (let p of players) {
            if (p.ejecting || ball.cooldownPlayer === p) continue;
            if (Math.hypot(p.x - ball.x, p.y - ball.y) < p.radius + ball.radius) {
                window._gkStealInProgress = p.isGk && ball.cooldownPlayer && ball.cooldownPlayer.team !== p.team;
                ball.owner = p;
                ball.vx = 0;
                ball.vy = 0;
                if (p.isGk) {
                    gkTimer = 360;
                    if (ball.cooldownPlayer && ball.cooldownPlayer.team !== p.team) {
                        let shooter = ball.cooldownPlayer;
                        let target = null;
                        if (p.team === 'blue' && shooter.x > 775 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, { minX: 775, maxX: 875, minY: 150, maxY: 450 });
                        } else if (p.team === 'red' && shooter.x < 125 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, { minX: 25, maxX: 125, minY: 150, maxY: 450 });
                        }
                        if (target) {
                            shooter.ejecting = true;
                            shooter.ejectTargetX = target.x;
                            shooter.ejectTargetY = target.y;
                        }
                    }
                }
                if (!(gameMode === 'pve' && p.team === 'blue')) arrowAngle = 0;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
                break;
            }
        }
    }

    if (ball.owner && !ball.owner.isGk) {
        let gkClaimed = false;
        let opponentGk = players.find(p => p.isGk && p.team !== ball.owner.team);
        if (opponentGk) {
            let dist = Math.hypot(ball.owner.x - opponentGk.x, ball.owner.y - opponentGk.y);
            if (dist < ball.owner.radius + opponentGk.radius + 2) {
                window._gkStealInProgress = true;
                let offender = ball.owner;
                ball.owner = opponentGk;
                gkTimer = 360;
                let target = null;
                if (opponentGk.team === 'blue') {
                    target = getEjectTarget(offender, { minX: 775, maxX: 875, minY: 150, maxY: 450 });
                } else {
                    target = getEjectTarget(offender, { minX: 25, maxX: 125, minY: 150, maxY: 450 });
                }
                offender.ejecting = true;
                offender.ejectTargetX = target.x;
                offender.ejectTargetY = target.y;
                gkClaimed = true;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
            }
        }
        if (!gkClaimed) {
            let defender = ball.owner.team === 'red' ? activeBlue : activeRed;
            if (defender && !defender.ejecting) {
                let dist = Math.hypot(ball.owner.x - defender.x, ball.owner.y - defender.y);
                if (dist < ball.owner.radius + defender.radius + 2) {
                    let tackler = ball.owner;
                    ball.owner = null;
                    let a = Math.atan2(defender.y - ball.y, defender.x - ball.x) + Math.PI;
                    ball.vx = Math.cos(a) * 9;
                    ball.vy = Math.sin(a) * 9;
                    ball.cooldownPlayer = tackler;
                    ball.cooldownTimer = 15;
                    aiReactionTimer = 20;
                    SoundManager.playSFX('kick', 0.6);
                }
            }
        }
    }
}

// ============================================================
//  DRAW FUNCTIONS
// ============================================================

function drawPitch() {
    let sw = (875 - 25) / 10;
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(25 + i * sw, 0, sw, H);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(25, 0, 850, H);
    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeRect(25, 150, 100, 300);
    ctx.strokeRect(775, 150, 100, 300);
    ctx.beginPath();
    ctx.arc(95, 300, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(805, 300, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    for (let y = 200; y <= 400; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(25, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(875, y);
        ctx.lineTo(900, y);
        ctx.stroke();
    }
}

function drawActiveIndicator(p, labelText, colorHex) {
    let time = Date.now() * 0.007;
    let pulseRadius = p.radius + 7 + Math.sin(time) * 3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 10;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = colorHex;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(p.x - 7, p.y - p.radius - 20);
    ctx.lineTo(p.x + 7, p.y - p.radius - 20);
    ctx.lineTo(p.x, p.y - p.radius - 10);
    ctx.closePath();
    ctx.fill();
    ctx.font = '900 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, p.x, p.y - p.radius - 24);
    ctx.restore();
}

function drawScoreboard() {
    ctx.fillStyle = 'rgba(15,20,25,0.75)';
    ctx.beginPath();
    ctx.roundRect(300, 15, 300, 50, 25);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ff5252';
    ctx.font = '900 28px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(score.red, 410, 51);
    ctx.font = '800 14px Outfit, sans-serif';
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('RED', 365, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', 450, 48);
    ctx.font = '800 14px Outfit, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'left';
    ctx.fillText(gameMode === 'pve' ? 'COM' : 'BLUE', 505, 48);
    ctx.fillStyle = '#48dbfb';
    ctx.font = '900 28px Outfit, sans-serif';
    ctx.fillText(score.blue, 475, 51);

    if (gameMode === 'pve') {
        ctx.fillStyle = 'rgba(15,20,25,0.85)';
        ctx.beginPath();
        ctx.roundRect(15, 15, 80, 28, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        let diffColor = difficulty === 'EASY' ? '#2ecc71' : (difficulty === 'MEDIUM' ? '#f1c40f' : '#e74c3c');
        ctx.fillStyle = diffColor;
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(difficulty, 55, 35);
    }

    ctx.fillStyle = 'rgba(15,20,25,0.85)';
    ctx.beginPath();
    ctx.roundRect(400, 68, 100, 32, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    let minutes = Math.floor(matchClock / 60);
    let seconds = Math.floor(matchClock % 60);
    let timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    ctx.fillStyle = matchClock <= 5 ? '#ff5252' : '#f1c40f';
    ctx.font = '800 20px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, 450, 94);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 10px Outfit, sans-serif';
    ctx.fillText(currentHalf === 1 ? '1ST HALF' : '2ND HALF', 450, 78);
}

function drawGkTimerUI() {
    if (gkTimer > 0 && ball.owner && ball.owner.isGk) {
        let seconds = Math.ceil(gkTimer / 60);
        ctx.fillStyle = 'rgba(15,20,25,0.85)';
        ctx.beginPath();
        ctx.roundRect(W - 80, 15, 65, 50, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = seconds <= 2 ? '#ff5252' : '#f1c40f';
        ctx.font = '900 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(seconds + 's', W - 47, 43);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText('GK TIME', W - 47, 25);
    }
}

function drawMenuBackground() {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, W, H);
    let time = Date.now() * 0.0012;
    let rad1X = 250 + Math.sin(time) * 60;
    let rad1Y = 200 + Math.cos(time * 0.8) * 40;
    let grad1 = ctx.createRadialGradient(rad1X, rad1Y, 10, rad1X, rad1Y, 340);
    grad1.addColorStop(0, 'rgba(231,76,60,0.35)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, W, H);
    let rad2X = 650 + Math.cos(time * 0.9) * 60;
    let rad2Y = 400 + Math.sin(time) * 40;
    let grad2 = ctx.createRadialGradient(rad2X, rad2Y, 10, rad2X, rad2Y, 340);
    grad2.addColorStop(0, 'rgba(52,152,219,0.35)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, W, H);
    for (let p of menuBgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ─── DRAW MENU ───
function drawMenu() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px Outfit, sans-serif';
    ctx.fillText('PRO STRIKER', 450, 150);
    ctx.restore();

    const options = [
        { key: '[ 1 ]', label: '1 VS 1 MATCH', y: 280, color: '#2ecc71' },
        { key: '[ 2 ]', label: 'VS COMPUTER', y: 350, color: '#00d2d3' },
        { key: '[ 3 ]', label: 'INSTRUCTIONS', y: 420, color: '#ff9f43' },
        { key: '[ 4 ]', label: 'SETTINGS', y: 490, color: '#ee5253' }
    ];
    for (let opt of options) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(280, opt.y - 32, 340, 50, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '900 18px Outfit, sans-serif';
        ctx.fillStyle = opt.color;
        ctx.shadowColor = opt.color;
        ctx.shadowBlur = 10;
        ctx.textAlign = 'left';
        ctx.fillText(opt.key, 305, opt.y + 1);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(opt.label, 375, opt.y + 1);
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🎵${SoundManager.musicEnabled ? 'ON' : 'OFF'}  🔊${SoundManager.sfxEnabled ? 'ON' : 'OFF'}   [M:SFX] [N:Music]`, 870, 580);
    ctx.restore();
}

// ─── DRAW DIFFICULTY SELECT ───
function drawDifficultySelect() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('SELECT DIFFICULTY', 450, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('Choose your challenge level', 450, 190);

    const diffs = [
        { label: 'EASY', value: 'EASY', x: 255, y: 290, color: '#2ecc71', desc: 'Casual Play' },
        { label: 'MEDIUM', value: 'MEDIUM', x: 445, y: 290, color: '#f1c40f', desc: 'Balanced Challenge' },
        { label: 'HARD', value: 'HARD', x: 635, y: 290, color: '#e74c3c', desc: 'Expert Challenge' }
    ];
    const positions = [180, 370, 560];
    diffs.forEach((d, idx) => {
        const x = positions[idx];
        ctx.fillStyle = difficulty === d.value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(x, 250, 150, 90, 16);
        ctx.fill();
        ctx.strokeStyle = difficulty === d.value ? d.color : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = difficulty === d.value ? 3 : 1.5;
        ctx.stroke();
        ctx.fillStyle = d.color;
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.shadowColor = difficulty === d.value ? d.color : 'transparent';
        ctx.shadowBlur = difficulty === d.value ? 20 : 0;
        ctx.fillText(d.label, x + 75, d.y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '600 12px Outfit, sans-serif';
        ctx.fillText(d.desc, x + 75, d.y + 28);
    });

    ctx.fillStyle = 'rgba(155,89,182,0.2)';
    ctx.beginPath();
    ctx.roundRect(350, 400, 200, 45, 12);
    ctx.fill();
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9b59b6';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText('← BACK', 450, 430);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Press [E] [M] [H] or tap to select', 450, 480);
    ctx.restore();
}

// ─── INSTRUCTIONS (from first code – no scroll, card layout) ───
function drawInstructions() {
    ctx.fillStyle = '#0a0f14';
    ctx.fillRect(0, 0, W, H);

    // Animated background glow
    let time = Date.now() / 1000;
    let bgGrad = ctx.createRadialGradient(
        450 + Math.sin(time * 0.3) * 100,
        300 + Math.cos(time * 0.2) * 80,
        50,
        450, 300, 500
    );
    bgGrad.addColorStop(0, 'rgba(241,196,15,0.06)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Floating particles (reuse menuBgParticles for consistency)
    for (let p of menuBgParticles) {
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.5;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Title
    ctx.textAlign = 'center';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 20;
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('📖 HOW TO PLAY', 450, 70);
    ctx.shadowBlur = 0;

    // Subtitle – show total match time = halfDuration * 2
    const totalMatchTime = halfDuration * 2;
    ctx.font = '500 15px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`⚡ ${totalMatchTime}s MATCH (two ${halfDuration}s halves) · MOST GOALS WINS · TIE = DRAW`, 450, 102);

    // ─── MAIN CARD ───
    const cardX = 50, cardY = 120, cardW = 800, cardH = 400;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.clip();

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.stroke();

    let yPos = cardY + 28;

    // ─── SECTION 1: CONTROLS ───
    ctx.textAlign = 'left';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 6;
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('🎮 Controls', cardX + 35, yPos);
    ctx.shadowBlur = 0;
    yPos += 30;

    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('🔴 RED TEAM', cardX + 55, yPos);
    ctx.font = '500 13px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(isMobileDevice ? 'Joystick (bottom-left)  ·  Shoot button ⚽' : 'W A S D  ·  SPACE to shoot', cardX + 175, yPos);
    yPos += 26;

    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillStyle = '#6bc5ff';
    ctx.fillText('🔵 BLUE TEAM', cardX + 55, yPos);
    ctx.font = '500 13px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(isMobileDevice ? 'Joystick (top-right)  ·  Shoot button ⚽' : '↑ ← ↓ →  ·  ENTER to shoot', cardX + 180, yPos);
    yPos += 34;

    // ─── SECTION 2: GAME RULES ───
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 6;
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('⚡ Game Rules', cardX + 35, yPos);
    ctx.shadowBlur = 0;
    yPos += 30;

    const rules = [
        { icon: '🎯', label: 'AIMING', detail: 'Yellow arrow shows direction' },
        { icon: '⚡', label: 'POSSESSION', detail: 'Closest player gets the ball' },
        { icon: '🏆', label: 'MATCH END', detail: 'Most goals when both halves end' },
    ];
    rules.forEach((r) => {
        ctx.font = '600 14px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(r.icon + ' ' + r.label, cardX + 55, yPos);
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(r.detail, cardX + 185, yPos);
        yPos += 26;
    });
    yPos += 8;

    // ─── SECTION 3: GK & AI ───
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 6;
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('🧤 GK & AI', cardX + 35, yPos);
    ctx.shadowBlur = 0;
    yPos += 30;

    const gkItems = [
        { icon: '🧤', label: 'GK PROTECTION', detail: 'No tackling inside the box' },
        { icon: '⏱️', label: 'GK TIMER', detail: '6 seconds to pass or auto‑kick' },
        { icon: '🤖', label: 'VS COM', detail: `Difficulty: ${difficulty}  ·  Adapts to your skill` },
    ];
    gkItems.forEach((g) => {
        ctx.font = '600 14px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(g.icon + ' ' + g.label, cardX + 55, yPos);
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(g.detail, cardX + 195, yPos);
        yPos += 26;
    });

    ctx.restore();

    // ─── BACK HINT ───
    ctx.textAlign = 'center';
    ctx.font = '500 14px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('Tap anywhere or press [ ESC ] to return', 450, 540);
}

// ─── SETTINGS ───
function drawSettings() {
    drawMenuBackground();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText('SETTINGS', 450, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(200, 120, 500, 380, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Half Duration
    ctx.font = '800 22px Outfit, sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Half Duration: ${halfDuration} seconds`, 450, 180);
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Use [ UP ] and [ DOWN ] Arrow Keys or Tap to modify', 450, 215);
    ctx.fillStyle = '#95a5a6';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Range: 15 -- 120 seconds (5s steps)', 450, 240);

    // Sound Controls
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 290);

    // Music toggle
    const musicBtn = { x: 350, y: 305, w: 200, h: 40 };
    ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
    ctx.beginPath();
    ctx.roundRect(musicBtn.x, musicBtn.y, musicBtn.w, musicBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillText(`🎵 Music: ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 450, 335);

    // SFX toggle
    const sfxBtn = { x: 350, y: 360, w: 200, h: 40 };
    ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
    ctx.beginPath();
    ctx.roundRect(sfxBtn.x, sfxBtn.y, sfxBtn.w, sfxBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 18px Outfit, sans-serif';
    ctx.fillText(`🔊 SFX: ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 450, 390);

    ctx.fillStyle = '#95a5a6';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Press [M] to toggle SFX, [N] to toggle Music', 450, 440);

    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('Press [ ESC ] or [ BACKSPACE ] to return to menu', 450, 520);
    ctx.restore();
}

// ─── PAUSE MENU ───
function drawPauseMenu() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15,23,42,0.95)';
    ctx.beginPath();
    ctx.roundRect(250, 150, 400, 320, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.font = '900 40px Outfit, sans-serif';
    ctx.shadowColor = '#f39c12';
    ctx.shadowBlur = 20;
    ctx.fillText('⏸ PAUSED', 450, 210);
    ctx.shadowBlur = 0;

    // Resume button
    ctx.fillStyle = 'rgba(46,204,113,0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 235, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2ecc71';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('▶ RESUME', 450, 270);

    // Main Menu button
    ctx.fillStyle = 'rgba(231,76,60,0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 295, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('🏠 MAIN MENU', 450, 330);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 14px Outfit, sans-serif';
    ctx.fillText('SOUND CONTROLS', 450, 370);

    const musicBtn = { x: 330, y: 385, w: 110, h: 35 };
    const sfxBtn = { x: 460, y: 385, w: 110, h: 35 };
    ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
    ctx.beginPath();
    ctx.roundRect(musicBtn.x, musicBtn.y, musicBtn.w, musicBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText(`🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 385, 410);

    ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
    ctx.beginPath();
    ctx.roundRect(sfxBtn.x, sfxBtn.y, sfxBtn.w, sfxBtn.h, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText(`🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 515, 410);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '500 10px Outfit, sans-serif';
    ctx.fillText('Music', 385, 427);
    ctx.fillText('SFX', 515, 427);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '600 13px Outfit, sans-serif';
    ctx.fillText('Press [ ESC ] or [ P ] to resume', 450, 445);
    ctx.restore();
}

// ─── MAIN DRAW ───
function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    if (currentState === 'MENU') { drawMenu(); ctx.restore(); return; }
    if (currentState === 'DIFFICULTY_SELECT') { drawDifficultySelect(); ctx.restore(); return; }
    if (currentState === 'INSTRUCTIONS') { drawInstructions(); ctx.restore(); return; }
    if (currentState === 'SETTINGS') { drawSettings(); ctx.restore(); return; }

    if (currentState === 'PAUSED' || currentState === 'PLAY' || currentState === 'GOAL_SCORED' || currentState === 'MATCH_END') {
        drawPitch();
        // Draw shadows
        for (let p of players) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Active indicators
        let activeRed = getActivePlayer('red');
        let activeBlue = getActivePlayer('blue');
        if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'P1', '#f39c12');
        if (activeBlue && !activeBlue.ejecting) {
            drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');
        }
        // Players
        for (let p of players) {
            let grad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
            grad.addColorStop(0, p.color);
            grad.addColorStop(1, p.gradColor);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.lineWidth = p.isGk ? 3 : 2;
            ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff';
            ctx.stroke();
            drawStar(p.x, p.y, 5, 8, 3.5);
        }
        // Posts
        for (let post of posts) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            let pg = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
            pg.addColorStop(0, '#ffffff');
            pg.addColorStop(1, '#bdc3c7');
            ctx.beginPath();
            ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
            ctx.fillStyle = pg;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();
        }
        // Ball
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#1e272e';
        ctx.stroke();
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Arrow
        if (ball.owner) {
            ctx.save();
            let sx = ball.owner.x + Math.cos(arrowAngle) * 22;
            let sy = ball.owner.y + Math.sin(arrowAngle) * 22;
            let ex = ball.owner.x + Math.cos(arrowAngle) * 65;
            let ey = ball.owner.y + Math.sin(arrowAngle) * 65;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#f1c40f';
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 8;
            ctx.stroke();
            let ta1 = arrowAngle + Math.PI * 0.85;
            let ta2 = arrowAngle - Math.PI * 0.85;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex + Math.cos(ta1) * 11, ey + Math.sin(ta1) * 11);
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex + Math.cos(ta2) * 11, ey + Math.sin(ta2) * 11);
            ctx.stroke();
            ctx.restore();
        }

        // Particles
        for (let p of particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        drawScoreboard();
        drawGkTimerUI();

        if (currentState === 'PLAY' || currentState === 'PAUSED') {
            drawPauseButton();
        }

        // Overlay messages
        if (matchState === 'HALFTIME') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.85)';
            ctx.fillRect(0, 250, 900, 100);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 48px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            ctx.fillText('HALF TIME', 450, 310);
            ctx.restore();
        }
        if (kickoffDelay > 0 && currentState === 'PLAY' && matchState === 'PLAY') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.7)';
            ctx.fillRect(0, 250, 900, 60);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '800 36px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('KICKOFF', 450, 295);
            ctx.restore();
        }
        if (currentState === 'GOAL_SCORED') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 210, 900, 180);
            ctx.translate(450, 280);
            ctx.scale(goalZoomScale, goalZoomScale);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 68px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 25;
            ctx.fillText('GOAL!', 0, 0);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 22px Outfit, sans-serif';
            ctx.fillText(lastScorer, 0, 48);
            ctx.restore();
        }
        if (currentState === 'MATCH_END') {
            ctx.save();
            ctx.fillStyle = 'rgba(15,23,42,0.88)';
            ctx.fillRect(0, 200, 900, 200);
            ctx.fillStyle = '#f1c40f';
            ctx.font = '900 56px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 20;
            ctx.fillText(lastScorer, 450, 270);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 26px Outfit, sans-serif';
            ctx.fillText(`RED ${score.red} - ${score.blue} BLUE`, 450, 330);
            ctx.fillStyle = '#95a5a6';
            ctx.font = '600 18px Outfit, sans-serif';
            ctx.fillText('Press any key or tap to continue', 450, 380);
            ctx.restore();
        }
        if (currentState === 'PAUSED') {
            drawPauseMenu();
        }
    }

    ctx.restore();
}

// ============================================================
//  INPUT HANDLING (Keyboard, Mouse, Touch)
// ============================================================

// ─── KEYBOARD ───
window.addEventListener('keydown', function(e) {
    initSoundOnInteraction();
    let k = e.key.toLowerCase();
    if ([' ', 'enter', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'escape', 'p'].includes(k)) e.preventDefault();

    if (e.code === 'Space' || e.key === ' ') keys.space = true;
    if (e.key === 'Enter') keys.enter = true;
    if (e.key === 'Escape') keys.Escape = true;
    if (k === 'p') keys.p = true;
    if (keys.hasOwnProperty(k) && k !== ' ' && k !== 'p') keys[k] = true;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;

    // Sound shortcuts
    if (k === 'm') {
        SoundManager.toggleSFX();
        SoundManager.playSFX('menuClick', 0.3);
        updateTouchUI();
    }
    if (k === 'n') {
        SoundManager.toggleMusic();
        SoundManager.playSFX('menuClick', 0.3);
        updateTouchUI();
    }

    // Pause
    if (k === 'p' && currentState === 'PLAY') togglePause();
    if (e.key === 'Escape' && currentState === 'PAUSED') togglePause();

    // Menu navigation
    if (currentState === 'MENU') {
        if (e.key === '1') { SoundManager.playSFX('menuClick'); selectMode('1v1'); }
        if (e.key === '2') { SoundManager.playSFX('menuClick'); currentState = 'DIFFICULTY_SELECT'; }
        if (e.key === '3') { SoundManager.playSFX('menuClick'); currentState = 'INSTRUCTIONS'; }
        if (e.key === '4') { SoundManager.playSFX('menuClick'); currentState = 'SETTINGS'; }
    } else if (currentState === 'DIFFICULTY_SELECT') {
        if (e.key === 'e' || e.key === 'E') { SoundManager.playSFX('confirm'); difficulty = 'EASY'; selectMode('pve'); }
        if (e.key === 'm' || e.key === 'M') { SoundManager.playSFX('confirm'); difficulty = 'MEDIUM'; selectMode('pve'); }
        if (e.key === 'h' || e.key === 'H') { SoundManager.playSFX('confirm'); difficulty = 'HARD'; selectMode('pve'); }
        if (e.key === 'Escape' || e.key === 'Backspace') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS') {
        if (e.key === 'Escape' || e.key === 'Backspace') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    } else if (currentState === 'MATCH_END') {
        if (e.key === 'Enter' || e.key === ' ') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    }

    // Settings: duration change with up/down
    if (currentState === 'SETTINGS') {
        if (e.key === 'ArrowUp') halfDuration = Math.min(120, halfDuration + 5);
        if (e.key === 'ArrowDown') halfDuration = Math.max(15, halfDuration - 5);
    }
    updateTouchUI();
});

window.addEventListener('keyup', function(e) {
    let k = e.key.toLowerCase();
    if (e.code === 'Space' || e.key === ' ') keys.space = false;
    if (e.key === 'Enter') keys.enter = false;
    if (e.key === 'Escape') keys.Escape = false;
    if (k === 'p') keys.p = false;
    if (keys.hasOwnProperty(k) && k !== ' ' && k !== 'p') keys[k] = false;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// ─── TOUCH / MOUSE ───
function getCanvasTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (touch.clientX - rect.left) * sx, y: (touch.clientY - rect.top) * sy };
}

canvas.addEventListener('pointerdown', function(e) {
    initSoundOnInteraction();
    const pos = getCanvasTouchPos(e);

    // Pause button
    if (currentState === 'PLAY' && pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45) {
        SoundManager.playSFX('menuClick');
        togglePause();
        return;
    }

    if (currentState === 'MENU') {
        if (pos.x >= 280 && pos.x <= 620 && pos.y >= 248 && pos.y <= 298) {
            SoundManager.playSFX('menuClick');
            selectMode('1v1');
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 318 && pos.y <= 368) {
            SoundManager.playSFX('menuClick');
            currentState = 'DIFFICULTY_SELECT';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 388 && pos.y <= 438) {
            SoundManager.playSFX('menuClick');
            currentState = 'INSTRUCTIONS';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 458 && pos.y <= 508) {
            SoundManager.playSFX('menuClick');
            currentState = 'SETTINGS';
        }
    } else if (currentState === 'DIFFICULTY_SELECT') {
        const diffs = [
            { x: 180, w: 150, value: 'EASY' },
            { x: 370, w: 150, value: 'MEDIUM' },
            { x: 560, w: 150, value: 'HARD' }
        ];
        for (let d of diffs) {
            if (pos.x >= d.x && pos.x <= d.x + d.w && pos.y >= 250 && pos.y <= 340) {
                SoundManager.playSFX('confirm');
                difficulty = d.value;
                selectMode('pve');
                return;
            }
        }
        if (pos.x >= 350 && pos.x <= 550 && pos.y >= 400 && pos.y <= 445) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'INSTRUCTIONS') {
        SoundManager.playSFX('menuClick');
        currentState = 'MENU';
    } else if (currentState === 'SETTINGS') {
        const musicBtn = { x: 350, y: 305, w: 200, h: 40 };
        const sfxBtn = { x: 350, y: 360, w: 200, h: 40 };
        if (pos.x >= musicBtn.x && pos.x <= musicBtn.x + musicBtn.w &&
            pos.y >= musicBtn.y && pos.y <= musicBtn.y + musicBtn.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        if (pos.x >= sfxBtn.x && pos.x <= sfxBtn.x + sfxBtn.w &&
            pos.y >= sfxBtn.y && pos.y <= sfxBtn.y + sfxBtn.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        SoundManager.playSFX('menuClick');
        currentState = 'MENU';
    } else if (currentState === 'PAUSED') {
        const resumeBtn = { x: 350, y: 235, w: 200, h: 50 };
        const menuBtn = { x: 350, y: 295, w: 200, h: 50 };
        const musicBtn = { x: 330, y: 385, w: 110, h: 35 };
        const sfxBtn = { x: 460, y: 385, w: 110, h: 35 };
        if (pos.x >= resumeBtn.x && pos.x <= resumeBtn.x + resumeBtn.w &&
            pos.y >= resumeBtn.y && pos.y <= resumeBtn.y + resumeBtn.h) {
            SoundManager.playSFX('menuClick');
            togglePause();
        } else if (pos.x >= menuBtn.x && pos.x <= menuBtn.x + menuBtn.w &&
                   pos.y >= menuBtn.y && pos.y <= menuBtn.y + menuBtn.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            updateTouchUI();
        } else if (pos.x >= musicBtn.x && pos.x <= musicBtn.x + musicBtn.w &&
                   pos.y >= musicBtn.y && pos.y <= musicBtn.y + musicBtn.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
        } else if (pos.x >= sfxBtn.x && pos.x <= sfxBtn.x + sfxBtn.w &&
                   pos.y >= sfxBtn.y && pos.y <= sfxBtn.y + sfxBtn.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
        }
    } else if (currentState === 'MATCH_END') {
        SoundManager.playSFX('menuClick');
        currentState = 'MENU';
    }
    updateTouchUI();
});

canvas.addEventListener('pointermove', function(e) {
    const pos = getCanvasTouchPos(e);
    pauseButton.hover = (pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45);
});

// ─── TOUCH JOYSTICKS ───
function setupJoystick(baseElem, updateKeys) {
    let touchId = null, baseRect = null;
    const stickElem = baseElem.querySelector('.joystick-stick');
    baseElem.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        baseRect = baseElem.getBoundingClientRect();
        handleMove(touch);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                handleMove(e.changedTouches[i]);
                break;
            }
        }
    }, { passive: false });
    const resetJoystick = (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchId) {
                touchId = null;
                stickElem.style.transform = 'translate(0px, 0px)';
                updateKeys(false, false, false, false);
                break;
            }
        }
    };
    window.addEventListener('touchend', resetJoystick);
    window.addEventListener('touchcancel', resetJoystick);

    function handleMove(touch) {
        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        let dist = Math.hypot(dx, dy);
        const maxDist = 35;
        if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
        stickElem.style.transform = `translate(${dx}px, ${dy}px)`;
        const threshold = 10;
        updateKeys(dy < -threshold, dy > threshold, dx < -threshold, dx > threshold);
    }
}

setupJoystick(document.getElementById('p1Joystick'), (up, down, left, right) => {
    keys.w = up; keys.s = down; keys.a = left; keys.d = right;
});
setupJoystick(document.getElementById('p2Joystick'), (up, down, left, right) => {
    keys.ArrowUp = up; keys.ArrowDown = down; keys.ArrowLeft = left; keys.ArrowRight = right;
});

function bindShootButton(btnElem, keyName) {
    const press = (e) => { e.preventDefault(); initSoundOnInteraction(); keys[keyName] = true; };
    const release = (e) => { e.preventDefault(); keys[keyName] = false; };
    btnElem.addEventListener('touchstart', press, { passive: false });
    btnElem.addEventListener('touchend', release);
    btnElem.addEventListener('touchcancel', release);
    btnElem.addEventListener('mousedown', press);
    btnElem.addEventListener('mouseup', release);
}
bindShootButton(document.getElementById('p1Shoot'), 'space');
bindShootButton(document.getElementById('p2Shoot'), 'enter');

function togglePause() {
    if (currentState === 'PLAY') { currentState = 'PAUSED'; SoundManager.playSFX('menuClick'); }
    else if (currentState === 'PAUSED') { currentState = 'PLAY'; SoundManager.playSFX('menuClick'); }
    updateTouchUI();
}

function selectMode(mode) {
    gameMode = mode;
    kickoffTeam = 'red';
    nextKickoffTeam = 'red';
    initMatch();
    currentState = 'PLAY';
    updateTouchUI();
    SoundManager.updateMusicForState('PLAY');
}

// ─── UPDATE TOUCH UI (with screen‑size check) ───
function updateTouchUI() {
    const tc = document.getElementById('touchControls');
    if (currentState === 'PLAY' && isMobileDevice && isSmallScreen()) {
        tc.style.display = 'block';
        tc.className = 'touch-controls is-active mode-' + gameMode;
    } else {
        tc.style.display = 'none';
    }
    SoundManager.updateMusicForState(currentState);
}

// Also update on resize
window.addEventListener('resize', updateTouchUI);

// ─── POLYFILL for roundRect ───
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

// ─── GAME LOOP ───
let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// ─── START ───
initMatch();
currentState = 'MENU';
updateTouchUI();
gameLoop(performance.now());

console.log('🎵 SOUND SYSTEM READY!');
console.log('🎮 Controls: [M] SFX toggle, [N] Music toggle, [P] Pause');
console.log('📁 Sound files loaded from /sounds/ folder');
