(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Threedify;

var _voxel_model = require('./voxel_model');

var _voxel_model2 = _interopRequireDefault(_voxel_model);

var _color_model = require('./color_model');

var _color_model2 = _interopRequireDefault(_color_model);

var _cubic_vertices_model = require('./cubic_vertices_model');

var _cubic_vertices_model2 = _interopRequireDefault(_cubic_vertices_model);

var _projection_vertices_model = require('./projection_vertices_model');

var _three_export = require('./formats/three_export');

var _three_export2 = _interopRequireDefault(_three_export);

var _projections = require('./projections');

var _projections2 = _interopRequireDefault(_projections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Threedify() {
    var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


    var configCache = {};
    var geometriesCache = {};
    var mainMethod = configs.method || "viaVox";
    var mainMaterial = THREE[configs.material] || THREE.MeshPhongMaterial;

    var tempCanvas = document.createElement('canvas');

    var convertor = {
        toGeometry: function toGeometry(imageData, key_or_config) {
            //gets config
            var config = configCache[key_or_config] || key_or_config;
            if (!config.projection) throw new Error("Cannot find projection for config/key: " + JSON.stringify(key_or_config));
            var vertModel = config.projection[mainMethod](imageData, config);
            //converts to geometry
            var exp = new _three_export2.default();
            var geom = exp.saveGeometry(vertModel);
            config.projection.postProcess(geom, config);
            var text = exp.saveTexture(vertModel);
            //console.log(vertModel.colorModel);
            var mesh = new THREE.Mesh(geom, new mainMaterial({ map: text }));
            var group = new THREE.Group();
            group.add(mesh);
            geometriesCache[key_or_config] = group;

            return { geometry: group, config: config.data };
        },
        fromTileToGeometry: function fromTileToGeometry(tile, layer) {
            //console.time("threedify");
            var index = tile.index;
            var tileset = layer.resolveTileset(index);
            var finalKey = "phaser_sprite_" + tileset.name + "_" + (index - tileset.firstgid);
            var config = configs[tileset.name][index - tileset.firstgid] || configs[tileset.name]['default'];
            configCache[finalKey] = config;
            if (geometriesCache[finalKey]) return { geometry: geometriesCache[finalKey], config: config.data };

            var height = config.top !== undefined ? tile.height * 2 : tile.height;

            tempCanvas.setAttribute('width', tile.width);
            tempCanvas.setAttribute('height', height);
            var ctx = tempCanvas.getContext('2d');
            ctx.clearRect(0, 0, tile.width, height);

            tileset.draw(ctx, 0, height - tile.height, config.base !== undefined ? config.base + tileset.firstgid : index);
            if (config.top) {
                tileset.draw(ctx, 0, 0, tileset.firstgid + config.top);
            }
            var res = this.toGeometry(ctx.getImageData(0, 0, tile.width, height), finalKey);

            //console.timeEnd("threedify");
            //console.log("vertices -> ", res.geometry.children[0].geometry.attributes.position.count)
            return res;
        },
        fromSpriteToGeometry: function fromSpriteToGeometry(phaserSprite, layer) {
            if (phaserSprite instanceof Phaser.Tile) return convertor.fromTileToGeometry(phaserSprite, layer);
            var key = phaserSprite.key;
            var frame = phaserSprite.frameName || phaserSprite.frame;
            var finalKey = "phaser_sprite_" + key + "_" + frame;
            var config = configs[key][frame] || configs[key]['default'];
            configCache[finalKey] = config;
            if (geometriesCache[finalKey]) return { geometry: geometriesCache[finalKey], config: config.data };

            var srcImage = void 0;
            var srcFrame = { x: 0, y: 0, width: phaserSprite.width, height: phaserSprite.height };

            //todo: finish. draw sprite over temp canvas
            if (phaserSprite.texture instanceof Phaser.RenderTexture || phaserSprite.texture instanceof PIXI.RenderTexture) {
                srcImage = phaserSprite.texture.getCanvas();
            } else {
                srcImage = phaserSprite.texture.baseTexture.source;
            }

            throw new Error("not finished yet");
        }
    };
    return convertor;
}

Threedify.Sym = {
    viaVox: function viaVox(imageData, config) {
        var vm = new _voxel_model2.default(imageData.width, imageData.width, imageData.height);
        _projections2.default.projectSymmetric(imageData, vm);
        var vert = new _cubic_vertices_model2.default();
        vert.addVoxelModel(vm, true);
        return vert;
    },
    directly: function directly(imageData, config) {
        var vert = new _projection_vertices_model.ProjectionVerticesModel();
        vert.addImageSymmetric(imageData, config ? config.quality : undefined);
        return vert;
    },
    postProcess: function postProcess(geometry) {}
};
Threedify.X = {
    viaVox: function viaVox(imageData, config) {
        var vm = new _voxel_model2.default(imageData.width, imageData.width, imageData.height);
        _projections2.default.projectFlatX(imageData, vm, config);
        var vert = new _cubic_vertices_model2.default();
        vert.addVoxelModel(vm, true);
        return vert;
    },
    directly: function directly(imageData, config) {
        var vert = new _projection_vertices_model.ProjectionVerticesModel();
        vert.addImageFlatX(config.offset, config.width, imageData);
        return vert;
    },
    postProcess: function postProcess(geometry) {}
};
Threedify.Y = {
    viaVox: Threedify.X.viaVox,
    directly: Threedify.X.directly,
    postProcess: function postProcess(geometry, config) {
        geometry.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(config.width + config.offset * 2 + 1, 0, 0));
    }
};

},{"./color_model":3,"./cubic_vertices_model":4,"./formats/three_export":5,"./projection_vertices_model":7,"./projections":8,"./voxel_model":10}],2:[function(require,module,exports){
'use strict';

var _voxel_model = require('./voxel_model');

var _voxel_model2 = _interopRequireDefault(_voxel_model);

var _color_model = require('./color_model');

var _color_model2 = _interopRequireDefault(_color_model);

var _cubic_vertices_model = require('./cubic_vertices_model');

var _cubic_vertices_model2 = _interopRequireDefault(_cubic_vertices_model);

var _projection_vertices_model = require('./projection_vertices_model');

var _three_export = require('./formats/three_export');

var _three_export2 = _interopRequireDefault(_three_export);

var _Threedify = require('./Threedify');

var _Threedify2 = _interopRequireDefault(_Threedify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.VoxelModel = _voxel_model2.default;
window.VerticesModel = _cubic_vertices_model2.default;
window.ProjectionVerticesModel = _projection_vertices_model.ProjectionVerticesModel;
window.ThreeExport = _three_export2.default;
window.ColorModel = _color_model2.default;
window.Threedify = _Threedify2.default;

},{"./Threedify":1,"./color_model":3,"./cubic_vertices_model":4,"./formats/three_export":5,"./projection_vertices_model":7,"./voxel_model":10}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ColorModel = function () {
    function ColorModel() {
        _classCallCheck(this, ColorModel);

        this._colors = [];
        this._colorsMap = {};
        this._normalized = null;
    }

    _createClass(ColorModel, [{
        key: "getColorIndex",
        value: function getColorIndex(color) {
            var ci = this._colorsMap[color];
            if (ci === undefined) {
                ci = this._colors.length;
                this._colorsMap[color] = ci;
                this._colors.push(color);
                this._normalized = null;
            }
            return ci;
        }
    }, {
        key: "getUVs",
        value: function getUVs(colorIndexes) {
            var count = this.normalizedColors.length;
            if (count <= 1) return colorIndexes;
            return colorIndexes.map(function (ci) {
                return ci / (count - 1);
            });
        }
    }, {
        key: "fillTexture",
        value: function fillTexture(imageDataCreator) {
            var colors = this.normalizedColors;
            var im = imageDataCreator(colors.length, 1);
            for (var ci = 0; ci < colors.length; ci++) {
                im.data[ci * 4 + 0] = colors[ci] >> 16;
                im.data[ci * 4 + 1] = colors[ci] >> 8 & 0xff;
                im.data[ci * 4 + 2] = colors[ci] & 0xff;
                im.data[ci * 4 + 3] = 0xff;
            }
            return im;
        }
    }, {
        key: "normalizedColors",
        get: function get() {
            if (!this._normalized) {
                var count = this._colors.length;
                var nearestPow2 = Math.pow(2, Math.ceil(Math.log(count) / Math.log(2)));
                this._normalized = this._colors.slice();
                while (count < nearestPow2) {
                    count++;
                    this._normalized.push(0x000000);
                }
            }
            return this._normalized;
        }
    }]);

    return ColorModel;
}();

module.exports = ColorModel;

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ColorModel = require('./color_model');

var _require = require('./vertices_common'),
    getNormals = _require.getNormals,
    getEdge = _require.getEdge;

var CubicVerticesModel = function () {
    function CubicVerticesModel() {
        var colorModel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new ColorModel();

        _classCallCheck(this, CubicVerticesModel);

        this._colorModel = colorModel;
        this._vertices = [];
        this._normals = [];
        this._uv = [];
        this._ci = [];
        //todo: custom attributes
    }

    _createClass(CubicVerticesModel, [{
        key: 'addVoxelModel',
        value: function addVoxelModel(voxelModel, ignoreEmptyness) {
            var _this = this;

            var cubemaps = voxelModel.toCubemap(ignoreEmptyness);
            //todo: for now - support only 1 voxel model
            var edgesCount = 0;
            cubemaps.forEach(function (axis, ai) {
                axis.forEach(function (edges, ei) {
                    edgesCount += edges.length;
                });
            });
            this._vertices = new Float32Array(edgesCount * 6 * 3);
            this._normals = new Float32Array(edgesCount * 6 * 3);
            this._ci = new Float32Array(edgesCount * 6);
            var idx = 0;
            cubemaps.forEach(function (axis, ai) {
                axis.forEach(function (edges, ei) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = edges[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var edge = _step.value;

                            var coords = [[edge.start.x, edge.end.x + 1], [edge.start.y, edge.end.y + 1], [edge.start.z, edge.end.z + 1]];
                            var vertices = getEdge(coords, ai, ei);
                            var normals = getNormals(coords, ai, ei);
                            var color = edge.start.color;
                            var ci = _this._colorModel.getColorIndex(color);
                            var vidx = idx * 6 * 3;
                            for (var i = 0; i < vertices.length; i++) {
                                _this._vertices[vidx + i * 3 + 0] = vertices[i][0];
                                _this._vertices[vidx + i * 3 + 1] = vertices[i][1];
                                _this._vertices[vidx + i * 3 + 2] = vertices[i][2];
                                _this._normals[vidx + i * 3 + 0] = normals[0];
                                _this._normals[vidx + i * 3 + 1] = normals[1];
                                _this._normals[vidx + i * 3 + 2] = normals[2];
                                _this._ci[idx * 6 + i] = ci;
                            }
                            idx++;
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }
                });
            });
            return this;
        }
    }, {
        key: 'normalizeUv',
        value: function normalizeUv() {
            this._uv = this._colorModel.getUVs(this._ci).reduce(function (a, b) {
                return a.concat([b, 0.5]);
            }, []);
            return this._uv;
        }
    }, {
        key: 'fillTexture',
        value: function fillTexture(imageDataCreator) {
            return this._colorModel.fillTexture(imageDataCreator);
        }
    }, {
        key: 'vertices',
        get: function get() {
            return this._vertices;
        }
    }, {
        key: 'normals',
        get: function get() {
            return this._normals;
        }
    }, {
        key: 'uvs',
        get: function get() {
            if (this._uv.length / 2 !== this._ci.length) {
                this.normalizeUv();
            }
            return this._uv;
        }
    }]);

    return CubicVerticesModel;
}();

module.exports = CubicVerticesModel;

},{"./color_model":3,"./vertices_common":9}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ThreeExport = function () {
    function ThreeExport() {
        _classCallCheck(this, ThreeExport);
    }

    _createClass(ThreeExport, [{
        key: 'saveTexture',
        value: function saveTexture(colorModel) {
            var canvas = void 0,
                ctx = void 0;
            var im = colorModel.fillTexture(function (width, height) {
                canvas = document.createElement('canvas');
                canvas.setAttribute("width", width);
                canvas.setAttribute('height', height);
                ctx = canvas.getContext('2d');
                return ctx.getImageData(0, 0, width, height);
            });
            if (!ctx) {
                canvas = document.createElement('canvas');
                canvas.setAttribute("width", im.width);
                canvas.setAttribute('height', im.height);
                ctx = canvas.getContext('2d');
            }
            ctx.putImageData(im, 0, 0);
            return new THREE.CanvasTexture(canvas, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        }
    }, {
        key: 'saveGeometry',
        value: function saveGeometry(verticesModel) {

            var g = new THREE.BufferGeometry();
            g.addAttribute("position", new THREE.BufferAttribute(new Float32Array(verticesModel.vertices), 3));
            g.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(verticesModel.normals), 3));
            //g.addAttribute("color", new THREE.BufferAttribute( new Float32Array( colors), 3));
            g.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(verticesModel.uvs), 2));
            return g;
        }
    }]);

    return ThreeExport;
}();

