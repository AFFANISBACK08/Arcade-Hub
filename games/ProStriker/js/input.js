// Input: keyboard and touch handlers
console.log('[ProStrker] input.js loaded');

window.addEventListener('keydown', (e) => {
    initSoundOnInteraction();
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'p', 'P', 'Shift'].includes(e.key)) {
        e.preventDefault();
    }
    const keyLower = e.key.toLowerCase();
    if (keyLower === ' ' || e.code === 'Space') keys.space = true;
    if (e.key === 'Enter') keys.enter = true;
    if (e.key === 'Escape') keys.Escape = true;
    if (e.key === 'Shift') keys.Shift = true;
    if (keyLower === 'p') keys.p = true;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p' && keyLower !== 'shift') {
        keys[keyLower] = true;
    }
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
    if (e.key === 'Shift') keys.Shift = false;
    if (keyLower === 'p') keys.p = false;
    if (keys.hasOwnProperty(keyLower) && keyLower !== ' ' && keyLower !== 'p' && keyLower !== 'shift') {
        keys[keyLower] = false;
    }
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

function getCanvasTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
}

canvas.addEventListener('pointerdown', (e) => {
    initSoundOnInteraction();
    const pos = getCanvasTouchPos(e);

    if (currentState === 'PLAY' && pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45) {
        SoundManager.playSFX('menuClick'); togglePause(); return;
    }

    if (currentState === 'MENU') {
        if (pos.x >= 280 && pos.x <= 620 && pos.y >= 248 && pos.y <= 298) {
            SoundManager.playSFX('menuClick'); selectMode('1v1');
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 318 && pos.y <= 368) {
            SoundManager.playSFX('menuClick'); currentState = 'DIFFICULTY_SELECT';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 388 && pos.y <= 438) {
            SoundManager.playSFX('menuClick'); currentState = 'INSTRUCTIONS';
        } else if (pos.x >= 280 && pos.x <= 620 && pos.y >= 458 && pos.y <= 508) {
            SoundManager.playSFX('menuClick'); currentState = 'SETTINGS';
        }
    } else if (currentState === 'DIFFICULTY_SELECT') {
        if (pos.x >= 180 && pos.x <= 330 && pos.y >= 250 && pos.y <= 340) { SoundManager.playSFX('confirm'); difficulty = 'EASY'; selectMode('pve'); }
        else if (pos.x >= 370 && pos.x <= 520 && pos.y >= 250 && pos.y <= 340) { SoundManager.playSFX('confirm'); difficulty = 'MEDIUM'; selectMode('pve'); }
        else if (pos.x >= 560 && pos.x <= 710 && pos.y >= 250 && pos.y <= 340) { SoundManager.playSFX('confirm'); difficulty = 'HARD'; selectMode('pve'); }
        else if (pos.x >= 350 && pos.x <= 550 && pos.y >= 400 && pos.y <= 445) { SoundManager.playSFX('menuClick'); currentState = 'MENU'; }
    } else if (currentState === 'SETTINGS') {
        const rect = window._sliderRect;
        if (rect && pos.x >= rect.x && pos.x <= rect.x + rect.w &&
            pos.y >= rect.y && pos.y <= rect.y + rect.h) {
            isDraggingSlider = true;
            updateSliderFromPointer(pos.x);
            return;
        }
        const music = window._musicBtn;
        if (music && pos.x >= music.x && pos.x <= music.x + music.w &&
            pos.y >= music.y && pos.y <= music.y + music.h) {
            SoundManager.toggleMusic();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        const sfx = window._sfxBtn;
        if (sfx && pos.x >= sfx.x && pos.x <= sfx.x + sfx.w &&
            pos.y >= sfx.y && pos.y <= sfx.y + sfx.h) {
            SoundManager.toggleSFX();
            SoundManager.playSFX('menuClick', 0.3);
            return;
        }
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w &&
            pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'INSTRUCTIONS') {
        const back = window._backBtn;
        if (back && pos.x >= back.x && pos.x <= back.x + back.w &&
            pos.y >= back.y && pos.y <= back.y + back.h) {
            SoundManager.playSFX('menuClick');
            currentState = 'MENU';
            return;
        }
    } else if (currentState === 'PAUSED') {
        const resumeBtn = { x: 350, y: 235, w: 200, h: 50 };
        const menuBtn = { x: 350, y: 295, w: 200, h: 50 };
        const musicToggleBtn = { x: 330, y: 385, w: 110, h: 35 };
        const sfxToggleBtn = { x: 460, y: 385, w: 110, h: 35 };
        if (pos.x >= resumeBtn.x && pos.x <= resumeBtn.x + resumeBtn.w && pos.y >= resumeBtn.y && pos.y <= resumeBtn.y + resumeBtn.h) {
            SoundManager.playSFX('menuClick'); togglePause();
        } else if (pos.x >= menuBtn.x && pos.x <= menuBtn.x + menuBtn.w && pos.y >= menuBtn.y && pos.y <= menuBtn.y + menuBtn.h) {
            SoundManager.playSFX('menuClick'); currentState = 'MENU'; updateTouchUI();
        } else if (pos.x >= musicToggleBtn.x && pos.x <= musicToggleBtn.x + musicToggleBtn.w && pos.y >= musicToggleBtn.y && pos.y <= musicToggleBtn.y + musicToggleBtn.h) {
            SoundManager.toggleMusic(); SoundManager.playSFX('menuClick', 0.3);
        } else if (pos.x >= sfxToggleBtn.x && pos.x <= sfxToggleBtn.x + sfxToggleBtn.w && pos.y >= sfxToggleBtn.y && pos.y <= sfxToggleBtn.y + sfxToggleBtn.h) {
            SoundManager.toggleSFX(); SoundManager.playSFX('menuClick', 0.3);
        }
    } else if (currentState === 'MATCH_END') {
        SoundManager.playSFX('menuClick'); currentState = 'MENU';
    }

    updateTouchUI();
});

// Pointer move (for slider drag and pause button hover)
canvas.addEventListener('pointermove', (e) => {
    const pos = getCanvasTouchPos(e);
    if (isDraggingSlider && currentState === 'SETTINGS') {
        updateSliderFromPointer(pos.x);
    }
    pauseButton.hover = (pos.x >= 860 && pos.x <= 890 && pos.y >= 15 && pos.y <= 45);
});

// Stop drag on pointer up anywhere
window.addEventListener('pointerup', () => {
    isDraggingSlider = false;
});

function togglePause() {
    if (currentState === 'PLAY') { currentState = 'PAUSED'; SoundManager.playSFX('menuClick'); }
    else if (currentState === 'PAUSED') { currentState = 'PLAY'; SoundManager.playSFX('menuClick'); }
    updateTouchUI();
}

function selectMode(mode) {
    gameMode = mode; kickoffTeam = 'red'; nextKickoffTeam = 'red';
    initMatch(); currentState = 'PLAY'; updateTouchUI();
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

// Helper for slider
function updateSliderFromPointer(pointerX) {
    const rect = window._sliderRect;
    if (!rect) return;
    const minVal = 15, maxVal = 120, step = 5;
    let t = (pointerX - rect.x) / rect.w;
    t = Math.max(0, Math.min(1, t));
    let raw = minVal + t * (maxVal - minVal);
    let stepped = Math.round(raw / step) * step;
    halfDuration = Math.max(minVal, Math.min(maxVal, stepped));
}

// ===== TOUCH JOYSTICKS =====
function setupJoystick(baseElem, updateKeys) {
    let touchId = null; let baseRect = null; const stickElem = baseElem.querySelector('.joystick-stick');

    baseElem.addEventListener('touchstart', (e) => {
        e.preventDefault(); initSoundOnInteraction(); if (touchId !== null) return;
        const touch = e.changedTouches[0]; touchId = touch.identifier;
        baseRect = baseElem.getBoundingClientRect(); handleMove(touch);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === touchId) {
            handleMove(e.changedTouches[i]); break;
        }
    }, { passive: false });

    const resetJoystick = (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            stickElem.style.transform = 'translate(0px, 0px)';
            updateKeys(false, false, false, false);
            break;
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
        if (dist > maxDist) { deltaX = (deltaX / dist) * maxDist; deltaY = (deltaY / dist) * maxDist; }
        stickElem.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        const threshold = 10;
        updateKeys(deltaY < -threshold, deltaY > threshold, deltaX < -threshold, deltaX > threshold);
    }
}

setupJoystick(document.getElementById('p1Joystick'), (up, down, left, right) => {
    keys.w = up; keys.s = down; keys.a = left; keys.d = right;
});

setupJoystick(document.getElementById('p2Joystick'), (up, down, left, right) => {
    keys.ArrowUp = up; keys.ArrowDown = down; keys.ArrowLeft = left; keys.ArrowRight = right;
});

// ===== SHOOT BUTTON WITH CHARGING (touch & mouse) =====
function bindShootButton(btnElem, keyName) {
    let pressTimer = null;
    const press = (e) => {
        e.preventDefault();
        initSoundOnInteraction();
        keys[keyName] = true;
        isChargingShot = true;
        shootPower = 0;
        // Start charging
        pressTimer = setInterval(() => {
            shootPower = Math.min(1, shootPower + 0.05);
        }, 50);
    };
    const release = (e) => {
        e.preventDefault();
        keys[keyName] = false;
        isChargingShot = false;
        if (pressTimer) { clearInterval(pressTimer); pressTimer = null; }
        // Release shot with power
        if (ball.owner && !ball.owner.isGk) {
            let power = 0.7 + 0.3 * shootPower;
            ball.speed = 13 * power;
            shootBall(ball.owner);
        }
        shootPower = 0;
    };
    btnElem.addEventListener('touchstart', press, { passive: false });
    btnElem.addEventListener('touchend', release);
    btnElem.addEventListener('touchcancel', release);
    btnElem.addEventListener('mousedown', press);
    btnElem.addEventListener('mouseup', release);
}

bindShootButton(document.getElementById('p1Shoot'), 'space');
bindShootButton(document.getElementById('p2Shoot'), 'enter');