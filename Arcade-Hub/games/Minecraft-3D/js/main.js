// ============================================
// MAIN GAME
// ============================================


// ============================================
// SCENE
// ============================================

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x87CEEB
    );


// ============================================
// CAMERA
// ============================================

const camera =
    new THREE.PerspectiveCamera(

        75,

        window.innerWidth /
        window.innerHeight,

        0.1,

        1000

    );


// ============================================
// RENDERER
// ============================================

const renderer =
    new THREE.WebGLRenderer({

        antialias: false

    });


renderer.setSize(

    window.innerWidth,

    window.innerHeight

);


renderer.setPixelRatio(

    Math.min(

        window.devicePixelRatio,

        1.5

    )

);


document.body.appendChild(

    renderer.domElement

);


// ============================================
// LIGHTING
// ============================================

const ambientLight =
    new THREE.AmbientLight(

        0xffffff,

        0.7

    );


scene.add(

    ambientLight

);


const sun =
    new THREE.DirectionalLight(

        0xffffff,

        1

    );


sun.position.set(

    50,

    100,

    50

);


scene.add(

    sun

);


// ============================================
// FOG
// ============================================

scene.fog =
    new THREE.Fog(

        0x87CEEB,

        30,

        100

    );


// ============================================
// GAME LOOP
// ============================================

let previousTime =
    performance.now();


function animate() {


    requestAnimationFrame(

        animate

    );


    const currentTime =
        performance.now();


    const delta =
        Math.min(

            (
                currentTime -
                previousTime
            ) / 1000,

            0.05

        );


    previousTime =
        currentTime;


    // Player

    if (
        typeof updatePlayer ===
        "function"
    ) {

        updatePlayer(

            delta

        );

    }


    // Interaction

    if (
        typeof updateInteraction ===
        "function"
    ) {

        updateInteraction(

            delta

        );

    }


    renderer.render(

        scene,

        camera

    );

}


animate();


// ============================================
// WINDOW RESIZE
// ============================================

window.addEventListener(

    "resize",

    function() {


        camera.aspect =

            window.innerWidth /

            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );

    }

);