exports.default = ThreeExport;

},{}],6:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

//sad that I have to introduce my own functions to be able just calculate dot/cross product
//without creating Objects and taking 1.5M libraries onboard

//implementations partially got from sylvester library
module.exports = {
    substract: function substract(v1, v2) {
        return [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
    },
    divide: function divide(v1, n) {
        return [v1[0] / n, v1[1] / n, v1[2] / n];
    },
    dot: function dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    },
    cross: function cross(v1, v2) {
        return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
    },


    length: function length(v1) {
        return Math.hypot.apply(Math, _toConsumableArray(v1));
    },

    normalize: function normalize(v1) {
        var l = this.length(v1);
        if (l !== 0) {
            return this.divide(v1, l);
        } else {
            return v1;
        }
    },

    opposite: function opposite(v1) {
        return [-v1[0], -v1[1], -v1[2]];
    },
    triangleNormal: function triangleNormal(p1, p2, p3, innerPoint) {
        var v1 = this.substract(p2, p1);
        var v2 = this.substract(p3, p1);
        var norm = this.normalize(this.cross(v1, v2));
        if (this.dot(norm, this.substract(innerPoint, p1)) < 0) {
            norm = this.opposite(norm);
            norm.cw = [p1, p2, p3];
            norm.ccw = [p1, p3, p2];
        } else {
            norm.cw = [p1, p3, p2];
            norm.ccw = [p1, p2, p3];
        }
        return norm;
    },
    triangleCenter: function triangleCenter(p1, p2, p3) {
        return this.divide([p1[0] + p2[0] + p3[0], p1[1] + p2[1] + p3[1], p1[2] + p2[2] + p3[2]], 3);
    },
    isClockwise: function isClockwise(p1, p2, p3, normal) {
        //http://stackoverflow.com/questions/11938766/how-to-order-3-points-counter-clockwise-around-normal
        return this.dot(normal, this.cross(this.substract(p2, p1), this.substract(p3, p1))) > 0;
    }
};

},{}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var math = require('./math/vector');

