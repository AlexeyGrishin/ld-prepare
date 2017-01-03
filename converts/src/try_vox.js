let VoxelModel = require('./voxel_model');

function compareAirs(model) {
    let air1 = model.getAir();
    let air2 = model.getAirCube();

    for (let val of air1) {
        air2.delete(val);
    }
    for (let val of air2) {
        air1.delete(val);
    }
    if (air1.length || air2.length) {
        console.warn("Elems in airs differ: \n air: ", air1, "\n air cube:", air2);
    }

}

let model = new VoxelModel(8,8,8);

for (let x = 1; x <= 3; x++) {
    for (let y = 1; y <= 3; y++) {
        for (let z = 1; z <= 3; z++) {
            if (x == 2 && y == 2 && z == 2) continue;
            if (x == 2 && y == 3 && z == 2) continue;
            model.setVoxel(x,y,z);
        }
    }
}

model._cube.debug("");

compareAirs(model);

console.log(model.getAir().has("2_2_2"))