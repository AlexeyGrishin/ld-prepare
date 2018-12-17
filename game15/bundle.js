/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../common/opts.js":
/*!*************************!*\
  !*** ../common/opts.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {


function initOptions(config) {

    var parsedConfig = {};

    var parsers = {
        boolean: function (s) {
            return { "true": true, "false": false }[s];
        },
        int: function (s) {
            return parseInt(s);
        },
        str: function (s) {
            return s;
        },
        select: function (s) {
            return s;
        }
    };

    var controls = {
        select: function (key) {
            var inp = document.createElement("select");
            inp.innerHTML = config[key][2].map(function (opt) {
                return "<option value='" + opt + "'" + (parsedConfig[key] === opt ? " selected " : "") + " >" + opt + "</option>";
            }).join("");
            inp.addEventListener("change", function () {
                parsedConfig[key] = inp.options[inp.selectedIndex].value;
            });
            return inp;
        },
        boolean: function (key) {
            var inp = document.createElement("input");
            inp.type = "checkbox";
            inp.checked = parsedConfig[key];
            inp.addEventListener("change", function () {
                parsedConfig[key] = !parsedConfig[key];
            });
            return inp;
        },
        int: function (key) {
            var inp = document.createElement("input");
            inp.type = "number";
            inp.value = parsedConfig[key];
            inp.addEventListener("change", function () {
                parsedConfig[key] = parseInt(inp.value);
            });
            return inp;
        },
        str: function (key) {
            var inp = document.createElement("input");
            inp.value = parsedConfig[key];
            inp.addEventListener("change", function () {
                parsedConfig[key] = inp.value;
            });
            return inp;
        }
    };

    var query = parseLocation();

    for (var key in config) {
        if (config.hasOwnProperty(key)) {
            var type = config[key][0];
            var defValue = config[key][1];
            if (query.hasOwnProperty(key)) {
                parsedConfig[key] = parsers[type](query[key]);
            }
            if (parsedConfig[key] === undefined) {
                parsedConfig[key] = defValue;
            }
        }
    }

    if (!parsedConfig.hidden) prepareUI();

    return parsedConfig;

    function parseLocation() {
        var options = {};
        location.search.substring(1).split("&").forEach(function (pair) {
            var kv = pair.split("=").map(decodeURIComponent);
            options[kv[0]] = kv[1];
        });
        return options;
    }

    function composeLocation() {
        var pairs = [];
        for (var key in parsedConfig) {
            if (parsedConfig.hasOwnProperty(key) && parsedConfig[key] !== config[key][1]) {
                pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(parsedConfig[key].toString()));
            }
        }
        return pairs.join("&");
    }

    function send() {
        location.search = composeLocation();
    }

    function prepareUI() {
        var div = document.createElement("div");
        div.className = "options-ui";
        div.style.position = "fixed";
        div.style.right = 0;
        div.style.top = 0;
        div.style.width = "200px";
        div.style.padding = "10px";
        div.style.backgroundColor = "#cccccc";

        for (var key in parsedConfig) {
            if (parsedConfig.hasOwnProperty(key)) {
                var label = document.createElement("label");
                label.style.display = "block";
                var span = document.createElement("span");
                span.style.marginRight = "10px";
                if (key === "hidden") {
                    span.style.color = "#554444";
                }
                span.innerHTML = key;
                var input = controls[config[key][0]](key);
                input.style.maxWidth = "100px";
                input.addEventListener("change", send);
                label.appendChild(span);
                label.appendChild(input);
                div.appendChild(label);
            }
        }
        document.body.appendChild(div);
    }
}

window.initOptions = initOptions;

/***/ }),

/***/ "./3d/render_pseudo_3d.js":
/*!********************************!*\
  !*** ./3d/render_pseudo_3d.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shadows_drawer = __webpack_require__(/*! ../lights/render/shadows_drawer */ "./lights/render/shadows_drawer.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VIEWPORT_ANGLE = Phaser.Math.degToRad(60);
var HALF_VIEWPORT_ANGLE = VIEWPORT_ANGLE / 2;

