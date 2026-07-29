// Rendering functions - ULTIMATE EDITION (fixed negative radius)
console.log('[ProStrker] renderer.js loaded');

function drawPitch() {
    const stripeWidth = (875 - 25) / 10;
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#27ae60' : '#2ecc71';
        ctx.fillRect(25 + i * stripeWidth, 0, stripeWidth, canvas.height);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(25, 0, 850, canvas.height);

    ctx.beginPath();
    ctx.moveTo(450, 0);
    ctx.lineTo(450, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 300, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(450, 300, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(25, 0, 20, 0, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(25, 600, 20, Math.PI * 1.5, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(875, 0, 20, Math.PI * 0.5, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(875, 600, 20, Math.PI, Math.PI * 1.5);
    ctx.stroke();

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

    // subtle centre glow
    const glow = ctx.createRadialGradient(450, 300, 10, 450, 300, 280);
    glow.addColorStop(0, 'rgba(255,255,255,0.03)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.setLineDash([8,4]);
    ctx.stroke();
    ctx.restore();

    // extra outer glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 14, 0, Math.PI * 2);
    ctx.fillStyle = colorHex + '15';
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 40;
    ctx.fill();
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
    ctx.restore();

    ctx.font = '900 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, p.x, p.y - p.radius - 24);
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
    let timeStr = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;

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
    ctx.fillRect(0,0,canvas.width,canvas.height);

    let time = Date.now() * 0.0012;
    let rad1X = 250 + Math.sin(time) * 60;
    let rad1Y = 200 + Math.cos(time * 0.8) * 40;
    let grad1 = ctx.createRadialGradient(rad1X, rad1Y, 10, rad1X, rad1Y, 340);
    grad1.addColorStop(0, 'rgba(231,76,60,0.35)');
    grad1.addColorStop(1,'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0,0,900,600);

    let rad2X = 650 + Math.cos(time * 0.9) * 60;
    let rad2Y = 400 + Math.sin(time) * 40;
    let grad2 = ctx.createRadialGradient(rad2X, rad2Y, 10, rad2X, rad2Y, 340);
    grad2.addColorStop(0,'rgba(52,152,219,0.35)');
    grad2.addColorStop(1,'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0,0,900,600);

    ctx.fillStyle = '#ffffff';
    for (let p of menuBgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 900;
        if (p.x > 900) p.x = 0;
        if (p.y < 0) p.y = 600;
        if (p.y > 600) p.y = 0;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
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
    ctx.fillRect(0,0,canvas.width,canvas.height);
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

// ===== MAIN DRAW =====
function draw() {
    try {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

        // ----- MENU -----
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
            ctx.restore();
            return;
        }

        // ----- DIFFICULTY SELECT -----
        if (currentState === 'DIFFICULTY_SELECT') {
            drawDifficultySelect();
            return;
        }

        // ----- INSTRUCTIONS & SETTINGS -----
        if (currentState === 'INSTRUCTIONS' || currentState === 'SETTINGS') {
            drawMenuBackground();
            ctx.textAlign = 'center';

            if (currentState === 'INSTRUCTIONS') {
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 36px Outfit, sans-serif';
                ctx.fillText('📖 HOW TO PLAY', 450, 70);

                const cards = [
                    { title: '🎮 CONTROLS', y: 140,
                      lines: isMobileDevice ?
                          ['RED: Left Joystick + ⚽ Shoot', 'BLUE: Right Joystick + ⚽ Shoot'] :
                          ['RED: WASD  |  SPACE to Shoot', 'BLUE: ⬆⬇⬅➡  |  ENTER to Shoot'] },
                    { title: '⚽ RULES', y: 280,
                      lines: [`Two ${halfDuration}s halves`, 'Most goals wins!', 'GK holds ball for 6s max'] },
                    { title: '💡 TIPS', y: 420,
                      lines: ['Pass to open teammates', 'Shoot from close range', 'Eject from GK on block'] }
                ];

                cards.forEach((card, idx) => {
                    const cx = 150 + idx * 220, cy = card.y;
                    ctx.fillStyle = 'rgba(255,255,255,0.04)';
                    ctx.beginPath();
                    ctx.roundRect(cx-90, cy-20, 180, 110, 14);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '700 18px Outfit, sans-serif';
                    ctx.fillText(card.title, cx, cy + 10);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '600 14px Outfit, sans-serif';
                    card.lines.forEach((line, i) => {
                        ctx.fillText(line, cx, cy + 40 + i * 24);
                    });
                });

                ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                ctx.beginPath();
                ctx.roundRect(350, 530, 200, 40, 12);
                ctx.fill();
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#9b59b6';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText('← BACK', 450, 558);
                window._backBtn = { x: 350, y: 530, w: 200, h: 40 };

                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '600 12px Outfit, sans-serif';
                ctx.fillText('Press ESC or tap BACK to return', 450, 590);
            } else { // SETTINGS
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 36px Outfit, sans-serif';
                ctx.fillText('⚙️ SETTINGS', 450, 70);

                const cardX = 200, cardY = 120, cardW = 500, cardH = 280;
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 20);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#f1c40f';
                ctx.font = '700 22px Outfit, sans-serif';
                ctx.fillText('⏱️ HALF DURATION', 450, 170);
                ctx.fillStyle = '#ffffff';
                ctx.font = '800 40px Outfit, sans-serif';
                ctx.fillText(`${halfDuration}s`, 450, 235);

                const sliderX = 280, sliderY = 270, sliderW = 340, sliderH = 8;
                const knobRadius = 16;
                const minVal = 15, maxVal = 120, step = 5;
                const progress = (halfDuration - minVal) / (maxVal - minVal);
                const knobX = sliderX + progress * sliderW;

                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.roundRect(sliderX, sliderY - sliderH/2, sliderW, sliderH, 4);
                ctx.fill();

                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.roundRect(sliderX, sliderY - sliderH/2, knobX - sliderX, sliderH, 4);
                ctx.fill();

                const grad = ctx.createRadialGradient(knobX-4, sliderY-4, 2, knobX, sliderY, knobRadius);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(1, '#f1c40f');
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(knobX, sliderY, knobRadius, 0, Math.PI*2);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '600 12px Outfit, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${minVal}s`, sliderX - 10, sliderY + 30);
                ctx.textAlign = 'right';
                ctx.fillText(`${maxVal}s`, sliderX + sliderW + 10, sliderY + 30);

                window._sliderRect = { x: sliderX, y: sliderY - 20, w: sliderW, h: 40 };

                // Sound toggles
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '600 16px Outfit, sans-serif';
                ctx.fillText('🔊 SOUND CONTROLS', 450, 340);

                const toggleY = 360;
                ctx.fillStyle = SoundManager.musicEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
                ctx.beginPath();
                ctx.roundRect(320, toggleY, 180, 45, 12);
                ctx.fill();
                ctx.strokeStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = SoundManager.musicEnabled ? '#2ecc71' : '#e74c3c';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText(`🎵 ${SoundManager.musicEnabled ? 'ON' : 'OFF'}`, 410, 393);
                window._musicBtn = { x: 320, y: toggleY, w: 180, h: 45 };

                ctx.fillStyle = SoundManager.sfxEnabled ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)';
                ctx.beginPath();
                ctx.roundRect(520, toggleY, 180, 45, 12);
                ctx.fill();
                ctx.strokeStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = SoundManager.sfxEnabled ? '#2ecc71' : '#e74c3c';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText(`🔊 ${SoundManager.sfxEnabled ? 'ON' : 'OFF'}`, 610, 393);
                window._sfxBtn = { x: 520, y: toggleY, w: 180, h: 45 };

                ctx.fillStyle = 'rgba(155, 89, 182, 0.2)';
                ctx.beginPath();
                ctx.roundRect(350, 430, 200, 45, 12);
                ctx.fill();
                ctx.strokeStyle = '#9b59b6';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#9b59b6';
                ctx.font = '700 18px Outfit, sans-serif';
                ctx.fillText('← BACK', 450, 460);
                window._backBtn = { x: 350, y: 430, w: 200, h: 45 };

                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '600 12px Outfit, sans-serif';
                ctx.fillText('Drag the knob or use ⬆ ⬇ keys', 450, 500);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = '500 12px Outfit, sans-serif';
            ctx.fillText('Press ESC or tap BACK to return', 450, 580);
            ctx.restore();
            return;
        }

        // ----- PAUSED -----
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
            if (activeBlue && !activeBlue.ejecting) drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');

            for (let p of players) {
                let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
                pGrad.addColorStop(0, p.color);
                pGrad.addColorStop(1, p.gradColor);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = pGrad;
                ctx.fill();
                ctx.lineWidth = p.isGk ? 3 : 2;
                ctx.strokeStyle = p.isGk ? '#f1c40f' : '#ffffff';
                ctx.stroke();
                drawStar(p.x, p.y, 5, 8, 3.5);
            }

            for (let post of posts) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.beginPath();
                ctx.ellipse(post.x, post.y + 4, post.radius, post.radius * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
                postGrad.addColorStop(0, '#ffffff');
                postGrad.addColorStop(1, '#bdc3c7');
                ctx.beginPath();
                ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
                ctx.fillStyle = postGrad;
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#2c3e50';
                ctx.stroke();
            }

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

            if (ball.owner) {
                ctx.save();
                let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
                let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
                let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
                let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#f1c40f';
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 8;
                ctx.stroke();
                let tipAngle1 = arrowAngle + Math.PI * 0.85;
                let tipAngle2 = arrowAngle - Math.PI * 0.85;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX + Math.cos(tipAngle1) * 11, endY + Math.sin(tipAngle1) * 11);
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX + Math.cos(tipAngle2) * 11, endY + Math.sin(tipAngle2) * 11);
                ctx.stroke();
                ctx.restore();
            }

            // Draw standard particles
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
            drawPauseMenu();
            ctx.restore();
            return;
        }

        // ----- GAME PLAY (PLAY, GOAL_SCORED, MATCH_END) -----
        drawPitch();

        // Player shadows
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
        if (activeBlue && !activeBlue.ejecting) drawActiveIndicator(activeBlue, gameMode === '1v1' ? 'P2' : 'COM', gameMode === '1v1' ? '#00ffff' : '#9b59b6');

        // Draw players
        for (let p of players) {
            let pGrad = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, p.radius);
            pGrad.addColorStop(0, p.color);
            pGrad.addColorStop(1, p.gradColor);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = pGrad;
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
            let postGrad = ctx.createRadialGradient(post.x - 2, post.y - 2, 1, post.x, post.y, post.radius);
            postGrad.addColorStop(0, '#ffffff');
            postGrad.addColorStop(1, '#bdc3c7');
            ctx.beginPath();
            ctx.arc(post.x, post.y, post.radius, 0, Math.PI * 2);
            ctx.fillStyle = postGrad;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();
        }

        // Ball shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(ball.x, ball.y + ball.radius * 0.7, ball.radius * 0.9, ball.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // ========== FIXED BALL TRAIL ==========
        if (ball.trail && ball.trail.length > 0) {
            for (let i = 0; i < ball.trail.length; i++) {
                const t = ball.trail[i];
                if (t.life <= 0) continue;          // skip dead trails
                const alpha = t.life / 20;
                const radius = ball.radius * alpha * 0.6;
                if (radius > 0) {
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.3, alpha * 0.3)})`;
                    ctx.fill();
                }
            }
        }

        // Ball
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

        // Shooting arrow
        if (ball.owner) {
            ctx.save();
            let startX = ball.owner.x + Math.cos(arrowAngle) * 22;
            let startY = ball.owner.y + Math.sin(arrowAngle) * 22;
            let endX = ball.owner.x + Math.cos(arrowAngle) * 65;
            let endY = ball.owner.y + Math.sin(arrowAngle) * 65;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#f1c40f';
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 8;
            ctx.stroke();
            let tipAngle1 = arrowAngle + Math.PI * 0.85;
            let tipAngle2 = arrowAngle - Math.PI * 0.85;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX + Math.cos(tipAngle1) * 11, endY + Math.sin(tipAngle1) * 11);
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX + Math.cos(tipAngle2) * 11, endY + Math.sin(tipAngle2) * 11);
            ctx.stroke();
            ctx.restore();
        }

        // Shot power indicator
        if (isChargingShot && ball.owner) {
            const pX = ball.owner.x;
            const pY = ball.owner.y - 40;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(pX - 25, pY - 5, 50, 10);
            ctx.fillStyle = shootPower > 0.7 ? '#ff5252' : (shootPower > 0.4 ? '#f1c40f' : '#2ecc71');
            ctx.fillRect(pX - 24, pY - 4, 48 * shootPower, 8);
            ctx.restore();
        }

        // Standard particles
        for (let p of particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }

        // Celebration particles
        if (celebrationParticles && celebrationParticles.length > 0) {
            for (let p of celebrationParticles) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 150;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            }
        }

        drawScoreboard();

        // Match progress bar
        if (currentState === 'PLAY' || currentState === 'GOAL_SCORED' || currentState === 'PAUSED') {
            const barX = 300, barY = 110, barW = 300, barH = 6;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 3);
            ctx.fill();
            const progress = matchTimeProgress || 0;
            ctx.fillStyle = progress > 0.8 ? '#ff5252' : '#f1c40f';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * Math.min(1, progress), barH, 3);
            ctx.fill();
        }

        drawGkTimerUI();

        if (currentState === 'PLAY') drawPauseButton();

        // Overlays for HALFTIME, KICKOFF, GOAL, MATCH_END
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

        ctx.restore();
    } catch (err) {
        console.error('[renderer.js draw] ERROR:', err);
        // Show a friendly error message on canvas
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, 900, 600);
        ctx.fillStyle = '#ff5252';
        ctx.font = 'bold 30px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Something went wrong', 450, 280);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Outfit, sans-serif';
        ctx.fillText('Check the console for details', 450, 330);
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px monospace';
        ctx.fillText(err.message, 450, 380);
    }
}