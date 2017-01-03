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

var _vertices_model = require('./vertices_model');

var _vertices_model2 = _interopRequireDefault(_vertices_model);

var _three_export = require('./formats/three_export');

var _three_export2 = _interopRequireDefault(_three_export);

var _projections = require('./projections');

var _projections2 = _interopRequireDefault(_projections);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Threedify() {
    var configs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


    var configCache = {};
    var geometriesCache = {};

    var tempCanvas = document.createElement('canvas');

    var convertor = {
        toGeometry: function toGeometry(imageData, key_or_config) {
            //gets config
            var config = configCache[key_or_config] || key_or_config;
            if (!config.projection) throw new Error("Cannot find projection for config/key: " + JSON.stringify(key_or_config));
            //performs projection to voxel model
            var voxModel = new _voxel_model2.default(imageData.width, imageData.width, imageData.height);
            config.projection(imageData, voxModel, config);
            //converts to vertices
            var vertModel = new _vertices_model2.default();
            vertModel.addVoxelModel(voxModel, true);
            //converts to geometry
            var exp = new _three_export2.default();
            var geom = exp.saveGeometry(vertModel);
            var text = exp.saveTexture(vertModel.colorModel);
            //console.log(vertModel.colorModel);
            var mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ map: text }));
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

Threedify.Sym = _projections2.default.projectSymmetric;
Threedify.X = _projections2.default.projectFlatX;
Threedify.Y = _projections2.default.projectFlatY;

},{"./color_model":3,"./formats/three_export":4,"./projections":5,"./vertices_model":6,"./voxel_model":7}],2:[function(require,module,exports){
'use strict';

var _voxel_model = require('./voxel_model');

var _voxel_model2 = _interopRequireDefault(_voxel_model);

var _color_model = require('./color_model');

var _color_model2 = _interopRequireDefault(_color_model);

var _vertices_model = require('./vertices_model');

var _vertices_model2 = _interopRequireDefault(_vertices_model);

var _three_export = require('./formats/three_export');

var _three_export2 = _interopRequireDefault(_three_export);

var _Threedify = require('./Threedify');

var _Threedify2 = _interopRequireDefault(_Threedify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.VoxelModel = _voxel_model2.default;
window.VerticesModel = _vertices_model2.default;
window.ThreeExport = _three_export2.default;
window.ColorModel = _color_model2.default;
window.Threedify = _Threedify2.default;

},{"./Threedify":1,"./color_model":3,"./formats/three_export":4,"./vertices_model":6,"./voxel_model":7}],3:[function(require,module,exports){
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
            var canvas = document.createElement('canvas');
            var colors = colorModel.normalizedColors;
            canvas.setAttribute("width", colors.length);
            canvas.setAttribute('height', 1);
            var ctx = canvas.getContext('2d');
            var im = ctx.getImageData(0, 0, colors.length, 1);
            for (var ci = 0; ci < colors.length; ci++) {
                im.data[ci * 4 + 0] = colors[ci] >> 16;
                im.data[ci * 4 + 1] = colors[ci] >> 8 & 0xff;
                im.data[ci * 4 + 2] = colors[ci] & 0xff;
                im.data[ci * 4 + 3] = 0xff;
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ColorModel = require('./color_model');

var Normals = [[-1, 0, 0], [1, 0, 0], //x-edges
[0, -1, 0], [0, 1, 0], //y-edges
[0, 0, -1], [0, 0, 1]];

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

var CubicVerticesModel = function () {
    function CubicVerticesModel() {
        var colorModel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new ColorModel();

        _classCallCheck(this, CubicVerticesModel);

        this._colorModel = colorModel;
        this._vertices = [];
        this._normals = []; //predefine normals
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
        key: 'colorModel',
        get: function get() {
            return this._colorModel;
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

},{"./color_model":3}],7:[function(require,module,exports){
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
