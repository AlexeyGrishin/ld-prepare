(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Proxy3d = exports.Proxy3d = function () {
    function Proxy3d(target) {
        var reverseY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (y) {
            return y;
        };
        var postSetFn = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

        _classCallCheck(this, Proxy3d);

        this.target = target;
        this.postSetFn = postSetFn;
        this.reverseY = reverseY;
    }

    _createClass(Proxy3d, [{
        key: "x",
        get: function get() {
            return this.target.x;
        },
        set: function set(val) {
            this.target.x = val;this.postSetFn();
        }
    }, {
        key: "y",
        get: function get() {
            return this.reverseY(this.target.y);
        },
        set: function set(val) {
            this.target.y = this.reverseY(val);this.postSetFn();
        }
    }, {
        key: "z",
        get: function get() {
            return this.target.z;
        },
        set: function set(val) {
            this.target.z = val;this.postSetFn();
        }
    }]);

    return Proxy3d;
}();

var ThreeLinkedObject = exports.ThreeLinkedObject = function () {
    function ThreeLinkedObject(scene, sprite, mainMesh) {
        var _this = this;

        var rotationAxis = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "y";

        _classCallCheck(this, ThreeLinkedObject);

        this.parent = scene;
        this.sprite = sprite;
        this.mainMesh = mainMesh;
        this.rotationAxis = rotationAxis;
        this.rotationDirection = 1;
        if (this.rotationAxis[0] === "-") {
            this.rotationAxis = this.rotationAxis[1];
            this.rotationDirection = -1;
        }
        this._rotation = new Proxy3d(mainMesh.rotation, function (y) {
            return y;
        }, function () {
            return _this.sprite.rotation = _this.rotationDirection * _this._rotation[_this.rotationAxis];
        });
        this._scale = new Proxy3d(mainMesh.scale);
        this.update();
    }

    _createClass(ThreeLinkedObject, [{
        key: "applyRendering",
        value: function applyRendering(_rendering) {}
    }, {
        key: "applyShadows",
        value: function applyShadows(_shadows) {}
    }, {
        key: "applyDebug",
        value: function applyDebug(_debug) {}
    }, {
        key: "update",
        value: function update() {
            this.updateCoords();
        }
    }, {
        key: "updateCoords",
        value: function updateCoords() {
            this.x = this.sprite.x;
            this.y = this.sprite.y;
            this.rotation[this.rotationAxis] = this.rotationDirection * this.sprite.rotation;
            this.scale.x = this.sprite.scale.x;
            this.scale.y = this.sprite.scale.y;
        }
    }, {
        key: "insertTo",
        value: function insertTo(scene) {
            scene.add(this.mainMesh);
        }
    }, {
        key: "removeFrom",
        value: function removeFrom(scene) {
            scene.remove(this.mainMesh);
        }
    }, {
        key: "attachTo",
        value: function attachTo(anotherSprite) {
            var _this2 = this;

            var updateFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

            var oldUpdate = anotherSprite.update;
            anotherSprite.update = function () {
                oldUpdate.call(anotherSprite);
                _this2.x = anotherSprite.x;
                _this2.y = anotherSprite.y;
                updateFn(_this2, anotherSprite);
            };
            anotherSprite.events.onDestroy.addOnce(function () {
                return _this2.sprite.destroy();
            });
        }
    }, {
        key: "x",
        get: function get() {
            return this.sprite.x;
        },
        set: function set(val) {
            this.sprite.x = val;this.mainMesh.position.x = val;
        }
    }, {
        key: "y",
        get: function get() {
            return this.sprite.y;
        },
        set: function set(val) {
            this.sprite.y = val;this.mainMesh.position.y = this.parent.reverseY(val);
        }
    }, {
        key: "z",
        get: function get() {
            return this.mainMesh.position.z;
        },
        set: function set(val) {
            this.mainMesh.position.z = val;
        }
    }, {
        key: "rotation",
        get: function get() {
            return this._rotation;
        }
    }, {
        key: "scale",
        get: function get() {
            return this._scale;
        }
    }]);

    return ThreeLinkedObject;
}();

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    AmbientLight: {
        factory: function factory(_ref) {
            var color = _ref.color,
                intensity = _ref.intensity;
            return new THREE.AmbientLight(color, intensity);
        },
        helperClass: undefined,
        shadows: false,
        target: false
    },
    DirectionalLight: {
        factory: function factory(_ref2) {
            var color = _ref2.color,
                intensity = _ref2.intensity,
                _ref2$distance = _ref2.distance,
                distance = _ref2$distance === undefined ? 100 : _ref2$distance;

            var light = new THREE.DirectionalLight(color, intensity);
            light.shadow.camera.top = distance;
            light.shadow.camera.bottom = -distance / 2;
            light.shadow.camera.left = -distance / 2;
            light.shadow.camera.right = distance / 2;
            light.shadow.camera.near = 0;
            light.shadow.camera.far = distance;
            light.shadow.camera.updateProjectionMatrix();
            return light;
        },
        helperClass: THREE.DirectionalLightHelper,
        shadows: true,
        target: true
    },
    SpotLight: {
        factory: function factory(_ref3) {
            var color = _ref3.color,
                intensity = _ref3.intensity,
                distance = _ref3.distance,
                angle = _ref3.angle,
                penumbra = _ref3.penumbra,
                decay = _ref3.decay;
            return new THREE.SpotLight(color, intensity, distance, angle, penumbra, decay);
        },
        helperClass: THREE.SpotLightHelper,
        shadows: true,
        target: true
    },
    PointLight: {
        factory: function factory(_ref4) {
            var color = _ref4.color,
                intensity = _ref4.intensity,
                distance = _ref4.distance,
                decay = _ref4.decay;
            return new THREE.PointLight(color, intensity, distance, decay);
        },
        helperClass: THREE.PointLightHelper,
        shadows: true,
        target: false
    },

    RenderSprites: 1,
    RenderModels: 2,
    RenderNothing: 3,
    RenderBoth: 4,

    ShadowMaterial: new THREE.ShadowMaterial()
};

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _base = require("./base");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ThreeLight = function (_ThreeLinkedObject) {
    _inherits(ThreeLight, _ThreeLinkedObject);

    function ThreeLight(scene, sprite, light, typeConfig, config) {
        _classCallCheck(this, ThreeLight);

        var _this = _possibleConstructorReturn(this, (ThreeLight.__proto__ || Object.getPrototypeOf(ThreeLight)).call(this, scene, sprite, light));

        _this.light = light;
        _this.typeConfig = typeConfig;
        _this.config = config;
        _this.applyConfig(typeConfig, config);
        return _this;
    }

    _createClass(ThreeLight, [{
        key: "applyConfig",
        value: function applyConfig(typeConfig, config) {
            var _this2 = this;

            if (config.position) {
                this.x = config.position.x;
                this.y = config.position.y;
                this.z = config.position.z;
            }
            if (typeConfig.target) {
                this.target = new _base.Proxy3d(this.light.target.position, this.parent.reverseY.bind(this.parent), function () {
                    return _this2.light.target.updateMatrixWorld();
                });
                if (config.target) {
                    this.target.x = config.target.x;
                    this.target.y = config.target.y;
                    this.target.z = config.target.z;
                }
            }
            if (config && config.floor !== undefined && config.distance !== undefined) {
                var material = this.parent.parent.createMaterial(config.floor);
                var floor = new THREE.Mesh(new THREE.CircleGeometry(config.distance, 32), material);
                floor.receiveShadow = true;
                floor.position.set(0, 0, 0);
                this.floor = floor;
            } else if (this.floor) {
                this.parent.scene.remove(this.floor);
                delete this.floor;
            }
            ["color", "intensity", "distance", "angle"].forEach(function (prop) {
                if (config[prop] !== undefined) _this2[prop] = config[prop];
            });
            if (config.attachTo) {
                var _ref = Array.isArray(config.attachTo) ? config.attachTo : [config.attachTo],
                    _ref2 = _slicedToArray(_ref, 2),
                    anotherSprite = _ref2[0],
                    updateFn = _ref2[1];

                this.attachTo(anotherSprite, updateFn);
            }
        }

        //todo: move helper creation here, inside updateDebug

    }, {
        key: "removeFrom",
        value: function removeFrom(scene) {
            this.parent.removeLight(this.light, this.config);
            if (this.floor) {
                scene.remove(this.floor);
            }
        }
    }, {
        key: "applyShadows",
        value: function applyShadows(shadows) {
            if (this.typeConfig.shadows) {
                this.light.castShadow = shadows;
                if (this.floor && shadows) this.light.parent.add(this.floor);
                if (this.floor && !shadows) this.light.parent.remove(this.floor);
            }
        }
    }, {
        key: "updateCoords",
        value: function updateCoords() {
            _get(ThreeLight.prototype.__proto__ || Object.getPrototypeOf(ThreeLight.prototype), "updateCoords", this).call(this);
            if (this.floor) {
                this.floor.position.set(this.light.position.x, this.light.position.y, 0);
            }
        }
    }, {
        key: "cloneInto",
        value: function cloneInto(newParent) {
            return new ThreeLight(newParent, this.sprite, this.light.clone(), this.typeConfig, this.config);
        }
    }, {
        key: "polygons",
        get: function get() {
            return 0;
        }
    }, {
        key: "color",
        get: function get() {
            return this.light.color.getHex();
        },
        set: function set(val) {
            this.light.color.setHex(val);
        }
    }, {
        key: "intensity",
        get: function get() {
            return this.light.intensity;
        },
        set: function set(val) {
            this.light.intensity = val;
        }
    }, {
        key: "distance",
        get: function get() {
            return this.light.distance;
        },
        set: function set(val) {
            this.light.distance = val;
        }
    }, {
        key: "angle",
        get: function get() {
            return this.light.angle;
        },
        set: function set(val) {
            this.light.angle = val;
        }
    }, {
        key: "renderOneByOne",
        get: function get() {
            return false;
        }
    }]);

    return ThreeLight;
}(_base.ThreeLinkedObject);

