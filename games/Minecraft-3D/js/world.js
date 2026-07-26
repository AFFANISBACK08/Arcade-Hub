// ============================================
// WORLD SYSTEM
// ============================================


const world = new Map();


// ============================================
// WORLD KEY
// ============================================

function getKey(

    x,

    y,

    z

) {

    return (

        x +

        "," +

        y +

        "," +

        z

    );

}


// ============================================
// SET BLOCK
// ============================================

function setBlock(

    x,

    y,

    z,

    type

) {


    world.set(

        getKey(

            x,

            y,

            z

        ),

        type

    );

}


// ============================================
// GET BLOCK
// ============================================

function getBlock(

    x,

    y,

    z

) {


    return world.get(

        getKey(

            x,

            y,

            z

        )

    );

}


// ============================================
// REMOVE BLOCK
// ============================================

function removeBlock(

    x,

    y,

    z

) {


    world.delete(

        getKey(

            x,

            y,

            z

        )

    );

}


// ============================================
// CHECK SOLID
// ============================================

function isSolid(

    x,

    y,

    z

) {


    return world.has(

        getKey(

            x,

            y,

            z

        )

    );

}


// ============================================
// WORLD MESH GROUP
// ============================================

const worldGroup =

    new THREE.Group();


scene.add(

    worldGroup

);


// ============================================
// RENDER WORLD
// ============================================

function renderWorld() {


    worldGroup.clear();


    for (

        const [
            key,
            type
        ]

        of world

    ) {


        const [

            x,

            y,

            z

        ] = key.split(

            ","

        ).map(

            Number

        );


        const block =

            createBlock(

                x,

                y,

                z,

                type

            );


        if (block) {

            worldGroup.add(

                block

            );

        }

    }

}


// ============================================
// GENERATE BASIC WORLD
// ============================================

function generateWorld() {


    const WORLD_SIZE = 30;


    for (

        let x =

            -WORLD_SIZE;

        x < WORLD_SIZE;

        x++

    ) {


        for (

            let z =

                -WORLD_SIZE;

            z < WORLD_SIZE;

            z++

        ) {


            // Grass

            setBlock(

                x,

                0,

                z,

                BLOCK_TYPES.GRASS

            );


            // Dirt

            setBlock(

                x,

                -1,

                z,

                BLOCK_TYPES.DIRT

            );


            setBlock(

                x,

                -2,

                z,

                BLOCK_TYPES.DIRT

            );


            // Stone

            setBlock(

                x,

                -3,

                z,

                BLOCK_TYPES.STONE

            );


            setBlock(

                x,

                -4,

                z,

                BLOCK_TYPES.STONE

            );

        }

    }


    // Trees

    for (

        let i = 0;

        i < 25;

        i++

    ) {


        const x =

            Math.floor(

                Math.random() *

                WORLD_SIZE * 2

            ) -

            WORLD_SIZE;


        const z =

            Math.floor(

                Math.random() *

                WORLD_SIZE * 2

            ) -

            WORLD_SIZE;


        createTree(

            x,

            1,

            z

        );

    }


    renderWorld();

}


// ============================================
// TREE
// ============================================

function createTree(

    x,

    y,

    z

) {


    const height = 4;


    for (

        let i = 0;

        i < height;

        i++

    ) {


        setBlock(

            x,

            y + i,

            z,

            BLOCK_TYPES.WOOD

        );

    }


    for (

        let dx = -2;

        dx <= 2;

        dx++

    ) {


        for (

            let dz = -2;

            dz <= 2;

            dz++

        ) {


            for (

                let dy = 3;

                dy <= 5;

                dy++

            ) {


                if (

                    Math.abs(dx) +

                    Math.abs(dz) < 4

                ) {


                    setBlock(

                        x + dx,

                        y + dy,

                        z + dz,

                        BLOCK_TYPES.LEAVES

                    );

                }

            }

        }

    }

}


// ============================================
// START WORLD
// ============================================

generateWorld();