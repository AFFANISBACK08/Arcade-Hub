// ============================================================
// PRO STRIKER — ENHANCED EDITION
// Safe unified build
//
// Foundation:
//   • Smart Decisive AI engine
//   • Premium Ultimate Edition gameplay/UI ideas retained where compatible
//
// Stability rules:
//   • One canvas engine
//   • One game state
//   • One input system
//   • One update/render loop
//   • One sound manager
//
// IMPORTANT:
// Replace the old JavaScript with this entire file.
// Do NOT paste the Ultimate Edition underneath it.
// ============================================================
 
// ─── PRO STRIKER - Smart Decisive AI Edition ───
 
// ─── CANVAS SETUP ───
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const touchControlsElem = document.getElementById('touchControls');
const gameWrapperElem = document.getElementById('gameWrapper');
const goalFlashElem = document.getElementById('goalFlash');
 
// ─── MOBILE DETECTION ───
const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
 
// ─── SOUND SYSTEM ───
 
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
                console.log(`✅ Loaded: ${name} from ${path}`);
            } catch (e) {
                console.warn(`⚠️ Could not load ${name}:`, e);
            }
        }
 
        // Set initial volumes
        if (this.sounds.menuMusic) {
            this.sounds.menuMusic.volume = 0.7; // Increased from 0.5
        }
        if (this.sounds.crowd) {
            this.sounds.crowd.volume = 0.35; // Reduced from 0.5
        }
        if (this.sounds.victory) {
            this.sounds.victory.volume = 0.7;
        }
        if (this.sounds.defeat) {
            this.sounds.defeat.volume = 0.7;
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
            // Set appropriate volume based on sound type
            if (name === 'crowd') {
                sound.volume = 0.35;
            } else if (name === 'menuMusic' || name === 'victory' || name === 'defeat') {
                sound.volume = 0.7;
            }
            sound.play().catch(e => console.warn('Music play blocked:', e));
            this.currentMusic = sound;
            this.isMusicPlaying = true;
            if (name === 'crowd') {
                this.crowdPlaying = true;
            } else {
                this.crowdPlaying = false;
            }
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
            clone.play().catch(e => console.warn('SFX play blocked:', e));
        } catch (e) {
            if (sound.paused) {
                sound.volume = volume;
                sound.currentTime = 0;
                sound.play().catch(e => {});
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
            this.sounds.crowd.volume = 0.35;
            this.sounds.crowd.play().catch(e => console.warn('Crowd resume blocked:', e));
            this.crowdPlaying = true;
            this.currentMusic = this.sounds.crowd;
            this.isMusicPlaying = true;
        }
    },
 
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.updateMusicForState(currentState);
        }
        return this.musicEnabled;
    },
 
    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    },
 
    updateMusicForState(state) {
        if (!this.musicEnabled) {
            this.stopMusic();
            return;
        }
 
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
            case 'GOAL_SCORED':
                break;
            case 'MATCH_END':
                const isVSComputer = gameMode === 'pve';
                const winner = lastScorer || '';
                if (isVSComputer) {
                    if (winner.includes('RED')) {
                        this.playMusic('victory');
                    } else {
                        this.playMusic('defeat');
                    }
                } else {
                    this.playMusic('victory');
                }
                break;
            default:
                this.stopMusic();
        }
    }
};
 
setTimeout(() => {
    SoundManager.init();
}, 100);
 
function initSoundOnInteraction() {
    if (!SoundManager.initialized) {
        SoundManager.init();
    }
    SoundManager.updateMusicForState(currentState);
}
 
document.addEventListener('click', initSoundOnInteraction);
document.addEventListener('keydown', initSoundOnInteraction);
document.addEventListener('touchstart', initSoundOnInteraction);
 
// ─── GAME STATES ───
let currentState = 'MENU';
let gameMode = '1v1';
let difficulty = 'EASY';
let score = { red: 0, blue: 0 };
let halfDuration = 45;
let matchClock = halfDuration;
let currentHalf = 1;
let matchState = 'PLAY';
let halftimeTimer = 0;
const HALFTIME_BREAK = 3;
let kickoffTeam = 'red';
let nextKickoffTeam = null;
let kickoffDelay = 0.5;
let ball = {
    x: 450, y: 300, radius: 9,
    vx: 0, vy: 0,
    owner: null,
    speed: 13,
    cooldownPlayer: null,
    cooldownTimer: 0
};
let players = [];
let arrowAngle = 0;
let gkSpeed = 2.5;
let gkDirection = { red: 1, blue: -1 };
let goalBannerTimer = 0;
let lastScorer = '';
let particles = [];
let screenShake = { duration: 0, intensity: 0, x: 0, y: 0 };
let goalZoomScale = 1.0;
 
let menuBgParticles = [];
for (let i = 0; i < 40; i++) {
    menuBgParticles.push({
        x: Math.random() * 900,
        y: Math.random() * 600,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        alpha: Math.random() * 0.5 + 0.2
    });
}
 
// ─── AI VARIABLES ───
let aiTimer = 0;
let aiReactionTimer = 20;
let aiStartDelay = 60;
let aiDribbleTime = 0;
let aiPassCooldown = 0;
let gkTimer = 0;
let aiState = 'CHASE';
let aiStateTimer = 0;
let aiHoldBallTimer = 0;
let aiTargetOffset = { x: 0, y: 0 };
let aiTargetX = 0;
let aiTargetY = 0;
let isAIDecisive = false;
let aiCommitTimer = 0;
 
let activeLocks = {
    red: { player: null, timer: 0 },
    blue: { player: null, timer: 0 }
};
 
const posts = [
    { x: 25, y: 200, radius: 7 },
    { x: 25, y: 400, radius: 7 },
    { x: 875, y: 200, radius: 7 },
    { x: 875, y: 400, radius: 7 }
];
 
let pauseButton = {
    x: 860, y: 15, width: 30, height: 30,
    hover: false
};
 
const keys = {
    w: false, a: false, s: false, d: false, space: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, enter: false,
    p: false, Escape: false
};
 
