// ============================================
// BLOCK INTERACTION + INVENTORY
// ============================================


const raycaster =

    new THREE.Raycaster();


const centerScreen =

    new THREE.Vector2(

        0,

        0

    );


// Maximum distance for interaction

const REACH_DISTANCE = 6;


// ============================================
// HOTBAR
// ============================================

const hotbarBlocks = [

    BLOCK_TYPES.GRASS,

    BLOCK_TYPES.DIRT,

    BLOCK_TYPES.STONE,

    BLOCK_TYPES.WOOD,

    BLOCK_TYPES.LEAVES

];


let selectedBlock = 0;


// ============================================
// INVENTORY
// ============================================

const inventory = {

    grass: 10,

    dirt: 10,

    stone: 10,

    wood: 10,

    leaves: 10

};


// ============================================
// CREATE HOTBAR
// ============================================

function createHotbar() {

    const hotbar =

        document.getElementById(

            "hotbar"

        );


    hotbar.innerHTML = "";


    for (

        let i = 0;

        i < hotbarBlocks.length;

        i++

    ) {

        const blockType =

            hotbarBlocks[i];


        const slot =

            document.createElement(

                "div"

            );


        slot.className =

            "hotbarSlot";


        if (

            i === selectedBlock

        ) {

            slot.classList.add(

                "selected"

            );

        }


        if (

            inventory[blockType] <= 0

        ) {

            slot.classList.add(

                "empty"

            );

        }


        slot.innerHTML = `

            <span class="slotNumber">

                ${i + 1}

            </span>


            ${blockType}


            <span class="itemCount">

                ${inventory[blockType]}

            </span>

        `;


        hotbar.appendChild(

            slot

        );

    }

}


createHotbar();


// ============================================
// NUMBER KEYS
// ============================================

document.addEventListener(

    "keydown",

    function(event) {

        const number =

            parseInt(

                event.key

            );


        if (

            number >= 1 &&

            number <= 5

        ) {

            selectedBlock =

                number - 1;


            createHotbar();

        }

    }

);


// ============================================
// MINING SYSTEM
// ============================================

let isMining = false;

let miningBlock = null;

let miningProgress = 0;


const miningUI =

    document.getElementById(

        "miningUI"

    );


const miningFill =

    document.getElementById(

        "miningFill"

    );


const miningText =

    document.getElementById(

        "miningText"

    );


// ============================================
// GET BLOCK UNDER CROSSHAIR
// ============================================

function getTargetBlock() {

    raycaster.setFromCamera(

        centerScreen,

        camera

    );


    const intersects =

        raycaster.intersectObjects(

            worldGroup.children

        );


    if (

        intersects.length === 0

    ) {

        return null;

    }


    const hit =

        intersects[0];


    const block =

        hit.object;


    const distance =

        camera.position.distanceTo(

            hit.point

        );


    if (

        distance > REACH_DISTANCE

    ) {

        return null;

    }


    return {

        block: block,

        hit: hit,

        data: block.userData

    };

}


// ============================================
// START MINING
// ============================================

function startMining() {

    const target =

        getTargetBlock();


    if (!target) {

        return;

    }


    const data =

        target.data;


    miningBlock = {

        x: data.x,

        y: data.y,

        z: data.z,

        type: data.type

    };


    isMining = true;

    miningProgress = 0;


    miningUI.style.display =

        "flex";


    miningText.textContent =

        "Mining " +

        data.type +

        "...";

}


// ============================================
// STOP MINING
// ============================================

function stopMining() {

    isMining = false;

    miningProgress = 0;

    miningBlock = null;


    miningUI.style.display =

        "none";


    miningFill.style.width =

        "0%";

}


// ============================================
// MOUSE DOWN
// ============================================