var _require = require('./vertices_common'),
    getNormals = _require.getNormals,
    getEdge = _require.getEdge,
    Axis = _require.Axis;

var ImageDataMask = function () {
    function ImageDataMask(imageData) {
        _classCallCheck(this, ImageDataMask);

        this._im = imageData;
    }

    _createClass(ImageDataMask, [{
        key: 'hasPixel',
        value: function hasPixel(x, y) {
            return this._im.data[this.width * y * 4 + x * 4 + 3] > 0;
        }
    }, {
        key: 'width',
        get: function get() {
            return this._im.width;
        }
    }, {
        key: 'height',
        get: function get() {
            return this._im.height;
        }
    }, {
        key: 'imageData',
        get: function get() {
            return this._im;
        }
    }]);

    return ImageDataMask;
}();

var StringArrayMask = function () {
    function StringArrayMask() {
        _classCallCheck(this, StringArrayMask);

        for (var _len = arguments.length, array = Array(_len), _key = 0; _key < _len; _key++) {
            array[_key] = arguments[_key];
        }

        this._array = array;
    }

    _createClass(StringArrayMask, [{
        key: 'hasPixel',
        value: function hasPixel(x, y) {
            return this._array[y].charAt(x) != ' ';
        }
    }, {
        key: 'width',
        get: function get() {
            return this._array[0].length;
        }
    }, {
        key: 'height',
        get: function get() {
            return this._array.length;
        }
    }, {
        key: 'imageData',
        get: function get() {
            return null;
        }
    }]);

    return StringArrayMask;
}();