// ─── KEYBOARD LISTENERS ───
window.addEventListener('keydown', (e) => {
    initSoundOnInteraction();
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
    }
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = true;
    if (e.key === 'Enter') keys.enter = true;
    if (e.key === 'Escape') keys.Escape = true;
    if (keyLower === 'p') keys.p = true;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p') keys[keyLower] = true;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    
    if (keyLower === 'p' && currentState === 'PLAY') togglePause();
    if (e.key === 'Escape' && currentState === 'PAUSED') togglePause();
    if (keyLower === 'm') { SoundManager.toggleSFX(); SoundManager.playSFX('menuClick', 0.3); updateTouchUI(); }
    if (keyLower === 'n') { SoundManager.toggleMusic(); SoundManager.playSFX('menuClick', 0.3); updateTouchUI(); }
    
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
    } else if (currentState === 'SETTINGS') {
        if (e.key === 'ArrowUp') halfDuration = Math.min(120, halfDuration + 5);
        if (e.key === 'ArrowDown') halfDuration = Math.max(15, halfDuration - 5);
    } else if (currentState === 'MATCH_END') {
        if (e.key === 'Enter' || e.key === ' ') { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    }
    updateTouchUI();
});
 
window.addEventListener('keyup', (e) => {
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = false;
    if (e.key === 'Enter') keys.enter = false;
    if (e.key === 'Escape') keys.Escape = false;
    if (keyLower === 'p') keys.p = false;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p') keys[keyLower] = false;
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});
 
// ─── TOUCH / MENU HANDLING ───
function getCanvasTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
    };
}
 
canvas.addEventListener('pointerdown', (e) => {
    initSoundOnInteraction();
    const pos = getCanvasTouchPos(e);
    
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
        if (pos.x >= 180 && pos.x <= 330 && pos.y >= 250 && pos.y <= 340) {
            SoundManager.playSFX('confirm');
            difficulty = 'EASY';
            selectMode('pve');
        } else if (pos.x >= 370 && pos.x <= 520 && pos.y >= 250 && pos.y <= 340) {
            SoundManager.playSFX('confirm');
            difficulty = 'MEDIUM';
            selectMode('pve');
        } else if (pos.x >= 560 && pos.x <= 710 && pos.y >= 250 && pos.y <= 340) {
            SoundManager.playSFX('confirm');
            difficulty = 'HARD';
            selectMode('pve');
        } else if (pos.x >= 350 && pos.x <= 550 && pos.y >= 400 && pos.y <= 445) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
        }
    } else if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS') {
        if (currentState === 'SETTINGS') {
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
        }
        SoundManager.playSFX('menuClick');
        currentState = 'MENU';
    } else if (currentState === 'MATCH_END') {
        SoundManager.playSFX('menuClick');
        currentState = 'MENU';
    } else if (currentState === 'PAUSED') {
        const resumeBtn = { x: 350, y: 235, w: 200, h: 50 };
        const menuBtn = { x: 350, y: 295, w: 200, h: 50 };
        const musicToggleBtn = { x: 330, y: 385, w: 110, h: 35 };
        const sfxToggleBtn = { x: 460, y: 385, w: 110, h: 35 };
        if (pos.x >= resumeBtn.x && pos.x <= resumeBtn.x + resumeBtn.w &&
            pos.y >= resumeBtn.y && pos.y <= resumeBtn.y + resumeBtn.h) {
            SoundManager.playSFX('menuClick');
            togglePause();
        } else if (pos.x >= menuBtn.x && pos.x <= menuBtn.x + menuBtn.w &&
                   pos.y >= menuBtn.y && pos.y <= menuBtn.y + menuBtn.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            updateTouchUI();
        } else if (pos.x >= musicToggleBtn.x && pos.x <= musicToggleBtn.x + musicToggleBtn.w &&
                   pos.y >= musicToggleBtn.y && pos.y <= musicToggleBtn.y + musicToggleBtn.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
        } else if (pos.x >= sfxToggleBtn.x && pos.x <= sfxToggleBtn.x + sfxToggleBtn.w &&
                   pos.y >= sfxToggleBtn.y && pos.y <= sfxToggleBtn.y + sfxToggleBtn.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
        }
    }
    updateTouchUI();
});
 
canvas.addEventListener('pointermove', (e) => {
    const pos = getCanvasTouchPos(e);
    pauseButton.hover = (pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45);
});
 
function togglePause() {
    if (currentState === 'PLAY') {
        currentState = 'PAUSED';
        SoundManager.playSFX('menuClick');
    } else if (currentState === 'PAUSED') {
        currentState = 'PLAY';
        SoundManager.playSFX('menuClick');
    }
    updateTouchUI();
}
 
function selectMode(mode) {
    gameMode = mode;
    kickoffTeam = 'red';
    nextKickoffTeam = 'red';
    initMatch();
    currentState = 'PLAY';
    updateTouchUI();
    SoundManager.updateMusicForState(currentState);
}
 
function updateTouchUI() {
    if (currentState === 'PLAY' && isMobileDevice) {
        touchControlsElem.style.display = 'block';
        touchControlsElem.className = 'touch-controls is-active mode-' + gameMode;
    } else {
        touchControlsElem.style.display = 'none';
    }
    SoundManager.updateMusicForState(currentState);
}
 
// ─── TOUCH JOYSTICKS ───
function setupJoystick(baseElem, updateKeys) {
    let touchId = null;
    let baseRect = null;
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
        let deltaX = touch.clientX - centerX;
        let deltaY = touch.clientY - centerY;
        let dist = Math.hypot(deltaX, deltaY);
        const maxDist = 35;
        if (dist > maxDist) {
            deltaX = (deltaX / dist) * maxDist;
            deltaY = (deltaY / dist) * maxDist;
        }
        stickElem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        const threshold = 10;
        updateKeys(
            deltaY < -threshold,
            deltaY > threshold,
            deltaX < -threshold,
            deltaX > threshold
        );
    }
}
 
setupJoystick(document.getElementById('p1Joystick'), (up, down, left, right) => {
    keys.w = up; keys.s = down; keys.a = left; keys.d = right;
});
 
setupJoystick(document.getElementById('p2Joystick'), (up, down, left, right) => {
    keys.ArrowUp = up; keys.ArrowDown = down; keys.ArrowLeft = left; keys.ArrowRight = right;
});
 
