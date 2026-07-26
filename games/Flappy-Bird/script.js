const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let bird = { x: 50, y: 300, size: 24, vy: 0, gravity: 0.4, jump: -7 };
let pipes = [];
let score = 0;
let frame = 0;
let gameOver = false;
let gameStarted = false;

function reset() {
    bird.y = 300; bird.vy = 0; pipes = []; score = 0; frame = 0;
    gameOver = false; gameStarted = true;
}

function flap() {
    if (gameOver) reset();
    else if (!gameStarted) gameStarted = true;
    bird.vy = bird.jump;
}

window.addEventListener('keydown', (e) => { if (e.code === 'Space') flap(); });
window.addEventListener('click', flap);

function update() {
    if (!gameStarted || gameOver) return;
    
    bird.vy += bird.gravity;
    bird.y += bird.vy;

    if (bird.y + bird.size > canvas.height || bird.y < 0) gameOver = true;

    if (frame % 100 === 0) {
        let gap = 140;
        let topH = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false });
    }

    pipes.forEach(p => {
        p.x -= 3;
        if (!p.passed && p.x + 40 < bird.x) { score++; p.passed = true; }
        if (bird.x < p.x + 50 && bird.x + bird.size > p.x &&
           (bird.y < p.top || bird.y + bird.size > canvas.height - p.bottom)) {
            gameOver = true;
        }
    });

    pipes = pipes.filter(p => p.x > -60);
    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Bird
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI*2);
    ctx.fill();

    // Draw Pipes
    ctx.fillStyle = '#2ecc71';
    pipes.forEach(p => {
        ctx.fillRect(p.x, 0, 50, p.top);
        ctx.fillRect(p.x, canvas.height - p.bottom, 50, p.bottom);
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    if (!gameStarted) {
        ctx.fillText('CLICK TO START', 50, 300);
    } else {
        ctx.fillText(score, 20, 40);
        if (gameOver) ctx.fillText('GAME OVER', 90, 300);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();