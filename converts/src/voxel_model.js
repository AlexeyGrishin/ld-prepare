function ckey(x,y,z) {
    return [x,y,z].join("_");
}

class VoxelModel {

    constructor(width = 0, height = 0, depth = 0) {
        this._width = width;
        this._height = height;
        this._depth = depth;
        //todo: this is simplest for now. when performance problem appeared - we'll need to go with another solution
        this._voxels = {};
    }
    
    resizeUpTo(nw, nh, nd) {
        this._width = Math.max(this._width, nw-1);
        this._height = Math.max(this._height, nh-1);
        this._depth = Math.max(this._depth, nd-1);
    }

    setVoxel(x, y, z, color, props) {
        if (x < 0 || y < 0 || z < 0) throw new Error("xyz shall be >= 0");
        this.resizeUpTo(x,y,z);
        this._voxels[ckey(x,y,z)] = {x, y, z, color: color, props: props || {}};
    }

    getVoxelColor(x, y, z) {
        return this.getVoxel(x, y, z, {}).color;
    }

    getVoxel(x, y, z, ifNull = undefined) {
        return this._voxels[ckey(x,y,z)] || ifNull;
    }

    getVoxelProp(name, x, y, z) {
        return this.getVoxel(x, y, z, {props: {}}).props[name]
    }

    deleteVoxel(x, y, z) {
        delete this._voxels[ckey(x,y,z)];
    }
    
    get voxels() { return Object.keys(this._voxels).map((k) => this._voxels[k]); }

    forEachIn(fn, x0 = 0, y0 = 0, z0 = 0, x1 = this.maxX, y1 = this.maxY, z1 = this.maxZ) {
        let xs = Math.min(x0, x1);
        let ys = Math.min(y0, y1);
        let zs = Math.min(z0, z1);
        let xe = Math.max(x0, x1);
        let ye = Math.max(y0, y1);
        let ze = Math.max(z0, z1);

        let currentVoxel = null, currentKey, x, y, z;
        let changer = (newColor) => {
            if (currentVoxel == null) {
                this._voxels[currentKey] = currentVoxel = {x, y, z, props: {}};
            }
            if (typeof newColor !== "object") {
                currentVoxel.color = newColor;
            } else {
                for (let key in newColor) {
                    if (newColor.hasOwnProperty(key)) {
                        currentVoxel.props[key] = newColor[key];
                    }
                }
            }
        };

        for (x = xs; x <= xe; x++) {
            for (y = ys; y <= ye; y++) {
                for (z = zs; z <= ze; z++) {
                    currentKey = ckey(x,y,z);
                    currentVoxel = this._voxels[currentKey];
                    fn(currentVoxel, x, y, z, changer);
                }
            }
        }

    }

    get maxX() { return this._width; }
    get maxY() { return this._height; }
    get maxZ() { return this._depth; }

    getAir() {
        let air = {};
        let toSeeMap = {"0_0_0": true};
        let toSee = [{x:0,y:0,z:0}];
        while (toSee.length > 0) {
            let {x,y,z} = toSee.shift();
            if (!this.getVoxel(x,y,z)) {
                air[ckey(x,y,z)] = true;
                [[x-1,y,z],[x+1,y,z],[x,y-1,z],[x,y+1,z],[x,y,z-1],[x,y,z+1]].forEach(([nx,ny,nz]) => {
                    let nkey = ckey(nx,ny,nz);
                   if (nx >= 0 && ny >= 0 && nz >= 0 && nx <= this.maxX && ny <= this.maxY && nz <= this.maxZ && !air[nkey] && !toSeeMap[nkey]) {
                       toSee.push({x:nx, y:ny, z:nz});
                       toSeeMap[nkey] = true;
                   }
                });
            }
        }
        return air;
    }