var Pseudo3dShader = function (_Phaser$Filter) {
    _inherits(Pseudo3dShader, _Phaser$Filter);

    function Pseudo3dShader(shadowsDrawer, width, height, useColor, useLights) {
        _classCallCheck(this, Pseudo3dShader);

        var _this = _possibleConstructorReturn(this, (Pseudo3dShader.__proto__ || Object.getPrototypeOf(Pseudo3dShader)).call(this, game));

        _this.uniforms.iChannel0.value = shadowsDrawer.distancesBitmap.sprite.texture;
        var lightsArray = new Array(_shadows_drawer.MAX_LIGHTS * 4);
        lightsArray.fill(0, 0, lightsArray.length);

        _this.uniforms.lightsCount = { type: '1i', value: 0 };
        _this.uniforms.hero = { type: '4f', value: { x: 0, y: 0, z: 0 } };
        _this.uniforms.lights = { type: '4fv', value: lightsArray };

        if (useColor) {
            var colorsSprite = game.add.sprite(-1000, -1000, "colors");
            colorsSprite.texture.scaleMode = PIXI.scaleModes.NEAREST;
            _this.uniforms.iChannel1.value = colorsSprite.texture;
            _this.uniforms.iChannel1.textureData = {
                magFilter: game.renderer.gl.NEAREST,
                minFilter: game.renderer.gl.NEAREST
            };
        } else {

            var texSprite = game.add.sprite(-1000, -1000, "walls");
            texSprite.texture.scaleMode = PIXI.scaleModes.NEAREST;
            _this.uniforms.iChannel1.value = texSprite.texture;
            _this.uniforms.iChannel1.textureData = {
                magFilter: game.renderer.gl.NEAREST,
                minFilter: game.renderer.gl.NEAREST
            };
        }

        _this.fragmentSrc = '\n\n            precision highp float;\n            \n            uniform int lightsCount;\n            uniform vec4 lights[' + _shadows_drawer.MAX_LIGHTS + ']; \n            uniform sampler2D  uSampler;\n            uniform sampler2D  iChannel0;\n            uniform sampler2D  iChannel1;\n            \n            uniform vec4 hero;\n            \n            #define M_PI 3.141592653589793\n            #define M_PI2 6.283185307179586\n            \n            #define W ' + width + '.\n            #define H ' + height + '.\n            \n            #define ANGLE ' + HALF_VIEWPORT_ANGLE.toFixed(8) + '\n            #define ANGLE_COS ' + Math.cos(HALF_VIEWPORT_ANGLE).toFixed(8) + '\n            #define STRENGTH 0.3\n            #define TEX_IN_HEIGHT 4.\n            #define TEX_IN_WIDTH 4.\n        \n           \n            ' + (useColor ? "#define USE_COLOR" : "") + '\n            ' + (useLights ? "#define USE_LIGHTS" : "") + '\n            \n            float decodeDist(vec4 color) {\n                return color.r*255.*2. + color.g*2.;\n            }         \n            \n            vec4 decodeTexture(vec4 color, float v) {\n                #ifdef USE_COLOR\n                return texture2D(iChannel1, vec2(color.b, 0.));\n                #else\n                return texture2D(iChannel1, vec2(color.b, v*0.5)); //first row only, and 1 tile in height\n                #endif\n            }\n            \n            vec4 getDistanceAndTexture(int i, float angle) {\n                float u = mod(angle/M_PI2, 1.);\n                float v = float(i)/' + _shadows_drawer.MAX_LIGHTS + '.;\n                return texture2D(iChannel0, vec2(u, v));\n            }            \n                \n                \n            vec2 getNormalizedCoords() {\n                //normalize - 0-1\n                vec2 xy = vec2(gl_FragCoord.x/W, (' + game.camera.height + '. - gl_FragCoord.y)/H);\n                return (xy - 0.5)*2.;\n            }\n            \n            float distance2z(float d) { return d / 100.; }\n            float z2distance(float z) { return z * 100.; }\n            \n            \n            vec2 getWorldXY(float angle, vec2 screenCoords, float distance, float isInsideWall) {\n                float z = screenCoords.y == 0. ? 1000. : 1./abs(screenCoords.y);\n                float actualDistance = mix(z2distance(z), distance-4., isInsideWall);  //-4 for wall width\n                \n                return vec2(cos(angle), sin(angle))*actualDistance + hero.xy;\n                \n            }\n            \n            float applyHeroVisibility(vec2 worldCoords) {\n                float d = length(worldCoords - hero.xy);\n                return mix(0.1, 0.5, pow(clamp(1. - d/400., 0., 1.), 2.));\n            }\n            \n            float getShadow(int i, float angle, float distance) {\n                float u = angle/M_PI2;\n                float v = float(i)/' + _shadows_drawer.MAX_LIGHTS + '.;\n                float shadowAfterDistance = decodeDist(texture2D(iChannel0, vec2(u, v)));\n                return step(shadowAfterDistance, distance);\n            }        \n                     \n            //todo: this is copy-paste from shadows_drawer. here shall be reusing instead\n            float applyLights(float lightness, vec2 worldCoords) {\n                for (int i = 0; i < ' + _shadows_drawer.MAX_LIGHTS + '; i++) {\n                    if (i >= lightsCount) break;\n                    vec4 light = lights[i];\n                    if (light.w == 0.) continue;\n                    vec2 light2point = worldCoords.xy - light.xy;\n                    \n                    float radius = light.z;\n                    float distance = length(light2point);\n                    float inLight = step(distance, radius);\n                    if (inLight == 0.) continue;\n                    float angle = mod(atan(light2point.y, light2point.x), M_PI2);\n                    \n                    float thisLightness = (1. - getShadow(i, angle, distance));\n\n                    thisLightness = thisLightness*smoothstep(0., 1., pow(1.-distance/radius, 0.5));\n                    \n                    lightness += thisLightness*STRENGTH;\n                }\n                return clamp(0., 1., lightness);     \n            }\n            \n            void main() {\n            \n                vec4 floorColor = texture2D(iChannel1, vec2(0., 1.));\n                vec4 ceilColor = texture2D(iChannel1, vec2(1., 1.));\n            \n                //x,y -> -1 - 1\n                vec2 screenCoords = getNormalizedCoords();\n                \n                //float angle = hero.z + acos(screenCoords.x*ANGLE_COS);\n                float angle = hero.z + (screenCoords.x * ANGLE);\n                float maybeFloor = step(screenCoords.y, 0.);\n                \n                vec4 dnt = getDistanceAndTexture(0, angle);\n                float distance = decodeDist(dnt);\n                \n                float z = distance2z(distance);\n                vec2 wallY = vec2(-1., 1.);\n                wallY /= z;\n                \n                float isInsideWall = step(wallY.x, screenCoords.y)*step(screenCoords.y, wallY.y);\n                float v = mod((screenCoords.y - wallY.x)/wallY.y/2. * TEX_IN_HEIGHT, 1.);\n                \n                //vec4 color = vec4(dnt.b, 0, 0, 1);\n                vec4 wallColor = decodeTexture(dnt, v);\n                \n                #ifdef USE_LIGHTS\n                vec2 worldCoords = getWorldXY(angle, screenCoords, distance, isInsideWall);\n                float lightness = applyHeroVisibility(worldCoords);\n                lightness = applyLights(lightness, worldCoords);\n                #else\n                float lightness = 1.;\n                #endif\n                \n                vec4 defaultColor = mix(floorColor, ceilColor, maybeFloor);\n                vec4 outColor = mix(vec4(0., 0., 0., 1.), mix(defaultColor, wallColor, isInsideWall), lightness);\n                \n                gl_FragColor = outColor;\n            }\n        \n        \n        \n        ';
        return _this;
    }

    _createClass(Pseudo3dShader, [{
        key: 'updateLights',
        value: function updateLights(lightSources) {
            this.uniforms.lightsCount.value = lightSources.length;
            var i = 0;
            var array = this.uniforms.lights.value;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = lightSources[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var light = _step.value;

                    array[i++] = light.x;
                    array[i++] = light.y;
                    array[i++] = light.radius;
                    array[i++] = light.activeLight ? 1 : 0;
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
        key: 'updateHero',
        value: function updateHero(hero) {
            this.uniforms.hero.value = {
                x: hero.x,
                y: hero.y,
                z: hero.rotation - Math.PI / 2,
                w: 0
            };
        }
    }]);

    return Pseudo3dShader;
}(Phaser.Filter);

var Pseudo3d = function () {
    function Pseudo3d(width, height, group, useColor, useLights) {
        _classCallCheck(this, Pseudo3d);

        this.sprite = game.add.sprite(0, 0, undefined, undefined, group);
        this.sprite.width = width;
        this.sprite.height = height;
        this.useColor = useColor;
        this.useLights = useLights;
    }

    _createClass(Pseudo3d, [{
        key: 'init',
        value: function init(hero, shadowsDrawer) {
            this.hero = hero;
            this.shadowsDrawer = shadowsDrawer;
            this.sprite.filters = [this.shader = new Pseudo3dShader(this.shadowsDrawer, this.sprite.width, this.sprite.height, this.useColor, this.useLights)];
        }
    }, {
        key: 'update',
        value: function update() {
            if (this.shader) {
                this.shader.updateHero(this.hero);
                this.shader.updateLights(this.shadowsDrawer.lightSources);
            }
        }
    }, {
        key: 'createTextureOffsetGetter',
        value: function createTextureOffsetGetter(textureNr) {
            var _this2 = this;

            return this.useColor ? function (width) {
                return _this2.getTextureOffsetColor(textureNr, width);
            } : function (width) {
                return _this2.getTextureOffsetTex(textureNr, width);
            };
        }
    }, {
        key: 'getTextureOffsetColor',
        value: function getTextureOffsetColor(textureNr, width) {
            return textureNr * 4 / 31 * 255 | 0;
        }
    }, {
        key: 'getTextureOffsetTex',
        value: function getTextureOffsetTex(textureNr, width) {
            return (textureNr * 16 + (width + 16) * 2 % 16) * 2 | 0;
        }
    }]);

    return Pseudo3d;
}();

exports.default = Pseudo3d;

/***/ }),

/***/ "./gameobjects/Bitmaps.js":
/*!********************************!*\
  !*** ./gameobjects/Bitmaps.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getBitmap;
var Bitmaps = new Map();

function getBitmap(color) {
    var radius = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var bitmap = Bitmaps.get(color + '_' + radius);
    if (!bitmap) {
        if (radius === 0) {
            bitmap = game.add.bitmapData(1, 1);
            bitmap.rect(0, 0, 1, 1, color);
        } else {
            bitmap = game.add.bitmapData(radius * 2 + 2, radius * 2 + 2);
            bitmap.circle(radius + 1, radius + 1, radius, color);
        }
        Bitmaps.set(color + '_' + radius, bitmap);
    }
    return bitmap;
}

/***/ }),

/***/ "./gameobjects/Bulb.js":
/*!*****************************!*\
  !*** ./gameobjects/Bulb.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Bitmaps = __webpack_require__(/*! ./Bitmaps */ "./gameobjects/Bitmaps.js");

