let math = require('./math/vector');
let {getNormals, getEdge, Axis} = require('./vertices_common');

class ImageDataMask {
    constructor(imageData) {
        this._im = imageData;
    }

    get width() { return this._im.width; }
    get height() { return this._im.height; }
    hasPixel(x, y) {
        return this._im.data[this.width * y * 4 + x * 4 + 3] > 0;
    }
    get imageData() { return this._im; }
}

class StringArrayMask {
    constructor(...array) {
        this._array = array;
    }
    get width() { return this._array[0].length; }
    get height() { return this._array.length; }
    hasPixel(x,y) {
        return this._array[y].charAt(x) != ' ';
    }
    get imageData() { return null; }
}

function getFlatProfile(imageMask) {
    //compose rectangles that match the mask
    //not expected to be very optimal for now

    let usedPoints = new Set();
    let rectangles = [];
    function setKey(x,y) {
        return y*imageMask.width + x;
    }

    function hasPixel(x,y) {
        return imageMask.hasPixel(x,y) && !usedPoints.has(setKey(x,y));
    }

    function tryStartFrom(x, y) {
        let thisRect = {start: [x,y], end: [x,y]};
        //expand to right (no need to go left, we are going from left to right)
        while (x < imageMask.width-1 && hasPixel(x+1, y)) {
            x++;
        }
        thisRect.end[0] = x;
        //now try to expand to the bottom
        let endY = y;
        let expanded = true;

        while (expanded && endY < imageMask.height - 1) {
            for (let cx = thisRect.start[0]; cx <= thisRect.end[0]; cx++) {
                if (!hasPixel(cx, endY + 1)) {
                    expanded = false;
                }
            }
            if (expanded) {
                endY++;
            }
        }
        thisRect.end[1] = endY;
        for (let cx = thisRect.start[0]; cx <= thisRect.end[0]; cx++) {
            for (let cy = thisRect.start[1]; cy <= thisRect.end[1]; cy++) {
                usedPoints.add(setKey(cx, cy));
            }
        }

        thisRect.end[0]++;
        thisRect.end[1]++;
        rectangles.push(thisRect);
        //console.log(thisRect, usedPoints);
    }

    for (let y = 0; y < imageMask.height; y++) {
        for (let x = 0; x < imageMask.width; x++) {
            if (hasPixel(x, y))
                tryStartFrom(x, y);
        }
    }
    return rectangles;

}

function getSymmetricProfile(imageMask) {
    let halfw = imageMask.width/2;
    let cx = halfw, cy, prevCx;
    let edges = [];
    for (cy = 0; cy <= imageMask.height; cy++) {
        prevCx = cx;
        cx = halfw-1;
        while (cx >= 0 && cy < imageMask.height && imageMask.hasPixel(cx, cy)) {
            cx--;
        }
        cx++;
        //ignore "empty" lines
        if (cx !== halfw || prevCx !== halfw) {
            //draw horizontal line, and then - vertical one
            if (cx !== prevCx) {
                edges.push({start: [prevCx, cy], end: [cx, cy], h: true});
            }
            edges.push({start: [cx, cy], end: [cx, cy + 1], v: true});
        }
    }

    //2. optimize it a bit, don't forget to remove last one vertical line!
    for (let i = edges.length-1; i >= 1; i--) {
        if (edges[i].v && edges[i-1].v) {
            edges[i-1].end = edges[i].end;
            edges.splice(i, 1);
        }
    }
    edges.pop();
    return edges.map((e) => {
        delete e.h;
        delete e.v;
        return e;
    });
}

function getUv(symmetricProfileEdges) {
    return symmetricProfileEdges.map(({start,end}) => {
        if (start[0] < end[0]) { //bottom edge
            return {start: [start[0], start[1] - 1], end: [end[0], end[1] - 1]}
        } else if (start[0] == end[0]) { //left edge
            return {start: [start[0], start[1]], end: [end[0], end[1] - 1]};
        } else {  //top edge
            return {start: [start[0], start[1]], end: [end[0], end[1]]}; //todo: make copying more... obvious
        }
    });
}

class ProjectionVerticesModel {
    constructor() {
        this._vertices = [];
        this._normals = [];
        this._uv = [];
        this._imageData = null;
    }


