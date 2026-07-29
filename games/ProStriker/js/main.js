console.log('[ProStrker] main.js loaded - ULTIMATE EDITION');

let gameRunning = false;
let celebrationTimer = 0;
let isCelebrating = false;

// ---------- GOAL & CELEBRATION ----------
function triggerGoal(bannerText, concedingTeam, goalX, goalY) {
    try {
        lastScorer = bannerText || '';
        // Update stats
        if (concedingTeam === 'red') matchStats.shots.blue++;
        else matchStats.shots.red++;

        screenShake.duration = 25; screenShake.intensity = 8;
        goalZoomScale = 1.8;
        if (ball) { ball.vx = 0; ball.vy = 0; ball.owner = null; }

        if (typeof SoundManager !== 'undefined') {
            try { SoundManager.playGoalSounds(); } catch(e) {}
            try { SoundManager.stopMusic(); } catch(e) {}
        }

        const teamColor = (concedingTeam === 'red') ? '#ff5252' : '#48dbfb';
        spawnCelebration(goalX, goalY, teamColor);
        const flash = document.getElementById('goalFlash');
        if (flash) { flash.classList.remove('active'); void flash.offsetWidth; flash.classList.add('active'); }
        const overlay = document.getElementById('celebrationOverlay');
        if (overlay) { overlay.classList.add('active'); setTimeout(() => overlay.classList.remove('active'), 1000); }

        // Scorer celebration
        let scorer = ball.cooldownPlayer || ball.owner;
        if (scorer) {
            const targetX = concedingTeam === 'red' ? 875 : 25;
            scorer.ejecting = true;
            scorer.ejectTargetX = targetX;
            scorer.ejectTargetY = 300 + (Math.random() - 0.5) * 100;
            isCelebrating = true;
            celebrationTimer = 60;
        }
        console.log('[GOAL]', bannerText);
    } catch(e) { console.error(e); }
}

function spawnCelebration(x, y, color) {
    const colors = [color, '#f1c40f', '#ffffff', '#ff9f43', '#e056fd', '#2ecc71', '#3498db'];
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 5;
        celebrationParticles.push({
            x: x + (Math.random()-0.5)*50,
            y: y + (Math.random()-0.5)*50,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed - 3,
            size: Math.random()*10 + 4,
            color: colors[Math.floor(Math.random()*colors.length)],
            rotation: Math.random()*Math.PI*2,
            vRot: (Math.random()-0.5)*0.4,
            life: 150 + Math.random()*50,
            gravity: 0.15 + Math.random()*0.1,
            bounce: 0.6 + Math.random()*0.3
        });
    }
}

function updateCelebration() {
    for (let i = celebrationParticles.length - 1; i >= 0; i--) {
        const p = celebrationParticles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99; p.vy *= 0.99;
        p.rotation += p.vRot;
        p.life--;
        if (p.y > 580) { p.y = 580; p.vy *= -p.bounce; p.vx *= 0.95; }
        if (p.life <= 0 || p.y < -50) celebrationParticles.splice(i, 1);
    }
}

// ---------- PLAYERS ----------
function createPlayers() {
    players = [];
    const create = (id, team, x, y, isGk, num, col, gradCol) => ({
        id, team, x, y, radius: 16,
        color: col, gradColor: gradCol,
        isGk, num,
        ejecting: false, ejectTargetX: 0, ejectTargetY: 0,
        stamina: 1.0,
        celebration: false,
        celebrationTimer: 0
    });
    players.push(create(0,'red',50,300,true,'1','#e74c3c','#c0392b'));
    players.push(create(1,'red',250,150,false,'7','#ff5252','#d63031'));
    players.push(create(2,'red',250,450,false,'9','#ff5252','#d63031'));
    players.push(create(3,'red',380,300,false,'10','#ff5252','#d63031'));
    players.push(create(4,'blue',850,300,true,'1','#3498db','#2980b9'));
    players.push(create(5,'blue',650,150,false,'8','#48dbfb','#0984e3'));
    players.push(create(6,'blue',650,450,false,'11','#48dbfb','#0984e3'));
    players.push(create(7,'blue',520,300,false,'10','#48dbfb','#0984e3'));
}