exports.default = ThreeLight;

},{"./base":1}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ThreeLoader = function () {
    function ThreeLoader() {
        _classCallCheck(this, ThreeLoader);

        if (!THREE) throw new Error("Please load three.js first");
        if (!THREE.OBJLoader) throw new Error("Cannot find OBJLoader class, please download it from three.js examples");
        if (!THREE.MTLLoader) throw new Error("Cannot find MTLLoader class, please download it from three.js examples");

        this.objLoader = new THREE.OBJLoader();
        this.mtlLoader = new THREE.MTLLoader();
        this._assetsPath = '';
        this._objects = {};
        this._replacement = {};
    }

    _createClass(ThreeLoader, [{
        key: "loadObj",
        value: function loadObj(name, props, cb) {
            var _this = this;

            this.mtlLoader.load(name + '.mtl', function (materials) {
                materials.preload();
                _this.objLoader.setMaterials(materials);
                _this.objLoader.load(name + '.obj', function (obj) {
                    props.obj = obj;
                    props.name = name;
                    _this._objects[name] = props;
                    if (props.insteadOf) {
                        var replacementKey = props.insteadOf.key || props.insteadOf[0];
                        if (props.insteadOf.frame !== undefined || props.insteadOf[1] !== undefined) {
                            replacementKey += "_" + (props.insteadOf.frame === undefined ? props.insteadOf[1] : props.insteadOf.frame);
                        }
                        _this._replacement[replacementKey] = props;
                    }
                    cb(obj);
                });
            });
        }
    }, {
        key: "assets",
        get: function get() {
            return this._assetsPath;
        },
        set: function set(val) {
            if (val[val.length - 1] !== "/") val += "/";
            this._assetsPath = val;
            this.objLoader.setPath(val);
            this.mtlLoader.setPath(val);
        }
    }]);

    return ThreeLoader;
}();

