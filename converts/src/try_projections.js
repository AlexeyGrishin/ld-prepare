let Vox = require('./formats/vox');
let VoxelModel = require('./voxel_model');
let projections = require('./projections');
let Jimp = require('jimp');

function tryProjection(img, filename, proj) {
    let voxModel = new VoxelModel();
    proj(voxModel);
    voxModel.resizeUpTo(16, 16, 16);
    Vox.saveModel(voxModel, filename, (err) => {
        if (err) console.error(err);
    })
}

Jimp.read("./test1.png", (err, img) => {
    if (err) return console.error(err);

    img.crop(3*16, 0, 16, 16);
    img.write("test1_cropped2.png");

    tryProjection(img, "zabor-sym.vox", (vox) => projections.projectSymmetric(img.bitmap, vox) );
    tryProjection(img, "zabor-x.vox", (vox) => projections.projectFlatX(img.bitmap, vox, {width: 4, offset: 5}) );
    tryProjection(img, "zabor-y.vox", (vox) => projections.projectFlatY(img.bitmap, vox, {width: 4, offset: 0}) );

});