var _Bitmaps2 = _interopRequireDefault(_Bitmaps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SLOWDOWN = 100;
var RADIUS = 140;

var Bulb = function (_Phaser$Sprite) {
    _inherits(Bulb, _Phaser$Sprite);

    function Bulb(x, y) {
        var baseRadius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : RADIUS;
        var floating = arguments[3];

        _classCallCheck(this, Bulb);

        var _this = _possibleConstructorReturn(this, (Bulb.__proto__ || Object.getPrototypeOf(Bulb)).call(this, game, x, y, (0, _Bitmaps2.default)("yellow", 8)));

        _this.anchor.set(0.5, 0.5);
        _this.lightRadius = baseRadius;
        _this.baseRadius = baseRadius;

        _this.cx = x;
        _this.cy = y;
        _this.t = game.rnd.realInRange(0, 10);
        _this.floating = floating;
        return _this;
    }

    _createClass(Bulb, [{
        key: "update",
        value: function update() {
            if (this.floating) {
                this.t += game.time.physicsElapsedMS / SLOWDOWN;
                this.x = this.cx + Math.sin(this.t / 4) * 2;
                this.y = this.cy + Math.cos(this.t) * Math.cos(this.t / 2) * 1;
                this.lightRadius = this.baseRadius + Math.sin(this.t) * 2;
            }
        }
    }]);

    return Bulb;
}(Phaser.Sprite);

exports.default = Bulb;

/***/ }),

/***/ "./gameobjects/Firefly.js":
/*!********************************!*\
  !*** ./gameobjects/Firefly.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Bitmaps = __webpack_require__(/*! ./Bitmaps */ "./gameobjects/Bitmaps.js");

var _Bitmaps2 = _interopRequireDefault(_Bitmaps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SLOWDOWN = 100;
var RADIUS = 140;

var Firefly = function (_Phaser$Sprite) {
    _inherits(Firefly, _Phaser$Sprite);

    function Firefly(x, y) {
        var baseRadius = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : RADIUS;
        var floating = arguments[3];

        _classCallCheck(this, Firefly);

        var _this = _possibleConstructorReturn(this, (Firefly.__proto__ || Object.getPrototypeOf(Firefly)).call(this, game, x, y, (0, _Bitmaps2.default)("yellow", 8)));

        _this.anchor.set(0.5, 0.5);
        _this.lightRadius = baseRadius;
        _this.baseRadius = baseRadius;

        _this.cx = x;
        _this.cy = y;
        _this.t = game.rnd.realInRange(0, 10);
        _this.floating = floating;
        _this.grabbed = false;
        return _this;
    }

    _createClass(Firefly, [{
        key: "update",
        value: function update() {
            if (this.floating && !this.grabbed) {
                this.t += game.time.physicsElapsedMS / SLOWDOWN;
                this.x = this.cx + Math.sin(this.t / 4) * 2;
                this.y = this.cy + Math.cos(this.t) * Math.cos(this.t / 2) * 1;
                this.lightRadius = this.baseRadius + Math.sin(this.t) * 2;
            }
        }
    }]);

    return Firefly;
}(Phaser.Sprite);

exports.default = Firefly;

/***/ }),

/***/ "./gameobjects/Flower.js":
/*!*******************************!*\
  !*** ./gameobjects/Flower.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Flower = function (_Phaser$Sprite) {
    _inherits(Flower, _Phaser$Sprite);

    function Flower(x, y) {
        _classCallCheck(this, Flower);

        var _this = _possibleConstructorReturn(this, (Flower.__proto__ || Object.getPrototypeOf(Flower)).call(this, game, x, y, "env", 4));

        _this.anchor.set(0.5, 0.5);
        _this.animations.add("grow", [5, 6, 7, 8, 9], 8, false);
        _this.animations.add("ungrow", [8, 7, 6, 5, 4], 8, false);
        _this.grown = false;
        _this.grownAnytime = false;
        return _this;
    }

    _createClass(Flower, [{
        key: "grow",
        value: function grow() {
            if (this.grown) return;

            this.animations.play("grow");
            this.grown = true;
            this.grownAnytime = true;
        }
    }, {
        key: "ungrow",
        value: function ungrow() {
            if (!this.grown) return;
            this.animations.play("ungrow");
            this.grown = false;
        }
    }, {
        key: "update",
        value: function update() {
            var anyNear = false;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = game.level.lightsGrp.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var light = _step.value;

                    if (Phaser.Point.distance(this, light) < light.lightRadius) {
                        anyNear = true;
                        break;
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

            anyNear ? this.grow() : this.ungrow();
        }
    }]);

    return Flower;
}(Phaser.Sprite);

exports.default = Flower;

/***/ }),

/***/ "./gameobjects/Hero.js":
/*!*****************************!*\
  !*** ./gameobjects/Hero.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Bitmaps = __webpack_require__(/*! ./Bitmaps */ "./gameobjects/Bitmaps.js");

var _Bitmaps2 = _interopRequireDefault(_Bitmaps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Hero = function (_Phaser$Sprite) {
    _inherits(Hero, _Phaser$Sprite);

    function Hero(x, y) {
        _classCallCheck(this, Hero);

        var _this = _possibleConstructorReturn(this, (Hero.__proto__ || Object.getPrototypeOf(Hero)).call(this, game, x, y, (0, _Bitmaps2.default)("black", 16)));

        _this.anchor.set(0.5, 0.5);
        if (game.gameplay) {
            _this.loadTexture("env", 0);
            _this.animations.add("walk", [0, 1, 2, 3], 12, true);
            _this.animations.add("idle", [0], 12, false);
            _this.walking = false;
            _this.lightRadius = 50;
        } else {
            _this.addChild(game.add.sprite(-4, -4, (0, _Bitmaps2.default)("white", 4)));
            _this.addChild(game.add.sprite(4, -4, (0, _Bitmaps2.default)("white", 4)));
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _this.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var c = _step.value;
                    c.anchor.set(0.5, 0.5);
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

            _this.lightRadius = 200;
        }

        _this.colliderRadius = 16;
        _this.colliderRadius2 = _this.colliderRadius * _this.colliderRadius;

        _this.hasFirefly = 0;
        return _this;
    }

    _createClass(Hero, [{
        key: "onWalk",
        value: function onWalk(speed) {
            if (game.gameplay) {
                if (speed !== 0 && !this.walking) {
                    this.walking = true;
                    this.animations.play("walk");
                }
                if (speed === 0 && this.walking) {
                    this.walking = false;
                    this.animations.play("idle");
                }
            }
        }
    }]);

    return Hero;
}(Phaser.Sprite);

exports.default = Hero;

/***/ }),

/***/ "./gameobjects/Wall.js":
/*!*****************************!*\
  !*** ./gameobjects/Wall.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Bitmaps = __webpack_require__(/*! ./Bitmaps */ "./gameobjects/Bitmaps.js");

var _Bitmaps2 = _interopRequireDefault(_Bitmaps);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Wall = function (_Phaser$Sprite) {
    _inherits(Wall, _Phaser$Sprite);

    function Wall(x1, y1, x2, y2) {
        var textureNr = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
        var thickness = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 4;

        _classCallCheck(this, Wall);

        var _this = _possibleConstructorReturn(this, (Wall.__proto__ || Object.getPrototypeOf(Wall)).call(this, game, x1, y1, "colors", textureNr));

        _this.textureNr = textureNr;
        _this.line = new Phaser.Line(x1, y1, x2, y2);

        _this.anchor.set(0, 0.5);
        _this.height = thickness;
        _this.width = _this.line.length;
        _this.rotation = _this.line.angle;
        return _this;
    }

    return Wall;
}(Phaser.Sprite);

exports.default = Wall;

/***/ }),

