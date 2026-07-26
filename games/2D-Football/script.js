// =========================================================
// PRO STRIKER
// CROSS-DEVICE EDITION
// PC + LAPTOP + MOBILE + TABLET
// =========================================================


// =========================================================
// CANVAS SETUP
// =========================================================

const canvas =
    document.getElementById('footballCanvas');

const ctx =
    canvas.getContext('2d');


// The game ALWAYS uses this internal resolution.
// CSS scales it to the player's screen.

const GAME_WIDTH = 900;
const GAME_HEIGHT = 600;

canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;


// =========================================================
// GAME STATES
// =========================================================

let currentState = 'MENU';

let score = {
    red: 0,
    blue: 0
};

let maxScore = 5;


// =========================================================
// BALL
// =========================================================

let ball = {

    x: 450,
    y: 300,

    radius: 9,

    vx: 0,
    vy: 0,

    owner: null,

    speed: 13,

    cooldownPlayer: null,

    cooldownTimer: 0
};


// =========================================================
// PLAYERS
// =========================================================

let players = [];

let arrowAngle = 0;

let gkSpeed = 2.5;

let gkDirection = {
    red: 1,
    blue: -1
};


// =========================================================
// GAME EFFECTS
// =========================================================

let goalBannerTimer = 0;

let lastScorer = '';

let nextKickoffTeam = null;

let particles = [];


// =========================================================
// GOAL POSTS
// =========================================================

const posts = [

    {
        x: 25,
        y: 200,
        radius: 7
    },

    {
        x: 25,
        y: 400,
        radius: 7
    },

    {
        x: 875,
        y: 200,
        radius: 7
    },

    {
        x: 875,
        y: 400,
        radius: 7
    }

];


// =========================================================
// KEYBOARD / TOUCH INPUT
// =========================================================

const keys = {

    w: false,
    a: false,
    s: false,
    d: false,

    space: false,

    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,

    enter: false

};


// =========================================================
// INPUT HELPER
// =========================================================

function setKeyState(key, state) {

    if (keys.hasOwnProperty(key)) {

        keys[key] = state;

    }

}


// =========================================================
// KEYBOARD DOWN
// =========================================================

window.addEventListener(
    'keydown',
    function (e) {

        const key =
            e.key.toLowerCase();

        if (
            [
                ' ',
                'enter',
                'arrowup',
                'arrowdown',
                'arrowleft',
                'arrowright'
            ].includes(key)
        ) {

            e.preventDefault();

        }


        if (
            e.code === 'Space' ||
            e.key === ' '
        ) {

            keys.space = true;

        }


        if (e.key === 'Enter') {

            keys.enter = true;

        }


        if (
            keys.hasOwnProperty(key) &&
            key !== ' '
        ) {

            keys[key] = true;

        }


        if (
            keys.hasOwnProperty(e.key)
        ) {

            keys[e.key] = true;

        }


        // MENU

        if (currentState === 'MENU') {

            if (e.key === '1') {

                initGame();

                currentState = 'PLAY';

            }

            else if (e.key === '2') {

                currentState =
                    'INSTRUCTIONS';

            }

            else if (e.key === '3') {

                currentState =
                    'SETTINGS';

            }

        }


        // BACK

        else if (
            currentState ===
                'INSTRUCTIONS' ||
            currentState ===
                'SETTINGS'
        ) {

            if (
                e.key === 'Escape' ||
                e.key === 'Backspace'
            ) {

                currentState = 'MENU';

            }

        }


        // SETTINGS

        if (
            currentState ===
            'SETTINGS'
        ) {

            if (
                e.key === 'ArrowUp'
            ) {

                maxScore++;

            }

            if (
                e.key === 'ArrowDown' &&
                maxScore > 1
            ) {

                maxScore--;

            }

        }

    }
);


// =========================================================
// KEYBOARD UP
// =========================================================

window.addEventListener(
    'keyup',
    function (e) {

        const key =
            e.key.toLowerCase();


        if (
            e.code === 'Space' ||
            e.key === ' '
        ) {

            keys.space = false;

        }


        if (
            e.key === 'Enter'
        ) {

            keys.enter = false;

        }


        if (
            keys.hasOwnProperty(key) &&
            key !== ' '
        ) {

            keys[key] = false;

        }


        if (
            keys.hasOwnProperty(e.key)
        ) {

            keys[e.key] = false;

        }

    }
);


// =========================================================
// PREVENT STUCK KEYS
// =========================================================

window.addEventListener(
    'blur',
    function () {

        for (
            let key in keys
        ) {

            keys[key] = false;

        }

    }
);


// =========================================================
// CREATE PLAYERS
// =========================================================

function createPlayers() {

    players = [];


    // RED TEAM

    players.push({

        id: 0,

        team: 'red',

        x: 50,
        y: 300,

        radius: 16,

        color: '#e74c3c',

        gradColor: '#c0392b',

        isGk: true,

        num: '1'

    });


    players.push({

        id: 1,

        team: 'red',

        x: 250,
        y: 150,

        radius: 16,

        color: '#ff5252',

        gradColor: '#d63031',

        isGk: false,

        num: '7'

    });


    players.push({

        id: 2,

        team: 'red',

        x: 250,
        y: 450,

        radius: 16,

        color: '#ff5252',

        gradColor: '#d63031',

        isGk: false,

        num: '9'

    });


    players.push({

        id: 3,

        team: 'red',

        x: 380,
        y: 300,

        radius: 16,

        color: '#ff5252',

        gradColor: '#d63031',

        isGk: false,

        num: '10'

    });


    // BLUE TEAM

    players.push({

        id: 4,

        team: 'blue',

        x: 850,
        y: 300,

        radius: 16,

        color: '#3498db',

        gradColor: '#2980b9',

        isGk: true,

        num: '1'

    });


    players.push({

        id: 5,

        team: 'blue',

        x: 650,
        y: 150,

        radius: 16,

        color: '#48dbfb',

        gradColor: '#0984e3',

        isGk: false,

        num: '8'

    });


    players.push({

        id: 6,

        team: 'blue',

        x: 650,
        y: 450,

        radius: 16,

        color: '#48dbfb',

        gradColor: '#0984e3',

        isGk: false,

        num: '11'

    });


    players.push({

        id: 7,

        team: 'blue',

        x: 520,
        y: 300,

        radius: 16,

        color: '#48dbfb',

        gradColor: '#0984e3',

        isGk: false,

        num: '10'

    });

}