exports.default = ThreeLoader;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ObjectCache = function () {
    function ObjectCache(scene, factoryFn) {
        var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

        _classCallCheck(this, ObjectCache);

        this.parent = scene;
        this.game = scene.game;
        this.factoryFn = factoryFn;
        this._autoAdd = true;
        this.count = count || 1;
        this._freeObjects = [];
        this._expand(count);
    }

    _createClass(ObjectCache, [{
        key: "_expand",
        value: function _expand() {
            var exactCount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.count;

            for (var i = 0; i < exactCount; i++) {
                var obj = this.factoryFn();
                if (this._autoAdd) this.parent.scene.add(obj);
                this._freeObjects.push(obj);
            }
        }
    }, {
        key: "allocate",
        value: function allocate() {
            if (this._freeObjects.length == 0) this._expand();
            return this._freeObjects.pop();
        }
    }, {
        key: "free",
        value: function free(obj) {
            this._freeObjects.push(obj);
            obj.position.z = -100; //todo: maybe better set alpha & remove shadows
        }
    }]);

    return ObjectCache;
}();

exports.default = ObjectCache;

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _loader = require('./loader');

var _loader2 = _interopRequireDefault(_loader);

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ThreePlugin = function (_Phaser$Plugin) {
    _inherits(ThreePlugin, _Phaser$Plugin);

    function ThreePlugin(game) {
        _classCallCheck(this, ThreePlugin);

        var _this = _possibleConstructorReturn(this, (ThreePlugin.__proto__ || Object.getPrototypeOf(ThreePlugin)).call(this, game));

        game.three = _this;
        _this.game = game;
        _this.loader = new _loader2.default();
        _this.patchPhaserLoader(game);
        return _this;
    }

    _createClass(ThreePlugin, [{
        key: 'autoCreate',
        value: function autoCreate() {
            if (this._autoCreator) {
                var res = this._autoCreator.apply(this, arguments);
                return Object.assign({}, res.config, { obj: res.geometry });
            }
            return null;
        }
    }, {
        key: 'createObjectFromTile',
        value: function createObjectFromTile(tile, layer) {
            var index = tile.index;
            var tileset = layer.resolveTileset(index);

            var searchKey = tileset.name + "_" + (index - tileset.firstgid);
            var obj = this.loader._replacement[searchKey];
            if (!obj) {
                obj = this.autoCreate(tile, layer);
            }
            if (!obj) {
                throw new Error("Cannot find 3d obj for tile " + tileset.name + "/" + index);
            }
            return this.createObject(obj, { nocenter: true });
        }
    }, {
        key: 'createObject',
        value: function createObject(obj) {
            var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var mesh = obj.obj.clone();
            //todo: support more complex model than one mesh/geometry
            mesh.children[0].geometry = mesh.children[0].geometry.clone();
            mesh.threePluginProperties = obj;
            if (obj.rotate) {
                var order = obj.order || "xyz";
                order.split("").forEach(function (axis) {
                    mesh.children[0].geometry.applyMatrix(new THREE.Matrix4()["makeRotation" + axis.toUpperCase()](obj.rotate[axis] || 0));
                });
            }
            if (obj.translate) {
                mesh.children[0].geometry.applyMatrix(new THREE.Matrix4().makeTranslation(obj.translate.x || 0, -obj.translate.y || 0, obj.translate.z || 0));
            }
            if (!opts.nocenter) {
                var _mesh$children$0$geom = mesh.children[0].geometry.center(),
                    z = _mesh$children$0$geom.z;

                mesh.position.set(0, 0, -z); // so bottom of figure shall have z = 0
            }
            return mesh;
        }
    }, {
        key: 'autoConvertSpritesUsing',
        value: function autoConvertSpritesUsing(autoCreator) {
            this._autoCreator = autoCreator;
        }
    }, {
        key: 'createMaterial',
        value: function createMaterial(material) {
            var opacity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

            if (material === undefined || material === true) {
                material = _consts2.default.ShadowMaterial;
            } else if (typeof material === "number") {
                material = new THREE.MeshPhongMaterial({ color: material });
                material.opacity = opacity;
            } else if (Array.isArray(material)) {
                return this.createMaterial(material[0], material[1]);
            }
            return material;
        }
    }, {
        key: 'createObjectFromSprite',
        value: function createObjectFromSprite(sprite, obj3dName) {
            var _this2 = this;

            var obj = void 0;
            if (!obj3dName) {
                var searchKeys = [sprite.key + "_" + sprite.frameName, sprite.key + "_" + sprite.frame, sprite.key];
                obj = searchKeys.map(function (sk) {
                    return _this2.loader._replacement[sk];
                }).filter(function (a) {
                    return a;
                })[0];
                if (!obj) {
                    obj = this.autoCreate(sprite);
                }
                if (!obj) {
                    throw new Error("You did not specify 3d model name, also I cannot find replacement 3d model for key/frame pair");
                }
            } else {
                obj = this.loader._objects[obj3dName];
                if (!obj) throw new Error("Cannot find 3d model with name '" + obj3dName + "'. Probably it is not loaded");
            }
            return this.createObject(obj);
        }
    }, {
        key: 'patchPhaserLoader',
        value: function patchPhaserLoader(game) {
            var oldLoadFile = game.load.loadFile;
            game.load.loadFile = function (file) {
                if (file.type === "three") {
                    return file.load(this.fileComplete.bind(this));
                }
                return oldLoadFile.call(game.load, file);
            };
            var self = this;
            game.load.obj3d = function (name, props) {
                if (props === undefined) props = {};
                props.load = function (onComplete) {
                    var file = this;
                    self.loader.loadObj(name, props, function (obj) {
                        props.obj = obj;
                        onComplete(file);
                    });
                };
                this.addToFileList("three", name, name, props);
            };
        }
    }, {
        key: 'createScene',
        value: function createScene() {
            var config = {};

            for (var _len = arguments.length, groups = Array(_len), _key = 0; _key < _len; _key++) {
                groups[_key] = arguments[_key];
            }

            if (groups.length > 0 && !(groups[groups.length - 1] instanceof PIXI.DisplayObject)) {
                config = groups.pop();
            }
            var scene = new _scene2.default(this, config);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = groups[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var g = _step.value;

                    scene.addGroup(g);
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

            scene.update();
            return scene;
        }
    }, {
        key: 'assets',
        get: function get() {
            return this.loader.assets;
        },
        set: function set(val) {
            this.loader.assets = val;
        }
    }]);

    return ThreePlugin;
}(Phaser.Plugin);

exports.default = ThreePlugin;


ThreePlugin.AmbientLight = _consts2.default.AmbientLight;
ThreePlugin.DirectionalLight = _consts2.default.DirectionalLight;
ThreePlugin.SpotLight = _consts2.default.SpotLight;
ThreePlugin.PointLight = _consts2.default.PointLight;

ThreePlugin.RenderSprites = _consts2.default.RenderSprites;
ThreePlugin.RenderModels = _consts2.default.RenderModels;
ThreePlugin.RenderNothing = _consts2.default.RenderNothing;
ThreePlugin.RenderBoth = _consts2.default.RenderBoth;

ThreePlugin.ShadowMaterial = _consts2.default.ShadowMaterial;

if (window !== undefined) {
    window.ThreePlugin = ThreePlugin;
}

},{"./consts":2,"./loader":4,"./scene":7}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

