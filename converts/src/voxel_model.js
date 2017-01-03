//todo: shall support models more than 256*256*256

function ckey(x,y,z) {
    return x*65536 + y*256 + z;
}

class Cube {
    constructor(x0, y0, z0, size, parent = null) {
        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.size = size;
        let p2 = Math.log(size) / Math.log(2);
        if (p2 !== Math.abs(p2)) throw new Error("size shall be power of 2");
        this.full = true;
        this.children = [];
        this.filled = false;
        this.parent = parent;
    }
    
    split() {
        if (!this.full) return;
        if (this.size === 1) throw new Error("cannot split cube with size 1");
        this.full = false;
        let {x0,y0,z0,size} = this;
        let half = size/2;
        this.children = [
            new Cube(x0,      y0,      z0,      half, this),
            new Cube(x0,      y0,      z0+half, half, this),
            new Cube(x0,      y0+half, z0,      half, this),
            new Cube(x0+half, y0,      z0,      half, this),
            new Cube(x0+half, y0,      z0+half, half, this),
            new Cube(x0,      y0+half, z0+half, half, this),
            new Cube(x0+half, y0+half, z0,      half, this),
            new Cube(x0+half, y0+half, z0+half, half, this)
        ]
    }
    
    fillSet(aset) {
        for (let x = this.x0; x < this.x0 + this.size; x++) {
            for (let y = this.y0; y < this.y0 + this.size; y++) {
                for (let z = this.z0; z < this.z0 + this.size; z++) {
                    aset.add(ckey(x,y,z));
                }
            }
        }
    }
    
    contains(x, y, z) {
        return x >= this.x0 && x < this.x0 + this.size
            && y >= this.y0 && y < this.y0 + this.size
            && z >= this.z0 && z < this.z0 + this.size;
    }
    
    
    findCube(x, y, z) {
        if (this.contains(x,y,z)) {
            if (this.full) return this;
            for (let cube of this.children) {
                let res = cube.findCube(x, y, z);
                if (res) return res;
            }
        }
        return null;
    }
    
    fill(x, y, z) {
        let c = this.findCube(x, y, z);
        while (c && c.size > 1) {
            c.split();
            c = c.findCube(x, y, z);
        }
        if (c == null) debugger;
        c.filled = true;
    }
    
    unfill(x, y, z) {
        let c = this.findCube(x, y, z);
        c.filled = false;
        if (c.parent) c.parent.tryCollapse();
    }

    tryCollapse() {
        if (this.full) return;
        if (this.children.every((c) => c.full && !c.filled)) {
            this.full = true;
            this.filled = false;
            this.children = [];
            if (this.parent) this.parent.tryCollapse();
        }
    }
    
    debug(indent = "", onlyFull = false, minSize = 0) {
        if (this.size < minSize) return;
        if (!onlyFull || this.full) {
            console.log(indent, "cube", this.filled ? "*":" ", [this.x0, this.y0, this.z0], "x", this.size);
        }
        if (!this.full) {
            this.children.forEach((c) => c.debug(indent + "  ", onlyFull, minSize));
        }
    }

}

//todo: another way: do not calculate air. just check neighbors. in this case we may add vertices for inner volume, but
//that could have less problems

class VoxelModel {

    constructor(width = 0, height = 0, depth = 0) {
        this._width = width;
        this._height = height;
        this._depth = depth;
        //todo: this is simplest for now. when performance problem appeared - we'll need to go with another solution
        this._voxels = new Map();
        if (width !== 0 && height !== 0 && depth !== 0) {
            let max = Math.max(width, height, depth);
            let p2 = Math.pow(2, Math.ceil(Math.log(max) / Math.log(2)));
            this._cube = new Cube(0, 0, 0, p2);
        }
    }
    
    resizeUpTo(nw, nh, nd) {
        this._width = Math.max(this._width, nw-1);
        this._height = Math.max(this._height, nh-1);
        this._depth = Math.max(this._depth, nd-1);
    }

    setVoxel(x, y, z, color, props) {
        if (x < 0 || y < 0 || z < 0) throw new Error("xyz shall be >= 0");
        this.resizeUpTo(x,y,z);
        this._voxels.set(ckey(x,y,z), {x, y, z, color: color, props: props || {}});
        if (this._cube) {
            this._cube.fill(x, y, z);
        }
    }

    getVoxelColor(x, y, z) {
        return this.getVoxel(x, y, z, {}).color;
    }

    getVoxel(x, y, z, ifNull = undefined) {
        return this._voxels.get(ckey(x,y,z)) || ifNull;
    }

    getVoxelProp(name, x, y, z) {
        return this.getVoxel(x, y, z, {props: {}}).props[name]
    }

    deleteVoxel(x, y, z) {
        this._voxels.delete(ckey(x,y,z));
        if (this._cube) {
            this._cube.unfill(x, y, z);
        }
    }
    