// ---------- MATCH INIT ----------
function initMatch() {
    score = { red:0, blue:0 };
    matchStats = {
        possession:{red:0, blue:0},
        shots:{red:0, blue:0},
        passes:{red:0, blue:0},
        tackles:{red:0, blue:0},
        possessionTimer:{red:0, blue:0},
        winStreak: matchStats.winStreak || 0,
        totalMatches: matchStats.totalMatches || 0
    };
    nextKickoffTeam = kickoffTeam;
    matchClock = halfDuration;
    currentHalf = 1;
    matchState = 'PLAY';
    halftimeTimer = 0;
    kickoffDelay = 0.5;
    matchTimeProgress = 0;
    isCelebrating = false;
    celebrationTimer = 0;
    celebrationParticles = [];
    resetField();
    document.getElementById('quickRematch').style.display = 'none';
    isQuickRematchVisible = false;
}

function resetField() {
    createPlayers();
    ball.x = 450; ball.y = 300; ball.vx = 0; ball.vy = 0;
    ball.cooldownPlayer = null; ball.cooldownTimer = 0;
    ball.trail = [];
    aiTimer = 0; aiDribbleTime = 0; aiPassCooldown = 0; aiHoldBallTimer = 0;
    aiState = 'CHASE'; aiStateTimer = 0; gkTimer = 0;
    aiStartDelay = 60; aiReactionTimer = 20;
    activeLocks.red = { player: null, timer: 0 };
    activeLocks.blue = { player: null, timer: 0 };
    let outfielders = players.filter(p => !p.isGk);
    if (nextKickoffTeam) outfielders = outfielders.filter(p => p.team === nextKickoffTeam);
    ball.owner = outfielders[Math.floor(Math.random() * outfielders.length)];
}