// =========================================================
// INIT GAME
// =========================================================

function initGame() {

    score = {

        red: 0,

        blue: 0

    };

    nextKickoffTeam = null;

    resetField();

}


// =========================================================
// RESET FIELD
// =========================================================

function resetField() {

    createPlayers();


    ball.x = 450;

    ball.y = 300;

    ball.vx = 0;

    ball.vy = 0;

    ball.cooldownPlayer = null;

    ball.cooldownTimer = 0;


    let outfielders =
        players.filter(
            p => !p.isGk
        );


    if (
        nextKickoffTeam
    ) {

        outfielders =
            outfielders.filter(
                p =>
                    p.team ===
                    nextKickoffTeam
            );

    }


    ball.owner =
        outfielders[
            Math.floor(
                Math.random() *
                outfielders.length
            )
        ];

}


// =========================================================
// GOAL CONFETTI
// =========================================================

function spawnGoalConfetti() {

    particles = [];


    const colors = [

        '#f1c40f',

        '#e74c3c',

        '#3498db',

        '#2ecc71',

        '#e056fd',

        '#ffffff'

    ];


    for (
        let i = 0;
        i < 90;
        i++
    ) {

        particles.push({

            x: 450,

            y: 250,

            vx:
                (Math.random() - 0.5) *
                16,

            vy:
                (Math.random() - 0.7) *
                16,

            size:
                Math.random() *
                7 +
                4,

            color:
                colors[
                    Math.floor(
                        Math.random() *
                        colors.length
                    )
                ],

            rotation:
                Math.random() *
                Math.PI *
                2,

            vRot:
                (Math.random() - 0.5) *
                0.2,

            life: 100

        });

    }

}


// =========================================================
// UPDATE PARTICLES
// =========================================================

function updateParticles() {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        let p =
            particles[i];


        p.x += p.vx;

        p.y += p.vy;

        p.vy += 0.25;

        p.rotation += p.vRot;

        p.life--;


        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );

        }

    }

}


// =========================================================
// STAR
// =========================================================

function drawStar(
    cx,
    cy,
    spikes,
    outerRadius,
    innerRadius
) {

    let rot =
        Math.PI / 2 * 3;

    let x = cx;

    let y = cy;

    let step =
        Math.PI /
        spikes;


    ctx.beginPath();

    ctx.moveTo(
        cx,
        cy - outerRadius
    );


    for (
        let i = 0;
        i < spikes;
        i++
    ) {

        x =
            cx +
            Math.cos(rot) *
            outerRadius;

        y =
            cy +
            Math.sin(rot) *
            outerRadius;

        ctx.lineTo(
            x,
            y
        );


        rot += step;


        x =
            cx +
            Math.cos(rot) *
            innerRadius;

        y =
            cy +
            Math.sin(rot) *
            innerRadius;

        ctx.lineTo(
            x,
            y
        );


        rot += step;

    }


    ctx.lineTo(
        cx,
        cy - outerRadius
    );

    ctx.closePath();


    ctx.fillStyle =
        '#f1c40f';

    ctx.fill();

}


// =========================================================
// GET ACTIVE PLAYER
// =========================================================

function getActivePlayer(team) {

    if (
        ball.owner &&
        ball.owner.team === team
    ) {

        return ball.owner;

    }


    let closest = null;

    let minDist = Infinity;


    for (
        let p of players
    ) {

        if (
            p.team === team &&
            !p.isGk
        ) {

            let dist =
                Math.hypot(
                    p.x - ball.x,
                    p.y - ball.y
                );


            if (
                dist < minDist
            ) {

                minDist = dist;

                closest = p;

            }

        }

    }


    return closest;

}


// =========================================================
// SHOOT BALL
// =========================================================

function shootBall(
    passer
) {

    let spawnDistance =
        passer.radius +
        ball.radius +
        6;


    ball.x =
        passer.x +
        Math.cos(
            arrowAngle
        ) *
        spawnDistance;


    ball.y =
        passer.y +
        Math.sin(
            arrowAngle
        ) *
        spawnDistance;


    ball.vx =
        Math.cos(
            arrowAngle
        ) *
        ball.speed;


    ball.vy =
        Math.sin(
            arrowAngle
        ) *
        ball.speed;


    ball.cooldownPlayer =
        passer;


    ball.cooldownTimer =
        20;


    ball.owner = null;

}


// =========================================================
// GOAL
// =========================================================

function triggerGoal(
    scorerText,
    concedingTeam
) {

    lastScorer =
        scorerText;

    nextKickoffTeam =
        concedingTeam;

    currentState =
        'GOAL_SCORED';

    spawnGoalConfetti();

}


// =========================================================
// BOX COLLISION
// =========================================================