    get voxels() { return  this._voxels.values(); }

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
                    currentVoxel = this._voxels.get(currentKey);
                    fn(currentVoxel, x, y, z, changer);
                }
            }
        }

    }

    get maxX() { return this._width; }
    get maxY() { return this._height; }
    get maxZ() { return this._depth; }

    getAirCube() {
        let air = new Set();

        function processCube(cube) {
            if (cube.full) {
                if (!cube.filled) {
                    cube.fillSet(air);
                }
            } else {
                cube.children.forEach(processCube);
            }
        }

        processCube(this._cube);
        return air;
    }

    getAir() {
        let air = new Set();
        let toSeeSet = new Set();
        toSeeSet.add(ckey(0,0,0));
        let toSee = [{x:0,y:0,z:0}];
        while (toSee.length > 0) {
            let {x,y,z} = toSee.shift();
            let key = ckey(x,y,z);
            if (!this._voxels.has(key)) {
                air.add(key);
                [[x-1,y,z],[x+1,y,z],[x,y-1,z],[x,y+1,z],[x,y,z-1],[x,y,z+1]].forEach(([nx,ny,nz]) => {
                    let nkey = ckey(nx,ny,nz);
                   if (nx >= 0 && ny >= 0 && nz >= 0 && nx <= this.maxX && ny <= this.maxY && nz <= this.maxZ && !air.has(nkey) && !toSeeSet.has(nkey)) {
                       toSee.push({x:nx, y:ny, z:nz});
                       toSeeSet.add(nkey);
                   }
                });
            }
        }
        return air;
    }


    toCubemap(ignoreEmptyness = false) {

        let cubemaps = [
            [new Map(), new Map()],    //const-x edges
            [new Map(), new Map()],    //const-y edges
            [new Map(), new Map()]     //const-z edges
        ];
        let isAir;

        if (ignoreEmptyness) {
            isAir = (key) => !this._voxels.has(key)
        } else {
            let air = this._cube ? this.getAirCube() : this.getAir();
            isAir = function(key) { return air.has(key); }
        }
        //1. add only meaningful edges - which touch air
        for (let voxel of this._voxels.values()) {
            let {x, y, z} = voxel;
            let key = ckey(x, y, z);
            let check = [[x - 1, y, z], [x + 1, y, z], [x, y - 1, z], [x, y + 1, z], [x, y, z - 1], [x, y, z + 1]];
            for (let idx = 0; idx < check.length; idx++) {
                let [nx,ny,nz] = check[idx];
                let thisIsAir = nx <= 0 || ny <= 0 || nz <= 0 || nx >= this.maxX + 1 || ny >= this.maxY + 1 || nz >= this.maxZ + 1 || isAir(ckey(nx, ny, nz));
                if (thisIsAir) {
                    let cmi = (idx / 2) | 0, cmj = idx % 2;
                    cubemaps[cmi][cmj].set(key, {start: voxel, end: voxel});
                }
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
                
                let toCheck = new Set(edgeMap.keys());
                
                while (toCheck.size) {
                    let key = toCheck.values().next().value;
                    toCheck.delete(key);
                    //console.log("check ", key);
                    let sq = edgeMap.get(key);
                    let voxel = sq.start;
                    //check first axis
                    let expanded = false;
                    let c11 = voxel[a1], c12 = voxel[a1];
                    let c21 = voxel[a2], c22 = voxel[a2];
                    let cc = voxel[ac];
                    do {
                        expanded = false;
                        if (equal(voxel, edgeMap.get(ckey(c11-1, c21, cc)))) {
                            c11--;
                            expanded = true;
                        }
                        if (equal(voxel, edgeMap.get(ckey(c12+1, c21, cc)))) {
                            c12++;
                            expanded = true;
                        }
                    } while (expanded);
                    //now check second axis
                    do {
                        expanded = false;
                        let allEqual = true;
                        for (let c1 = c11; c1 <= c12; c1++) {
                            if (!equal(voxel, edgeMap.get(ckey(c1, c21-1, cc)))) {
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
                            if (!equal(voxel, edgeMap.get(ckey(c1, c22+1, cc)))) {
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
                    let newEdge = {start: edgeMap.get(key1).start, end: edgeMap.get(key2).start};
                    
                    for (let c1 = c11; c1 <= c12; c1++) {
                        for (let c2 = c21; c2 <= c22; c2++) {
                            let key = ckey(c1, c2, cc);
                            //console.log("remove ", key);
                            edgeMap.delete(key);
                            toCheck.delete(key);
                        }
                    }
                    edgeMap.set(key, newEdge);
                }
                
                
            });
        });
     
        return cubemaps.map((axisMap) => axisMap.map((edgeMap) => Array.from(edgeMap.values())));
    }

}

module.exports = VoxelModel;