    toCubemap() {

        var cubemaps = [
            [{},{}],    //const-x edges
            [{},{}],    //const-y edges
            [{},{}]     //const-z edges
        ];
        var air = this.getAir();
        //1. add only meaningful edges - which touch air
        for (let vk in this._voxels) {
            if (this._voxels.hasOwnProperty(vk)) {
                let voxel = this._voxels[vk];
                let {x, y, z} = voxel;
                let key = ckey(x, y, z);
                [[x - 1, y, z], [x + 1, y, z], [x, y - 1, z], [x, y + 1, z], [x, y, z - 1], [x, y, z + 1]].forEach(([nx,ny,nz], idx) => {
                    let isAir = nx <= 0 || ny <= 0 || nz <= 0 || nx >= this.maxX + 1 || ny >= this.maxY + 1 || nz >= this.maxZ + 1 || air[ckey(nx, ny, nz)];
                    if (isAir) {
                        let cmi = (idx / 2) | 0, cmj = idx % 2;
                        cubemaps[cmi][cmj][key] = {start: voxel, end: voxel};
                    }
                });
            }

        }
        const axisCheck = [
            ["y", "z", "x", (c1, c2, cc) => ckey(cc, c1, c2)],
            ["x", "z", "y", (c1, c2, cc) => ckey(c1, cc, c2)],
            ["x", "y", "z", (c1, c2, cc) => ckey(c1, c2, cc)]
        ];
        //2. unite edges if possible
        // for each edgemap
        //   first axis - try to check next/prev. if same color - continue. if not on both ends - next step
        //   second axis - try to check next/prev for whole line.
        //todo: different attributes
        
        let equal = (v1, v2) => v1 && v2 && (v2.start ? v1.color === v2.start.color : v1.color === v2.color);
        
        cubemaps.forEach((coordMap, ci) => {
            let [a1,a2,ac, ckey] = axisCheck[ci];
            coordMap.forEach((edgeMap, ei) => {
                
                let toCheck = Object.keys(edgeMap);
                
                while (toCheck.length) {
                    let key = toCheck.shift();
                    //console.log("check ", key);
                    let sq = edgeMap[key];
                    let voxel = sq.start;
                    //check first axis
                    let expanded = false;
                    let c11 = voxel[a1], c12 = voxel[a1];
                    let c21 = voxel[a2], c22 = voxel[a2];
                    let cc = voxel[ac];
                    do {
                        expanded = false;
                        if (equal(voxel, edgeMap[ckey(c11-1, c21, cc)])) {
                            c11--;
                            expanded = true;
                        }
                        if (equal(voxel, edgeMap[ckey(c12+1, c21, cc)])) {
                            c12++;
                            expanded = true;
                        }
                    } while (expanded);
                    //now check second axis
                    do {
                        expanded = false;
                        let allEqual = true;
                        for (let c1 = c11; c1 <= c12; c1++) {
                            if (!equal(voxel, edgeMap[ckey(c1, c21-1, cc)])) {
                                allEqual = false;
                                break;
                            }
                        }
                        if (allEqual) {
                            c21--;
                            expanded = true;
                        }
                        allEqual = true;
                        for (let c1 = c11; c1 <= c12; c1++) {
                            if (!equal(voxel, edgeMap[ckey(c1, c22+1, cc)])) {
                                allEqual = false;
                                break;
                            }
                        }
                        if (allEqual) {
                            c22++;
                            expanded = true;
                        }
                    } while (expanded);
                    let key1 = ckey(c11, c21, cc);
                    let key2 = ckey(c12, c22, cc);
                    let newEdge = {start: edgeMap[key1].start, end: edgeMap[key2].start};
                    
                    for (let c1 = c11; c1 <= c12; c1++) {
                        for (let c2 = c21; c2 <= c22; c2++) {
                            let key = ckey(c1, c2, cc);
                            //console.log("remove ", key);
                            delete edgeMap[key];
                            let ci = toCheck.indexOf(key);
                            if (ci !== -1) toCheck.splice(ci, 1);
                        }
                    }
                    edgeMap[key] = newEdge;
                }
                
                
            });
        });
     
        return cubemaps.map((axisMap) => axisMap.map((edgeMap) => Object.keys(edgeMap).map((k) => edgeMap[k])));
    }

}

module.exports = VoxelModel;