function resolveBoxCollision(
    player,
    box
) {

    let closestX =
        Math.max(
            box.minX,
            Math.min(
                player.x,
                box.maxX
            )
        );


    let closestY =
        Math.max(
            box.minY,
            Math.min(
                player.y,
                box.maxY
            )
        );


    let dx =
        player.x -
        closestX;


    let dy =
        player.y -
        closestY;


    let distance =
        Math.hypot(
            dx,
            dy
        );


    if (
        distance <
        player.radius
    ) {

        if (
            distance === 0
        ) {

            let dLeft =
                Math.abs(
                    player.x -
                    box.minX
                );


            let dRight =
                Math.abs(
                    player.x -
                    box.maxX
                );


            let dTop =
                Math.abs(
                    player.y -
                    box.minY
                );


            let dBottom =
                Math.abs(
                    player.y -
                    box.maxY
                );


            let min =
                Math.min(
                    dLeft,
                    dRight,
                    dTop,
                    dBottom
                );


            if (
                min === dLeft
            ) {

                player.x =
                    box.minX -
                    player.radius;

            }

            else if (
                min === dRight
            ) {

                player.x =
                    box.maxX +
                    player.radius;

            }

            else if (
                min === dTop
            ) {

                player.y =
                    box.minY -
                    player.radius;

            }

            else {

                player.y =
                    box.maxY +
                    player.radius;

            }

        }

        else {

            let overlap =
                player.radius -
                distance;


            player.x +=
                (dx / distance) *
                overlap;


            player.y +=
                (dy / distance) *
                overlap;

        }

    }

}


// =========================================================
// GAME UPDATE
// =========================================================

