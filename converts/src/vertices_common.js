const Normals = [
    [-1, 0, 0], [1, 0, 0],  //x-edges
    [0, -1, 0], [0, 1, 0],  //y-edges
    [0, 0, -1], [0, 0, 1]   //z-edges
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


module.exports = {
    getNormals: getNormals,
    getEdge: getEdge,
    Axis: Axis
};