/***/ "./lights/model/camera.js":
/*!********************************!*\
  !*** ./lights/model/camera.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Camera = function () {
    function Camera(sprite, pseudo3d) {
        _classCallCheck(this, Camera);

        this.sprite = sprite;
        this.x = sprite.x;
        this.y = sprite.y;

        this.radius = game.world.width;
        this.activeLight = false;

        this.pseudo3d = pseudo3d;
    }

    _createClass(Camera, [{
        key: "update",
        value: function update() {
            this.x = this.sprite.x;
            this.y = this.sprite.y;
        }
    }, {
        key: "setDistancesMap",
        value: function setDistancesMap(map) {
            this.distancesMap = map;
        }
    }, {
        key: "fillDistancesForArc",
        value: function fillDistancesForArc(ai1, ai2, normalFromLight, getU) {
            var _this = this;

            this.distancesMap.fillDistancesForArc(ai1, ai2, normalFromLight, function (index, minusNormalWidth, angle, normalAngle) {
                _this.distancesMap.setTextureOffset(index, getU(_this, normalFromLight, minusNormalWidth, angle, normalAngle));
            });
        }
    }]);

    return Camera;
}();

exports.default = Camera;

/***/ }),

/***/ "./lights/model/distances_map.js":
/*!***************************************!*\
  !*** ./lights/model/distances_map.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hyp_table = __webpack_require__(/*! ./hyp_table */ "./lights/model/hyp_table.js");

var _hyp_table2 = _interopRequireDefault(_hyp_table);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DistancesMap = function () {
    function DistancesMap(steps) {
        var angle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2 * Math.PI / steps;
        var maxDistance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 512;
        var catets = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;

        _classCallCheck(this, DistancesMap);

        this.distances = new Array(steps);
        this.maxDistance = maxDistance;
        this.distances.fill(maxDistance, 0, steps);
        this.steps = steps;
        this.stepAngle = angle;

        this.textureOffsets = new Array(steps);
        this.textureOffsets.fill(-1, 0, steps);

        this.catets = catets || new _hyp_table2.default(steps, angle);
    }

    _createClass(DistancesMap, [{
        key: "erase",
        value: function erase() {
            this.distances.fill(this.maxDistance, 0, this.steps);
            this.textureOffsets.fill(-1, 0, this.steps);
        }
    }, {
        key: "fillDistancesForArc",
        value: function fillDistancesForArc(ai1, ai2, normal, onSetCallback) {
            this.catets.fillDistancesForArc(this, ai1, ai2, normal, onSetCallback);
        }
    }, {
        key: "minus",
        value: function minus(ai1, ai2) {
            var diff = ai1 - ai2;
            if (Math.abs(diff) > this.steps / 2) diff = diff - Math.sign(diff) * this.steps;
            return diff;
        }
    }, {
        key: "set",
        value: function set(index, newValue, onSetCallback) {
            index = index % this.steps;
            if (newValue < this.distances[index]) {
                this.distances[index] = newValue;
                if (onSetCallback) onSetCallback(index);
            }
        }
    }, {
        key: "setTextureOffset",
        value: function setTextureOffset(index, textureOffset) {
            this.textureOffsets[index] = textureOffset;
        }
    }, {
        key: "angle2index",
        value: function angle2index(ang) {
            return Phaser.Math.normalizeAngle(ang) / this.stepAngle | 0;
        }
    }, {
        key: "angles2indexes",
        value: function angles2indexes(ang1, ang2) {
            var ai1 = Math.round(Phaser.Math.normalizeAngle(ang1) / this.stepAngle);
            var ai2 = Math.round(Phaser.Math.normalizeAngle(ang2) / this.stepAngle);
            if (ai2 < ai1) ai2 += this.steps;
            return [ai1, ai2];
        }
    }, {
        key: "getAngles",
        value: function getAngles() {
            var _this = this;

            return this.distances.map(function (dist, i) {
                return {
                    distance: dist,
                    angle: i * _this.stepAngle
                };
            });
        }
    }, {
        key: "fillBitmap",
        value: function fillBitmap(data, index) {
            var total = index + this.steps * 4;
            var d1 = void 0,
                d2 = void 0,
                d3 = void 0;
            var i = 0;
            for (; index < total; index += 4, i++) {
                //max is 512. rgb max = 256*256*256
                d1 = this.distances[i] / 2 | 0;
                data[index] = d1;
                d1 = this.distances[i] - d1 * 2; //so we get remaining < 2
                d2 = d1 * 128 | 0;
                data[index + 1] = d2;

                data[index + 2] = this.textureOffsets[i] === -1 ? 255 : this.textureOffsets[i];
                data[index + 3] = 255;
            }
        }
    }, {
        key: "anglesForSegment",
        value: function anglesForSegment(x1, y1, x2, y2) {
            var ang1 = Phaser.Math.normalizeAngle(Math.atan2(y1, x1));
            var ang2 = Phaser.Math.normalizeAngle(Math.atan2(y2, x2));

            if (ang1 > ang2 && ang1 - ang2 < Math.PI || ang2 - ang1 >= Math.PI) {
                var tmp = ang1;
                ang1 = ang2;
                ang2 = tmp;
            }

            if (ang2 < ang1) ang2 += 2 * Math.PI;

            return { ang1: ang1, ang2: ang2 };
        }
    }]);

    return DistancesMap;
}();

exports.default = DistancesMap;

/***/ }),

/***/ "./lights/model/hyp_table.js":
/*!***********************************!*\
  !*** ./lights/model/hyp_table.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HypTable = function () {
    function HypTable(steps) {
        var stepAngle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2 * Math.PI / steps;

        _classCallCheck(this, HypTable);

        this.perAngleStep = [1];
        for (var i = 1; i < steps / 4; i++) {
            //не надо больше pi/2
            var ang = i * stepAngle;
            this.perAngleStep[i] = 1 / Math.cos(ang);
        }
        this.stepAngle = stepAngle;
    }

    //normal shall be a) from light to surface b) has valid length


    _createClass(HypTable, [{
        key: "fillDistancesForArc",
        value: function fillDistancesForArc(distancesMap, ai1, ai2, normal, onSetCallback) {
            var _this = this;

            var D = normal.getMagnitude();
            var normalAngle = Phaser.Math.normalizeAngle(Math.atan2(normal.y, normal.x)); //baseline
            var normalAngleI = normalAngle / this.stepAngle | 0; //from 0 to Detailed_steps
            var count = ai2 - ai1 + 1;
            var ai = void 0;
            var onDistanceSetCallback = undefined;
            for (var dai = 0; dai < count; dai++) {
                ai = ai1 + dai;
                if (onSetCallback) {
                    onDistanceSetCallback = function onDistanceSetCallback(index) {
                        return onSetCallback(index, D * Math.tan(ai * _this.stepAngle - normalAngle), ai * _this.stepAngle, normalAngle);
                    };
                }
                distancesMap.set(ai, D * this.perAngleStep[Math.abs(distancesMap.minus(ai, normalAngleI))], onDistanceSetCallback);
            }
        }
    }]);

    return HypTable;
}();

exports.default = HypTable;

/***/ }),

/***/ "./lights/model/light_source.js":
/*!**************************************!*\
  !*** ./lights/model/light_source.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LightSource = function () {
    function LightSource(sprite) {
        _classCallCheck(this, LightSource);

        this.sprite = sprite;
        this.x = sprite.x;
        this.y = sprite.y;

        this.radius = sprite.lightRadius || 200;
        this.activeLight = true;
    }

    _createClass(LightSource, [{
        key: "update",
        value: function update() {
            this.x = this.sprite.x;
            this.y = this.sprite.y;
        }
    }, {
        key: "setDistancesMap",
        value: function setDistancesMap(map) {
            this.distancesMap = map;
        }
    }, {
        key: "fillDistancesForArc",
        value: function fillDistancesForArc(ai1, ai2, normalFromLight) {
            this.distancesMap.fillDistancesForArc(ai1, ai2, normalFromLight);
        }
    }]);

    return LightSource;
}();

exports.default = LightSource;

/***/ }),

