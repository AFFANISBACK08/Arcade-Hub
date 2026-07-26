// ============================================
// BLOCK SYSTEM
// ============================================


const BLOCK_TYPES = {

    GRASS: "grass",

    DIRT: "dirt",

    STONE: "stone",

    WOOD: "wood",

    LEAVES: "leaves"

};


// ============================================
// BLOCK PROPERTIES
// ============================================

const BLOCK_PROPERTIES = {

    grass: {

        hardness: 0.6,

        drop: "grass"

    },

    dirt: {

        hardness: 0.5,

        drop: "dirt"

    },

    stone: {

        hardness: 2.5,

        drop: "stone"

    },

    wood: {

        hardness: 1.5,

        drop: "wood"

    },

    leaves: {

        hardness: 0.3,

        drop: "leaves"

    }

};


// ============================================
// MATERIALS
// ============================================

const blockMaterials = {};


// Grass

blockMaterials.grass =

    new THREE.MeshLambertMaterial({

        color: 0x5fae3e

    });


// Dirt

blockMaterials.dirt =

    new THREE.MeshLambertMaterial({

        color: 0x8b5a2b

    });


// Stone

blockMaterials.stone =

    new THREE.MeshLambertMaterial({

        color: 0x888888

    });


// Wood

blockMaterials.wood =

    new THREE.MeshLambertMaterial({

        color: 0x8b6b4d

    });


// Leaves

blockMaterials.leaves =

    new THREE.MeshLambertMaterial({

        color: 0x2e8b57,

        transparent: true,

        opacity: 0.9

    });


// ============================================
// BLOCK GEOMETRY
// ============================================

const blockGeometry =

    new THREE.BoxGeometry(

        1,

        1,

        1

    );


// ============================================
// CREATE BLOCK
// ============================================

function createBlock(

    x,

    y,

    z,

    type

) {

    const material =

        blockMaterials[type];


    if (!material) {

        return null;

    }


    const block =

        new THREE.Mesh(

            blockGeometry,

            material

        );


    block.position.set(

        x + 0.5,

        y + 0.5,

        z + 0.5

    );


    block.userData = {

        x: x,

        y: y,

        z: z,

        type: type

    };


    block.castShadow = true;

    block.receiveShadow = true;


    return block;

}