    addImageSymmetric(imageMask, count = 16) {
        if (!imageMask.hasPixel && imageMask.data) {
            imageMask = new ImageDataMask(imageMask);
        }
        //1. make profile (i.e. x/z coords)
        let profile = getSymmetricProfile(imageMask);
        let uvs = getUv(profile);

        this._imageData = imageMask.imageData;

        //3. calculate <count> angles
        let anStep = Math.PI*2 / count;
        let angles = [];
        for (let i = 0; i < count; i++) {
            angles.push(i * anStep);
        }

        let halfw = imageMask.width/2;

        function getX(x, angle) {
            return halfw + (halfw - x)*Math.cos(angle);
        }
        function getY(x, angle) {
            return halfw + (halfw - x)*Math.sin(angle);
        }

        function point3d(point2d, angle, uv) {
            return [
                getX(point2d[0], angle),
                getY(point2d[0], angle),
                imageMask.height - point2d[1],
                uv[0],
                uv[1]
            ]
        }

        let trianglesCount = profile.length * 2 * count;
        this._vertices = new Float32Array(trianglesCount * 3 * 3);
        this._normals = new Float32Array(trianglesCount * 3 * 3);
        this._uv = new Float32Array(trianglesCount * 3 * 2);

        let vi = 0;
        let ui = 0;

        angles.forEach((angle, i) => {
            let prevAngle = i == 0 ? angles[angles.length-1] : angles[i-1];
            profile.forEach(({start, end}, idx) => {

                let tri1 = [
                    point3d(start, angle, uvs[idx].start),
                    point3d(start, prevAngle, uvs[idx].start),
                    point3d(end, angle, uvs[idx].end)
                ];
                let tri2 = [
                    point3d(start, prevAngle, uvs[idx].start),
                    point3d(end, prevAngle, uvs[idx].end),
                    point3d(end, angle, uvs[idx].end)
                ];
                //todo: for edges from middle there will be one triangle,
                [tri1, tri2].forEach((triangle) => {
                    let normal = math.triangleNormal(triangle[0], triangle[1], triangle[2], [halfw, halfw, (triangle[0][2] + triangle[1][2] + triangle[2][2])/3]);
                    normal.ccw.forEach((point) => {
                        this._vertices[vi] = point[0];
                        this._vertices[vi+1] = point[1];
                        this._vertices[vi+2] = point[2];
                        this._normals[vi] = normal[0];
                        this._normals[vi+1] = normal[1];
                        this._normals[vi+2] = normal[2];
                        vi += 3;
                        this._uv[ui] = point[3] / (imageMask.width-1);
                        this._uv[ui+1] = 1 - point[4] / (imageMask.height-1);
                        if (this._uv[ui+1] < 0) console.log(point[3], point[4]);
                        ui += 2;
                    });
                });

            });
        });

    }

    addImageFlatX(offset, width, imageMask) {
        if (!imageMask.hasPixel && imageMask.data) {
            imageMask = new ImageDataMask(imageMask);
        }
        let rectangles = getFlatProfile(imageMask);
        this._imageData = imageMask.imageData;
        this._vertices = new Float32Array(rectangles.length * 2 * 6 * 3 * 3);
        this._normals = new Float32Array(rectangles.length * 2 * 6 * 3 * 3);
        this._uv = new Float32Array(rectangles.length * 2 * 6 * 2 * 3);
        let vi = 0, ui = 0;
        
        let self = this;

        let vmod = [[0,0], [0,0], [0,+1]];  //shift uv a bit for top side
        let umod = [[-1,0], [0,0], [0,0]];   //shift uv a bit for right side

        function addFace(coords, ai, ei) {
            let vertices = getEdge(coords, ai, ei);
            let normals = getNormals(coords, ai, ei);
            for (let i = 0; i < vertices.length; i++) {
                self._vertices[vi + i*3 + 0] = vertices[i][0];
                self._vertices[vi + i*3 + 1] = vertices[i][1];
                self._vertices[vi + i*3 + 2] = imageMask.height - vertices[i][2];
                self._normals[vi + i*3 + 0] = normals[0];
                self._normals[vi + i*3 + 1] = normals[1];
                self._normals[vi + i*3 + 2] = normals[2];
                self._uv[ui + i*2 + 0] = (umod[ai][ei] + vertices[i][0]) / (imageMask.width);
                self._uv[ui + i*2 + 1] = 1 - (vmod[ai][ei] + vertices[i][2]) / (imageMask.height);
            }
            vi += 3*vertices.length;
            ui += 2*vertices.length;
        }
        
        rectangles.forEach(({start, end}) => {
            //6 edges we need to build, there are 12 triangles
            //1. front/back (y)
            addFace([
                [start[0], end[0]],
                [offset, offset],
                [start[1], end[1]]
            ], Axis.y, 0);
            addFace([
                [start[0], end[0]],
                [offset+width, offset+width],
                [start[1], end[1]]
            ], Axis.y, 1);
            //2. left/right (x)
            addFace([
                [start[0], start[0]],
                [offset, offset+width],
                [start[1], end[1]]
            ], Axis.x, 1);
            addFace([
                [end[0], end[0]],
                [offset, offset+width],
                [start[1], end[1]]
            ], Axis.x, 0);
            //3. top/bottom (z)
            addFace([
                [start[0], end[0]],
                [offset, offset+width],
                [start[1], start[1]]
            ], Axis.z, 1);
            addFace([
                [start[0], end[0]],
                [offset, offset+width],
                [end[1], end[1]]
            ], Axis.z, 0);
        });

        //console.log(this._uv.filter((v) => v < 0));
        
        //throw new Error("not implemented yet");
    }

    fillTexture(imageDataCreator) {
        return this._imageData;
    }

    get vertices() { return this._vertices; }

    get normals() { return this._normals; }

    get uvs() { return this._uv; }
}

module.exports.ProjectionVerticesModel = ProjectionVerticesModel;
module.exports.getSymmetricProfile = getSymmetricProfile;
module.exports.getFlatProfile = getFlatProfile;
module.exports.StringArrayMask = StringArrayMask;
module.exports.getUv = getUv;