function getFlatProfile(imageMask) {
    //compose rectangles that match the mask
    //not expected to be very optimal for now

    var usedPoints = new Set();
    var rectangles = [];
    function setKey(x, y) {
        return y * imageMask.width + x;
    }

    function hasPixel(x, y) {
        return imageMask.hasPixel(x, y) && !usedPoints.has(setKey(x, y));
    }

    function tryStartFrom(x, y) {
        var thisRect = { start: [x, y], end: [x, y] };
        //expand to right (no need to go left, we are going from left to right)
        while (x < imageMask.width - 1 && hasPixel(x + 1, y)) {
            x++;
        }
        thisRect.end[0] = x;
        //now try to expand to the bottom
        var endY = y;
        var expanded = true;

        while (expanded && endY < imageMask.height - 1) {
            for (var cx = thisRect.start[0]; cx <= thisRect.end[0]; cx++) {
                if (!hasPixel(cx, endY + 1)) {
                    expanded = false;
                }
            }
            if (expanded) {
                endY++;
            }
        }
        thisRect.end[1] = endY;
        for (var _cx = thisRect.start[0]; _cx <= thisRect.end[0]; _cx++) {
            for (var cy = thisRect.start[1]; cy <= thisRect.end[1]; cy++) {
                usedPoints.add(setKey(_cx, cy));
            }
        }

        thisRect.end[0]++;
        thisRect.end[1]++;
        rectangles.push(thisRect);
        //console.log(thisRect, usedPoints);
    }

    for (var y = 0; y < imageMask.height; y++) {
        for (var x = 0; x < imageMask.width; x++) {
            if (hasPixel(x, y)) tryStartFrom(x, y);
        }
    }
    return rectangles;
}

function getSymmetricProfile(imageMask) {
    var halfw = imageMask.width / 2;
    var cx = halfw,
        cy = void 0,
        prevCx = void 0;
    var edges = [];
    for (cy = 0; cy <= imageMask.height; cy++) {
        prevCx = cx;
        cx = halfw - 1;
        while (cx >= 0 && cy < imageMask.height && imageMask.hasPixel(cx, cy)) {
            cx--;
        }
        cx++;
        //ignore "empty" lines
        if (cx !== halfw || prevCx !== halfw) {
            //draw horizontal line, and then - vertical one
            if (cx !== prevCx) {
                edges.push({ start: [prevCx, cy], end: [cx, cy], h: true });
            }
            edges.push({ start: [cx, cy], end: [cx, cy + 1], v: true });
        }
    }

    //2. optimize it a bit, don't forget to remove last one vertical line!
    for (var i = edges.length - 1; i >= 1; i--) {
        if (edges[i].v && edges[i - 1].v) {
            edges[i - 1].end = edges[i].end;
            edges.splice(i, 1);
        }
    }
    edges.pop();
    return edges.map(function (e) {
        delete e.h;
        delete e.v;
        return e;
    });
}

function getUv(symmetricProfileEdges) {
    return symmetricProfileEdges.map(function (_ref) {
        var start = _ref.start,
            end = _ref.end;

        if (start[0] < end[0]) {
            //bottom edge
            return { start: [start[0], start[1] - 1], end: [end[0], end[1] - 1] };
        } else if (start[0] == end[0]) {
            //left edge
            return { start: [start[0], start[1]], end: [end[0], end[1] - 1] };
        } else {
            //top edge
            return { start: [start[0], start[1]], end: [end[0], end[1]] }; //todo: make copying more... obvious
        }
    });
}