/***/ "./lights/model/line_shadow_caster.js":
/*!********************************************!*\
  !*** ./lights/model/line_shadow_caster.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _math = __webpack_require__(/*! ../../math */ "./math.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LineShadowCaster = function () {
    function LineShadowCaster(line, getTextureOffsetFromWidth) {
        _classCallCheck(this, LineShadowCaster);

        this.line = line;
        this.getTextureOffsetFromWidth = getTextureOffsetFromWidth;

        this._normalFromLight = new Phaser.Point();
        this._directFromLight = new Phaser.Point();

        this._intersectionPoints = [];

        this.tmpLine = new Phaser.Line();
        this.getWidthFromStart = this.getWidthFromStart.bind(this);
        this.getUFromStart = this.getUFromStart.bind(this);

        this._tmpPoint = new Phaser.Point();
    }

    _createClass(LineShadowCaster, [{
        key: "update",
        value: function update() {}
    }, {
        key: "fillDistancesMap",
        value: function fillDistancesMap(lightSource, distancesMap) {
            var intersection = intersectWithCircle(this.line, lightSource.x, lightSource.y, lightSource.radius, this.tmpLine);
            if (intersection) {
                var x1 = intersection.x1,
                    y1 = intersection.y1,
                    x2 = intersection.x2,
                    y2 = intersection.y2,
                    distanceFromLightToLine = intersection.distanceFromLightToLine;

                var _distancesMap$anglesF = distancesMap.anglesForSegment(x1 - lightSource.x, y1 - lightSource.y, x2 - lightSource.x, y2 - lightSource.y),
                    ang1 = _distancesMap$anglesF.ang1,
                    ang2 = _distancesMap$anglesF.ang2;

                var _distancesMap$angles = distancesMap.angles2indexes(ang1, ang2),
                    _distancesMap$angles2 = _slicedToArray(_distancesMap$angles, 2),
                    ai1 = _distancesMap$angles2[0],
                    ai2 = _distancesMap$angles2[1];

                this._intersectionPoints = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
                this._normalFromLight.set(x2 - x1, y2 - y1);

                this._normalFromLight.normalRightHand();
                this._normalFromLight.setMagnitude(distanceFromLightToLine);

                this._directFromLight.set(x2 - lightSource.x, y2 - lightSource.y);
                if (this._normalFromLight.dot(this._directFromLight) < 0) {
                    this._normalFromLight.multiply(-1, -1);
                }
                //if (!window.d2) {window.d2 = true; console.log( this._normalFromLight, ang1, ang2, ai1, ai2)}

                lightSource.fillDistancesForArc(ai1, ai2, this._normalFromLight, this.getUFromStart);
            } else {
                this._intersectionPoints = [];
            }
        }
    }, {
        key: "getUFromStart",
        value: function getUFromStart(point, normalFromLight, minusNormalWidth, angle, normalAngle) {
            return this.getTextureOffsetFromWidth(this.getWidthFromStart(point, normalFromLight, minusNormalWidth, angle, normalAngle));
        }
    }, {
        key: "getWidthFromStart",
        value: function getWidthFromStart(point, normalFromLight, minusNormalWidth, angle, normalAngle) {

            this._tmpPoint.set(point.x, point.y);
            this._tmpPoint.add(normalFromLight.x, normalFromLight.y);
            //this._tmpPoint.rotate(0, 0, angle - normalAngle, false);
            this._tmpPoint.subtract(this.line.start.x, this.line.start.y);
            var w1 = this._tmpPoint.getMagnitude();
            var w2 = this.line.length - w1;

            var width = Math.max(w1 - minusNormalWidth, w2 - minusNormalWidth);

            return width;
        }
    }]);

    return LineShadowCaster;
}();

//Done according to http://mathworld.wolfram.com/Circle-LineIntersection.html
//Imma lazy


exports.default = LineShadowCaster;
function intersectWithCircle(line, x, y, radius, tmpLine) {
    var dx = line.end.x - line.start.x;
    var dy = line.end.y - line.start.y;
    var dr2 = dx * dx + dy * dy;
    var dr = Math.sqrt(dr2);
    var D = (line.start.x - x) * (line.end.y - y) - (line.end.x - x) * (line.start.y - y);

    var distanceFromLightToLine = Math.abs(D) / dr;
    if (distanceFromLightToLine >= radius) return null;

    var sgndy = dy < 0 ? -1 : 1;

    var discr = radius * radius * dr2 - D * D;
    if (discr <= 0) {
        return null;
    }
    var sqrtDiscr = Math.sqrt(discr);

    var x1 = x + (D * dy + sgndy * dx * sqrtDiscr) / dr2;
    var y1 = y + (-D * dx + Math.abs(dy) * sqrtDiscr) / dr2;
    var x2 = x + (D * dy - sgndy * dx * sqrtDiscr) / dr2;
    var y2 = y + (-D * dx - Math.abs(dy) * sqrtDiscr) / dr2;

    var newdx = x2 - x1;
    var newdy = y2 - y1;

    //dot product
    if (newdx * dx + newdy * dy < 0) {
        //need to reverse
        var tmpx = x1,
            tmpy = y1;
        x1 = x2;y1 = y2;
        x2 = tmpx;y2 = tmpy;
    }

    //now we have old line and new line having same direction.
    tmpLine.start.set(x1, y1);
    tmpLine.end.set(x2, y2);

    var outside = true;
    if ((0, _math.pointOnSegment)(tmpLine, line.start.x, line.start.y)) {
        x1 = line.start.x;
        y1 = line.start.y;
        outside = false;
    }
    if ((0, _math.pointOnSegment)(tmpLine, line.end.x, line.end.y)) {
        x2 = line.end.x;
        y2 = line.end.y;
        outside = false;
    }
    if ((0, _math.pointOnSegment)(line, x1, y1) || (0, _math.pointOnSegment)(line, x2, y2)) {
        outside = false;
    }
    /*if (!window.d) {
        window.d = true;
        console.log(line.start.x, line.start.y, line.end.x, line.end.y);
        //console.log(tmpLine.pointOnSegment(600, 640, 0.0001));
        console.log(x1, y1, x2, y2);
        console.log(distanceFromLightToLine);
    }*/
    if (outside) return null;

    return { x1: x1, y1: y1, x2: x2, y2: y2, distanceFromLightToLine: distanceFromLightToLine };
}

/***/ }),

/***/ "./lights/render/shadows_drawer.js":
/*!*****************************************!*\
  !*** ./lights/render/shadows_drawer.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MODE_SHADOWS = exports.MODE_SIMPLE = exports.MODE_NONE = exports.MAX_LIGHTS = undefined;

var _PerMode;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _light_source = __webpack_require__(/*! ../model/light_source */ "./lights/model/light_source.js");

var _light_source2 = _interopRequireDefault(_light_source);

var _hyp_table = __webpack_require__(/*! ../model/hyp_table */ "./lights/model/hyp_table.js");

var _hyp_table2 = _interopRequireDefault(_hyp_table);

var _distances_map = __webpack_require__(/*! ../model/distances_map */ "./lights/model/distances_map.js");

var _distances_map2 = _interopRequireDefault(_distances_map);

var _line_shadow_caster = __webpack_require__(/*! ../model/line_shadow_caster */ "./lights/model/line_shadow_caster.js");

var _line_shadow_caster2 = _interopRequireDefault(_line_shadow_caster);

var _camera = __webpack_require__(/*! ../model/camera */ "./lights/model/camera.js");

var _camera2 = _interopRequireDefault(_camera);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MAX_LIGHTS = exports.MAX_LIGHTS = 64;
var STEPS = 128;