function bindShootButton(btnElem, keyName) {
    const press = (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        keys[keyName] = true;
    };
    const release = (e) => {
        e.preventDefault();
        keys[keyName] = false;
    };
    btnElem.addEventListener('touchstart', press, { passive: false });
    btnElem.addEventListener('touchend', release);
    btnElem.addEventListener('touchcancel', release);
    btnElem.addEventListener('mousedown', press);
    btnElem.addEventListener('mouseup', release);
}
 
bindShootButton(document.getElementById('p1Shoot'), 'space');
bindShootButton(document.getElementById('p2Shoot'), 'enter');
 
// ─── GAME SETUP & LOGIC ───
 
function createPlayers() {
    players = [];
    const create = (id, team, x, y, isGk, num, col, gradCol) => {
        return {
            id, team, x, y, radius: 16, color: col, gradColor: gradCol,
            isGk, num, ejecting: false, ejectTargetX: 0, ejectTargetY: 0
        };
    };
    players.push(create(0, 'red', 50, 300, true, '1', '#e74c3c', '#c0392b'));
    players.push(create(1, 'red', 250, 150, false, '7', '#ff5252', '#d63031'));
    players.push(create(2, 'red', 250, 450, false, '9', '#ff5252', '#d63031'));
    players.push(create(3, 'red', 380, 300, false, '10', '#ff5252', '#d63031'));
    players.push(create(4, 'blue', 850, 300, true, '1', '#3498db', '#2980b9'));
    players.push(create(5, 'blue', 650, 150, false, '8', '#48dbfb', '#0984e3'));
    players.push(create(6, 'blue', 650, 450, false, '11', '#48dbfb', '#0984e3'));
    players.push(create(7, 'blue', 520, 300, false, '10', '#48dbfb', '#0984e3'));
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
    let x = cx, y = cy;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
}
 
function getActivePlayer(team) {
    if (ball.owner && ball.owner.team === team) return ball.owner;
    let lock = activeLocks[team];
    if (lock.timer > 0 && lock.player && !lock.player.ejecting) {
        return lock.player;
    }
    let eligible = players.filter(p => p.team === team && !p.isGk && !p.ejecting);
    if (eligible.length === 0) return null;
    let candidates = eligible.map(p => {
        return { player: p, dist: Math.hypot(p.x - ball.x, p.y - ball.y) };
    });
    candidates.sort((a, b) => a.dist - b.dist);
    let chosen = candidates[0].player;
    let threshold = 25;
    let equidistantGroup = candidates.filter(c => c.dist - candidates[0].dist <= threshold);
    if (equidistantGroup.length >= 2) {
        let randomIndex = Math.floor(Math.random() * equidistantGroup.length);
        chosen = equidistantGroup[randomIndex].player;
        lock.player = chosen;
        lock.timer = 18;
    } else {
        lock.player = chosen;
        lock.timer = 0;
    }
    return chosen;
}
 
function shootBall(passer) {
    if (!window._gkStealInProgress) {
        SoundManager.playSFX('kick', 0.8);
    }
    let spawnDistance = passer.radius + ball.radius + 6;
    ball.x = passer.x + Math.cos(arrowAngle) * spawnDistance;
    ball.y = passer.y + Math.sin(arrowAngle) * spawnDistance;
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
        if (target) {
            arrowAngle = Math.atan2(target.y - gk.y, target.x - gk.x);
        } else {
            arrowAngle = Math.atan2((Math.random() - 0.5), -1);
        }
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
    if (gameWrapperElem) {
        gameWrapperElem.classList.remove('shake-impact');
        void gameWrapperElem.offsetWidth;
        gameWrapperElem.classList.add('shake-impact');
    }
    if (goalFlashElem) {
        goalFlashElem.classList.remove('active');
        void goalFlashElem.offsetWidth;
        goalFlashElem.classList.add('active');
    }
    updateTouchUI();
    spawnGoalConfetti(originX, originY);
}
 
function resolveBoxCollision(player, box) {
    let closestX = Math.max(box.minX, Math.min(player.x, box.maxX));
    let closestY = Math.max(box.minY, Math.min(player.y, box.maxY));
    let dx = player.x - closestX;
    let dy = player.y - closestY;
    let distance = Math.hypot(dx, dy);
    if (distance < player.radius) {
        if (distance === 0) {
            let dLeft = Math.abs(player.x - box.minX);
            let dRight = Math.abs(player.x - box.maxX);
            let dTop = Math.abs(player.y - box.minY);
            let dBottom = Math.abs(player.y - box.maxY);
            let min = Math.min(dLeft, dRight, dTop, dBottom);
            if (min === dLeft) player.x = box.minX - player.radius;
            else if (min === dRight) player.x = box.maxX + player.radius;
            else if (min === dTop) player.y = box.minY - player.radius;
            else player.y = box.maxY + player.radius;
        } else {
            let overlap = player.radius - distance;
            player.x += (dx / distance) * overlap;
            player.y += (dy / distance) * overlap;
        }
    }
}
 
function getEjectTarget(player, box) {
    let dLeft = Math.abs(player.x - box.minX);
    let dRight = Math.abs(player.x - box.maxX);
    let dTop = Math.abs(player.y - box.minY);
    let dBottom = Math.abs(player.y - box.maxY);
    let min = Math.min(dLeft, dRight, dTop, dBottom);
    let targetX = player.x;
    let targetY = player.y;
    if (min === dLeft) {
        targetX = box.minX - player.radius - 5;
    } else if (min === dRight) {
        targetX = box.maxX + player.radius + 5;
    } else if (min === dTop) {
        targetY = box.minY - player.radius - 5;
    } else {
        targetY = box.maxY + player.radius + 5;
    }
    const PADDING = 25;
    targetX = Math.max(PADDING + player.radius, Math.min(875 - player.radius, targetX));
    targetY = Math.max(PADDING + player.radius, Math.min(580 - player.radius, targetY));
    if (box.maxX === 125) {
        targetX = Math.max(130, targetX);
    }
    if (box.minX === 775) {
        targetX = Math.min(770, targetX);
    }
    return { x: targetX, y: targetY };
}
 