function update() {

    updateParticles();


    // GOAL STATE

    if (
        currentState ===
        'GOAL_SCORED'
    ) {

        goalBannerTimer++;


        if (
            goalBannerTimer >
            110
        ) {

            goalBannerTimer = 0;


            if (
                score.red >=
                    maxScore ||
                score.blue >=
                    maxScore
            ) {

                alert(

                    (
                        score.red >=
                        maxScore
                    )
                        ? "RED TEAM WINS THE MATCH!"
                        : "BLUE TEAM WINS THE MATCH!"

                );


                currentState =
                    'MENU';

            }

            else {

                resetField();

                currentState =
                    'PLAY';

            }

        }


        return;

    }


    if (
        currentState !==
        'PLAY'
    ) {

        return;

    }


    // BALL COOLDOWN

    if (
        ball.cooldownTimer >
        0
    ) {

        ball.cooldownTimer--;


        if (
            ball.cooldownTimer <=
            0
        ) {

            ball.cooldownPlayer =
                null;

        }

    }


    // =====================================================
    // GOALKEEPER PATROL
    // =====================================================

    for (
        let p of players
    ) {

        if (
            p.isGk &&
            ball.owner !== p
        ) {

            let dir =
                p.team === 'red'
                    ? gkDirection.red
                    : gkDirection.blue;


            p.y +=
                gkSpeed *
                dir;


            if (
                p.y < 210 ||
                p.y > 390
            ) {

                if (
                    p.team ===
                    'red'
                ) {

                    gkDirection.red *=
                        -1;

                }

                else {

                    gkDirection.blue *=
                        -1;

                }

            }


            p.x =
                p.team === 'red'
                    ? 50
                    : 850;

        }

    }


    let activeRed =
        getActivePlayer(
            'red'
        );


    let activeBlue =
        getActivePlayer(
            'blue'
        );


    let playerSpeed =
        4.5;


    let redGkHasBall =
        ball.owner &&
        ball.owner.team ===
            'red' &&
        ball.owner.isGk;


    let blueGkHasBall =
        ball.owner &&
        ball.owner.team ===
            'blue' &&
        ball.owner.isGk;


    // =====================================================
    // RED PLAYER
    // =====================================================

    if (
        activeRed
    ) {

        let nextX =
            activeRed.x;

        let nextY =
            activeRed.y;


        if (
            keys.w
        ) {

            nextY -=
                playerSpeed;

        }


        if (
            keys.s
        ) {

            nextY +=
                playerSpeed;

        }


        if (
            keys.a
        ) {

            nextX -=
                playerSpeed;

        }


        if (
            keys.d
        ) {

            nextX +=
                playerSpeed;

        }


        activeRed.x =
            nextX;


        activeRed.y =
            nextY;


        if (
            activeRed.isGk
        ) {

            activeRed.x =
                Math.max(
                    25 +
                        activeRed.radius,

                    Math.min(
                        100 -
                            activeRed.radius,

                        activeRed.x
                    )
                );


            activeRed.y =
                Math.max(
                    150 +
                        activeRed.radius,

                    Math.min(
                        450 -
                            activeRed.radius,

                        activeRed.y
                    )
                );

        }

        else {

            activeRed.x =
                Math.max(
                    25 +
                        activeRed.radius,

                    Math.min(
                        875 -
                            activeRed.radius,

                        activeRed.x
                    )
                );


            activeRed.y =
                Math.max(
                    activeRed.radius,

                    Math.min(
                        canvas.height -
                            activeRed.radius,

                        activeRed.y
                    )
                );


            if (
                blueGkHasBall
            ) {

                resolveBoxCollision(

                    activeRed,

                    {
                        minX: 775,

                        maxX: 875,

                        minY: 150,

                        maxY: 450
                    }

                );

            }

        }

    }


    // =====================================================
    // BLUE PLAYER
    // =====================================================

    if (
        activeBlue
    ) {

        let nextX =
            activeBlue.x;

        let nextY =
            activeBlue.y;


        if (
            keys.ArrowUp
        ) {

            nextY -=
                playerSpeed;

        }


        if (
            keys.ArrowDown
        ) {

            nextY +=
                playerSpeed;

        }


        if (
            keys.ArrowLeft
        ) {

            nextX -=
                playerSpeed;

        }


        if (
            keys.ArrowRight
        ) {

            nextX +=
                playerSpeed;

        }


        activeBlue.x =
            nextX;


        activeBlue.y =
            nextY;


        if (
            activeBlue.isGk
        ) {

            activeBlue.x =
                Math.max(
                    800 +
                        activeBlue.radius,

                    Math.min(
                        875 -
                            activeBlue.radius,

                        activeBlue.x
                    )
                );


            activeBlue.y =
                Math.max(
                    150 +
                        activeBlue.radius,

                    Math.min(
                        450 -
                            activeBlue.radius,

                        activeBlue.y
                    )
                );

        }

        else {

            activeBlue.x =
                Math.max(
                    25 +
                        activeBlue.radius,

                    Math.min(
                        875 -
                            activeBlue.radius,

                        activeBlue.x
                    )
                );


            activeBlue.y =
                Math.max(
                    activeBlue.radius,

                    Math.min(
                        canvas.height -
                            activeBlue.radius,

                        activeBlue.y
                    )
                );


            if (
                redGkHasBall
            ) {

                resolveBoxCollision(

                    activeBlue,

                    {
                        minX: 25,

                        maxX: 125,

                        minY: 150,

                        maxY: 450
                    }

                );

            }

        }

    }


    // =====================================================
    // BALL POSSESSION
    // =====================================================

    if (
        ball.owner
    ) {

        ball.x =
            ball.owner.x;


        ball.y =
            ball.owner.y;


        arrowAngle +=
            0.08;


        // RED SHOOT

        if (
            ball.owner.team ===
                'red' &&
            keys.space
        ) {

            shootBall(
                ball.owner
            );

            keys.space =
                false;

        }


        // BLUE SHOOT

        else if (
            ball.owner.team ===
                'blue' &&
            keys.enter
        ) {

            shootBall(
                ball.owner
            );

            keys.enter =
                false;

        }

    }


    // =====================================================
    // FREE BALL
    // =====================================================

    else {

        ball.x +=
            ball.vx;

        ball.y +=
            ball.vy;


        ball.vx *=
            0.985;

        ball.vy *=
            0.985;


        // BALL TRAIL

        if (
            Math.hypot(
                ball.vx,
                ball.vy
            ) > 6 &&
            Math.random() <
                0.4
        ) {

            particles.push({

                x: ball.x,

                y: ball.y,

                vx:
                    (Math.random() -
                        0.5) *
                    2,

                vy:
                    (Math.random() -
                        0.5) *
                    2,

                size:
                    Math.random() *
                    4 +
                    2,

                color:
                    'rgba(255,255,255,0.5)',

                rotation: 0,

                vRot: 0,

                life: 15

            });

        }


        // =================================================
        // POST COLLISION
        // =================================================

        for (
            let post of posts
        ) {

            let dist =
                Math.hypot(

                    ball.x -
                        post.x,

                    ball.y -
                        post.y

                );


            if (
                dist <
                ball.radius +
                    post.radius
            ) {

                let angle =
                    Math.atan2(

                        ball.y -
                            post.y,

                        ball.x -
                            post.x

                    );


                let speed =
                    Math.hypot(

                        ball.vx,

                        ball.vy

                    );


                if (
                    speed < 4
                ) {

                    speed = 4;

                }


                ball.vx =
                    Math.cos(
                        angle
                    ) *
                    speed;


                ball.vy =
                    Math.sin(
                        angle
                    ) *
                    speed;


                let overlap =
                    (
                        ball.radius +
                        post.radius
                    ) -
                    dist +
                    1;


                ball.x +=
                    Math.cos(
                        angle
                    ) *
                    overlap;


                ball.y +=
                    Math.sin(
                        angle
                    ) *
                    overlap;

            }

        }


        // =================================================
        // PITCH BOUNDARIES
        // =================================================

        if (
            ball.y <=
            ball.radius
        ) {

            ball.y =
                ball.radius;

            ball.vy *=
                -1;

        }

        else if (
            ball.y >=
            canvas.height -
                ball.radius
        ) {

            ball.y =
                canvas.height -
                ball.radius;

            ball.vy *=
                -1;

        }


        // =================================================
        // LEFT GOAL
        // =================================================

        if (
            ball.x -
                ball.radius <=
            25
        ) {

            if (
                ball.y >= 200 &&
                ball.y <= 400
            ) {

                if (
                    ball.y -
                        ball.radius <=
                    200
                ) {

                    ball.y =
                        200 +
                        ball.radius;

                    ball.vy *=
                        -1;

                }

                else if (
                    ball.y +
                        ball.radius >=
                    400
                ) {

                    ball.y =
                        400 -
                        ball.radius;

                    ball.vy *=
                        -1;

                }


                if (
                    ball.x -
                        ball.radius <=
                    5
                ) {

                    score.blue++;

                    triggerGoal(

                        'BLUE TEAM SCORES!',

                        'red'

                    );

                    return;

                }

            }

            else {

                ball.x =
                    25 +
                    ball.radius;

                ball.vx *=
                    -1;

            }

        }


        // =================================================
        // RIGHT GOAL
        // =================================================

        if (
            ball.x +
                ball.radius >=
            875
        ) {

            if (
                ball.y >= 200 &&
                ball.y <= 400
            ) {

                if (
                    ball.y -
                        ball.radius <=
                    200
                ) {

                    ball.y =
                        200 +
                        ball.radius;

                    ball.vy *=
                        -1;

                }

                else if (
                    ball.y +
                        ball.radius >=
                    400
                ) {

                    ball.y =
                        400 -
                        ball.radius;

                    ball.vy *=
                        -1;

                }


                if (
                    ball.x +
                        ball.radius >=
                    895
                ) {

                    score.red++;

                    triggerGoal(

                        'RED TEAM SCORES!',

                        'blue'

                    );

                    return;

                }

            }

            else {

                ball.x =
                    875 -
                    ball.radius;

                ball.vx *=
                    -1;

            }

        }


        // =================================================
        // CATCH BALL
        // =================================================

        for (
            let p of players
        ) {

            if (
                ball.cooldownPlayer ===
                p
            ) {

                continue;

            }


            let dist =
                Math.hypot(

                    p.x -
                        ball.x,

                    p.y -
                        ball.y

                );


            if (
                dist <
                p.radius +
                    ball.radius
            ) {

                ball.owner =
                    p;


                ball.vx = 0;

                ball.vy = 0;

                arrowAngle = 0;

                break;

            }

        }

    }


    // =====================================================
    // TACKLING
    // =====================================================

    if (
        ball.owner &&
        !ball.owner.isGk
    ) {

        let defender =

            ball.owner.team ===
            'red'

                ? activeBlue

                : activeRed;


        if (
            defender
        ) {

            let dist =
                Math.hypot(

                    ball.owner.x -
                        defender.x,

                    ball.owner.y -
                        defender.y

                );


            if (
                dist <
                ball.owner.radius +
                    defender.radius +
                    2
            ) {

                let tackler =
                    ball.owner;


                ball.owner =
                    null;


                let tackleAngle =

                    Math.atan2(

                        defender.y -
                            ball.y,

                        defender.x -
                            ball.x

                    ) +
                    Math.PI;


                ball.vx =

                    Math.cos(
                        tackleAngle
                    ) *
                    9;


                ball.vy =

                    Math.sin(
                        tackleAngle
                    ) *
                    9;


                ball.cooldownPlayer =
                    tackler;


                ball.cooldownTimer =
                    15;

            }

        }

    }

}