// ---------- UPDATE ----------
function update(dt) {
    if (currentState === 'PAUSED') return;
    const ai = getAIConfig();

    // Particles
    updateParticles();
    updateCelebration();

    // Screen shake
    if (screenShake.duration > 0) {
        screenShake.duration--;
        let damp = screenShake.duration / 32;
        screenShake.x = (Math.random()-0.5)*screenShake.intensity*damp;
        screenShake.y = (Math.random()-0.5)*screenShake.intensity*damp;
    } else { screenShake.x = 0; screenShake.y = 0; }
    if (goalZoomScale > 1.0) goalZoomScale += (1.0 - goalZoomScale)*0.16;

    // State checks
    if (currentState === 'MATCH_END') return;
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

    // Match clock
    if (kickoffDelay > 0) {
        if (kickoffDelay < 0.1 && kickoffDelay > 0) SoundManager.playSFX('whistleStart', 0.7);
        kickoffDelay -= dt;
    } else {
        matchClock -= dt;
        matchTimeProgress = 1 - (matchClock / halfDuration);
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
                } else SoundManager.playMusic('victory');
                matchState = 'MATCH_END';
                currentState = 'MATCH_END';
                let winnerText = '';
                if (score.red > score.blue) winnerText = '🏆 RED TEAM WINS!';
                else if (score.blue > score.red) winnerText = '🏆 BLUE TEAM WINS!';
                else winnerText = '🤝 DRAW!';
                lastScorer = winnerText;
                // Update rank
                if (winner === 'RED') {
                    matchStats.winStreak++;
                    rankPoints += 10;
                } else if (winner === 'BLUE') {
                    matchStats.winStreak = 0;
                    rankPoints = Math.max(0, rankPoints - 5);
                } else {
                    matchStats.winStreak = 0;
                }
                matchStats.totalMatches++;
                updateRank();
                document.getElementById('quickRematch').style.display = 'block';
                isQuickRematchVisible = true;
                return;
            }
        }
    }

    // Locks
    if (activeLocks.red.timer > 0) activeLocks.red.timer--;
    if (activeLocks.blue.timer > 0) activeLocks.blue.timer--;

    // Ejecting players
    for (let p of players) {
        if (p.ejecting) {
            let dx = p.ejectTargetX - p.x, dy = p.ejectTargetY - p.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 5) { p.x = p.ejectTargetX; p.y = p.ejectTargetY; p.ejecting = false; }
            else { let speed = 5 + dist*0.05; if (speed>8) speed=8; p.x += (dx/dist)*speed; p.y += (dy/dist)*speed; }
        }
        // Stamina recovery
        if (!keys.Shift) p.stamina = Math.min(1, p.stamina + 0.002);
    }

    // Ball cooldown
    if (ball.cooldownTimer > 0) { ball.cooldownTimer--; if (ball.cooldownTimer <= 0) ball.cooldownPlayer = null; }

    // AI timers
    if (aiStartDelay > 0) aiStartDelay--;
    if (aiReactionTimer > 0) aiReactionTimer--;
    if (aiPassCooldown > 0) aiPassCooldown--;

    // GK movement
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

    // Active players
    let activeRed = getActivePlayer('red');
    let activeBlue = getActivePlayer('blue');
    let playerSpeed = 4.5;

    let redGkHasBall = ball.owner && ball.owner.team === 'red' && ball.owner.isGk;
    let blueGkHasBall = ball.owner && ball.owner.team === 'blue' && ball.owner.isGk;

    // Human (Red) control with sprint
    if (activeRed && !activeRed.ejecting) {
        let nextX = activeRed.x, nextY = activeRed.y;
        let speed = playerSpeed * (0.7 + 0.3 * activeRed.stamina);
        if (keys.Shift) { speed *= 1.5; activeRed.stamina -= 0.004; if (activeRed.stamina < 0) activeRed.stamina = 0; }
        if (keys.w) nextY -= speed;
        if (keys.s) nextY += speed;
        if (keys.a) nextX -= speed;
        if (keys.d) nextX += speed;
        activeRed.x = nextX; activeRed.y = nextY;
        if (activeRed.isGk) {
            activeRed.x = Math.max(25+activeRed.radius, Math.min(100-activeRed.radius, activeRed.x));
            activeRed.y = Math.max(150+activeRed.radius, Math.min(450-activeRed.radius, activeRed.y));
        } else {
            activeRed.x = Math.max(25+activeRed.radius, Math.min(875-activeRed.radius, activeRed.x));
            activeRed.y = Math.max(activeRed.radius, Math.min(canvas.height-activeRed.radius, activeRed.y));
            if (blueGkHasBall) resolveBoxCollision(activeRed, {minX:775, maxX:875, minY:150, maxY:450});
        }
    }

    // AI (Blue) control
    if (activeBlue && !activeBlue.ejecting) {
        let nextX = activeBlue.x, nextY = activeBlue.y;
        if (gameMode === '1v1') {
            let speed = playerSpeed * (0.7 + 0.3 * activeBlue.stamina);
            if (keys.Shift) { speed *= 1.5; activeBlue.stamina -= 0.004; if (activeBlue.stamina < 0) activeBlue.stamina = 0; }
            if (keys.ArrowUp) nextY -= speed;
            if (keys.ArrowDown) nextY += speed;
            if (keys.ArrowLeft) nextX -= speed;
            if (keys.ArrowRight) nextX += speed;
        } else {
            if (aiReactionTimer <= 0 && aiStartDelay <= 0) {
                let aiCfg = getAIConfig();
                let aiSpeed = playerSpeed * aiCfg.speedMultiplier * (0.7 + 0.3 * activeBlue.stamina);
                if (ball.owner === activeBlue) {
                    aiHoldBallTimer++;
                    aiDribbleTime += 0.04;
                    let curveY = 300 + Math.sin(aiDribbleTime) * 130;
                    if (activeBlue.x > 160) nextX -= aiSpeed;
                    if (activeBlue.y < curveY - 15) nextY += aiSpeed;
                    else if (activeBlue.y > curveY + 15) nextY -= aiSpeed;
                    arrowAngle = Math.atan2(300 - activeBlue.y, 25 - activeBlue.x);
                    let isCloseToGoal = activeBlue.x < aiCfg.shootRange;
                    if (aiPassCooldown <= 0 && activeBlue.x > 380) {
                        let teammates = players.filter(p => p.team === 'blue' && !p.isGk && p !== activeBlue);
                        let randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];
                        let distToHuman = activeRed ? Math.hypot(activeRed.x - activeBlue.x, activeRed.y - activeBlue.y) : 999;
                        if (randomTeammate && (distToHuman < aiCfg.passTriggerDist || Math.random() < 0.005)) {
                            let passAngle = Math.atan2(randomTeammate.y - activeBlue.y, randomTeammate.x - activeBlue.x);
                            if (Math.random() < (1 - aiCfg.perfectPassRate)) passAngle += (Math.random()-0.5)*aiCfg.passError;
                            arrowAngle = passAngle;
                            shootBall(activeBlue);
                            aiPassCooldown = aiCfg.passCooldown;
                        }
                    }
                    let forcePanicShot = (isCloseToGoal && aiHoldBallTimer > aiCfg.panicTimer);
                    if ((forcePanicShot || (isCloseToGoal && Math.random() < 0.03)) && ball.owner === activeBlue) {
                        if (Math.random() < (1 - aiCfg.perfectShotRate)) arrowAngle += Math.random()>0.5 ? aiCfg.missError : -aiCfg.missError;
                        shootBall(activeBlue);
                        aiHoldBallTimer = 0;
                        aiPassCooldown = 60;
                    }
                } else {
                    aiHoldBallTimer = 0;
                    const isBallLoose = !ball.owner;
                    const ballInAIHalf = ball.x < 450;
                    const ballInHumanHalf = ball.x > 450;
                    aiStateTimer -= dt * 60;
                    if (aiStateTimer <= 0 || isBallLoose) {
                        let roll = Math.random();
                        if (isBallLoose) {
                            aiState = 'CHASE';
                            aiTargetOffset = { x: (Math.random()-0.5)*30, y: (Math.random()-0.5)*30 };
                            aiCommitTimer = 30;
                        } else if (ballInAIHalf) {
                            if (roll < aiCfg.retreatRate) { aiState = 'RETREAT'; aiCommitTimer = 25; }
                            else if (roll < (aiCfg.retreatRate + aiCfg.chaseRate*0.7)) { aiState = 'CHASE'; aiTargetOffset = { x:(Math.random()-0.5)*40, y:(Math.random()-0.5)*40 }; aiCommitTimer = 20; }
                            else { aiState = 'HESITATE'; aiCommitTimer = 15; }
                        } else if (ballInHumanHalf) {
                            if (roll < aiCfg.chaseRate) { aiState = 'CHASE'; aiTargetOffset = { x:(Math.random()-0.5)*50, y:(Math.random()-0.5)*50 }; aiCommitTimer = 30; }
                            else if (roll < (aiCfg.chaseRate + aiCfg.retreatRate*0.5)) { aiState = 'RETREAT'; aiCommitTimer = 15; }
                            else { aiState = 'HESITATE'; aiCommitTimer = 10; }
                        }
                        if (aiCommitTimer < 15) aiCommitTimer = 15;
                        if (aiState === 'CHASE') { aiTargetX = ball.x + aiTargetOffset.x; aiTargetY = ball.y + aiTargetOffset.y; }
                        else if (aiState === 'RETREAT') { aiTargetX = aiCfg.retreatDistance + (Math.random()-0.5)*40; aiTargetY = 300 + (Math.random()-0.5)*80; }
                        else { aiTargetX = activeBlue.x + (Math.random()-0.5)*60; aiTargetY = activeBlue.y + (Math.random()-0.5)*60; }
                        aiStateTimer = Math.floor(Math.random()*20) + aiCfg.stateSwitchCooldown;
                    }
                    if (aiCommitTimer > 0) aiCommitTimer--;
                    if (aiState === 'CHASE' || aiCommitTimer > 0 || isBallLoose) {
                        let dx = aiTargetX - activeBlue.x, dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 15) {
                            let moveSpeed = aiSpeed * (0.8 + Math.random()*0.3);
                            if (isBallLoose) moveSpeed *= 1.3;
                            if (aiState === 'CHASE' && aiCommitTimer > 20) moveSpeed *= 1.1;
                            if (distToTarget > 100) moveSpeed *= 1.2;
                            nextX += (dx/distToTarget)*moveSpeed;
                            nextY += (dy/distToTarget)*moveSpeed;
                        }
                    } else {
                        let dx = aiTargetX - activeBlue.x, dy = aiTargetY - activeBlue.y;
                        let distToTarget = Math.hypot(dx, dy);
                        if (distToTarget > 20) {
                            nextX += (dx/distToTarget)*aiSpeed*0.3;
                            nextY += (dy/distToTarget)*aiSpeed*0.3;
                        }
                    }
                }
            }
        }
        activeBlue.x = nextX; activeBlue.y = nextY;
        if (activeBlue.isGk) {
            activeBlue.x = Math.max(800+activeBlue.radius, Math.min(875-activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(150+activeBlue.radius, Math.min(450-activeBlue.radius, activeBlue.y));
        } else {
            activeBlue.x = Math.max(25+activeBlue.radius, Math.min(875-activeBlue.radius, activeBlue.x));
            activeBlue.y = Math.max(activeBlue.radius, Math.min(canvas.height-activeBlue.radius, activeBlue.y));
            if (redGkHasBall) resolveBoxCollision(activeBlue, {minX:25, maxX:125, minY:150, maxY:450});
        }
    }

    // ---------- BALL PHYSICS ----------
    if (ball.owner) {
        ball.x = ball.owner.x;
        ball.y = ball.owner.y;
        // Update possession timer
        if (ball.owner.team === 'red') matchStats.possessionTimer.red += dt;
        else matchStats.possessionTimer.blue += dt;

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
            // Shot charging
            if (ball.owner.team === 'red' && keys.space) {
                if (!isChargingShot) { isChargingShot = true; shootPower = 0; }
                shootPower = Math.min(1, shootPower + dt * 2);
            } else if (ball.owner.team === 'red' && !keys.space && isChargingShot) {
                // Release shot with power
                let power = 0.7 + 0.3 * shootPower;
                ball.speed = 13 * power;
                shootBall(ball.owner);
                keys.space = false;
                isChargingShot = false;
                shootPower = 0;
            } else if (ball.owner.team === 'blue' && gameMode === '1v1' && keys.enter) {
                if (!isChargingShot) { isChargingShot = true; shootPower = 0; }
                shootPower = Math.min(1, shootPower + dt * 2);
            } else if (ball.owner.team === 'blue' && gameMode === '1v1' && !keys.enter && isChargingShot) {
                let power = 0.7 + 0.3 * shootPower;
                ball.speed = 13 * power;
                shootBall(ball.owner);
                keys.enter = false;
                isChargingShot = false;
                shootPower = 0;
            }
        }
    } else {
        // Ball loose – physics
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.985;
        ball.vy *= 0.985;

        // Ball trail
        if (Math.hypot(ball.vx, ball.vy) > 2) {
            ball.trail.push({x: ball.x, y: ball.y, life: 20});
            if (ball.trail.length > 30) ball.trail.shift();
        }
        for (let t of ball.trail) t.life--;

        // Particles
        if (Math.hypot(ball.vx, ball.vy) > 6 && Math.random() < 0.4) {
            particles.push({
                x: ball.x, y: ball.y,
                vx: (Math.random()-0.5)*2,
                vy: (Math.random()-0.5)*2,
                size: Math.random()*4+2,
                color: 'rgba(255,255,255,0.5)',
                rotation:0, vRot:0, life:15
            });
        }

        // Collisions with posts
        for (let post of posts) {
            let dist = Math.hypot(ball.x - post.x, ball.y - post.y);
            if (dist < ball.radius + post.radius) {
                let angle = Math.atan2(ball.y - post.y, ball.x - post.x);
                let speed = Math.max(4, Math.hypot(ball.vx, ball.vy));
                ball.vx = Math.cos(angle)*speed;
                ball.vy = Math.sin(angle)*speed;
                let overlap = (ball.radius + post.radius) - dist + 1;
                ball.x += Math.cos(angle)*overlap;
                ball.y += Math.sin(angle)*overlap;
                SoundManager.playSFX('kick', 0.3);
            }
        }

        // Walls
        if (ball.y <= ball.radius) { ball.y = ball.radius; ball.vy *= -1; }
        else if (ball.y >= canvas.height - ball.radius) { ball.y = canvas.height - ball.radius; ball.vy *= -1; }

        // Goal detection
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

        // Player collision
        for (let p of players) {
            if (p.ejecting || ball.cooldownPlayer === p) continue;
            let dist = Math.hypot(p.x - ball.x, p.y - ball.y);
            if (dist < p.radius + ball.radius) {
                window._gkStealInProgress = p.isGk && ball.cooldownPlayer && ball.cooldownPlayer.team !== p.team;
                ball.owner = p;
                ball.vx = 0; ball.vy = 0;
                if (p.isGk) {
                    gkTimer = 360;
                    if (ball.cooldownPlayer && ball.cooldownPlayer.team !== p.team) {
                        let shooter = ball.cooldownPlayer;
                        let target = null;
                        if (p.team === 'blue' && shooter.x > 775 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, {minX:775, maxX:875, minY:150, maxY:450});
                        } else if (p.team === 'red' && shooter.x < 125 && shooter.y > 150 && shooter.y < 450) {
                            target = getEjectTarget(shooter, {minX:25, maxX:125, minY:150, maxY:450});
                        }
                        if (target) { shooter.ejecting = true; shooter.ejectTargetX = target.x; shooter.ejectTargetY = target.y; }
                    }
                }
                if (!(gameMode === 'pve' && p.team === 'blue')) arrowAngle = 0;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
                break;
            }
        }
    }

    // GK steal from outfield
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
                if (opponentGk.team === 'blue') target = getEjectTarget(offender, {minX:775, maxX:875, minY:150, maxY:450});
                else target = getEjectTarget(offender, {minX:25, maxX:125, minY:150, maxY:450});
                offender.ejecting = true;
                offender.ejectTargetX = target.x;
                offender.ejectTargetY = target.y;
                gkClaimed = true;
                setTimeout(() => { window._gkStealInProgress = false; }, 50);
            }
        }
        if (!gkClaimed) {
            let defender = ball.owner.team === 'red' ? getActivePlayer('blue') : getActivePlayer('red');
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
                    matchStats.tackles[defender.team]++;
                }
            }
        }
    }

    // Update match stats (possession)
    const totalTime = matchStats.possessionTimer.red + matchStats.possessionTimer.blue;
    if (totalTime > 0) {
        matchStats.possession.red = matchStats.possessionTimer.red / totalTime;
        matchStats.possession.blue = matchStats.possessionTimer.blue / totalTime;
    }

    // Passes tracking (simplified)
    if (ball.owner && ball.cooldownPlayer && ball.cooldownPlayer !== ball.owner) {
        // A pass happened
        if (ball.owner.team === 'red') matchStats.passes.red++;
        else matchStats.passes.blue++;
    }

    // Update DOM stats
    updateStatsUI();
}