var ProjectionVerticesModel = function () {
    function ProjectionVerticesModel() {
        _classCallCheck(this, ProjectionVerticesModel);

        this._vertices = [];
        this._normals = [];
        this._uv = [];
        this._imageData = null;
    }

    _createClass(ProjectionVerticesModel, [{
        key: 'addImageSymmetric',
        value: function addImageSymmetric(imageMask) {
            var _this = this;

            var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;

            if (!imageMask.hasPixel && imageMask.data) {
                imageMask = new ImageDataMask(imageMask);
            }
            //1. make profile (i.e. x/z coords)
            var profile = getSymmetricProfile(imageMask);
            var uvs = getUv(profile);

            this._imageData = imageMask.imageData;

            //3. calculate <count> angles
            var anStep = Math.PI * 2 / count;
            var angles = [];
            for (var i = 0; i < count; i++) {
                angles.push(i * anStep);
            }

            var halfw = imageMask.width / 2;

            function getX(x, angle) {
                return halfw + (halfw - x) * Math.cos(angle);
            }
            function getY(x, angle) {
                return halfw + (halfw - x) * Math.sin(angle);
            }

            function point3d(point2d, angle, uv) {
                return [getX(point2d[0], angle), getY(point2d[0], angle), imageMask.height - point2d[1], uv[0], uv[1]];
            }

            var trianglesCount = profile.length * 2 * count;
            this._vertices = new Float32Array(trianglesCount * 3 * 3);
            this._normals = new Float32Array(trianglesCount * 3 * 3);
            this._uv = new Float32Array(trianglesCount * 3 * 2);

            var vi = 0;
            var ui = 0;

            angles.forEach(function (angle, i) {
                var prevAngle = i == 0 ? angles[angles.length - 1] : angles[i - 1];
                profile.forEach(function (_ref2, idx) {
                    var start = _ref2.start,
                        end = _ref2.end;


                    var tri1 = [point3d(start, angle, uvs[idx].start), point3d(start, prevAngle, uvs[idx].start), point3d(end, angle, uvs[idx].end)];
                    var tri2 = [point3d(start, prevAngle, uvs[idx].start), point3d(end, prevAngle, uvs[idx].end), point3d(end, angle, uvs[idx].end)];
                    //todo: for edges from middle there will be one triangle,
                    [tri1, tri2].forEach(function (triangle) {
                        var normal = math.triangleNormal(triangle[0], triangle[1], triangle[2], [halfw, halfw, (triangle[0][2] + triangle[1][2] + triangle[2][2]) / 3]);
                        normal.ccw.forEach(function (point) {
                            _this._vertices[vi] = point[0];
                            _this._vertices[vi + 1] = point[1];
                            _this._vertices[vi + 2] = point[2];
                            _this._normals[vi] = normal[0];
                            _this._normals[vi + 1] = normal[1];
                            _this._normals[vi + 2] = normal[2];
                            vi += 3;
                            _this._uv[ui] = point[3] / (imageMask.width - 1);
                            _this._uv[ui + 1] = 1 - point[4] / (imageMask.height - 1);
                            if (_this._uv[ui + 1] < 0) console.log(point[3], point[4]);
                            ui += 2;
                        });
                    });
                });
            });
        }
    }, {
        key: 'addImageFlatX',
        value: function addImageFlatX(offset, width, imageMask) {
            if (!imageMask.hasPixel && imageMask.data) {
                imageMask = new ImageDataMask(imageMask);
            }
            var rectangles = getFlatProfile(imageMask);
            this._imageData = imageMask.imageData;
            this._vertices = new Float32Array(rectangles.length * 2 * 6 * 3 * 3);
            this._normals = new Float32Array(rectangles.length * 2 * 6 * 3 * 3);
            this._uv = new Float32Array(rectangles.length * 2 * 6 * 2 * 3);
            var vi = 0,
                ui = 0;

            var self = this;

            var vmod = [[0, 0], [0, 0], [0, -1]]; //shift uv a bit for top side
            var umod = [[0, -1], [0, 0], [0, 0]]; //shift uv a bit for right side

            function addFace(coords, ai, ei) {
                //swap z-values
                var c20 = coords[2][0];
                coords[2][0] = imageMask.height - coords[2][1];
                coords[2][1] = imageMask.height - c20;
                var vertices = getEdge(coords, ai, ei);
                var normals = getNormals(coords, ai, ei);
                for (var i = 0; i < vertices.length; i++) {
                    self._vertices[vi + i * 3 + 0] = vertices[i][0];
                    self._vertices[vi + i * 3 + 1] = vertices[i][1];
                    self._vertices[vi + i * 3 + 2] = vertices[i][2];
                    self._normals[vi + i * 3 + 0] = normals[0];
                    self._normals[vi + i * 3 + 1] = normals[1];
                    self._normals[vi + i * 3 + 2] = normals[2];
                    self._uv[ui + i * 2 + 0] = (umod[ai][ei] + vertices[i][0]) / imageMask.width;
                    self._uv[ui + i * 2 + 1] = (vmod[ai][ei] + vertices[i][2]) / imageMask.height;
                }
                vi += 3 * vertices.length;
                ui += 2 * vertices.length;
            }

            rectangles.forEach(function (_ref3) {
                var start = _ref3.start,
                    end = _ref3.end;

                //6 edges we need to build, there are 12 triangles
                //1. front/back (y)
                addFace([[start[0], end[0]], [offset, offset], [start[1], end[1]]], Axis.y, 0);
                addFace([[start[0], end[0]], [offset + width, offset + width], [start[1], end[1]]], Axis.y, 1);
                //2. left/right (x)
                addFace([[start[0], start[0]], [offset, offset + width], [start[1], end[1]]], Axis.x, 0);
                addFace([[end[0], end[0]], [offset, offset + width], [start[1], end[1]]], Axis.x, 1);
                //3. top/bottom (z)
                addFace([[start[0], end[0]], [offset, offset + width], [start[1], start[1]]], Axis.z, 1);
                addFace([[start[0], end[0]], [offset, offset + width], [end[1], end[1]]], Axis.z, 0);
            });

            //console.log(this._uv.filter((v) => v < 0));

            //throw new Error("not implemented yet");
        }
    }, {
        key: 'fillTexture',
        value: function fillTexture(imageDataCreator) {
            return this._imageData;
        }
    }, {
        key: 'vertices',
        get: function get() {
            return this._vertices;
        }
    }, {
        key: 'normals',
        get: function get() {
            return this._normals;
        }
    }, {
        key: 'uvs',
        get: function get() {
            return this._uv;
        }
    }]);

    return ProjectionVerticesModel;
}();