document.addEventListener(

    "mousedown",

    function(event) {

        if (

            !controls.isLocked

        ) {

            return;

        }


        // LEFT CLICK

        if (

            event.button === 0

        ) {

            startMining();

        }


        // RIGHT CLICK

        if (

            event.button === 2

        ) {

            placeBlock();

        }

    }

);


// ============================================
// MOUSE UP
// ============================================

document.addEventListener(

    "mouseup",

    function(event) {

        if (

            event.button === 0

        ) {

            stopMining();

        }

    }

);


// ============================================
// PLACE BLOCK
// ============================================

function placeBlock() {

    const target =

        getTargetBlock();


    if (!target) {

        return;

    }


    const data =

        target.data;


    const normal =

        target.hit.face.normal;


    const x =

        data.x +

        Math.round(

            normal.x

        );


    const y =

        data.y +

        Math.round(

            normal.y

        );


    const z =

        data.z +

        Math.round(

            normal.z

        );


    const blockType =

        hotbarBlocks[

            selectedBlock

        ];


    // No items

    if (

        inventory[blockType] <= 0

    ) {

        return;

    }


    // Already occupied

    if (

        isSolid(

            x,

            y,

            z

        )

    ) {

        return;

    }


    // ========================================
    // PLAYER COLLISION CHECK
    // ========================================

    const playerX =

        camera.position.x;


    const playerY =

        camera.position.y;


    const playerZ =

        camera.position.z;


    const playerRadius =

        0.3;


    const playerHeight =

        1.8;


    const blockMinX = x;

    const blockMaxX = x + 1;


    const blockMinY = y;

    const blockMaxY = y + 1;


    const blockMinZ = z;

    const blockMaxZ = z + 1;


    const playerMinX =

        playerX -

        playerRadius;


    const playerMaxX =

        playerX +

        playerRadius;


    const playerMinY =

        playerY -

        1.6;


    const playerMaxY =

        playerY +

        0.2;


    const playerMinZ =

        playerZ -

        playerRadius;


    const playerMaxZ =

        playerZ +

        playerRadius;


    const overlaps =

        playerMaxX > blockMinX &&

        playerMinX < blockMaxX &&

        playerMaxY > blockMinY &&

        playerMinY < blockMaxY &&

        playerMaxZ > blockMinZ &&

        playerMinZ < blockMaxZ;


    if (overlaps) {

        return;

    }


    // ========================================
    // PLACE
    // ========================================

    setBlock(

        x,

        y,

        z,

        blockType

    );


    inventory[blockType]--;


    createHotbar();


    renderWorld();

}


// ============================================
// UPDATE MINING
// ============================================

function updateInteraction(

    delta

) {

    if (

        !isMining ||

        !miningBlock

    ) {

        return;

    }


    const currentTarget =

        getTargetBlock();


    if (!currentTarget) {

        stopMining();

        return;

    }


    const data =

        currentTarget.data;


    // Player looked away

    if (

        data.x !== miningBlock.x ||

        data.y !== miningBlock.y ||

        data.z !== miningBlock.z

    ) {

        stopMining();

        return;

    }


    const properties =

        BLOCK_PROPERTIES[

            miningBlock.type

        ];


    if (!properties) {

        stopMining();

        return;

    }


    // Mining speed

    miningProgress +=

        delta /

        properties.hardness;


    const percent =

        Math.min(

            miningProgress,

            1

        );


    miningFill.style.width =

        (

            percent * 100

        ) +

        "%";


    // Block broken

    if (

        miningProgress >= 1

    ) {

        const drop =

            properties.drop;


        removeBlock(

            miningBlock.x,

            miningBlock.y,

            miningBlock.z

        );


        if (

            inventory[drop] !== undefined

        ) {

            inventory[drop]++;

        }


        createHotbar();


        renderWorld();


        stopMining();

    }

}


// ============================================
// DISABLE RIGHT CLICK MENU
// ============================================

document.addEventListener(

    "contextmenu",

    function(event) {

        event.preventDefault();

    }

);