// =========================================================
// DRAW PITCH
// =========================================================

function drawPitch() {

    const stripeWidth =
        (875 - 25) /
        10;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        ctx.fillStyle =
            i % 2 === 0
                ? '#27ae60'
                : '#2ecc71';


        ctx.fillRect(

            25 +
                i *
                stripeWidth,

            0,

            stripeWidth,

            canvas.height

        );

    }


    // FIELD BORDER

    ctx.strokeStyle =
        '#ffffff';

    ctx.lineWidth = 3;

    ctx.strokeRect(

        25,

        0,

        850,

        canvas.height

    );


    // MIDFIELD

    ctx.beginPath();

    ctx.moveTo(
        450,
        0
    );

    ctx.lineTo(
        450,
        600
    );

    ctx.stroke();


    // CENTER CIRCLE

    ctx.beginPath();

    ctx.arc(

        450,

        300,

        70,

        0,

        Math.PI * 2

    );

    ctx.stroke();


    // CENTER SPOT

    ctx.beginPath();

    ctx.arc(

        450,

        300,

        4,

        0,

        Math.PI * 2

    );

    ctx.fillStyle =
        '#ffffff';

    ctx.fill();


    // PENALTY BOXES

    ctx.strokeRect(

        25,

        150,

        100,

        300

    );


    ctx.strokeRect(

        775,

        150,

        100,

        300

    );


    // PENALTY SPOTS

    ctx.beginPath();

    ctx.arc(

        95,

        300,

        3,

        0,

        Math.PI * 2

    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(

        805,

        300,

        3,

        0,

        Math.PI * 2

    );

    ctx.fill();


    // GOAL NET EFFECT

    ctx.strokeStyle =
        'rgba(255,255,255,0.35)';

    ctx.lineWidth = 1;


    for (
        let y = 200;
        y <= 400;
        y += 15
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            25,
            y
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            875,
            y
        );

        ctx.lineTo(
            900,
            y
        );

        ctx.stroke();

    }


    for (
        let x = 0;
        x <= 25;
        x += 8
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            200
        );

        ctx.lineTo(
            x,
            400
        );

        ctx.stroke();

    }


    for (
        let x = 875;
        x <= 900;
        x += 8
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            200
        );

        ctx.lineTo(
            x,
            400
        );

        ctx.stroke();

    }

}


// =========================================================
// ACTIVE PLAYER INDICATOR
// =========================================================

function drawActiveIndicator(

    p,

    labelText,

    colorHex

) {

    let time =
        Date.now() *
        0.007;


    let pulseRadius =

        p.radius +
        7 +
        Math.sin(time) *
        3;


    ctx.save();


    ctx.beginPath();

    ctx.arc(

        p.x,

        p.y,

        pulseRadius,

        0,

        Math.PI * 2

    );


    ctx.strokeStyle =
        colorHex;

    ctx.lineWidth = 3.5;

    ctx.shadowColor =
        colorHex;

    ctx.shadowBlur = 10;

    ctx.setLineDash(
        [8, 4]
    );

    ctx.stroke();


    ctx.restore();


    ctx.save();


    ctx.fillStyle =
        colorHex;

    ctx.shadowColor =
        colorHex;

    ctx.shadowBlur = 8;


    ctx.beginPath();

    ctx.moveTo(

        p.x - 7,

        p.y -
            p.radius -
            20

    );


    ctx.lineTo(

        p.x + 7,

        p.y -
            p.radius -
            20

    );


    ctx.lineTo(

        p.x,

        p.y -
            p.radius -
            10

    );


    ctx.closePath();

    ctx.fill();


    ctx.font =
        '900 13px Arial';


    ctx.textAlign =
        'center';


    ctx.fillText(

        labelText,

        p.x,

        p.y -
            p.radius -
            24

    );


    ctx.restore();

}


// =========================================================
// SCOREBOARD
// =========================================================