var SimpleLightShader = function (_Phaser$Filter) {
    _inherits(SimpleLightShader, _Phaser$Filter);

    function SimpleLightShader() {
        _classCallCheck(this, SimpleLightShader);

        var _this = _possibleConstructorReturn(this, (SimpleLightShader.__proto__ || Object.getPrototypeOf(SimpleLightShader)).call(this, game));

        var lightsArray = new Array(MAX_LIGHTS * 4);
        lightsArray.fill(0, 0, lightsArray.length);

        _this.uniforms.lightsCount = { type: '1i', value: 0 };
        _this.uniforms.lights = { type: '4fv', value: lightsArray };

        _this.fragmentSrc = "\n            precision highp float;\n            \n            uniform int lightsCount;\n            uniform vec4 lights[" + MAX_LIGHTS + "]; \n        \n        \n            void main() {\n                float b = 0.;\n                for (int i = 0; i < " + MAX_LIGHTS + "; i++) {\n                    if (i >= lightsCount) break;\n                    vec4 light = lights[i];\n                    b += step(length(light.xy - gl_FragCoord.xy), light.z);\n                }\n                b = clamp(0., 1., b);\n            \n                gl_FragColor = mix(vec4(0,0,0,0.5), vec4(0,0,0,0), b);\n            }\n        \n        ";
        return _this;
    }

    _createClass(SimpleLightShader, [{
        key: "updateLights",
        value: function updateLights(lightSources) {
            this.uniforms.lightsCount.value = lightSources.length;
            var i = 0;
            var array = this.uniforms.lights.value;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = lightSources[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var light = _step.value;

                    array[i++] = light.x;
                    array[i++] = game.world.height - light.y;
                    array[i++] = light.radius;
                    i++;
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
    }]);

    return SimpleLightShader;
}(Phaser.Filter);

var ShadowsShader = function (_Phaser$Filter3) {
    _inherits(ShadowsShader, _Phaser$Filter3);

    function ShadowsShader(sprite) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$lightDecay = _ref.lightDecay,
            lightDecay = _ref$lightDecay === undefined ? true : _ref$lightDecay,
            _ref$smoothShadow = _ref.smoothShadow,
            smoothShadow = _ref$smoothShadow === undefined ? true : _ref$smoothShadow;

        _classCallCheck(this, ShadowsShader);

        var _this2 = _possibleConstructorReturn(this, (ShadowsShader.__proto__ || Object.getPrototypeOf(ShadowsShader)).call(this, game));

        var lightsArray = new Array(MAX_LIGHTS * 4);
        lightsArray.fill(0, 0, lightsArray.length);

        _this2.uniforms.lightsCount = { type: '1i', value: 0 };
        _this2.uniforms.lights = { type: '4fv', value: lightsArray };

        _this2.uniforms.iChannel0.value = sprite.texture;

        _this2.fragmentSrc = "\n            precision highp float;\n            \n            uniform int lightsCount;\n            uniform vec4 lights[" + MAX_LIGHTS + "]; \n            uniform sampler2D  uSampler;\n            uniform sampler2D  iChannel0;\n            \n            #define STRENGTH " + (game.gameplay ? "0.2" : "0.3") + "\n            #define MAX_DARK " + (game.gameplay ? "0.9" : "0.7") + "\n\n            #define M_PI 3.141592653589793\n            #define M_PI2 6.283185307179586\n            \n            " + (lightDecay ? "#define DECAY" : "") + "\n            " + (smoothShadow ? "#define SMOOTH" : "") + "\n            \n            #define SMOOTH_STEP 0.02\n            \n            float decodeDist(vec4 color) {\n                return color.r*255.*2. + color.g*2.;\n            }            \n            \n            float getShadow(int i, float angle, float distance) {\n                float u = angle/M_PI2;\n                float v = float(i)/" + MAX_LIGHTS + ".;\n                float shadowAfterDistance = decodeDist(texture2D(iChannel0, vec2(u, v)));\n                return step(shadowAfterDistance, distance);\n            }            \n        \n        \n            void main() {\n                float lightness = 0.;\n                for (int i = 0; i < " + MAX_LIGHTS + "; i++) {\n                    if (i >= lightsCount) break;\n                    vec4 light = lights[i];\n                    if (light.w == 0.) continue;\n                    vec2 light2point = gl_FragCoord.xy - light.xy;\n                    \n                    float radius = light.z;\n                    float distance = length(light2point);\n                    float inLight = step(distance, radius);\n                    if (inLight == 0.) continue;\n                    float angle = mod(-atan(light2point.y, light2point.x), M_PI2);\n                    \n                    float thisLightness = (1. - getShadow(i, angle, distance));\n\n                    #ifdef SMOOTH\n                    thisLightness = thisLightness * 0.4 \n                        + (1. - getShadow(i, angle-SMOOTH_STEP, distance)) * 0.2   \n                        + (1. - getShadow(i, angle+SMOOTH_STEP, distance)) * 0.2\n                        + (1. - getShadow(i, angle-SMOOTH_STEP*2., distance)) * 0.1   \n                        + (1. - getShadow(i, angle+SMOOTH_STEP*2., distance)) * 0.1;\n                       \n                    #endif\n                    \n                    #ifdef DECAY\n                    thisLightness = thisLightness*smoothstep(0., 1., pow(1.-distance/radius, 0.5));\n                    #endif\n                    \n                    lightness += thisLightness*STRENGTH;\n                }\n                lightness = clamp(0., 1., lightness);\n            \n                gl_FragColor = mix(vec4(0,0,0,MAX_DARK), vec4(0,0,0,0), lightness);\n            }\n        \n        ";
        return _this2;
    }

    _createClass(ShadowsShader, [{
        key: "updateLights",
        value: function updateLights(lightSources) {
            this.uniforms.lightsCount.value = lightSources.length;
            var i = 0;
            var array = this.uniforms.lights.value;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = lightSources[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var light = _step2.value;

                    array[i++] = light.x;
                    array[i++] = game.world.height - light.y;
                    array[i++] = light.radius;
                    array[i++] = light.activeLight ? 1 : 0;
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
    }]);

    return ShadowsShader;
}(Phaser.Filter);

var MODE_NONE = exports.MODE_NONE = "none";
var MODE_SIMPLE = exports.MODE_SIMPLE = "simple";
var MODE_SHADOWS = exports.MODE_SHADOWS = "shadows";

var PerMode = (_PerMode = {}, _defineProperty(_PerMode, MODE_SIMPLE, SimpleLightShader), _defineProperty(_PerMode, MODE_SHADOWS, ShadowsShader), _PerMode);

var ShadowsDrawer = function () {
    function ShadowsDrawer(shadowsGroup) {
        var steps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : STEPS;

        _classCallCheck(this, ShadowsDrawer);

        this.grp = shadowsGroup;
        this.spriteToApplyShader = game.add.sprite(0, 0, undefined, undefined, shadowsGroup);
        this.spriteToApplyShader.width = game.world.width;
        this.spriteToApplyShader.height = game.world.height;

        this.lightSources = [];
        this.shadowCasters = [];

        this.hypTable = new _hyp_table2.default(steps);
        this.steps = steps;

        this.distancesBitmap = game.add.bitmapData(steps, MAX_LIGHTS);
        this.distancesBitmap.update();
        this.distancesBitmap.sprite = game.add.sprite(-10000, -10000, this.distancesBitmap);
    }

    _createClass(ShadowsDrawer, [{
        key: "init",
        value: function init() {
            var _this3 = this;

            var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : MODE_SIMPLE;
            var options = arguments[1];

            if (this.shader) return;
            setTimeout(function () {
                _this3.spriteToApplyShader.filters = [_this3.shader = new PerMode[mode](_this3.distancesBitmap.sprite, options)];
            }, 0);
        }
    }, {
        key: "showRaycastDebug",
        value: function showRaycastDebug() {
            this.distancesBitmap.sprite.x = this.distancesBitmap.sprite.y = 0;
            this.distancesBitmap.sprite.scale.y = 8;
            if (this.steps < 256) {
                this.distancesBitmap.sprite.scale.x = 4;
            }
            if (this.steps < 128) {
                this.distancesBitmap.sprite.scale.x = 8;
            }
        }
    }, {
        key: "addCamera",
        value: function addCamera(sprite) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            var camera = new (Function.prototype.bind.apply(_camera2.default, [null].concat([sprite], args)))();
            this.lightSources.push(camera);
            camera.setDistancesMap(new _distances_map2.default(this.steps, undefined, camera.radius, this.hypTable));
        }
    }, {
        key: "addLight",
        value: function addLight(sprite) {
            var src = new _light_source2.default(sprite);
            this.lightSources.push(src);
            src.setDistancesMap(new _distances_map2.default(this.steps, undefined, src.radius, this.hypTable));
        }
    }, {
        key: "addLineShadowCaster",
        value: function addLineShadowCaster(line, textureOffsetGetter) {
            this.shadowCasters.push(new _line_shadow_caster2.default(line, textureOffsetGetter));
        }
    }, {
        key: "update",
        value: function update() {
            for (var li = this.lightSources.length - 1; li >= 0; li--) {
                var light = this.lightSources[li];
                light.update();
                light.distancesMap.erase();
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = this.shadowCasters[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var caster = _step3.value;

                        caster.fillDistancesMap(light, light.distancesMap);
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                light.distancesMap.fillBitmap(this.distancesBitmap.imageData.data, li * this.steps * 4);
            }
            this.distancesBitmap.ctx.putImageData(this.distancesBitmap.imageData, 0, 0);
            this.distancesBitmap.dirty = true;
            if (this.shader) {
                this.shader.updateLights(this.lightSources);
            }
        }
    }]);

    return ShadowsDrawer;
}();

exports.default = ShadowsDrawer;

/***/ }),

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _Wall = __webpack_require__(/*! ./gameobjects/Wall */ "./gameobjects/Wall.js");

var _Wall2 = _interopRequireDefault(_Wall);

var _Hero = __webpack_require__(/*! ./gameobjects/Hero */ "./gameobjects/Hero.js");

var _Hero2 = _interopRequireDefault(_Hero);

var _Bulb = __webpack_require__(/*! ./gameobjects/Bulb */ "./gameobjects/Bulb.js");

var _Bulb2 = _interopRequireDefault(_Bulb);

var _shadows_drawer = __webpack_require__(/*! ./lights/render/shadows_drawer */ "./lights/render/shadows_drawer.js");

var _shadows_drawer2 = _interopRequireDefault(_shadows_drawer);

__webpack_require__(/*! ../common/opts */ "../common/opts.js");

var _render_pseudo_3d = __webpack_require__(/*! ./3d/render_pseudo_3d */ "./3d/render_pseudo_3d.js");

var _render_pseudo_3d2 = _interopRequireDefault(_render_pseudo_3d);

var _math = __webpack_require__(/*! ./math */ "./math.js");

var _Flower = __webpack_require__(/*! ./gameobjects/Flower */ "./gameobjects/Flower.js");

var _Flower2 = _interopRequireDefault(_Flower);

var _Firefly = __webpack_require__(/*! ./gameobjects/Firefly */ "./gameobjects/Firefly.js");

var _Firefly2 = _interopRequireDefault(_Firefly);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FLOOR_FRAME_NR = 8;
var CEIL_FRAME_NR = 16;
var PAD = 32;

var fpsEl = document.querySelector("#fps");

var options = window.initOptions({
    showSegmentsDebug: ["boolean", false],
    showRaycastDebug: ["boolean", false],
    showRaycastShaderDebug: ["boolean", false],
    collideWalls: ["boolean", false],

    steps: ["int", 512],
    mode: ["select", _shadows_drawer.MODE_SHADOWS, [_shadows_drawer.MODE_SIMPLE, _shadows_drawer.MODE_SHADOWS]],
    lightDecay: ["boolean", true],
    smoothShadow: ["boolean", true],
    randomLightsOnStart: ["int", 1],
    floatingBulbs: ["boolean", true],
    bulbRadius: ["int", 140],

    pseudo3d: ["boolean", false],
    pseudo3dTexture: ["boolean", true],
    pseudo3dLights: ["boolean", true],

    gameplay: ["boolean", false],

    hidden: ["boolean", false]
});

var Main = {
    init: function init() {
        game.time.advancedTiming = true;
    },
    preload: function preload() {
        game.load.tilemap("Walls", "Walls.json", undefined, Phaser.Tilemap.TILED_JSON);
        game.load.tilemap("Level1", "Level1.json", undefined, Phaser.Tilemap.TILED_JSON);
        game.load.spritesheet("colors", "colors.png", 4, 1);
        game.load.spritesheet("env", "env.png", 32, 32);
        game.load.spritesheet("walls", "walls.png", 16, 16);

        game.gameplay = options.gameplay;
    },
    create: function create() {
        this.floorGrp = game.add.group(undefined, "floor");
        var floor = game.add.sprite(0, 0, "colors", FLOOR_FRAME_NR, this.floorGrp);
        floor.width = game.world.width;
        floor.height = game.world.height;

        this.objGrp = game.add.group(undefined, "objects");
        this.flowersGrp = game.add.group(undefined, "flowers");
        this.shadowsGrp = game.add.group(undefined, "shadows");
        this.lightsGrp = game.add.group(undefined, "lights");
        this.heroGrp = game.add.group(undefined, "hero");
        this.overallGrp = game.add.group(undefined, "overall");

        this.shadows = new _shadows_drawer2.default(this.shadowsGrp, options.steps);
        if (options.showRaycastShaderDebug) {
            this.shadows.showRaycastDebug();
        }
        if (options.pseudo3d) {
            this.pseudo3d = new _render_pseudo_3d2.default(640, 480, this.overallGrp, !options.pseudo3dTexture, options.pseudo3dLights);
        }
        this.addWalls();
        this.addHero();
        this.addLights();

        game.level = this;

        this.shadows.init(options.mode, options);

        if (options.pseudo3d) {
            this.pseudo3d.init(this.hero, this.shadows);
        }

        this.fireflyTimeout = 0;
        this.lastFlowersCount = 0;
    },
    addWalls: function addWalls() {
        var tilemap = game.add.tilemap(options.gameplay ? "Level1" : "Walls");
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = tilemap.objects.walls[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ref = _step.value;
                var x = _ref.x,
                    y = _ref.y,
                    properties = _ref.properties,
                    polyline = _ref.polyline;

                //if (!properties || !properties.only) continue;
                var color = properties && properties.color;
                var textureNr = properties && properties.texture;
                for (var i = 0; i < polyline.length - 1; i++) {
                    var wall = new _Wall2.default(x + polyline[i][0], y + polyline[i][1], x + polyline[i + 1][0], y + polyline[i + 1][1], textureNr);
                    this.objGrp.add(wall);
                    var textureGetter = this.pseudo3d ? this.pseudo3d.createTextureOffsetGetter(textureNr || 0) : undefined;
                    this.shadows.addLineShadowCaster(wall.line, textureGetter);
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
    },
    addLights: function addLights() {
        game.rnd.sow([1]);
        for (var i = 0; i < options.randomLightsOnStart; i++) {
            var x = game.rnd.integerInRange(PAD, game.world.width - PAD * 2);
            var y = game.rnd.integerInRange(PAD, game.world.height - PAD * 2);
            this.addLight(x, y);
        }
        game.rnd.sow([2]);
    },
    addLight: function addLight(x, y) {
        var bulb = game.gameplay ? new _Firefly2.default(x, y, undefined, true) : new _Bulb2.default(x, y, options.bulbRadius, options.floatingBulbs);
        this.lightsGrp.add(bulb);
        this.shadows.addLight(bulb);
    },
    addHero: function addHero() {
        this.heroGrp.add(this.hero = new _Hero2.default(game.world.width / 2, game.world.height / 2, options.pseudo3d));
        this.cursors = game.input.keyboard.createCursorKeys();
        this.keys = {
            space: game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR),
            z: game.input.keyboard.addKey(Phaser.KeyCode.Z)
        };
        if (options.pseudo3d) {
            this.shadows.addCamera(this.hero);
        } else {
            this.shadows.addLight(this.hero);
        }
    },
    moveByIfCan: function moveByIfCan(hero, speed) {
        var forceVector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

        var dx = forceVector === undefined ? Math.cos(this.hero.rotation - Math.PI / 2) : forceVector.x;
        var dy = forceVector === undefined ? Math.sin(this.hero.rotation - Math.PI / 2) : forceVector.y;
        var newx = this.hero.x + speed * dx;
        var newy = this.hero.y + speed * dy;

        if (options.collideWalls) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.objGrp.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var wall = _step2.value;

                    if ((0, _math.intersectsLineWithCircle)(wall.line, newx, newy, this.hero.colliderRadius, this.hero.colliderRadius2)) {
                        if (forceVector === undefined) {
                            var p = new Phaser.Point(wall.line.end.x, wall.line.end.y);
                            p.subtract(wall.line.start.x, wall.line.start.y);
                            p.normalRightHand();
                            if (p.dot({ x: wall.line.start.x - this.hero.x, y: wall.line.start.y - this.hero.y }) > 0) {
                                p.multiply(-1, -1);
                            }
                            p.add(dx, dy).normalize();
                            return this.moveByIfCan(hero, speed, p);
                        }
                        return;
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

            this.hero.x = newx;
            this.hero.y = newy;
        } else {
            newx = Math.min(newx, game.world.width - this.hero.width);
            this.hero.x = Math.max(newx, this.hero.width);
            newy = Math.min(newy, game.world.height - this.hero.height);
            this.hero.y = Math.max(newy, this.hero.height);
        }
    },
    update: function update() {
        this.shadows.update();
        if (this.pseudo3d) this.pseudo3d.update();
        if (!game.gameplay && game.input.activePointer.leftButton.isDown) {
            if (!this.isMouseDown) {
                this.isMouseDown = true;
                this.addLight(game.input.activePointer.worldX, game.input.activePointer.worldY);
            }
        } else {
            this.isMouseDown = false;
        }
        if (!game.gameplay && this.keys.space.justDown) {
            this.addLight(this.hero.x, this.hero.y);
        }

        var rotspeed = 2;
        if (this.cursors.up.isDown || this.cursors.down.isDown) {
            var speed = this.cursors.up.isDown ? 4 : -4;
            this.moveByIfCan(this.hero, speed);
            this.hero.onWalk(speed);
        } else {
            rotspeed = 4;
            this.hero.onWalk(0);
        }
        if (this.cursors.left.isDown) {
            this.hero.rotation -= 0.02 * rotspeed;
        }
        if (this.cursors.right.isDown) {
            this.hero.rotation += 0.02 * rotspeed;
        }

        if (game.gameplay) {
            this.updateGameplay();
        }
    },
    updateGameplay: function updateGameplay() {
        if (this.keys.z.justDown) {
            var p = new Phaser.Point(0, 16);
            p.rotate(0, 0, this.hero.rotation, false);
            p.add(this.hero.x, this.hero.y);

            this.flowersGrp.add(new _Flower2.default(p.x, p.y));
        }

        if (this.keys.space.justDown) {
            if (this.hero.grabbedFirefly) {
                var ff = this.hero.grabbedFirefly;
                ff.grabbed = false;
                this.hero.grabbedFirefly = undefined;
            } else {
                var _ff = this.lightsGrp.getClosestTo(this.hero);
                if (_ff && Phaser.Point.distance(_ff, this.hero) < 32) {
                    this.hero.grabbedFirefly = _ff;
                    _ff.grabbed = true;
                }
            }
        }

        if (this.hero.grabbedFirefly) {
            this.hero.grabbedFirefly.cx = this.hero.grabbedFirefly.x = this.hero.x + 16 * Math.cos(this.hero.rotation - Math.PI / 2);
            this.hero.grabbedFirefly.cy = this.hero.grabbedFirefly.y = this.hero.y + 16 * Math.sin(this.hero.rotation - Math.PI / 2);
        }

        var grownFlowersCount = this.flowersGrp.children.filter(function (f) {
            return f.grownAnytime;
        }).length;
        if (grownFlowersCount > this.lastFlowersCount) {
            this.lastFlowersCount = grownFlowersCount;
            if (this.fireflyTimeout < 0) {
                var x = game.rnd.integerInRange(PAD, game.world.width - PAD * 2);
                var y = game.rnd.integerInRange(PAD, game.world.height - PAD * 6);
                this.addLight(x, y);
                this.fireflyTimeout = 4000;
            }
        }
        this.fireflyTimeout -= game.time.physicsElapsedMS;
    },
    render: function render() {
        fpsEl.innerText = game.time.fps || '--';
        if (options.showSegmentsDebug) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.shadows.shadowCasters[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var sc = _step3.value;

                    if (sc._intersectionPoints.length === 0) continue;
                    game.debug.geom(new Phaser.Line(sc._intersectionPoints[0].x, sc._intersectionPoints[0].y, sc._intersectionPoints[1].x, sc._intersectionPoints[1].y), "white");
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
        if (options.showRaycastDebug) {
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.shadows.lightSources[0].distancesMap.getAngles()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _ref2 = _step4.value;
                    var angle = _ref2.angle,
                        distance = _ref2.distance;

                    game.debug.geom(new Phaser.Line(this.hero.x, this.hero.y, this.hero.x + Math.cos(angle) * distance, this.hero.y + Math.sin(angle) * distance), "rgba(0,0,255,0.4)");
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }
        }
    }
};

window.Main = Main;

/***/ }),