module.exports.ProjectionVerticesModel = ProjectionVerticesModel;
module.exports.getSymmetricProfile = getSymmetricProfile;
module.exports.getFlatProfile = getFlatProfile;
module.exports.StringArrayMask = StringArrayMask;
module.exports.getUv = getUv;

},{"./math/vector":6,"./vertices_common":9}],8:[function(require,module,exports){
"use strict";

//converts 2d image to 3d model using simple conversion

function forEach(imageData, condition, fn) {
    for (var y = 0; y < imageData.height; y++) {
        var idx = y * imageData.width * 4;
        for (var x = 0; x < imageData.width; x++) {
            var r = imageData.data[idx];
            var g = imageData.data[idx + 1];
            var b = imageData.data[idx + 2];
            var a = imageData.data[idx + 3];
            var color = r << 16 | g << 8 | b;
            if (condition(x, y, color, a)) {
                fn(x, y, color, a);
            }
            idx += 4;
        }
    }
}

function nonTransparent(x, y, color, a) {
    return a > 0;
}

function projectFlatX(imageData, voxelModel, _ref) {
    var _ref$width = _ref.width,
        width = _ref$width === undefined ? 1 : _ref$width,
        _ref$offset = _ref.offset,
        offset = _ref$offset === undefined ? 0 : _ref$offset;

    forEach(imageData, nonTransparent, function (x, y, color) {
        for (var ny = offset; ny <= offset + width; ny++) {
            voxelModel.setVoxel(x, ny, imageData.height - 1 - y, color);
        }
    });
}

function projectFlatY(imageData, voxelModel, _ref2) {
    var _ref2$width = _ref2.width,
        width = _ref2$width === undefined ? 1 : _ref2$width,
        _ref2$offset = _ref2.offset,
        offset = _ref2$offset === undefined ? 0 : _ref2$offset;

    forEach(imageData, nonTransparent, function (x, y, color) {
        for (var nx = offset; nx <= offset + width; nx++) {
            voxelModel.setVoxel(nx, x, imageData.height - 1 - y, color);
        }
    });
}

function projectSymmetric(imageData, voxelModel) {
    var cx = imageData.width / 2;
    forEach(imageData, nonTransparent, function (x, y, color) {
        if (x > cx) return; //it is symetric, we need to analyze only half of image
        var radius = Math.abs(cx - x);
        for (var nx = x; nx < imageData.width - x; nx++) {
            for (var ny = x; ny < imageData.width - x; ny++) {
                if (Math.hypot(nx - cx, ny - cx) <= radius) {
                    voxelModel.setVoxel(nx, ny, imageData.height - 1 - y, color);
                }
            }
        }
    });
}

module.exports = {
    projectFlatX: projectFlatX,
    projectFlatY: projectFlatY,
    projectSymmetric: projectSymmetric
};

},{}],9:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var Normals = [[-1, 0, 0], [1, 0, 0], //x-edges
[0, -1, 0], [0, 1, 0], //y-edges
[0, 0, -1], [0, 0, 1] //z-edges
];

var Edges = [[[0, 0], [1, 1], [1, 0], [0, 0], [0, 1], [1, 1]], //ccw
[[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]] //cw
];

var Axis = {
    x: 0,
    y: 1,
    z: 2
};

//coords
function getEdge(coords, axis, idx) {
    var val = coords[axis][idx];
    switch (axis) {
        case Axis.x:
            return Edges[idx].map(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    i1 = _ref2[0],
                    i2 = _ref2[1];

                return [val, coords[Axis.y][i1], coords[Axis.z][i2]];
            });
        case Axis.y:
            return Edges[idx].map(function (_ref3) {
                var _ref4 = _slicedToArray(_ref3, 2),
                    i1 = _ref4[0],
                    i2 = _ref4[1];

                return [coords[Axis.x][i2], val, coords[Axis.z][i1]];
            });
        case Axis.z:
            return Edges[idx].map(function (_ref5) {
                var _ref6 = _slicedToArray(_ref5, 2),
                    i1 = _ref6[0],
                    i2 = _ref6[1];

                return [coords[Axis.x][i1], coords[Axis.y][i2], val];
            });
    }
}

function getNormals(coords, axis, idx) {
    return Normals[axis * 2 + idx];
}

module.exports = {
    getNormals: getNormals,
    getEdge: getEdge,
    Axis: Axis
};

},{}],10:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//todo: shall support models more than 256*256*256

function ckey(x, y, z) {
    return x * 65536 + y * 256 + z;
}