function drawScoreboard() {

    ctx.fillStyle =
        'rgba(15,20,25,0.75)';


    ctx.beginPath();


    ctx.roundRect(

        300,

        15,

        300,

        50,

        25

    );


    ctx.fill();


    ctx.strokeStyle =
        'rgba(255,255,255,0.15)';


    ctx.lineWidth = 1.5;

    ctx.stroke();


    // RED SCORE

    ctx.fillStyle =
        '#ff5252';


    ctx.font =
        '900 28px Arial';


    ctx.textAlign =
        'right';


    ctx.fillText(

        score.red,

        410,

        51

    );


    ctx.font =
        '800 14px Arial';


    ctx.fillStyle =
        '#e74c3c';


    ctx.fillText(

        'RED',

        365,

        48

    );


    // VS

    ctx.fillStyle =
        'rgba(255,255,255,0.4)';


    ctx.font =
        '700 14px Arial';


    ctx.textAlign =
        'center';


    ctx.fillText(

        'VS',

        450,

        48

    );


    // BLUE

    ctx.font =
        '800 14px Arial';


    ctx.fillStyle =
        '#3498db';


    ctx.textAlign =
        'left';


    ctx.fillText(

        'BLUE',

        505,

        48

    );


    ctx.fillStyle =
        '#48dbfb';


    ctx.font =
        '900 28px Arial';


    ctx.fillText(

        score.blue,

        475,

        51

    );

}


// =========================================================
// DRAW MENU
// =========================================================

function drawMenu() {

    ctx.fillStyle =
        '#111827';

    ctx.fillRect(

        0,

        0,

        canvas.width,

        canvas.height

    );


    let grad1 =

        ctx.createRadialGradient(

            250,

            200,

            10,

            250,

            200,

            300

        );


    grad1.addColorStop(

        0,

        'rgba(231,76,60,0.25)'

    );


    grad1.addColorStop(

        1,

        'transparent'

    );


    ctx.fillStyle =
        grad1;


    ctx.fillRect(

        0,

        0,

        900,

        600

    );


    let grad2 =

        ctx.createRadialGradient(

            650,

            400,

            10,

            650,

            400,

            300

        );


    grad2.addColorStop(

        0,

        'rgba(52,152,219,0.25)'

    );


    grad2.addColorStop(

        1,

        'transparent'

    );


    ctx.fillStyle =
        grad2;


    ctx.fillRect(

        0,

        0,

        900,

        600

    );


    ctx.fillStyle =
        '#ffffff';


    ctx.textAlign =
        'center';


    ctx.font =
        '900 52px Arial';


    ctx.fillText(

        'PRO STRIKER',

        450,

        170

    );


    ctx.font =
        '700 20px Arial';


    ctx.fillStyle =
        '#f1c40f';


    ctx.fillText(

        `★ FIRST TO ${maxScore} GOALS WINS ★`,

        450,

        215

    );


    let options = [

        {
            key: '[ 1 ]',

            label:
                'START MATCH',

            y: 290,

            color:
                '#2ecc71'

        },

        {
            key: '[ 2 ]',

            label:
                'INSTRUCTIONS',

            y: 360,

            color:
                '#3498db'

        },

        {
            key: '[ 3 ]',

            label:
                'SETTINGS',

            y: 430,

            color:
                '#e74c3c'

        }

    ];


    for (
        let opt of options
    ) {

        ctx.fillStyle =
            'rgba(255,255,255,0.07)';


        ctx.beginPath();


        ctx.roundRect(

            280,

            opt.y - 32,

            340,

            50,

            12

        );


        ctx.fill();


        ctx.strokeStyle =
            'rgba(255,255,255,0.15)';


        ctx.stroke();


        ctx.font =
            '800 20px Arial';


        ctx.fillStyle =
            opt.color;


        ctx.textAlign =
            'left';


        ctx.fillText(

            opt.key,

            310,

            opt.y + 2

        );


        ctx.fillStyle =
            '#ffffff';


        ctx.fillText(

            opt.label,

            385,

            opt.y + 2

        );

    }

}


// =========================================================
// DRAW INSTRUCTIONS
// =========================================================

function drawInstructions() {

    ctx.fillStyle =
        '#111827';

    ctx.fillRect(

        0,

        0,

        canvas.width,

        canvas.height

    );


    ctx.fillStyle =
        '#ffffff';

    ctx.textAlign =
        'center';


    ctx.font =
        '900 36px Arial';


    ctx.fillText(

        'HOW TO PLAY',

        450,

        80

    );


    ctx.fillStyle =
        'rgba(255,255,255,0.05)';


    ctx.beginPath();


    ctx.roundRect(

        100,

        120,

        700,

        360,

        16

    );


    ctx.fill();


    ctx.font =
        '600 17px Arial';


    ctx.fillStyle =
        '#f1c40f';


    ctx.fillText(

        `MATCH RULE: First team to reach ${maxScore} goals wins the game!`,

        450,

        160

    );


    ctx.fillStyle =
        '#ffffff';


    ctx.fillText(

        '• You automatically control whichever player is nearest to the ball.',

        450,

        200

    );


    ctx.fillText(

        '• RED TEAM: Use [ W, A, S, D ] to Move  |  Press [ SPACE ] to Pass / Shoot',

        450,

        240

    );


    ctx.fillText(

        '• BLUE TEAM: Use [ ARROW KEYS ] to Move  |  Press [ ENTER ] to Pass / Shoot',

        450,

        280

    );


    ctx.fillText(

        '• Aim your shots using the spinning 360° yellow direction arrow.',

        450,

        320

    );


    ctx.fillText(

        '• Goalkeepers are protected: Opponents cannot enter box or tackle GK.',

        450,

        360

    );


    ctx.fillText(

        '• Shots bouncing off the metal posts will ricochet back into play.',

        450,

        400

    );


    ctx.font =
        '700 16px Arial';


    ctx.fillStyle =
        '#95a5a6';


    ctx.fillText(

        'Press [ ESC ] or [ BACKSPACE ] to return to main menu',

        450,

        520

    );

}


// =========================================================
// DRAW SETTINGS
// =========================================================

