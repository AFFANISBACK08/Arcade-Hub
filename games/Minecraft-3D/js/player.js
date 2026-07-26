// ============================================
// PLAYER SYSTEM
// ============================================


// ============================================
// POINTER LOCK
// ============================================

const controls =

    new THREE.PointerLockControls(

        camera,

        document.body

    );


// ============================================
// START SCREEN
// ============================================

const startScreen =

    document.getElementById(

        "startScreen"

    );


const playButton =

    document.getElementById(

        "playButton"

    );


// ============================================
// PLAY BUTTON
// ============================================

playButton.addEventListener(

    "click",

    function() {

        controls.lock();

    }

);


// ============================================
// GAME START
// ============================================

controls.addEventListener(

    "lock",

    function() {

        startScreen.style.display =

            "none";

    }

);


// ============================================
// GAME PAUSE
// ============================================

controls.addEventListener(

    "unlock",

    function() {

        startScreen.style.display =

            "flex";

    }

);


// ============================================
// PLAYER POSITION
// ============================================

camera.position.set(

    0,

    3,

    5

);


// ============================================
// PLAYER SETTINGS
// ============================================

const PLAYER_RADIUS =

    0.3;


const PLAYER_HEIGHT =

    1.8;


const EYE_HEIGHT =

    1.6;


const MOVE_SPEED =

    6;


const GRAVITY =

    22;


const JUMP_FORCE =

    8;


// ============================================
// MOVEMENT
// ============================================

const keys = {

    forward: false,

    backward: false,

    left: false,

    right: false

};


let velocityY = 0;


let canJump = false;


// ============================================
// CHECK PLAYER COLLISION
// ============================================

function playerCollides(

    x,

    y,

    z

) {

    const minX =

        Math.floor(

            x -

            PLAYER_RADIUS

        );


    const maxX =

        Math.floor(

            x +

            PLAYER_RADIUS

        );


    const minY =

        Math.floor(

            y -

            EYE_HEIGHT

        );


    const maxY =

        Math.floor(

            y +

            0.2

        );


    const minZ =

        Math.floor(

            z -

            PLAYER_RADIUS

        );


    const maxZ =

        Math.floor(

            z +

            PLAYER_RADIUS

        );


    for (

        let bx = minX;

        bx <= maxX;

        bx++

    ) {

        for (

            let by = minY;

            by <= maxY;

            by++

        ) {

            for (

                let bz = minZ;

                bz <= maxZ;

                bz++

            ) {

                if (

                    isSolid(

                        bx,

                        by,

                        bz

                    )

                ) {

                    return true;

                }

            }

        }

    }


    return false;

}


// ============================================
// KEY DOWN
// ============================================

document.addEventListener(

    "keydown",

    function(event) {


        if (

            event.code ===

            "KeyW"

        ) {

            keys.forward = true;

        }


        if (

            event.code ===

            "KeyS"

        ) {

            keys.backward = true;

        }


        if (

            event.code ===

            "KeyA"

        ) {

            keys.left = true;

        }


        if (

            event.code ===

            "KeyD"

        ) {

            keys.right = true;

        }


        if (

            event.code ===

            "Space"

        ) {

            event.preventDefault();


            if (

                canJump

            ) {

                velocityY =

                    JUMP_FORCE;


                canJump =

                    false;

            }

        }

    }

);


// ============================================
// KEY UP
// ============================================

document.addEventListener(

    "keyup",

    function(event) {


        if (

            event.code ===

            "KeyW"

        ) {

            keys.forward = false;

        }


        if (

            event.code ===

            "KeyS"

        ) {

            keys.backward = false;

        }


        if (

            event.code ===

            "KeyA"

        ) {

            keys.left = false;

        }


        if (

            event.code ===

            "KeyD"

        ) {

            keys.right = false;

        }

    }

);


// ============================================
// PLAYER UPDATE
// ============================================

function updatePlayer(

    delta

) {


    if (

        !controls.isLocked

    ) {

        return;

    }


    const direction =

        new THREE.Vector3();


    if (

        keys.forward

    ) {

        direction.z -= 1;

    }


    if (

        keys.backward

    ) {

        direction.z += 1;

    }


    if (

        keys.left

    ) {

        direction.x -= 1;

    }


    if (

        keys.right

    ) {

        direction.x += 1;

    }


    if (

        direction.length() >

        0

    ) {


        direction.normalize();


        direction.applyQuaternion(

            camera.quaternion

        );


        direction.y = 0;


        direction.normalize();


        const moveX =

            direction.x *

            MOVE_SPEED *

            delta;


        const moveZ =

            direction.z *

            MOVE_SPEED *

            delta;


        // ====================================
        // X COLLISION
        // ====================================

        const newX =

            camera.position.x +

            moveX;


        if (

            !playerCollides(

                newX,

                camera.position.y,

                camera.position.z

            )

        ) {

            camera.position.x =

                newX;

        }


        // ====================================
        // Z COLLISION
        // ====================================

        const newZ =

            camera.position.z +

            moveZ;


        if (

            !playerCollides(

                camera.position.x,

                camera.position.y,

                newZ

            )

        ) {

            camera.position.z =

                newZ;

        }

    }


    // ========================================
    // GRAVITY
    // ========================================

    velocityY -=

        GRAVITY *

        delta;


    const newY =

        camera.position.y +

        velocityY *

        delta;


    // ========================================
    // VERTICAL COLLISION
    // ========================================

    if (

        !playerCollides(

            camera.position.x,

            newY,

            camera.position.z

        )

    ) {

        camera.position.y =

            newY;


        canJump =

            false;

    }

    else {


        if (

            velocityY < 0

        ) {

            canJump =

                true;

        }


        velocityY =

            0;

    }


    // ========================================
    // FALL PROTECTION
    // ========================================

    if (

        camera.position.y < -20

    ) {

        camera.position.set(

            0,

            3,

            5

        );


        velocityY =

            0;

    }

}