// ─── AI DIFFICULTY CONFIG (UPDATED) ───
function getAIConfig() {
    if (difficulty === 'EASY') {
        return {
            speedMultiplier: 0.58,
            shootRange: 360,
            panicTimer: 120,
            perfectShotRate: 0.35,
            missError: 0.5,
            passTriggerDist: 70,
            perfectPassRate: 0.50,
            passError: 1.2,
            passCooldown: 140,
            gkHoldTime: 360,
            reactionDelay: 20,
            // NEW: Decisive AI stats - less hesitation, more commitment
            chaseRate: 0.45,      // Increased from 30%
            retreatRate: 0.45,    // Reduced from 50%
            hesitateRate: 0.10,   // Reduced from 20%
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 35, // Increased = more committed
            movementSmoothness: 0.3,
            retreatDistance: 620, // How far back they go
            chaseAggressiveness: 1.0
        };
    } else if (difficulty === 'MEDIUM') {
        return {
            speedMultiplier: 0.72,
            shootRange: 360,
            panicTimer: 100,
            perfectShotRate: 0.50, // UPDATED from 45% → 50%
            missError: 0.5,
            passTriggerDist: 100,
            perfectPassRate: 0.60,
            passError: 1.0,
            passCooldown: 110,
            gkHoldTime: 360,
            reactionDelay: 12,
            chaseRate: 0.55,      // Increased from 45%
            retreatRate: 0.35,    // Same
            hesitateRate: 0.10,   // Reduced from 20%
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 40, // More committed
            movementSmoothness: 0.4,
            retreatDistance: 600,
            chaseAggressiveness: 1.2
        };
    } else { // HARD
        return {
            speedMultiplier: 0.86,
            shootRange: 360,
            panicTimer: 80,
            perfectShotRate: 0.60, // UPDATED from 55% → 60%
            missError: 0.4,
            passTriggerDist: 130,
            perfectPassRate: 0.70,
            passError: 0.8,
            passCooldown: 80,
            gkHoldTime: 360,
            reactionDelay: 6,
            chaseRate: 0.70,      // Increased from 60%
            retreatRate: 0.25,    // Same
            hesitateRate: 0.05,   // Reduced from 15%
            lockThreshold: 25,
            lockTimer: 18,
            stateSwitchCooldown: 45, // Most committed
            movementSmoothness: 0.5,
            retreatDistance: 580,
            chaseAggressiveness: 1.5
        };
    }
}
 
