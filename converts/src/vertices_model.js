let ColorModel = require('./color_model');

const Normals = [
    [-1, 0, 0], [1, 0, 0],  //x-edges
    [0, -1, 0], [0, 1, 0],  //y-edges
    [0, 0, -1], [0, 0, 1],  //z-edges
];

const Edges = [
    [[0, 0], [1, 1], [1, 0], [0, 0], [0, 1], [1, 1]],   //ccw
    [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]    //cw
];

const Axis = {
    x: 0,
    y: 1,
    z: 2
};

//coords
function getEdge(coords, axis, idx) {
    let val = coords[axis][idx];
    switch (axis) {
        case Axis.x:
            return Edges[idx].map(([i1,i2]) => [val, coords[Axis.y][i1], coords[Axis.z][i2] ]);
        case Axis.y:
            return Edges[idx].map(([i1,i2]) => [coords[Axis.x][i2], val, coords[Axis.z][i1] ]);
        case Axis.z:
            return Edges[idx].map(([i1,i2]) => [coords[Axis.x][i1], coords[Axis.y][i2], val]);
    }
}

function getNormals(coords, axis, idx) {
    return Normals[axis*2 + idx];
}



class CubicVerticesModel {
    constructor(colorModel = new ColorModel()) {
        this._colorModel = colorModel;
        this._vertices = [];
        this._normals = []; //predefine normals
        this._uv = [];
        this._ci = [];
        //todo: custom attributes
    }
    
    addVoxelModel(voxelModel, ignoreEmptyness) {
        let cubemaps = voxelModel.toCubemap(ignoreEmptyness);
        //todo: for now - support only 1 voxel model
        let edgesCount = 0;
        cubemaps.forEach((axis, ai) => {
            axis.forEach((edges, ei) => {
                edgesCount += edges.length;
            });
        });
        this._vertices = new Float32Array(edgesCount * 6 * 3);
        this._normals = new Float32Array(edgesCount * 6 * 3);
        this._ci = new Float32Array(edgesCount * 6);
        let idx = 0;
        cubemaps.forEach((axis, ai) => {
            axis.forEach((edges, ei) => {
                for (let edge of edges) {
                    let coords = [
                        [edge.start.x, edge.end.x + 1],
                        [edge.start.y, edge.end.y + 1],
                        [edge.start.z, edge.end.z + 1]
                    ];
                    let vertices = getEdge(coords, ai, ei);
                    let normals = getNormals(coords, ai, ei);
                    let color = edge.start.color;
                    let ci = this._colorModel.getColorIndex(color);
                    let vidx = idx * 6 * 3;
                    for (let i = 0; i < vertices.length; i++) {
                        this._vertices[vidx + i*3 + 0] = vertices[i][0];
                        this._vertices[vidx + i*3 + 1] = vertices[i][1];
                        this._vertices[vidx + i*3 + 2] = vertices[i][2];
                        this._normals[vidx + i*3 + 0] = normals[0];
                        this._normals[vidx + i*3 + 1] = normals[1];
                        this._normals[vidx + i*3 + 2] = normals[2];
                        this._ci[idx * 6 + i] = ci;
                    }
                    idx++;
                }
            });
        });
        return this;
    }

    normalizeUv() {
        this._uv = this._colorModel.getUVs(this._ci).reduce((a,b) => a.concat([b, 0.5]), []);
        return this._uv;
    }

    get colorModel() { return this._colorModel; }
    get vertices() { return this._vertices;}
    get normals() { return this._normals;}
    get uvs() { 
        if (this._uv.length / 2 !== this._ci.length) {
            this.normalizeUv();
        }
        return this._uv;
    }
}

module.exports = CubicVerticesModel;