var _sprite = require('./sprite');

var _sprite2 = _interopRequireDefault(_sprite);

var _tile = require('./tile');

var _tile2 = _interopRequireDefault(_tile);

var _light = require('./light');

var _light2 = _interopRequireDefault(_light);

var _scene_renderer = require('./scene_renderer');

var _scene_renderer2 = _interopRequireDefault(_scene_renderer);

var _obj_cache = require('./obj_cache');

var _obj_cache2 = _interopRequireDefault(_obj_cache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ThreeScene = function () {
    function ThreeScene(plugin, config) {
        var _this = this;

        _classCallCheck(this, ThreeScene);

        this.parent = plugin;
        this.game = plugin.game;
        this._key = "three";
        this._groups = [];
        this._debug = false;
        this._render = _consts2.default.RenderModels;
        this._shadows = false;
        this._groups = [];
        this._sprites = [];
        this._sceneRenderer = null;
        this._copier = null;
        this._ignore = function () {
            return false;
        };
        this._debug = false;
        this._caches = {};
        this._scene = new THREE.Scene();

        if (config) {
            if (config.key !== undefined) this._key = config.key;
            if (config.debug !== undefined) this._debug = config.debug;
            if (config.render !== undefined) this._render = config.render;
            if (config.shadows !== undefined) this._shadows = config.shadows;
            if (config.floor !== undefined) {
                this.addShadowFloor(config.floor === true ? undefined : config.floor);
            }
            if (config.oneByOne) this.renderOneByOne(config.oneByOne);
            if (config.lights) config.lights.forEach(function (c) {
                return _this.addLight(c.type || _consts2.default.AmbientLight, c);
            });
            if (config.groups) config.groups.forEach(function (g) {
                return _this.addGroup(g);
            });
            if (Array.isArray(config.ignore)) {
                this._ignore = function (tile_or_sprite) {
                    return config.ignore.indexOf(tile_or_sprite.index) != -1;
                };
            } else if (config.ignore) {
                this._ignore = config.ignore;
            }
            if (config.caches) {
                for (var key in config.caches) {
                    this.prepareCache(key, config.caches[key]);
                }
            }
            if (config.debugCanvas) this._debugCanvas = true;
            this.update();
        }
    }

    _createClass(ThreeScene, [{
        key: 'renderOneByOne',
        value: function renderOneByOne(copier) {
            this._copier = copier;
        }
    }, {
        key: 'addShadowFloor',
        value: function addShadowFloor(material_or_color) {
            var material = this.parent.createMaterial(material_or_color);
            var floor = new THREE.Mesh(new THREE.PlaneGeometry(this.game.world.width, this.game.world.height, 1, 1), material);
            floor.receiveShadow = true;
            floor.position.set(this.game.world.width / 2, this.game.world.height / 2, 0);
            this._scene.add(floor);
        }
    }, {
        key: 'addGroup',
        value: function addGroup(group) {
            var _this2 = this;

            var firstGroup = this._groups.length == 0;
            if (firstGroup) {
                this._sceneRenderer = new _scene_renderer2.default(this);
                group.parent.addAt(this._sceneRenderer.sprite, group.parent.children.indexOf(group));
            }
            var oldUpdate = group.update;
            group.update = function () {
                _this2._updateGroup(group);
                oldUpdate.call(group);
            };
            this._groups.push(group);
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            this._groups.forEach(function (group) {
                return _this3._updateGroup(group);
            });
        }
    }, {
        key: '_updateGroup',
        value: function _updateGroup(group) {
            var _this4 = this;

            if (group instanceof Phaser.TilemapLayer) {
                this.updateTilemapLayer(group);
            } else {
                group.forEach(function (sprite) {
                    return _this4.addSprite(sprite);
                });
            }
        }
    }, {
        key: 'updateTilemapLayer',
        value: function updateTilemapLayer(layer) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = layer.layer.data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var row = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = row[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var cell = _step2.value;

                            if (cell.index !== -1 && !cell[this._key]) {
                                this.addTile(cell, layer);
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
    }, {
        key: 'addTile',
        value: function addTile(cell, layer) {
            if (cell[this._key] || this._ignore(cell)) return cell;
            var container = new THREE.Group();
            //todo: tile objects are not centered. need to make it more clear, or get common solution for tiles and sprites
            container.position.set(cell.worldX, this.reverseY(cell.worldY + cell.height), 0);
            var mesh = this.parent.createObjectFromTile(cell, layer);
            container.add(mesh);
            cell[this._key] = new _tile2.default(this, cell, mesh, container, layer);
            this._pushSprite(cell, layer.events);
            return cell;
        }
    }, {
        key: 'removeLight',
        value: function removeLight(light, config) {
            if (config.cache) {
                this._caches[config.cache].free(light);
            } else {
                this._scene.remove(light);
            }
        }
    }, {
        key: '_pushSprite',
        value: function _pushSprite(sprite) {
            var _this5 = this;

            var events = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : sprite.events;

            this._sprites.push(sprite);
            sprite[this._key].insertTo(this._scene);
            events.onDestroy.addOnce(function () {
                sprite[_this5._key].removeFrom(_this5._scene);
                var si = _this5._sprites.indexOf(sprite);
                if (si !== -1) {
                    _this5._sprites.splice(si, 1);
                }
            });
            this.applyConfig(sprite);
        }
    }, {
        key: 'addExisting',
        value: function addExisting(sprite, sourceKey) {
            if (sprite[sourceKey] && !sprite[this._key]) {
                sprite[this._key] = sprite[sourceKey].cloneInto(this);
                this._pushSprite(sprite);
            }
            return sprite;
        }
    }, {
        key: 'prepareCache',
        value: function prepareCache(name, constructorProvider) {
            var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            if (this._caches[name]) throw new Error('Cache with name "' + name + '" already defined');
            var constructorFn = void 0;
            if (typeof constructorProvider === "function") {
                constructorFn = function constructorFn() {
                    return new constructorProvider();
                };
            } else if (typeof constructorProvider.factory === "function") {
                constructorFn = function constructorFn() {
                    return constructorProvider.factory({});
                };
            } else {
                throw new Error("Please specify a way to construct object in cache");
            }
            this._caches[name] = new _obj_cache2.default(this, constructorFn, count);
            return this._caches[name];
        }
    }, {
        key: '_createCachedLight',
        value: function _createCachedLight(type, config) {
            if (!config.cache) {
                return type.factory(config);
            } else {
                var cache = this._caches[config.cache];
                if (!cache) {
                    cache = this.prepareCache(config.cache, type);
                }
                return cache.allocate();
            }
        }
    }, {
        key: 'addLight',
        value: function addLight(type, config) {
            var _this6 = this;

            var sprite = this.game.make.sprite();

            var light = this._createCachedLight(type, config);
            sprite[this._key] = new _light2.default(this, sprite, light, type, config);
            this._pushSprite(sprite);
            if ((config.debug || this._debug) && type.helperClass) {
                (function () {
                    var helper = new type.helperClass(light);
                    var sHelper = new THREE.CameraHelper(light.shadow.camera);
                    _this6._scene.add(helper, sHelper);
                    sprite.events.onDestroy.addOnce(function () {
                        return _this6._scene.remove(helper, sHelper);
                    });
                })();
            }
            return sprite;
        }
    }, {
        key: 'addSprite',
        value: function addSprite(sprite, obj3dName) {
            if (sprite[this._key] || this._ignore(sprite)) return sprite;
            //add threesprite
            var container = new THREE.Group();
            container.position.set(sprite.x, this.reverseY(sprite.y), 0);
            var mesh = this.parent.createObjectFromSprite(sprite, obj3dName);
            container.add(mesh);
            sprite[this._key] = new _sprite2.default(this, sprite, mesh, container);
            this._pushSprite(sprite);
            return sprite;
        }
    }, {
        key: 'reverseY',
        value: function reverseY(y) {
            return this.parent.game.world.height - y;
        }
    }, {
        key: 'applyConfig',
        value: function applyConfig(sp) {
            if (!sp) {
                this._sprites.forEach(this.applyConfig.bind(this));
                return;
            }
            sp[this._key].applyRendering(this._render);
            sp[this._key].applyShadows(this._shadows);
            sp[this._key].applyDebug(this._debug);
            //iterate over all sprites and groups, apply shadows/renderable
        }
    }, {
        key: 'forEach',
        value: function forEach(cb) {
            this._sprites.forEach(cb);
            //assuming that any sprite in group already in _sprites
        }
    }, {
        key: 'render',
        get: function get() {
            return this._render;
        },
        set: function set(val) {
            this._render = val;this.applyConfig();
        }
    }, {
        key: 'shadows',
        get: function get() {
            return this._shadows;
        },
        set: function set(val) {
            this._shadows = val;
            this.applyConfig();
        }
    }, {
        key: 'scene',
        get: function get() {
            return this._scene;
        }
    }, {
        key: 'renderer',
        get: function get() {
            return this._sceneRenderer.renderer;
        }
    }, {
        key: 'camera',
        get: function get() {
            return this._sceneRenderer.camera;
        }
    }, {
        key: 'sprite',
        get: function get() {
            return this._sceneRenderer.sprite;
        }
    }, {
        key: 'polygons',
        get: function get() {
            var _this7 = this;

            return this._sprites.reduce(function (a, b) {
                return a + b[_this7._key].polygons;
            }, 0);
        }
    }]);

    return ThreeScene;
}();

exports.default = ThreeScene;

},{"./consts":2,"./light":3,"./obj_cache":5,"./scene_renderer":8,"./sprite":9,"./tile":10}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ThreeSceneRenderer = function () {
    function ThreeSceneRenderer(scene) {
        var _this = this;

        _classCallCheck(this, ThreeSceneRenderer);

        this.parent = scene;
        this.scene = scene.scene;
        this.game = scene.parent.game;
        this.camera = new THREE.OrthographicCamera(0, this.game.camera.width, this.game.camera.height, 0, 1, 1000);
        this.camera.position.z = 1000;
        this.camera.position.x = 0;
        this.camera.position.y = 0;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(this.game.camera.width, this.game.camera.height);

        if (scene._copier) {
            this.copier = scene._copier;
            this.targetCanvas = Phaser.Canvas.create(undefined, this.game.camera.width, this.game.camera.height, 0, true);
            this.targetCanvas.context = this.targetCanvas.getContext('2d');
            this.texture = PIXI.Texture.fromCanvas(this.targetCanvas);
            this.render = function () {
                return _this.renderOneByOne();
            };
        } else {
            this.texture = PIXI.Texture.fromCanvas(this.renderer.domElement);
            this.render = function () {
                return _this.renderAll();
            };
        }
        this.sprite = this.game.make.sprite(0, 0, this.texture);
        this.sprite.fixedToCamera = true;
        this.sprite.alive = true;
        this.sprite.update = function () {
            return _this.update();
        };

        if (scene._debugCanvas) {
            document.body.appendChild(this.renderer.domElement);
        }
    }

    _createClass(ThreeSceneRenderer, [{
        key: 'renderAll',
        value: function renderAll() {
            this.renderer.render(this.scene, this.camera);
        }
    }, {
        key: 'renderOneByOne',
        value: function renderOneByOne() {
            var _this2 = this;

            var tempScene = new THREE.Scene();
            this.targetCanvas.context.clearRect(0, 0, this.game.camera.width, this.game.camera.height);
            this.parent.forEach(function (sprite) {
                if (!sprite[_this2.parent._key].renderOneByOne) tempScene.add(sprite[_this2.parent._key].mainMesh);
            });
            this.parent.forEach(function (sprite) {
                if (sprite[_this2.parent._key].renderOneByOne) {
                    tempScene.add(sprite[_this2.parent._key].mainMesh);
                    _this2.renderer.render(tempScene, _this2.camera);
                    _this2.copier(sprite, _this2.renderer.domElement, _this2.targetCanvas.context);
                    tempScene.remove(sprite[_this2.parent._key].mainMesh);
                }
            });
        }
    }, {
        key: 'update',
        value: function update() {
            var _this3 = this;

            var camera = this.camera;
            delete this.sprite.body;
            this.sprite.renderable = true;
            this.renderer.shadowMap.enabled = this.parent.shadows;
            camera.left = this.game.camera.x;
            camera.top = this.game.world.height - this.game.camera.y;
            camera.right = this.game.camera.x + this.game.camera.width;
            camera.bottom = this.game.world.height - this.game.camera.y - this.game.camera.height;
            //todo(alexey): we do not need update here because we know that Phaser updates groups in reverse order
            //              so when this update is called by sprite, all dependent groups will be alraedy updated
            //              but it is very unobvious
            //this.parent.update();   //move loop inside
            this.parent.forEach(function (sprite) {
                //todo: i do not like all these this.parent._key
                if (sprite[_this3.parent._key] && sprite[_this3.parent._key].update) {
                    sprite[_this3.parent._key].update();
                }
            });
            camera.updateProjectionMatrix();
            this.render();
            this.texture.baseTexture.dirty();
        }
    }]);

    return ThreeSceneRenderer;
}();

exports.default = ThreeSceneRenderer;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _base = require('./base');

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ThreeSprite = function (_ThreeLinkedObject) {
    _inherits(ThreeSprite, _ThreeLinkedObject);

    function ThreeSprite(scene, sprite, mesh, container) {
        _classCallCheck(this, ThreeSprite);

        var _this = _possibleConstructorReturn(this, (ThreeSprite.__proto__ || Object.getPrototypeOf(ThreeSprite)).call(this, scene, sprite, container, mesh.threePluginProperties ? mesh.threePluginProperties.spriteRotation : undefined));

        _this.mesh = mesh;
        _this.container = container;
        return _this;
    }

    _createClass(ThreeSprite, [{
        key: 'applyShadows',
        value: function applyShadows(shadows) {
            this.mesh.traverse(function (no) {
                if (no instanceof THREE.Mesh) {
                    no.castShadow = shadows;
                    no.receiveShadow = shadows;
                }
            });
        }
    }, {
        key: 'applyDebug',
        value: function applyDebug(debug) {
            var _this2 = this;

            if (debug) {
                (function () {
                    var box1 = new THREE.BoxHelper(_this2.container, 0x00ff00);
                    var box2 = new THREE.BoxHelper(_this2.mesh, 0xff0000);
                    _this2.parent.scene.add(box1, box2);
                    _this2.sprite.update = function () {
                        box1.update(_this2.container);
                        box2.update(_this2.mesh);
                    };
                    _this2.sprite.events.onDestroy.addOnce(function () {
                        return _this2.parent.scene.remove(box1, box2);
                    });
                })();
            }
        }
    }, {
        key: 'applyRenderingForSprite',
        value: function applyRenderingForSprite(rendering) {
            this.sprite.renderable = rendering === _consts2.default.RenderSprites || rendering === _consts2.default.RenderBoth;
        }
    }, {
        key: 'applyRenderingForMesh',
        value: function applyRenderingForMesh(rendering) {
            this.mesh.traverse(function (no) {
                if (no instanceof THREE.Mesh) {
                    if (rendering === _consts2.default.RenderModels || rendering === _consts2.default.RenderBoth) {
                        if (no.material === _consts2.default.ShadowMaterial) no.material = no._material;
                    } else {
                        no._material = no.material;
                        no.material = _consts2.default.ShadowMaterial;
                    }
                }
            });
        }
    }, {
        key: 'applyRendering',
        value: function applyRendering(rendering) {
            this.applyRenderingForSprite(rendering);
            this.applyRenderingForMesh(rendering);
        }
    }, {
        key: 'cloneInto',
        value: function cloneInto(newParent) {
            return new ThreeSprite(newParent, this.sprite, this.mesh.clone(), this.container.clone());
        }
    }, {
        key: 'renderOneByOne',
        get: function get() {
            return true;
        }
    }, {
        key: 'polygons',
        get: function get() {
            var count = 0;
            this.mesh.traverse(function (no) {
                if (no instanceof THREE.Mesh && no.geometry instanceof THREE.BufferGeometry) {
                    count += no.geometry.attributes.position.count;
                }
            });
            return count;
        }
    }]);

    return ThreeSprite;
}(_base.ThreeLinkedObject);

exports.default = ThreeSprite;

},{"./base":1,"./consts":2}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sprite = require('./sprite');

var _sprite2 = _interopRequireDefault(_sprite);

var _consts = require('./consts');

var _consts2 = _interopRequireDefault(_consts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ThreeTile = function (_ThreeSprite) {
    _inherits(ThreeTile, _ThreeSprite);

    function ThreeTile(scene, sprite, mesh, container, layer) {
        _classCallCheck(this, ThreeTile);

        var _this = _possibleConstructorReturn(this, (ThreeTile.__proto__ || Object.getPrototypeOf(ThreeTile)).call(this, scene, sprite, mesh, container, true));

        _this.layer = layer;
        return _this;
    }

    _createClass(ThreeTile, [{
        key: 'applyRenderingForSprite',
        value: function applyRenderingForSprite(rendering) {
            this.layer.renderable = rendering === _consts2.default.RenderSprites || rendering === _consts2.default.RenderBoth;
        }
    }, {
        key: 'updateCoords',
        value: function updateCoords() {}
    }, {
        key: 'cloneInto',
        value: function cloneInto(newParent) {
            return new ThreeTile(newParent, this.sprite, this.mesh.clone(), this.container.clone(), this.layer);
        }
    }, {
        key: 'x',
        get: function get() {
            return this.mainMesh.position.x;
        },
        set: function set(val) {
            this.mainMesh.position.x = val;
        }
    }, {
        key: 'y',
        get: function get() {
            return this.parent.reverseY(this.mainMesh.position.y);
        },
        set: function set(val) {
            this.mainMesh.position.y = this.parent.reverseY(val);
        }
    }, {
        key: 'z',
        get: function get() {
            return this.mainMesh.position.z;
        },
        set: function set(val) {
            this.mainMesh.position.z = val;
        }
    }]);

    return ThreeTile;
}(_sprite2.default);

exports.default = ThreeTile;

},{"./consts":2,"./sprite":9}]},{},[6]);