// ─── UPDATE FUNCTION ───
function update(dt) {
    if (currentState === 'PAUSED') return;
    const ai = getAIConfig();
    updateParticles();
    
    if (screenShake.duration > 0) {
        screenShake.duration--;
        let damp = screenShake.duration / 32;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * damp;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * damp;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
    
    if (goalZoomScale > 1.0) {
        goalZoomScale += (1.0 - goalZoomScale) * 0.16;
    }
    
    if (currentState === 'MATCH_END') {
        return;
    }
    
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
                    if (winner === 'RED') {
                        SoundManager.playMusic('victory');
                    } else {
                        SoundManager.playMusic('defeat');
                    }
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
    
    if (activeRed && !activeRed.ejecting) {
        let nextX = activeRed.x, nextY = activeRed.y;
        if (keys.w) nextY -= playerSpeed;
        if (keys.s) nextY += playerSpeed;
        if (keys.a) nextX -= playerSpeed;
        if (keys.d) nextX += playerSpeed;
        activeRed.x = nextX;
        activeRed.y = nextY;
        if (activeRed.isGk) {
            activeRed.x = Math.max(25 + activeRed.radius, Math.min(100 - activeRed.radius, activeRed.x));
            activeRed.y = Math.max(150 + activeRed.radius, Math.min(450 - activeRed.radius, activeRed.y));
        } else {
            activeRed.x = Math.max(25 + activeRed.radius, Math.min(875 - activeRed.radius, activeRed.x));
            activeRed.y = Math.max(activeRed.radius, Math.min(canvas.height - activeRed.radius, activeRed.y));
            if (blueGkHasBall) {
                resolveBoxCollision(activeRed, { minX: 775, maxX: 875, minY: 150, maxY: 450 });
            }
        }
    }
    
    // ─── UPDATED: SMART DECISIVE AI ───
    if (activeBlue && !activeBlue.ejecting) {
        let nextX = activeBlue.x, nextY = activeBlue.y;
        
        if (gameMode === '1v1') {
            if (keys.ArrowUp) nextY -= playerSpeed;
            if (keys.ArrowDown) nextY += playerSpeed;
            if (keys.ArrowLeft) nextX -= playerSpeed;
            if (keys.ArrowRight) nextX += playerSpeed;
        } else {
            if (aiReactionTimer <= 0 && aiStartDelay <= 0) {
                let aiSpeed = playerSpeed * ai.speedMultiplier;
                
                if (ball.owner === activeBlue) {
                    // ─── AI HAS THE BALL ───
                    aiHoldBallTimer++;
                    aiDribbleTime += 0.04;
                    let curveY = Math.sin(aiDribbleTime) * 130;
                    let targetY = 300 + curveY;
                    if (activeBlue.x > 160) nextX -= aiSpeed;
                    if (activeBlue.y < targetY - 15) nextY += aiSpeed;
                    else if (activeBlue.y > targetY + 15) nextY -= aiSpeed;
                    arrowAngle = Math.atan2(300 - activeBlue.y, 25 - activeBlue.x);
                    let isCloseToGoal = activeBlue.x < ai.shootRange;
                    
                    // Passing logic
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
                    
                    // Panic shot
                    let forcePanicShot = (isCloseToGoal && aiHoldBallTimer > ai.panicTimer);
                    if ((forcePanicShot || (isCloseToGoal && Math.random() < 0.03)) && ball.owner === activeBlue) {
                        if (Math.random() < (1 - ai.perfectShotRate)) arrowAngle += Math.random() > 0.5 ? ai.missError : -ai.missError;
                        shootBall(activeBlue);
                        aiHoldBallTimer = 0;
                        aiPassCooldown = 60;
                    }
                } else {
                    // ─── AI DOES NOT HAVE THE BALL ───
                    aiHoldBallTimer = 0;
                    
                    // Check if ball is loose (no owner)
                    const isBallLoose = !ball.owner;
                    
                    // Check ball position for context
                    const ballInAIHalf = ball.x < 450;
                    const ballInHumanHalf = ball.x > 450;
                    
                    // Decrease state timer
                    aiStateTimer -= dt * 60;
                    
                    // Only re-evaluate when timer expires OR if ball state changes significantly
                    if (aiStateTimer <= 0 || isBallLoose) {
                        let roll = Math.random();
                        
                        // ─── CONTEXT-AWARE DECISION MAKING ───
                        if (isBallLoose) {
                            // ALWAYS CHASE LOOSE BALL - no hesitation!
                            aiState = 'CHASE';
                            aiTargetOffset = { x: (Math.random() - 0.5) * 30, y: (Math.random() - 0.5) * 30 };
                            aiCommitTimer = 30; // Commit to chase
                        } else if (ballInAIHalf) {
                            // Defensive mode - ball in AI's half
                            if (roll < ai.retreatRate) {
                                aiState = 'RETREAT';
                                aiCommitTimer = 25;
                            } else if (roll < (ai.retreatRate + ai.chaseRate * 0.7)) {
                                aiState = 'CHASE';
                                aiTargetOffset = { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 };
                                aiCommitTimer = 20;
                            } else {
                                aiState = 'HESITATE';
                                aiCommitTimer = 15;
                            }
                        } else if (ballInHumanHalf) {
                            // Attacking mode - ball in human's half
                            if (roll < ai.chaseRate) {
                                aiState = 'CHASE';
                                aiTargetOffset = { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 };
                                aiCommitTimer = 30;
                            } else if (roll < (ai.chaseRate + ai.retreatRate * 0.5)) {
                                aiState = 'RETREAT';
                                aiCommitTimer = 15;
                            } else {
                                aiState = 'HESITATE';
                                aiCommitTimer = 10;
                            }
                        }
                        
                        // Ensure minimum commit time
                        if (aiCommitTimer < 15) aiCommitTimer = 15;
                        
                        // Set target position based on state
                        if (aiState === 'CHASE') {
                            aiTargetX = ball.x + aiTargetOffset.x;
                            aiTargetY = ball.y + aiTargetOffset.y;
                        } else if (aiState === 'RETREAT') {
                            aiTargetX = ai.retreatDistance + (Math.random() - 0.5) * 40;
                            aiTargetY = 300 + (Math.random() - 0.5) * 80;
                        } else { // HESITATE
                            aiTargetX = activeBlue.x + (Math.random() - 0.5) * 60;
                            aiTargetY = activeBlue.y + (Math.random() - 0.5) * 60;
                        }
                        
                        // Set next re-evaluation (longer = more decisive)
                        aiStateTimer = Math.floor(Math.random() * 20) + ai.stateSwitchCooldown;
                    }
                    
                    // ─── COMMITTED MOVEMENT ───
                    // Reduce hesitation timer
                    if (aiCommitTimer > 0) aiCommitTimer--;
                    
                    // Only move if committed or if chasing
                    if (aiState === 'CHASE' || aiCommitTimer > 0 || isBallLoose) {
                        let dx = aiTargetX - activeBlue.x;
                        let dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        
                        if (distToTarget > 15) {
                            let moveSpeed = aiSpeed * (0.8 + Math.random() * 0.3);
                            // Boost speed when chasing loose ball
                            if (isBallLoose) moveSpeed *= 1.3;
                            // Boost speed when chasing aggressively
                            if (aiState === 'CHASE' && aiCommitTimer > 20) moveSpeed *= 1.1;
                            
                            if (distToTarget > 100) moveSpeed *= 1.2;
                            nextX += (dx / distToTarget) * moveSpeed;
                            nextY += (dy / distToTarget) * moveSpeed;
                        }
                    } else {
                        // Default: move slowly toward target
                        let dx = aiTargetX - activeBlue.x;
                        let dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 20) {
                            nextX += (dx / distToTarget) * aiSpeed * 0.3;
                            nextY += (dy / distToTarget) * aiSpeed * 0.3;
                        }
                    }
                }
            }
        }
        
        activeBlue.x = nextX;
        activeBlue.y = nextY;
        if (activeBlue.isGk) {
            activeBlue.x = Math.max(800 + activeBlue.radius, Math.min(875 - activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(150 + activeBlue.radius, Math.min(450 - activeBlue.radius, activeBlue.y));
        } else {
            activeBlue.x = Math.max(25 + activeBlue.radius, Math.min(875 - activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(activeBlue.radius, Math.min(canvas.height - activeBlue.radius, activeBlue.y));
            if (redGkHasBall) {
                resolveBoxCollision(activeBlue, { minX: 25, maxX: 125, minY: 150, maxY: 450 });
            }
        }
    }
    
    // ─── BALL PHYSICS (unchanged) ───
    if (ball.owner) {
        ball.x = ball.owner.x;
        ball.y = ball.owner.y;
        if (ball.owner.isGk) {
            gkTimer--;
            let gk = ball.owner;
            let canPass = gkTimer <= 300;
            if (!(gameMode === 'pve' && gk.team === 'blue')) {
                arrowAngle += 0.08;
            }
            if (gkTimer <= 0) {
                if (gameMode === 'pve' && gk.team === 'blue') {
                    doAiGkPass(gk);
                } else {
                    shootBall(gk);
                }
            } else if (canPass) {
                if (gk.team === 'red' && keys.space) {
                    shootBall(gk);
                    keys.space = false;
                } else if (gk.team === 'blue') {
                    if (gameMode === '1v1' && keys.enter) {
                        shootBall(gk);
                        keys.enter = false;
                    } else if (gameMode === 'pve') {
                        aiTimer++;
                        if (aiTimer > 50) {
                            doAiGkPass(gk);
                            aiTimer = 0;
                        }
                    }
                }
            }
        } else {
            if (!(gameMode === 'pve' && ball.owner.team === 'blue')) {
                arrowAngle += 0.08;
            }
            if (ball.owner.team === 'red' && keys.space) {
                shootBall(ball.owner);
                keys.space = false;
            } else if (ball.owner.team === 'blue' && gameMode === '1v1' && keys.enter) {
                shootBall(ball.owner);
                keys.enter = false;
            }
        }
    } else {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.985;
        ball.vy *= 0.985;
        
        if (Math.hypot(ball.vx, ball.vy) > 6 && Math.random() < 0.4) {
            particles.push({
                x: ball.x, y: ball.y,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 4 + 2, color: 'rgba(255,255,255,0.5)',
                rotation: 0, vRot: 0, life: 15
            });
        }
        
        for (let post of posts) {
            let dist = Math.hypot(ball.x - post.x, ball.y - post.y);
            if (dist < ball.radius + post.radius) {
                let angle = Math.atan2(ball.y - post.y, ball.x - post.x);
                let speed = Math.max(4, Math.hypot(ball.vx, ball.vy));
                ball.vx = Math.cos(angle) * speed;
                ball.vy = Math.sin(angle) * speed;
                let overlap = (ball.radius + post.radius) - dist + 1;
                ball.x += Math.cos(angle) * overlap;
                ball.y += Math.sin(angle) * overlap;
                SoundManager.playSFX('kick', 0.3);
            }
        }
        
        if (ball.y <= ball.radius) { ball.y = ball.radius; ball.vy *= -1; }
        else if (ball.y >= canvas.height - ball.radius) { ball.y = canvas.height - ball.radius; ball.vy *= -1; }
        
        if (ball.x - ball.radius <= 25) {
            if (ball.y >= 200 && ball.y <= 400) {
                if (ball.y - ball.radius <= 200) { ball.y = 200 + ball.radius; ball.vy *= -1; }
                else if (ball.y + ball.radius >= 400) { ball.y = 400 - ball.radius; ball.vy *= -1; }
                if (ball.x - ball.radius <= 5) {
                    score.blue++;
                    triggerGoal('BLUE TEAM SCORES!', 'red', 25, ball.y);
                    currentState = 'GOAL_SCORED';
                    goalBannerTimer = 0;
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
                    currentState = 'GOAL_SCORED';
                    goalBannerTimer = 0;
                    return;
                }
            } else { ball.x = 875 - ball.radius; ball.vx *= -1; }
        }
        
        for (let p of players) {
            if (p.ejecting || ball.cooldownPlayer === p) continue;
            let dist = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (dist < p.radius + ball.radius) {
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
                if (!(gameMode === 'pve' && p.team === 'blue')) {
                    arrowAngle = 0;
                }
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
                    let tackleAngle = Math.atan2(defender.y - ball.y, defender.x - ball.x) + Math.PI;
                    ball.vx = Math.cos(tackleAngle) * 9;
                    ball.vy = Math.sin(tackleAngle) * 9;
                    ball.cooldownPlayer = tackler;
                    ball.cooldownTimer = 15;
                    aiReactionTimer = 20;
                    SoundManager.playSFX('kick', 0.6);
                }
            }
        }
    }
}
 
// ─── DRAW FUNCTIONS ───
function drawPitch() {
    const stripeWidth = (875 - 25) / 10;
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(25 + i * stripeWidth, 0, stripeWidth, canvas.height);
    }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.strokeRect(25, 0, 850, canvas.height);
    ctx.beginPath(); ctx.moveTo(450, 0); ctx.lineTo(450, 600); ctx.stroke();
    ctx.beginPath(); ctx.arc(450, 300, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(450, 300, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(25, 0, 20, 0, Math.PI * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(25, 600, 20, Math.PI * 1.5, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(875, 0, 20, Math.PI * 0.5, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(875, 600, 20, Math.PI, Math.PI * 1.5); ctx.stroke();
    ctx.strokeRect(25, 150, 100, 300);
    ctx.strokeRect(775, 150, 100, 300);
    ctx.beginPath(); ctx.arc(95, 300, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(805, 300, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    for (let y = 200; y <= 400; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(25, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(875, y); ctx.lineTo(900, y); ctx.stroke();
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
    ctx.beginPath(); ctx.roundRect(300, 15, 300, 50, 25); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ff5252'; ctx.font = '900 28px Outfit, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(score.red, 410, 51);
    ctx.font = '800 14px Outfit, sans-serif'; ctx.fillStyle = '#e74c3c';
    ctx.fillText('RED', 365, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '700 14px Outfit, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('VS', 450, 48);
    ctx.font = '800 14px Outfit, sans-serif'; ctx.fillStyle = '#3498db';
    ctx.textAlign = 'left'; ctx.fillText(gameMode === 'pve' ? 'COM' : 'BLUE', 505, 48);
    ctx.fillStyle = '#48dbfb'; ctx.font = '900 28px Outfit, sans-serif';
    ctx.fillText(score.blue, 475, 51);
    
    if (gameMode === 'pve') {
        ctx.fillStyle = 'rgba(15,20,25,0.85)';
        ctx.beginPath(); ctx.roundRect(15, 15, 80, 28, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
        let diffColor = difficulty === 'EASY' ? '#2ecc71' : (difficulty === 'MEDIUM' ? '#f1c40f' : '#e74c3c');
        ctx.fillStyle = diffColor;
        ctx.font = '700 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(difficulty, 55, 35);
    }
    
    ctx.fillStyle = 'rgba(15,20,25,0.85)';
    ctx.beginPath(); ctx.roundRect(400, 68, 100, 32, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
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
        ctx.roundRect(canvas.width - 80, 15, 65, 50, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = seconds <= 2 ? '#ff5252' : '#f1c40f';
        ctx.font = '900 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(seconds + 's', canvas.width - 47, 43);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10px Outfit, sans-serif';
        ctx.fillText('GK TIME', canvas.width - 47, 25);
    }
}
 
function drawMenuBackground() {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let time = Date.now() * 0.0012;
    let rad1X = 250 + Math.sin(time) * 60;
    let rad1Y = 200 + Math.cos(time * 0.8) * 40;
    let grad1 = ctx.createRadialGradient(rad1X, rad1Y, 10, rad1X, rad1Y, 340);
    grad1.addColorStop(0, 'rgba(231,76,60,0.35)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1; ctx.fillRect(0, 0, 900, 600);
    let rad2X = 650 + Math.cos(time * 0.9) * 60;
    let rad2Y = 400 + Math.sin(time) * 40;
    let grad2 = ctx.createRadialGradient(rad2X, rad2Y, 10, rad2X, rad2Y, 340);
    grad2.addColorStop(0, 'rgba(52,152,219,0.35)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2; ctx.fillRect(0, 0, 900, 600);
    ctx.fillStyle = '#ffffff';
    for (let p of menuBgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 900; if (p.x > 900) p.x = 0;
        if (p.y < 0) p.y = 600; if (p.y > 600) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
 
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
    
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.beginPath();
    ctx.roundRect(180, 250, 150, 90, 16);
    ctx.fill();
    ctx.strokeStyle = difficulty === 'EASY' ? '#2ecc71' : 'rgba(46, 204, 113, 0.5)';
    ctx.lineWidth = difficulty === 'EASY' ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = '#2ecc71';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.shadowColor = difficulty === 'EASY' ? '#2ecc71' : 'transparent';
    ctx.shadowBlur = difficulty === 'EASY' ? 20 : 0;
    ctx.fillText('EASY', 255, 295);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Casual Play', 255, 320);
    
    ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
    ctx.beginPath();
    ctx.roundRect(370, 250, 150, 90, 16);
    ctx.fill();
    ctx.strokeStyle = difficulty === 'MEDIUM' ? '#f1c40f' : 'rgba(241, 196, 15, 0.5)';
    ctx.lineWidth = difficulty === 'MEDIUM' ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.shadowColor = difficulty === 'MEDIUM' ? '#f1c40f' : 'transparent';
    ctx.shadowBlur = difficulty === 'MEDIUM' ? 20 : 0;
    ctx.fillText('MEDIUM', 445, 295);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Balanced Challenge', 445, 320);
    
    ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
    ctx.beginPath();
    ctx.roundRect(560, 250, 150, 90, 16);
    ctx.fill();
    ctx.strokeStyle = difficulty === 'HARD' ? '#e74c3c' : 'rgba(231, 76, 60, 0.5)';
    ctx.lineWidth = difficulty === 'HARD' ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = '#e74c3c';
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.shadowColor = difficulty === 'HARD' ? '#e74c3c' : 'transparent';
    ctx.shadowBlur = difficulty === 'HARD' ? 20 : 0;
    ctx.fillText('HARD', 635, 290);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.fillText('Expert Challenge', 635, 320);
    
    ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
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
 
function drawPauseButton() {
    const x = 860, y = 15, w = 30, h = 30;
    ctx.save();
    ctx.fillStyle = pauseButton.hover ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8, y + 7, 4, 16);
    ctx.fillRect(x + 18, y + 7, 4, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '7px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSE', x + w/2, y + h + 12);
    ctx.restore();
}
 
function drawPauseMenu() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
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
    
    ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
    ctx.beginPath();
    ctx.roundRect(350, 235, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2ecc71';
    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('▶ RESUME', 450, 270);
    
    ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
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
    
    ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
    ctx.beginPath();
    ctx.roundRect(330, 385, 110, 35, 10);
    ctx.fill();
    ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
    ctx.font = '700 16px Outfit, sans-serif';
    ctx.fillText(`🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 385, 410);
    
    ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
    ctx.beginPath();
    ctx.roundRect(460, 385, 110, 35, 10);
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
 
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);
    
    if (currentState === 'MENU') {
        drawMenuBackground();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 58px Outfit, sans-serif';
        ctx.fillText('PRO STRIKER', 450, 150);
        ctx.restore();
        
        let options = [
            { key: '[ 1 ]', label: '1 VS 1 MATCH', y: 280, color: '#2ecc71' },
            { key: '[ 2 ]', label: 'VS COMPUTER', y: 350, color: '#00d2d3' },
            { key: '[ 3 ]', label: 'INSTRUCTIONS', y: 420, color: '#ff9f43' },
            { key: '[ 4 ]', label: 'SETTINGS', y: 490, color: '#ee5253' }
        ];
        for (let opt of options) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.beginPath();
            ctx.roundRect(280, opt.y - 32, 340, 50, 14);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
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
        
        ctx.restore();
        return;
    }
    
    if (currentState === 'DIFFICULTY_SELECT') {
        drawDifficultySelect();
        return;
    }
    
    if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS') {
        drawMenuBackground();
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
        if (currentState === 'INSTRUCTIONS') {
            ctx.font = '900 36px Outfit, sans-serif'; ctx.fillText('HOW TO PLAY', 450, 80);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath(); ctx.roundRect(100, 120, 700, 360, 16); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();
            ctx.font = '600 17px Outfit, sans-serif';
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`MATCH RULE: Two ${halfDuration}s halves -- most goals wins!`, 450, 160);
            ctx.fillStyle = '#ffffff';
            if (isMobileDevice) {
                ctx.fillText('• RED TEAM: Bottom-Left Joystick | Shoot Button ⚽', 450, 220);
                ctx.fillText('• BLUE TEAM: Top-Right Joystick | Shoot Button ⚽', 450, 260);
            } else {
                ctx.fillText('• RED TEAM: [ W, A, S, D ] | [ SPACE ] to Shoot', 450, 220);
                ctx.fillText('• BLUE TEAM: [ ARROW KEYS ] | [ ENTER ] to Shoot', 450, 260);
            }
            ctx.fillText('• Goalkeepers have 6 Seconds to pass before auto-kicking.', 450, 310);
            ctx.fillText('• Touching an opponent GK gets you immediately ejected.', 450, 350);
            ctx.fillText('• Shots blocked by the GK push the shooter back.', 450, 390);
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`• Press [ P ] or tap pause button to pause the game`, 450, 430);
        } else {
            ctx.font = '900 36px Outfit, sans-serif'; ctx.fillText('SETTINGS', 450, 80);
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath(); ctx.roundRect(200, 120, 500, 380, 16); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.stroke();
            
            ctx.font = '800 22px Outfit, sans-serif'; ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Half Duration: ${halfDuration} seconds`, 450, 180);
            ctx.font = '600 16px Outfit, sans-serif'; ctx.fillStyle = '#ffffff';
            ctx.fillText('Use [ UP ] and [ DOWN ] Arrow Keys or Tap to modify', 450, 215);
            ctx.fillStyle = '#95a5a6';
            ctx.font = '600 13px Outfit, sans-serif';
            ctx.fillText('Range: 15 -- 120 seconds (5s steps)', 450, 240);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '600 16px Outfit, sans-serif';
            ctx.fillText('SOUND CONTROLS', 450, 290);
            
            const musicBtn = { x: 350, y: 305, w: 200, h: 40 };
            ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
            ctx.beginPath();
            ctx.roundRect(musicBtn.x, musicBtn.y, musicBtn.w, musicBtn.h, 10);
            ctx.fill();
            ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
            ctx.font = '700 18px Outfit, sans-serif';
            ctx.fillText(`🎵 Music: ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 450, 335);
            
            const sfxBtn = { x: 350, y: 360, w: 200, h: 40 };
            ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)';
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
        }
        ctx.font = '700 16px Outfit, sans-serif'; ctx.fillStyle = '#95a5a6';
        ctx.fillText(isMobileDevice ? 'Tap screen to return to menu' : 'Press [ ESC ] or [ BACKSPACE ] to return to menu', 450, 520);
        ctx.restore();
        return;
    }
    
    if (currentState === 'PAUSED') {
        drawPitch();
        for (let p of players) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        let activeRed = getActivePlayer('red');
        let activeBlue = getActivePlayer('blue');
        if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'P1', '#f39c12');
        if (activeBlue && !activeBlue.ejecting) {
            drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');
        }
        for (let p of players) {
            let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
            pGrad.addColorStop(0, p.color); pGrad.addColorStop(1, p.gradColor);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = pGrad; ctx.fill();
            ctx.lineWidth = p.isGk ? 3 : 2; ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff'; ctx.stroke();
            drawStar(p.x, p.y, 5, 8, 3.5);
        }
        for (let post of posts) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath(); ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
            postGrad.addColorStop(0, '#ffffff'); postGrad.addColorStop(1, '#bdc3c7');
            ctx.beginPath(); ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
            ctx.fillStyle = postGrad; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = '#2c3e50'; ctx.stroke();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#1e272e'; ctx.stroke();
        ctx.fillStyle = '#1e272e'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2); ctx.fill();
        if (ball.owner) {
            ctx.save();
            let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
            let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
            let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
            let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
            ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY);
            ctx.lineWidth = 4; ctx.strokeStyle = '#f1c40f'; ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 8; ctx.stroke();
            let tipAngle1 = arrowAngle + Math.PI * 0.85; let tipAngle2 = arrowAngle - Math.PI * 0.85;
            ctx.beginPath();
            ctx.moveTo(endX, endY); ctx.lineTo(endX + Math.cos(tipAngle1) * 11, endY + Math.sin(tipAngle1) * 11);
            ctx.moveTo(endX, endY); ctx.lineTo(endX + Math.cos(tipAngle2) * 11, endY + Math.sin(tipAngle2) * 11);
            ctx.stroke(); ctx.restore();
        }
        for (let p of particles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
            ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
        }
        drawScoreboard();
        drawGkTimerUI();
        drawPauseMenu();
        ctx.restore();
        return;
    }
    
    drawPitch();
    for (let p of players) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + p.radius * 0.8, p.radius * 0.9, p.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    let activeRed = getActivePlayer('red');
    let activeBlue = getActivePlayer('blue');
    if (activeRed && !activeRed.ejecting) drawActiveIndicator(activeRed, 'P1', '#f39c12');
    if (activeBlue && !activeBlue.ejecting) {
        drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');
    }
    for (let p of players) {
        let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
        pGrad.addColorStop(0, p.color); pGrad.addColorStop(1, p.gradColor);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = pGrad; ctx.fill();
        ctx.lineWidth = p.isGk ? 3 : 2; ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff'; ctx.stroke();
        drawStar(p.x, p.y, 5, 8, 3.5);
    }
    for (let post of posts) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
        postGrad.addColorStop(0, '#ffffff'); postGrad.addColorStop(1, '#bdc3c7');
        ctx.beginPath(); ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
        ctx.fillStyle = postGrad; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#2c3e50'; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#1e272e'; ctx.stroke();
    ctx.fillStyle = '#1e272e'; ctx.beginPath(); ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2); ctx.fill();
    if (ball.owner) {
        ctx.save();
        let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
        let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
        let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
        let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY);
        ctx.lineWidth = 4; ctx.strokeStyle = '#f1c40f'; ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 8; ctx.stroke();
        let tipAngle1 = arrowAngle + Math.PI * 0.85; let tipAngle2 = arrowAngle - Math.PI * 0.85;
        ctx.beginPath();
        ctx.moveTo(endX, endY); ctx.lineTo(endX + Math.cos(tipAngle1) * 11, endY + Math.sin(tipAngle1) * 11);
        ctx.moveTo(endX, endY); ctx.lineTo(endX + Math.cos(tipAngle2) * 11, endY + Math.sin(tipAngle2) * 11);
        ctx.stroke(); ctx.restore();
    }
    for (let p of particles) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore();
    }
    drawScoreboard();
    drawGkTimerUI();
    if (currentState === 'PLAY') {
        drawPauseButton();
    }
    if (matchState === 'HALFTIME') {
        ctx.save();
        ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect(0, 250, 900, 100);
        ctx.fillStyle = '#f1c40f'; ctx.font = '900 48px Outfit, sans-serif';
        ctx.textAlign = 'center'; ctx.shadowColor = '#f39c12'; ctx.shadowBlur = 20;
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
        ctx.shadowColor = '#f39c12'; ctx.shadowBlur = 20;
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
    ctx.restore();
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
 
// ─── ENGINE INITIALIZATION ───
initMatch();
updateTouchUI();
lastTime = performance.now();
gameLoop(lastTime);
 
console.log('🎵 SOUND SYSTEM READY!');
console.log('🧠 SMART DECISIVE AI ACTIVATED!');
console.log('🎮 Controls:');
console.log('  [M] Toggle SFX');
console.log('  [N] Toggle Music');
console.log('  [P] Pause/Resume');
console.log('📁 Sound files loaded from /sounds/ folder');