var Cube = function () {
    function Cube(x0, y0, z0, size) {
        var parent = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

        _classCallCheck(this, Cube);

        this.x0 = x0;
        this.y0 = y0;
        this.z0 = z0;
        this.size = size;
        var p2 = Math.log(size) / Math.log(2);
        if (p2 !== Math.abs(p2)) throw new Error("size shall be power of 2");
        this.full = true;
        this.children = [];
        this.filled = false;
        this.parent = parent;
    }

    _createClass(Cube, [{
        key: "split",
        value: function split() {
            if (!this.full) return;
            if (this.size === 1) throw new Error("cannot split cube with size 1");
            this.full = false;
            var x0 = this.x0,
                y0 = this.y0,
                z0 = this.z0,
                size = this.size;

            var half = size / 2;
            this.children = [new Cube(x0, y0, z0, half, this), new Cube(x0, y0, z0 + half, half, this), new Cube(x0, y0 + half, z0, half, this), new Cube(x0 + half, y0, z0, half, this), new Cube(x0 + half, y0, z0 + half, half, this), new Cube(x0, y0 + half, z0 + half, half, this), new Cube(x0 + half, y0 + half, z0, half, this), new Cube(x0 + half, y0 + half, z0 + half, half, this)];
        }
    }, {
        key: "fillSet",
        value: function fillSet(aset) {
            for (var x = this.x0; x < this.x0 + this.size; x++) {
                for (var y = this.y0; y < this.y0 + this.size; y++) {
                    for (var z = this.z0; z < this.z0 + this.size; z++) {
                        aset.add(ckey(x, y, z));
                    }
                }
            }
        }
    }, {
        key: "contains",
        value: function contains(x, y, z) {
            return x >= this.x0 && x < this.x0 + this.size && y >= this.y0 && y < this.y0 + this.size && z >= this.z0 && z < this.z0 + this.size;
        }
    }, {
        key: "findCube",
        value: function findCube(x, y, z) {
            if (this.contains(x, y, z)) {
                if (this.full) return this;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var cube = _step.value;

                        var res = cube.findCube(x, y, z);
                        if (res) return res;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
            return null;
        }
    }, {
        key: "fill",
        value: function fill(x, y, z) {
            var c = this.findCube(x, y, z);
            while (c && c.size > 1) {
                c.split();
                c = c.findCube(x, y, z);
            }
            if (c == null) debugger;
            c.filled = true;
        }
    }, {
        key: "unfill",
        value: function unfill(x, y, z) {
            var c = this.findCube(x, y, z);
            c.filled = false;
            if (c.parent) c.parent.tryCollapse();
        }
    }, {
        key: "tryCollapse",
        value: function tryCollapse() {
            if (this.full) return;
            if (this.children.every(function (c) {
                return c.full && !c.filled;
            })) {
                this.full = true;
                this.filled = false;
                this.children = [];
                if (this.parent) this.parent.tryCollapse();
            }
        }
    }, {
        key: "debug",
        value: function debug() {
            var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
            var onlyFull = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var minSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            if (this.size < minSize) return;
            if (!onlyFull || this.full) {
                console.log(indent, "cube", this.filled ? "*" : " ", [this.x0, this.y0, this.z0], "x", this.size);
            }
            if (!this.full) {
                this.children.forEach(function (c) {
                    return c.debug(indent + "  ", onlyFull, minSize);
                });
            }
        }
    }]);

    return Cube;
}();

//todo: another way: do not calculate air. just check neighbors. in this case we may add vertices for inner volume, but
//that could have less problems

var VoxelModel = function () {
    function VoxelModel() {
        var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        _classCallCheck(this, VoxelModel);

        this._width = width;
        this._height = height;
        this._depth = depth;
        //todo: this is simplest for now. when performance problem appeared - we'll need to go with another solution
        this._voxels = new Map();
        if (width !== 0 && height !== 0 && depth !== 0) {
            var max = Math.max(width, height, depth);
            var p2 = Math.pow(2, Math.ceil(Math.log(max) / Math.log(2)));
            this._cube = new Cube(0, 0, 0, p2);
        }
    }

    _createClass(VoxelModel, [{
        key: "resizeUpTo",
        value: function resizeUpTo(nw, nh, nd) {
            this._width = Math.max(this._width, nw - 1);
            this._height = Math.max(this._height, nh - 1);
            this._depth = Math.max(this._depth, nd - 1);
        }
    }, {
        key: "setVoxel",
        value: function setVoxel(x, y, z, color, props) {
            if (x < 0 || y < 0 || z < 0) throw new Error("xyz shall be >= 0");
            this.resizeUpTo(x, y, z);
            this._voxels.set(ckey(x, y, z), { x: x, y: y, z: z, color: color, props: props || {} });
            if (this._cube) {
                this._cube.fill(x, y, z);
            }
        }
    }, {
        key: "getVoxelColor",
        value: function getVoxelColor(x, y, z) {
            return this.getVoxel(x, y, z, {}).color;
        }
    }, {
        key: "getVoxel",
        value: function getVoxel(x, y, z) {
            var ifNull = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

            return this._voxels.get(ckey(x, y, z)) || ifNull;
        }
    }, {
        key: "getVoxelProp",
        value: function getVoxelProp(name, x, y, z) {
            return this.getVoxel(x, y, z, { props: {} }).props[name];
        }
    }, {
        key: "deleteVoxel",
        value: function deleteVoxel(x, y, z) {
            this._voxels.delete(ckey(x, y, z));
            if (this._cube) {
                this._cube.unfill(x, y, z);
            }
        }
    }, {
        key: "forEachIn",
        value: function forEachIn(fn) {
            var x0 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
            var y0 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
            var z0 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
            var x1 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : this.maxX;

            var _this = this;

            var y1 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : this.maxY;
            var z1 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : this.maxZ;

            var xs = Math.min(x0, x1);
            var ys = Math.min(y0, y1);
            var zs = Math.min(z0, z1);
            var xe = Math.max(x0, x1);
            var ye = Math.max(y0, y1);
            var ze = Math.max(z0, z1);

            var currentVoxel = null,
                currentKey = void 0,
                x = void 0,
                y = void 0,
                z = void 0;
            var changer = function changer(newColor) {
                if (currentVoxel == null) {
                    _this._voxels[currentKey] = currentVoxel = { x: x, y: y, z: z, props: {} };
                }
                if ((typeof newColor === "undefined" ? "undefined" : _typeof(newColor)) !== "object") {
                    currentVoxel.color = newColor;
                } else {
                    for (var key in newColor) {
                        if (newColor.hasOwnProperty(key)) {
                            currentVoxel.props[key] = newColor[key];
                        }
                    }
                }
            };

            for (x = xs; x <= xe; x++) {
                for (y = ys; y <= ye; y++) {
                    for (z = zs; z <= ze; z++) {
                        currentKey = ckey(x, y, z);
                        currentVoxel = this._voxels.get(currentKey);
                        fn(currentVoxel, x, y, z, changer);
                    }
                }
            }
        }
    }, {
        key: "getAirCube",
        value: function getAirCube() {
            var air = new Set();

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
    }, {
        key: "getAir",
        value: function getAir() {
            var _this2 = this;

            var air = new Set();
            var toSeeSet = new Set();
            toSeeSet.add(ckey(0, 0, 0));
            var toSee = [{ x: 0, y: 0, z: 0 }];
            while (toSee.length > 0) {
                var _toSee$shift = toSee.shift(),
                    x = _toSee$shift.x,
                    y = _toSee$shift.y,
                    z = _toSee$shift.z;

                var key = ckey(x, y, z);
                if (!this._voxels.has(key)) {
                    air.add(key);
                    [[x - 1, y, z], [x + 1, y, z], [x, y - 1, z], [x, y + 1, z], [x, y, z - 1], [x, y, z + 1]].forEach(function (_ref) {
                        var _ref2 = _slicedToArray(_ref, 3),
                            nx = _ref2[0],
                            ny = _ref2[1],
                            nz = _ref2[2];

                        var nkey = ckey(nx, ny, nz);
                        if (nx >= 0 && ny >= 0 && nz >= 0 && nx <= _this2.maxX && ny <= _this2.maxY && nz <= _this2.maxZ && !air.has(nkey) && !toSeeSet.has(nkey)) {
                            toSee.push({ x: nx, y: ny, z: nz });
                            toSeeSet.add(nkey);
                        }
                    });
                }
            }
            return air;
        }
    }, {
        key: "toCubemap",
        value: function toCubemap() {
            var _this3 = this;

            var ignoreEmptyness = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


            var cubemaps = [[new Map(), new Map()], //const-x edges
            [new Map(), new Map()], //const-y edges
            [new Map(), new Map()] //const-z edges
            ];
            var isAir = void 0;

            if (ignoreEmptyness) {
                isAir = function isAir(key) {
                    return !_this3._voxels.has(key);
                };
            } else {
                (function () {
                    var air = _this3._cube ? _this3.getAirCube() : _this3.getAir();
                    isAir = function isAir(key) {
                        return air.has(key);
                    };
                })();
            }
            //1. add only meaningful edges - which touch air
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this._voxels.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var voxel = _step2.value;
                    var x = voxel.x,
                        y = voxel.y,
                        z = voxel.z;

                    var key = ckey(x, y, z);
                    var check = [[x - 1, y, z], [x + 1, y, z], [x, y - 1, z], [x, y + 1, z], [x, y, z - 1], [x, y, z + 1]];
                    for (var idx = 0; idx < check.length; idx++) {
                        var _check$idx = _slicedToArray(check[idx], 3),
                            nx = _check$idx[0],
                            ny = _check$idx[1],
                            nz = _check$idx[2];

                        var thisIsAir = nx <= 0 || ny <= 0 || nz <= 0 || nx >= this.maxX + 1 || ny >= this.maxY + 1 || nz >= this.maxZ + 1 || isAir(ckey(nx, ny, nz));
                        if (thisIsAir) {
                            var cmi = idx / 2 | 0,
                                cmj = idx % 2;
                            cubemaps[cmi][cmj].set(key, { start: voxel, end: voxel });
                        }
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            var axisCheck = [["y", "z", "x", function (c1, c2, cc) {
                return ckey(cc, c1, c2);
            }], ["x", "z", "y", function (c1, c2, cc) {
                return ckey(c1, cc, c2);
            }], ["x", "y", "z", function (c1, c2, cc) {
                return ckey(c1, c2, cc);
            }]];
            //2. unite edges if possible
            // for each edgemap
            //   first axis - try to check next/prev. if same color - continue. if not on both ends - next step
            //   second axis - try to check next/prev for whole line.
            //todo: different attributes

            var equal = function equal(v1, v2) {
                return v1 && v2 && (v2.start ? v1.color === v2.start.color : v1.color === v2.color);
            };

            cubemaps.forEach(function (coordMap, ci) {
                var _axisCheck$ci = _slicedToArray(axisCheck[ci], 4),
                    a1 = _axisCheck$ci[0],
                    a2 = _axisCheck$ci[1],
                    ac = _axisCheck$ci[2],
                    ckey = _axisCheck$ci[3];

                coordMap.forEach(function (edgeMap, ei) {

                    var toCheck = new Set(edgeMap.keys());

                    while (toCheck.size) {
                        var key = toCheck.values().next().value;
                        toCheck.delete(key);
                        //console.log("check ", key);
                        var sq = edgeMap.get(key);
                        var voxel = sq.start;
                        //check first axis
                        var expanded = false;
                        var c11 = voxel[a1],
                            c12 = voxel[a1];
                        var c21 = voxel[a2],
                            c22 = voxel[a2];
                        var cc = voxel[ac];
                        do {
                            expanded = false;
                            if (equal(voxel, edgeMap.get(ckey(c11 - 1, c21, cc)))) {
                                c11--;
                                expanded = true;
                            }
                            if (equal(voxel, edgeMap.get(ckey(c12 + 1, c21, cc)))) {
                                c12++;
                                expanded = true;
                            }
                        } while (expanded);
                        //now check second axis
                        do {
                            expanded = false;
                            var allEqual = true;
                            for (var c1 = c11; c1 <= c12; c1++) {
                                if (!equal(voxel, edgeMap.get(ckey(c1, c21 - 1, cc)))) {
                                    allEqual = false;
                                    break;
                                }
                            }
                            if (allEqual) {
                                c21--;
                                expanded = true;
                            }
                            allEqual = true;
                            for (var _c = c11; _c <= c12; _c++) {
                                if (!equal(voxel, edgeMap.get(ckey(_c, c22 + 1, cc)))) {
                                    allEqual = false;
                                    break;
                                }
                            }
                            if (allEqual) {
                                c22++;
                                expanded = true;
                            }
                        } while (expanded);
                        var key1 = ckey(c11, c21, cc);
                        var key2 = ckey(c12, c22, cc);
                        var newEdge = { start: edgeMap.get(key1).start, end: edgeMap.get(key2).start };

                        for (var _c2 = c11; _c2 <= c12; _c2++) {
                            for (var c2 = c21; c2 <= c22; c2++) {
                                var _key = ckey(_c2, c2, cc);
                                //console.log("remove ", key);
                                edgeMap.delete(_key);
                                toCheck.delete(_key);
                            }
                        }
                        edgeMap.set(key, newEdge);
                    }
                });
            });

            return cubemaps.map(function (axisMap) {
                return axisMap.map(function (edgeMap) {
                    return Array.from(edgeMap.values());
                });
            });
        }
    }, {
        key: "voxels",
        get: function get() {
            return this._voxels.values();
        }
    }, {
        key: "maxX",
        get: function get() {
            return this._width;
        }
    }, {
        key: "maxY",
        get: function get() {
            return this._height;
        }
    }, {
        key: "maxZ",
        get: function get() {
            return this._depth;
        }
    }]);

    return VoxelModel;
}();

module.exports = VoxelModel;

},{}]},{},[2]);