/***/ "./math.js":
/*!*****************!*\
  !*** ./math.js ***!
  \*****************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.intersectsLineWithCircle = intersectsLineWithCircle;
exports.pointOnSegment = pointOnSegment;
function intersectsLineWithCircle(line, x, y, radius) {
    var radius2 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : radius * radius;

    var dx = line.end.x - line.start.x;
    var dy = line.end.y - line.start.y;
    var dr2 = dx * dx + dy * dy;
    var D = (line.start.x - x) * (line.end.y - y) - (line.end.x - x) * (line.start.y - y);

    var sgndy = dy < 0 ? -1 : 1;

    var discr = radius2 * dr2 - D * D;
    if (discr <= 0) {
        return false;
    }
    var sqrtDiscr = Math.sqrt(discr);

    var x1 = x + (D * dy + sgndy * dx * sqrtDiscr) / dr2;
    var y1 = y + (-D * dx + Math.abs(dy) * sqrtDiscr) / dr2;
    var x2 = x + (D * dy - sgndy * dx * sqrtDiscr) / dr2;
    var y2 = y + (-D * dx - Math.abs(dy) * sqrtDiscr) / dr2;

    return pointOnSegment(line, x1, y1) || pointOnSegment(line, x2, y2);
}

//Phaser's pointOnSegment does not use epsilon for range checks
function pointOnSegment(line, x, y) {
    var epsilon = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.01;

    var xMin = Math.min(line.start.x, line.end.x);
    var xMax = Math.max(line.start.x, line.end.x);
    var yMin = Math.min(line.start.y, line.end.y);
    var yMax = Math.max(line.start.y, line.end.y);

    return line.pointOnLine(x, y, epsilon) && x >= xMin - epsilon && x <= xMax + epsilon && y >= yMin - epsilon && y <= yMax + epsilon;
}

/***/ })

/******/ });
//# sourceMappingURL=bundle.js.map