function drawSettings() {

    ctx.fillStyle =
        '#111827';

    ctx.fillRect(

        0,

        0,

        canvas.width,

        canvas.height

    );


    ctx.fillStyle =
        '#ffffff';

    ctx.textAlign =
        'center';


    ctx.font =
        '900 36px Arial';


    ctx.fillText(

        'MATCH SETTINGS',

        450,

        160

    );


    ctx.fillStyle =
        'rgba(255,255,255,0.05)';


    ctx.beginPath();


    ctx.roundRect(

        200,

        220,

        500,

        200,

        16

    );


    ctx.fill();


    ctx.font =
        '800 24px Arial';


    ctx.fillStyle =
        '#f1c40f';


    ctx.fillText(

        `Target Goal Limit: ${maxScore} Goals`,

        450,

        290

    );


    ctx.font =
        '600 18px Arial';


    ctx.fillStyle =
        '#ffffff';


    ctx.fillText(

        'Use [ UP ] and [ DOWN ] Arrow Keys to modify goal limit',

        450,

        340

    );


    ctx.font =
        '700 16px Arial';


    ctx.fillStyle =
        '#95a5a6';


    ctx.fillText(

        'Press [ ESC ] or [ BACKSPACE ] to return to main menu',

        450,

        480

    );

}


// =========================================================
// DRAW GAME
// =========================================================

function draw() {

    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );


    // MENU

    if (
        currentState ===
        'MENU'
    ) {

        drawMenu();

        return;

    }


    // INSTRUCTIONS

    if (
        currentState ===
        'INSTRUCTIONS'
    ) {

        drawInstructions();

        return;

    }


    // SETTINGS

    if (
        currentState ===
        'SETTINGS'
    ) {

        drawSettings();

        return;

    }


    // =====================================================
    // PITCH
    // =====================================================

    drawPitch();


    // =====================================================
    // PLAYER SHADOWS
    // =====================================================

    for (
        let p of players
    ) {

        ctx.fillStyle =
            'rgba(0,0,0,0.3)';


        ctx.beginPath();


        ctx.ellipse(

            p.x,

            p.y +
                p.radius *
                0.8,

            p.radius *
                0.9,

            p.radius *
                0.45,

            0,

            0,

            Math.PI * 2

        );


        ctx.fill();

    }


    // =====================================================
    // ACTIVE INDICATORS
    // =====================================================

    let activeRed =
        getActivePlayer(
            'red'
        );


    let activeBlue =
        getActivePlayer(
            'blue'
        );


    if (
        activeRed
    ) {

        drawActiveIndicator(

            activeRed,

            'P1',

            '#f39c12'

        );

    }


    if (
        activeBlue
    ) {

        drawActiveIndicator(

            activeBlue,

            'P2',

            '#00ffff'

        );

    }


    // =====================================================
    // PLAYERS
    // =====================================================

    for (
        let p of players
    ) {

        let pGrad =

            ctx.createRadialGradient(

                p.x - 4,

                p.y - 4,

                2,

                p.x,

                p.y,

                p.radius

            );


        pGrad.addColorStop(

            0,

            p.color

        );


        pGrad.addColorStop(

            1,

            p.gradColor

        );


        ctx.beginPath();


        ctx.arc(

            p.x,

            p.y,

            p.radius,

            0,

            Math.PI * 2

        );


        ctx.fillStyle =
            pGrad;


        ctx.fill();


        ctx.lineWidth =
            p.isGk
                ? 3
                : 2;


        ctx.strokeStyle =

            p.isGk
                ? '#f1c40f'
                : '#ffffff';


        ctx.stroke();


        drawStar(

            p.x,

            p.y,

            5,

            8,

            3.5

        );

    }


    // =====================================================
    // GOAL POSTS
    // =====================================================

    for (
        let post of posts
    ) {

        ctx.fillStyle =
            'rgba(0,0,0,0.4)';


        ctx.beginPath();


        ctx.ellipse(

            post.x,

            post.y + 4,

            post.radius,

            post.radius *
                0.5,

            0,

            0,

            Math.PI * 2

        );


        ctx.fill();


        let postGrad =

            ctx.createRadialGradient(

                post.x - 2,

                post.y - 2,

                1,

                post.x,

                post.y,

                post.radius

            );


        postGrad.addColorStop(

            0,

            '#ffffff'

        );


        postGrad.addColorStop(

            1,

            '#bdc3c7'

        );


        ctx.beginPath();


        ctx.arc(

            post.x,

            post.y,

            post.radius,

            0,

            Math.PI * 2

        );


        ctx.fillStyle =
            postGrad;


        ctx.fill();


        ctx.lineWidth =
            1.5;


        ctx.strokeStyle =
            '#2c3e50';


        ctx.stroke();

    }


    // =====================================================
    // BALL SHADOW
    // =====================================================

    ctx.fillStyle =
        'rgba(0,0,0,0.35)';


    ctx.beginPath();


    ctx.ellipse(

        ball.x,

        ball.y +
            ball.radius *
            0.7,

        ball.radius *
            0.9,

        ball.radius *
            0.4,

        0,

        0,

        Math.PI * 2

    );


    ctx.fill();


    // =====================================================
    // BALL
    // =====================================================

    ctx.beginPath();


    ctx.arc(

        ball.x,

        ball.y,

        ball.radius,

        0,

        Math.PI * 2

    );


    ctx.fillStyle =
        '#ffffff';


    ctx.fill();


    ctx.lineWidth =
        1.5;


    ctx.strokeStyle =
        '#1e272e';


    ctx.stroke();


    ctx.fillStyle =
        '#1e272e';


    ctx.beginPath();


    ctx.arc(

        ball.x,

        ball.y,

        3,

        0,

        Math.PI * 2

    );


    ctx.fill();


    // =====================================================
    // AIMING ARROW
    // =====================================================

    if (
        ball.owner
    ) {

        ctx.save();


        let startX =

            ball.owner.x +

            Math.cos(
                arrowAngle
            ) *
            22;


        let startY =

            ball.owner.y +

            Math.sin(
                arrowAngle
            ) *
            22;


        let endX =

            ball.owner.x +

            Math.cos(
                arrowAngle
            ) *
            65;


        let endY =

            ball.owner.y +

            Math.sin(
                arrowAngle
            ) *
            65;


        ctx.beginPath();


        ctx.moveTo(

            startX,

            startY

        );


        ctx.lineTo(

            endX,

            endY

        );


        ctx.lineWidth = 4;


        ctx.strokeStyle =
            '#f1c40f';


        ctx.shadowColor =
            '#f1c40f';


        ctx.shadowBlur = 8;


        ctx.stroke();


        let tipAngle1 =

            arrowAngle +
            Math.PI *
            0.85;


        let tipAngle2 =

            arrowAngle -
            Math.PI *
            0.85;


        ctx.beginPath();


        ctx.moveTo(

            endX,

            endY

        );


        ctx.lineTo(

            endX +
                Math.cos(
                    tipAngle1
                ) *
                11,

            endY +
                Math.sin(
                    tipAngle1
                ) *
                11

        );


        ctx.moveTo(

            endX,

            endY

        );


        ctx.lineTo(

            endX +
                Math.cos(
                    tipAngle2
                ) *
                11,

            endY +
                Math.sin(
                    tipAngle2
                ) *
                11

        );


        ctx.stroke();


        ctx.restore();

    }


    // =====================================================
    // PARTICLES
    // =====================================================

    for (
        let p of particles
    ) {

        ctx.save();


        ctx.translate(

            p.x,

            p.y

        );


        ctx.rotate(

            p.rotation

        );


        ctx.fillStyle =
            p.color;


        ctx.fillRect(

            -p.size / 2,

            -p.size / 2,

            p.size,

            p.size

        );


        ctx.restore();

    }


    // SCOREBOARD

    drawScoreboard();


    // =====================================================
    // GOAL BANNER
    // =====================================================

    if (
        currentState ===
        'GOAL_SCORED'
    ) {

        ctx.fillStyle =
            'rgba(15,23,42,0.85)';


        ctx.fillRect(

            0,

            220,

            900,

            160

        );


        ctx.fillStyle =
            '#f1c40f';


        ctx.font =
            '900 64px Arial';


        ctx.textAlign =
            'center';


        ctx.shadowColor =
            '#f39c12';


        ctx.shadowBlur =
            15;


        ctx.fillText(

            'GOAL!',

            450,

            290

        );


        ctx.shadowBlur = 0;


        ctx.fillStyle =
            '#ffffff';


        ctx.font =
            '800 24px Arial';


        ctx.fillText(

            lastScorer,

            450,

            340

        );

    }

}


