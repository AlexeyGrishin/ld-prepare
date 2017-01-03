let Vox = require('./formats/vox');
let VoxelModel = require('./voxel_model');
let VerticesModel = require('./vertices_model');
let projections = require('./projections');
let Jimp = require('jimp');

const TIMES = 10;
const USE_CUBE = false;
const USE_AIR = false;

const MX = 72, MY = 72, MZ = 75;

function createVox(proj) {
    let voxModel = USE_CUBE ? new VoxelModel(MX, MY, MZ) : new VoxelModel();
    proj(voxModel);
    voxModel.resizeUpTo(MX, MY, MZ);
    return voxModel;
}

function tryProjection(proj) {
    let t1 = new Date().getTime();
    for (let i = 0; i < TIMES; i++) {
        createVox(proj);
    }
    let voxTime = new Date().getTime() - t1;
    let voxModel = createVox(proj);
    //voxModel._cube.debug("", true, 2);
    /*console.time("air");
    for (let i = 0; i < TIMES; i++) {
        voxModel.getAir();
    }
    console.timeEnd("air");*/
    /*console.time("aircube");
    for (let i = 0; i < TIMES; i++) {
        voxModel.getAirCube();
    }
    console.timeEnd("aircube");
    console.time("cubemap");
    for (let i = 0; i < TIMES; i++) {
        voxModel.toCubemap();
    }
    console.timeEnd("cubemap");*/

    let t2 = new Date().getTime();
    for (let i = 0; i < TIMES; i++) {
        let verModel = new VerticesModel();
        verModel.addVoxelModel(voxModel, !USE_AIR);
    }
    let verTime = new Date().getTime() - t2;

    console.log(voxTime + "\t" + verTime);
}

Jimp.read("../../game3/caco1.png", (err, img) => {
    if (err) return console.error(err);

    for (let w = 1; w <= 24; w++) {
        //console.log(w);
        tryProjection((vox) => projections.projectFlatX(img.bitmap, vox, {offset: 0, width: w}));
    }
});

/*
100 times 16x16x16
 vox: 512.939ms --> 5ms
 vert: 5415.986ms --> 50ms

100 times 24x24x48
 vox: 4262.901ms
 vert: 26470.703ms

10 times 24x24x48
 vox: 468.471ms
 vert: 2596.349ms


last time, 2
 vox: 8.590ms
 air: 1441.429ms
 cubemap: 1502.358ms
 vert: 1531.029ms


size 24, cube
 24
 vox: 281.697ms
 vert: 834.344ms


size 24, no cube
 vox: 55ms
 vert: 907ms
 
 


 */