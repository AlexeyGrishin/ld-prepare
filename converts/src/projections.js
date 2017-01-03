//converts 2d image to 3d model using simple conversion

function forEach(imageData, condition, fn) {
    for (let y = 0; y < imageData.height; y++) {
        let idx = y * imageData.width * 4;
        for (let x = 0; x < imageData.width; x++) {
            let r = imageData.data[idx];
            let g = imageData.data[idx+1];
            let b = imageData.data[idx+2];
            let a = imageData.data[idx+3];
            let color = (r << 16) | (g << 8) | b;
            if (condition(x, y, color, a)) {
                fn(x, y, color, a);
            }
            idx+=4;
        }
    }
}

function nonTransparent(x, y, color, a) { return  a > 0; }

function projectFlatX(imageData, voxelModel, {width = 1, offset = 0}) {
    forEach(imageData, nonTransparent, (x, y, color) => {
        for (let ny = offset; ny <= offset+width; ny++) {
            voxelModel.setVoxel(x, ny, imageData.height - 1 - y, color);
        }
    });
}

function projectFlatY(imageData, voxelModel, {width = 1, offset = 0}) {
    forEach(imageData, nonTransparent, (x, y, color) => {
        for (let nx = offset; nx <= offset+width; nx++) {
            voxelModel.setVoxel(nx, x, imageData.height - 1 - y, color);
        }
    });
}

function projectSymmetric(imageData, voxelModel) {
    let cx = imageData.width/2;
    forEach(imageData, nonTransparent, (x, y, color) => {
        if (x > cx) return; //it is symetric, we need to analyze only half of image
        let radius = Math.abs(cx - x);
        for (let nx = x; nx < imageData.width-x; nx++) {
            for (let ny = x; ny < imageData.width-x; ny++) {
                if (Math.hypot(nx-cx, ny-cx) <= radius) {
                    voxelModel.setVoxel(nx, ny, imageData.height - 1 -y, color);
                }
            }
        }
    });
}

module.exports = {
    projectFlatX,
    projectFlatY,
    projectSymmetric
};