// =========================================================
// MOBILE / TABLET TOUCH CONTROLS
// =========================================================

const ctrlButtons =

    document.querySelectorAll(
        '.ctrl-btn'
    );


function pressVirtualKey(
    key
) {

    setKeyState(
        key,
        true
    );

}


function releaseVirtualKey(
    key
) {

    setKeyState(
        key,
        false
    );

}


ctrlButtons.forEach(

    function (btn) {

        const key =

            btn.getAttribute(
                'data-key'
            );


        // POINTER DOWN

        btn.addEventListener(

            'pointerdown',

            function (e) {

                e.preventDefault();


                btn.classList.add(
                    'pressed'
                );


                pressVirtualKey(
                    key
                );


                // Keep pointer captured

                try {

                    btn.setPointerCapture(
                        e.pointerId
                    );

                }

                catch (error) {}

            }

        );


        // POINTER UP

        btn.addEventListener(

            'pointerup',

            function (e) {

                e.preventDefault();


                btn.classList.remove(
                    'pressed'
                );


                releaseVirtualKey(
                    key
                );

            }

        );


        // POINTER CANCEL

        btn.addEventListener(

            'pointercancel',

            function () {

                btn.classList.remove(
                    'pressed'
                );


                releaseVirtualKey(
                    key
                );

            }

        );


        // POINTER LEAVES

        btn.addEventListener(

            'pointerleave',

            function () {

                if (
                    btn.hasPointerCapture
                ) {

                    return;

                }


                btn.classList.remove(
                    'pressed'
                );


                releaseVirtualKey(
                    key
                );

            }

        );

    }

);


// =========================================================
// MENU TOUCH / MOUSE SUPPORT
// =========================================================

canvas.addEventListener(

    'pointerdown',

    function (e) {

        if (
            currentState !==
            'MENU'
        ) {

            return;

        }


        const rect =
            canvas.getBoundingClientRect();


        const scaleX =
            canvas.width /
            rect.width;


        const scaleY =
            canvas.height /
            rect.height;


        const x =

            (
                e.clientX -
                rect.left
            ) *
            scaleX;


        const y =

            (
                e.clientY -
                rect.top
            ) *
            scaleY;


        // START MATCH

        if (
            x >= 280 &&
            x <= 620 &&
            y >= 258 &&
            y <= 308
        ) {

            initGame();

            currentState =
                'PLAY';

        }


        // INSTRUCTIONS

        else if (
            x >= 280 &&
            x <= 620 &&
            y >= 328 &&
            y <= 378
        ) {

            currentState =
                'INSTRUCTIONS';

        }


        // SETTINGS

        else if (
            x >= 280 &&
            x <= 620 &&
            y >= 398 &&
            y <= 448
        ) {

            currentState =
                'SETTINGS';

        }

    }

);


// =========================================================
// START GAME
// =========================================================

initGame();


// =========================================================
// GAME LOOP
// =========================================================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();