// ---------- STATS UI ----------
function updateStatsUI() {
    const poss = document.getElementById('possessionStat');
    if (poss) poss.textContent = Math.round(matchStats.possession.red * 100) + '%';
    const shots = document.getElementById('shotsStat');
    if (shots) shots.textContent = matchStats.shots.red + '-' + matchStats.shots.blue;
    const passes = document.getElementById('passesStat');
    if (passes) passes.textContent = matchStats.passes.red + matchStats.passes.blue;
    const rank = document.getElementById('rankStat');
    if (rank) rank.textContent = currentRank;
}

// ---------- RANK ----------
function updateRank() {
    const thresholds = [0, 50, 150, 300, 500];
    let newRank = 'Bronze';
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (rankPoints >= thresholds[i]) { newRank = ranks[i]; break; }
    }
    currentRank = newRank;
}

// ---------- SHOOT ----------
function shootBall(passer) {
    if (!window._gkStealInProgress) SoundManager.playSFX('kick', 0.8);
    const spawnDist = passer.radius + ball.radius + 6;
    ball.x = passer.x + Math.cos(arrowAngle) * spawnDist;
    ball.y = passer.y + Math.sin(arrowAngle) * spawnDist;
    const power = ball.speed || 13;
    ball.vx = Math.cos(arrowAngle) * power;
    ball.vy = Math.sin(arrowAngle) * power;
    ball.cooldownPlayer = passer;
    ball.cooldownTimer = 20;
    ball.owner = null;
    if (passer.isGk) gkTimer = 0;
    aiReactionTimer = 20;
    // Reset power
    ball.speed = 13;
}

