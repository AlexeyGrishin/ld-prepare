import ColorModel from './color_model';

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



export default class CubicVerticesModel {
    constructor(colorModel = new ColorModel()) {
        this._colorModel = colorModel;
        this._vertices = [];
        this._normals = []; //predefine normals
        this._uv = [];
        this._ci = [];
        //todo: custom attributes
    }
    
    addVoxelModel(voxelModel) {
        let cubemaps = voxelModel.toCubemap();
        cubemaps.forEach((axis, ai) => {
            axis.forEach((edges, ei) => {
                edges.forEach((edge) => {
                    let coords = [
                        [edge.start.x, edge.end.x + 1],
                        [edge.start.y, edge.end.y + 1],
                        [edge.start.z, edge.end.z + 1]
                    ];
                    let vertices = getEdge(coords, ai, ei);
                    let normals = getNormals(coords, ai, ei);
                    let color = edge.start.color;
                    let ci = this._colorModel.getColorIndex(color);
                    
                    this._vertices = this._vertices.concat(vertices.reduce((a,b) => a.concat(b), []));
                    for (let i = 0; i < 6; i++) {
                        this._normals = this._normals.concat(normals);
                        this._ci.push(ci);
                    }
                });
            });
        });
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