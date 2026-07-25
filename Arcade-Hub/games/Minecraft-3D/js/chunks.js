// ============================================
// CHUNK SYSTEM
// ============================================


// Chunk size

const CHUNK_SIZE = 16;


// ============================================
// CHUNK KEY
// ============================================

function getChunkKey(

    chunkX,

    chunkZ

) {


    return (

        chunkX +

        "," +

        chunkZ

    );

}


// ============================================
// GET CHUNK COORDINATES
// ============================================

function getChunkCoordinates(

    x,

    z

) {


    return {

        x:

            Math.floor(

                x /

                CHUNK_SIZE

            ),

        z:

            Math.floor(

                z /

                CHUNK_SIZE

            )

    };

}


// ============================================
// CHUNK PLACEHOLDER
// ============================================

const loadedChunks =

    new Map();


// ============================================
// LOAD CHUNK
// ============================================

function loadChunk(

    chunkX,

    chunkZ

) {


    const key =

        getChunkKey(

            chunkX,

            chunkZ

        );


    if (

        loadedChunks.has(

            key

        )

    ) {

        return;

    }


    loadedChunks.set(

        key,

        true

    );

}


// ============================================
// UNLOAD CHUNK
// ============================================

function unloadChunk(

    chunkX,

    chunkZ

) {


    const key =

        getChunkKey(

            chunkX,

            chunkZ

        );


    loadedChunks.delete(

        key

    );

}