function doAiGkPass(gk) {
    if (Math.random() < 0.50) {
        let teammates = players.filter(p => p.team === gk.team && !p.isGk);
        let target = teammates[Math.floor(Math.random() * teammates.length)];
        if (target) arrowAngle = Math.atan2(target.y - gk.y, target.x - gk.x);
        else arrowAngle = Math.atan2((Math.random()-0.5), -1);
    } else arrowAngle = Math.atan2((Math.random()-0.5), -1);
    shootBall(gk);
}

// ---------- QUICK REMATCH ----------
quickRematchBtn.addEventListener('click', () => {
    if (currentState === 'MATCH_END') {
        SoundManager.playSFX('menuClick', 0.5);
        initMatch();
        currentState = 'PLAY';
        SoundManager.updateMusicForState(currentState);
        document.getElementById('quickRematch').style.display = 'none';
        isQuickRematchVisible = false;
    }
});

// ---------- GAME LOOP ----------
let lastTime = 0;
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// ---------- BOOTSTRAP ----------
function bootstrap() {
    if (gameRunning) return;
    try {
        const depsReady = typeof initMatch === 'function' && typeof updateTouchUI === 'function';
        if (!depsReady) { setTimeout(bootstrap, 50); return; }
        initMatch();
        updateTouchUI();
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        gameRunning = true;
        console.log('Pro Striker ULTIMATE EDITION loaded!');
    } catch(e) { console.error(e); }
}
window.bootstrap = bootstrap;
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => { if (typeof window.bootstrap === 'function') window.bootstrap(); }, 0);
} else {
    window.addEventListener('load', () => { if (typeof window.bootstrap === 'function') window.bootstrap(); });
}