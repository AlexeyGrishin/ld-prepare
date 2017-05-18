"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function preload() {
    game.time.advancedTiming = true;
}
var MIN_SIZE = 1024;

var REGION_SIZE = 128;

var options = initOptions({
    doRecolor: ["boolean", true],
    useRegions: ["boolean", true],
    regionsPerTick: ["int", 32],
    recolorMode: ["int", 1],
    recolorRadius: ["int", 2],
    spawnDelay: ["int", 1000]
});

var MultiBitmap = function () {
    function MultiBitmap(width, height) {
        var sw = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : MIN_SIZE;
        var sh = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : MIN_SIZE;
        var sprite = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

        _classCallCheck(this, MultiBitmap);

        this.width = width;
        this.height = height;
        this.sw = sw;
        this.sh = sh;
        this.bitmaps = [];
        for (var r = 0; r < height / sh; r++) {
            var row = [];
            this.bitmaps.push(row);
            for (var c = 0; c < width / sw; c++) {
                var _bitmap2 = game.add.bitmapData(sw, sh);
                row.push({
                    bitmap: _bitmap2,
                    sx: c * sw,
                    sy: r * sh,
                    sprite: game.add.sprite(sprite ? c * sw : -1000, r * sh, _bitmap2)
                });
            }
        }
        this.dirtyBitmaps = [];

        //todo: for first bitmap only
        this.regions = [];
        for (var x = 0; x < sw; x += REGION_SIZE / 2) {
            for (var y = 0; y < sh; y += REGION_SIZE / 2) {
                this.regions.push({ sx: x, sy: y, w: REGION_SIZE, h: REGION_SIZE });
            }
        }
    }

    _createClass(MultiBitmap, [{
        key: "_bitmap",
        value: function _bitmap(x, y) {
            return this.bitmaps[y / this.sh | 0][x / this.sw | 0];
        }
    }, {
        key: "bitmap",
        value: function bitmap(x, y) {
            return this._bitmap(x, y).bitmap;
        }
    }, {
        key: "fill",
        value: function fill(r, g, b) {
            this.forEach(function (bm) {
                return bm.fill(r, g, b);
            });
        }
    }, {
        key: "setDirty",
        value: function setDirty(bitmap, y) {
            if (y !== undefined) {
                bitmap = this.bitmap(bitmap, y);
            }
            if (!bitmap._ourDirty) {
                this.dirtyBitmaps.push(bitmap);
                bitmap._ourDirty = true;
            }
        }
    }, {
        key: "update",
        value: function update() {
            var bm = this.dirtyBitmaps.shift();
            if (bm) {
                bm._ourDirty = false;
                bm.context.putImageData(bm.imageData, 0, 0);
                bm.dirty = true;
            }
        }
    }, {
        key: "getPixel",
        value: function getPixel(x, y) {
            var obj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
                obj.r = 0;
                obj.g = 0;
                obj.b = 0;
                obj.a = 0;
                obj._outside = true;
                return obj;
            } else {
                obj._outside = false;
            }

            var _bitmap3 = this._bitmap(x, y),
                bitmap = _bitmap3.bitmap,
                sx = _bitmap3.sx,
                sy = _bitmap3.sy;

            return bitmap.getPixel(x - sx, y - sy, obj);
        }
    }, {
        key: "setPixel",
        value: function setPixel(x, y, r, g, b, immediate) {
            var _bitmap4 = this._bitmap(x, y),
                bitmap = _bitmap4.bitmap,
                sx = _bitmap4.sx,
                sy = _bitmap4.sy;

            bitmap.setPixel(x - sx, y - sy, r, g, b, immediate);
            if (!immediate) {
                this.setDirty(bitmap);
            }
        }
    }, {
        key: "forEach",
        value: function forEach(cb) {
            for (var r = 0; r < this.bitmaps.length; r++) {
                for (var c = 0; c < this.bitmaps[r].length; c++) {
                    cb(this.bitmaps[r][c].bitmap, r, c);
                }
            }
        }
    }, {
        key: "updateAll",
        value: function updateAll() {
            this.forEach(function (b) {
                return b.update(0, 0, b.width, b.height);
            });
        }
    }]);

    return MultiBitmap;
}();

var Grid = function () {
    function Grid() {
        _classCallCheck(this, Grid);

        this.grid = [];
        for (var c = 0; c < W / PIX; c++) {
            var col = [];
            this.grid.push(col);
            for (var r = 0; r < H / PIX; r++) {
                col.push({ value: undefined, _state: {} });
            }
        }
    }

    _createClass(Grid, [{
        key: "get",
        value: function get(gx, gy) {
            if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return undefined;
            return this.grid[gx][gy].value;
        }
    }, {
        key: "getCell",
        value: function getCell(gx, gy) {
            if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return { value: undefined };
            return this.grid[gx][gy];
        }
    }, {
        key: "set",
        value: function set(gx, gy, val) {
            this.grid[gx][gy].value = val;
            this.grid[gx][gy].dirty = true;
        }
    }, {
        key: "getReal",
        value: function getReal(x, y) {
            return this.get(x / PIX | 0, y / PIX | 0);
        }
    }, {
        key: "setReal",
        value: function setReal(x, y, val) {
            this.set(x / PIX | 0, y / PIX | 0, val);
        }
    }, {
        key: "forEach",
        value: function forEach(cb) {
            for (var x = 0; x < this.grid.length; x++) {
                for (var y = 0; y < this.grid[x].length; y++) {
                    cb(this.grid[x][y].value, x, y, this.grid[x][y], x * PIX, y * PIX);
                }
            }
        }
    }, {
        key: "width",
        get: function get() {
            return this.grid.length;
        }
    }, {
        key: "height",
        get: function get() {
            return this.grid[0].length;
        }
    }]);

    return Grid;
}();

var particles = [];

var bitmap = void 0,
    grid = void 0,
    growingBitmap = void 0,
    tempCanvas = void 0;
var W = 1024,
    H = 1024,
    PIX = 16;
var PIX_MID = PIX / 2;
var PIX_B1 = PIX_MID - PIX / 4,
    PIX_B2 = PIX_MID + PIX / 4;
var buttons = void 0;

var timer = void 0;
var inited = false;
var SX = 12,
    SY = 12;
function create() {
    game.stage.backgroundColor = '#cccccc';

    bitmap = new MultiBitmap(W, H);
    //bitmap.fill(0,0,0);
    bitmap.updateAll();

    growingBitmap = new MultiBitmap(W, H, MIN_SIZE, MIN_SIZE, false);

    //tempCanvas = (() => {let c = document.createElement('canvas'); c.width=MIN_SIZE; c.height=MIN_SIZE; c.context = c.ctx = c.getContext('2d'); return c;})();

    grid = new Grid();

    grid.set(SX, SY, { i: true });
    buttons = {
        Z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        X: game.input.keyboard.addKey(Phaser.Keyboard.X)
    };
    prepareParticles();

    timer = game.time.create();
    timer.loop(options.spawnDelay, function () {
        var toAdd = [];
        grid.forEach(function (val, x, y) {
            if (!val) {
                var total = around(x, y).total;
                if (total >= 2 && total < 7 && Math.random() < 0.5) {
                    toAdd.push({ x: x, y: y });
                }
            }
        });
        toAdd.forEach(function (_ref) {
            var x = _ref.x,
                y = _ref.y;
            return grid.set(x, y, { i: true });
        });
    }, this);
    //timer.start();
}

var pix = 0;
var recolor = createRecolorer();

var toRecolor = [],
    regionsToRecolor = void 0;
var MAX_RECOLOR = options.useRegions ? options.regionsPerTick : 1;

function update() {
    if (!regionsToRecolor) {
        regionsToRecolor = bitmap.regions.slice();
    }
    if (!inited && grid.getCell(SX, SY)._state.growing === true) {
        grid.set(SX + 1, SY, { i: true });
        inited = true;
        //timer.start();
    }

    var mb = bitmap;

    var gx = game.input.activePointer.x / PIX | 0,
        gy = game.input.activePointer.y / PIX | 0;

    if (buttons.Z.justDown) {
        grid.set(gx, gy, { i: true });
    }
    if (buttons.X.justDown) {
        grid.set(gx, gy, undefined);
    }

    growingBitmap.forEach(function (bm) {
        bm._inited = false;
    });
    mb.forEach(function (bm) {
        bm._updated = false;
    });

    updatedCount = 0;
    grid.forEach(function (val, gx, gy, cell, x, y) {
        if (cell.dirty) {
            var updated = updateCell(mb, cell, x, y, gx, gy);
            cell.dirty = updated;
            updatedCount++;
        }
        //todo: optimize. it shall not be in per-cell loop, it is about bitmaps

        var _mb$_bitmap = mb._bitmap(x, y),
            bitmap = _mb$_bitmap.bitmap,
            sx = _mb$_bitmap.sx,
            sy = _mb$_bitmap.sy;

        if ((cell.value || cell.dirty) && options.doRecolor && !options.useRegions && !bitmap._scheduledForRecolor) {
            toRecolor.push({ bitmap: bitmap, sx: sx, sy: sy });
            bitmap._scheduledForRecolor = true;
        }
    });
    growingBitmap.forEach(function (bm, r, c) {
        if (bm._inited) {
            var resultBitmap = mb.bitmaps[r][c].bitmap;
            bm.ctx.drawImage(resultBitmap.canvas, 0, 0);
            resultBitmap.ctx.globalCompositeOperation = "source-over";
            resultBitmap.ctx.drawImage(bm.canvas, 0, 0);
            resultBitmap.dirty = true;
        }
    });
    if (options.doRecolor) {
        if (!options.useRegions) {
            for (var i = 0; i < MAX_RECOLOR && i < toRecolor.length; i++) {
                var _toRecolor$shift = toRecolor.shift(),
                    _bitmap5 = _toRecolor$shift.bitmap,
                    sx = _toRecolor$shift.sx,
                    sy = _toRecolor$shift.sy;

                _bitmap5._scheduledForRecolor = false;
                if (!_bitmap5._updated) {
                    _bitmap5.update(0, 0, _bitmap5.width, _bitmap5.height);
                    _bitmap5._updated = true;
                }
                recolor(mb, _bitmap5, sx, sy, _bitmap5.width, _bitmap5.height);
            }
            mb.update();
        } else {
            for (var _i = 0; _i < MAX_RECOLOR && _i < regionsToRecolor.length; _i++) {
                var region = regionsToRecolor.shift();
                regionsToRecolor.push(region);
                var onlyBitmap = mb.bitmaps[0][0].bitmap;
                onlyBitmap.update(region.sx, region.sy, region.w, region.h);
                recolor(mb, onlyBitmap, region.sx, region.sy, region.w, region.h, PIX);
                onlyBitmap.ctx.putImageData(onlyBitmap.imageData, region.sx, region.sy);
                onlyBitmap.dirty = true;
            }
        }
    }
}

var updatedCount = 0;

function aroundBase(getter, gx, gy) {
    var res = {
        total: 0,
        list: []
    };
    for (var ax = -1; ax <= 1; ax++) {
        //let r = {};
        //res[ax] = r;
        for (var ay = -1; ay <= 1; ay++) {
            var val = /*r[ay] = */getter(gx + ax, gy + ay);
            if (val && (ay != 0 || ax != 0)) {
                res.total++;
                res.list.push({ ax: ax, ay: ay, val: val });
            }
        }
    }
    return res;
}

function around(gx, gy) {
    return aroundBase(function (gx, gy) {
        return grid.get(gx, gy);
    }, gx, gy);
}

function aroundGrown(gx, gy) {
    return aroundBase(function (gx, gy) {
        var cell = grid.getCell(gx, gy);
        return cell && cell._state && cell._state.growing === true;
    }, gx, gy);
}

function prepareParticles() {
    for (var i = 0; i < 10; i++) {
        var canvas1 = document.createElement('canvas');
        document.body.appendChild(canvas1);
        canvas1.width = PIX;
        canvas1.height = PIX;
        var context = canvas1.getContext('2d');
        //context.globalAlpha = 1;// + 0.1*game.rnd.frac();
        context.fillStyle = "rgb(" + game.rnd.integerInRange(250, 255) + ",0,50)";
        context.beginPath();
        context.arc(PIX / 2, PIX / 2, PIX / 8 * 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(255,0,255,255)';
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        for (var j = 0; j < i * 10; j++) {
            context.rect(game.rnd.integerInRange(0, PIX - 1), game.rnd.integerInRange(0, PIX - 1), game.rnd.integerInRange(1, 2), game.rnd.integerInRange(1, 2));
        }
        context.fill();
        //todo: add some noise
        canvas1.cache = {};
        particles.push(canvas1);
    }
}

function drawParticle(context, x, y, particle, mode) {
    particle = particle || game.rnd.pick(particles);
    if (!mode || mode.scale == 1) {
        context.drawImage(particle, x | 0, y | 0);
    } else if (mode.scale) {

        if (!particle.cache[mode.scale]) {
            var oldW = PIX,
                oldH = PIX,
                oldMiddle = PIX / 2;
            var newW = oldW * mode.scale | 0,
                newH = oldH * mode.scale | 0;
            var newMiddle = newW / 2 | 0;
            var diff = newMiddle - oldMiddle;
            //todo: cache sized particles
            //console.log(mode, ': ', x,y, '->', newX, newY, newW, newH);

            var c = document.createElement('canvas');
            c.width = PIX;
            c.height = PIX;
            var ctx = c.getContext('2d');

            ctx.drawImage(particle, 0, 0, oldW, oldH, -diff, -diff, newW, newH);
            particle.cache[mode.scale] = c;
        }
        context.drawImage(particle.cache[mode.scale], x | 0, y | 0);
    }
    //todo: different particles. pre-print and now copy
}

function updateCell(mb, cell, x, y, gx, gy) {
    var _mb$_bitmap2 = mb._bitmap(x, y),
        sx = _mb$_bitmap2.sx,
        sy = _mb$_bitmap2.sy,
        bitmap = _mb$_bitmap2.bitmap;

    var resultBitmap = bitmap;
    bitmap = growingBitmap.bitmap(x, y);
    if (!bitmap._inited) {
        bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
        bitmap._inited = true;
    }
    var ar = aroundGrown(gx, gy);
    if (!cell._state) {
        cell._state = {};
    }
    var SPEED = 2;
    var PIX_PER_STEP = 4;
    if (cell.value) {
        //growing
        if (!cell._state.growing) {
            //bitmap.context.strokeStyle = 'red';
            //bitmap.context.strokeRect(x-sx,y-sy,PIX,PIX);
            //need to init
            if (ar.total == 0) {
                //console.log('alone');
                cell._state.growing = [{
                    particle: particles[0],
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    stepsLeft: PIX / 2,
                    skipLeft: (x + y) % SPEED,
                    size: function size(stepsLeft) {
                        return (1 - stepsLeft / PIX * 2) * 1;
                    }
                }];
                //for now just put cell
                //drawParticle(bitmap.ctx, x-sx, y-sy);
                /*bitmap.context.fillStyle = '#ff0000';
                bitmap.context.beginPath();
                bitmap.context.arc(x-sx+PIX/2, y-sy+PIX/2, PIX/8*3, 0, Math.PI*2);
                bitmap.context.fill();
                 cell._state.growing = true;*/
                //bitmap.update(0, 0, bitmap.width, bitmap.height);
                bitmap.dirty = true;
            } else {
                var ps = [];
                ar.list.forEach(function (_ref2) {
                    var ax = _ref2.ax,
                        ay = _ref2.ay,
                        val = _ref2.val;

                    ps.push({
                        x: x + ax * PIX + game.rnd.integerInRange(-1, 1),
                        y: y + ay * PIX + game.rnd.integerInRange(-1, 1),
                        dx: -ax * PIX_PER_STEP,
                        dy: -ay * PIX_PER_STEP,
                        stepsLeft: PIX / PIX_PER_STEP + 1,
                        particle: game.rnd.pick(particles),
                        skipLeft: (x + y) % SPEED,
                        size: function size(stepsLeft) {
                            return Math.abs((stepsLeft - 2) / (PIX / PIX_PER_STEP) - 0.5) * 2 * 0.5 + 0.5;
                        }
                    });
                    /*ps.push({
                        x: x+ax*PIX+game.rnd.integerInRange(-1,1),
                        y: y+ay*PIX+game.rnd.integerInRange(-1,1),
                        dx: -ax*2,
                        dy: -ay*2,
                        stepsLeft: PIX/2,
                        particle: game.rnd.pick(particles),
                        skipLeft: 0
                    });
                    ps.push({
                        x: x+ax*PIX+game.rnd.integerInRange(-1,1),
                        y: y+ay*PIX+game.rnd.integerInRange(-1,1),
                        dx: -ax,
                        dy: -ay,
                        stepsLeft: PIX,
                        particle: game.rnd.pick(particles),
                        skipLeft: 0
                    });*/
                });
                cell._state.growing = ps;
            }
        }
        delete cell._state.reducing;

        if (cell._state.growing !== true) {
            var somethingChanged = 0;
            cell._state.growing.forEach(function (part) {
                //todo: between-canvases
                if (part.skipLeft == 0) {
                    part.skipLeft = SPEED;
                } else {
                    part.skipLeft--;
                    return;
                }
                bitmap.ctx.globalCompositeOperation = "source-over";
                drawParticle(bitmap.ctx, part.x - sx, part.y - sy, part.particle, { scale: part.size(part.stepsLeft) });
                //debug
                //bitmap.context.strokeStyle = 'black';
                //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
                part.x += part.dx + Math.sign(part.dx) * game.rnd.pick([0, 0, 0, 0, 0, -1, 1]);
                part.y += part.dy + Math.sign(part.dy) * game.rnd.pick([0, 0, 0, 0, 0, -1, 1]);
                //bitmap.context.lineTo(100+part.x-sx,part.y-sy);
                //bitmap.context.stroke();
                part.stepsLeft--;
                if (part.stepsLeft == 0) {
                    cell._state.growing = true;
                    //bitmap.update(0, 0, bitmap.width, bitmap.height);
                }
                somethingChanged++;
            });
            if (somethingChanged) {
                bitmap.dirty = true;
            }
        } else {
            return false;
        }
    } else {
        if (!cell._state.reducing) {
            if (ar.total == 0) {
                //todo: animate;
                cell._state.reducing = [{
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    particle: particles[0],
                    stepsLeft: PIX,
                    skipLeft: (x + y) % SPEED,
                    size: function size(stepsLeft) {
                        return (1 - stepsLeft / PIX) * 1.5;
                    }
                }];
            } else {
                var _ps = [];
                ar.list.forEach(function (_ref3) {
                    var ax = _ref3.ax,
                        ay = _ref3.ay,
                        val = _ref3.val;

                    _ps.push({
                        x: x,
                        y: y,
                        dx: ax * PIX_PER_STEP / 2,
                        dy: ay * PIX_PER_STEP / 2,
                        stepsLeft: PIX / PIX_PER_STEP + 1,
                        particle: particles[0],
                        skipLeft: (x + y) % SPEED,
                        size: function size(stepsLeft) {
                            return 1;
                        }
                    });
                });
                _ps.push({
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    particle: particles[0],
                    stepsLeft: PIX / 2,
                    skipLeft: (x + y) % SPEED,
                    size: function size(stepsLeft) {
                        return (1 - stepsLeft / PIX * 2) * 1.5;
                    }
                });

                cell._state.reducing = _ps;
            }
            //bitmap.ctx.fillStyle = 'rgba(255,0,0,0)';
            //bitmap.ctx.fillRect(x-sx, y-sy, PIX, PIX);
            bitmap.dirty = true;
            //bitmap.update(0, 0, bitmap.width, bitmap.height);
            delete cell._state.growing;
        }
        if (cell._state.reducing === true) {
            return false;
        } else {
            var _somethingChanged = 0;
            resultBitmap.ctx.globalCompositeOperation = "destination-out";
            cell._state.reducing.forEach(function (part) {
                //todo: between-canvases
                if (part.skipLeft == 0) {
                    part.skipLeft = SPEED;
                } else {
                    part.skipLeft--;
                    return;
                }
                drawParticle(resultBitmap.ctx, part.x - sx, part.y - sy, part.particle, { scale: part.size(part.stepsLeft) });
                //debug
                //bitmap.context.strokeStyle = 'black';
                //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
                part.x += part.dx + Math.sign(part.dx) * game.rnd.pick([0, 0, 0, 0, 0, -1, 1]);
                part.y += part.dy + Math.sign(part.dy) * game.rnd.pick([0, 0, 0, 0, 0, -1, 1]);
                //bitmap.context.lineTo(100+part.x-sx,part.y-sy);
                //bitmap.context.stroke();
                part.stepsLeft--;
                if (part.stepsLeft == 0) {
                    cell._state.reducing = true;
                    //bitmap.update(0, 0, bitmap.width, bitmap.height);
                }
                _somethingChanged++;
            });
            if (_somethingChanged) {
                resultBitmap.dirty = true;
            }
        }
    }
    //bitmap.ctx.fillStyle = cell.value ? "red" : "black";
    //bitmap.ctx.fillRect(x-sx,y-sy,PIX,PIX);


    return true;
}

function createRecolorer() {

    var neiColors = [];
    var neiColors1 = [];

    var RADIUS = options.recolorRadius;

    if (options.recolorMode == 1) {
        for (var x = -RADIUS; x <= RADIUS; x++) {
            for (var y = -RADIUS; y <= RADIUS; y++) {
                var nei = { x: x, y: y, color: {} };
                if (Math.hypot(x, y) <= RADIUS) neiColors.push(nei);
            }
        }
    } else if (options.recolorMode == 2) {
        neiColors.push({ x: -2, y: +1, color: {} });
        neiColors.push({ x: +1, y: -2, color: {} });
        neiColors.push({ x: -1, y: -2, color: {} });
        neiColors.push({ x: 0, y: +1, color: {} });
    } else if (options.recolorMode == 3) {
        neiColors.push({ x: -RADIUS, y: 0, color: {} });
        neiColors.push({ x: RADIUS, y: 0, color: {} });
        neiColors.push({ x: 0, y: -RADIUS, color: {} });
        neiColors.push({ x: 0, y: RADIUS, color: {} });
    }

    neiColors1.push({ x: -1, y: 0, color: {} });
    neiColors1.push({ x: +1, y: 0, color: {} });
    neiColors1.push({ x: 0, y: -1, color: {} });
    neiColors1.push({ x: 0, y: +1, color: {} });

    var aroundCache = {};

    function recolorAll(mb, bitmap, sx, sy, width, height) {
        var pad = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

        var RSTEP = 12;
        var SSTEP = 4;

        var data = bitmap.imageData.data;
        var len = data.length;
        var row = width * 4;

        var updates = [];
        var x = 0,
            y = 0;
        aroundCache = {};
        for (var i = 0; i < len; i += 4) {
            if (x < pad || x > width - pad || y < pad || y > height - pad) {
                x++;
                if (x >= width) {
                    x = 0;
                    y++;
                }
                continue;
            }
            var red = data[i];
            var blue = data[i + 2];
            var maxR = red,
                minR = red;
            var gx = (sx + x) / PIX | 0;
            var gy = (sy + y) / PIX | 0;
            var cell = grid.getCell(gx, gy);
            if (!red) {
                if (cell.value) {
                    var total = aroundCache[gx + '_' + gy] = aroundCache[gx + '_' + gy] || around(gx, gy).total;
                    if (total === 8) {
                        var redAround = false;
                        for (var ni = 0; ni < neiColors1.length; ni++) {
                            var _neiColors1$ni = neiColors1[ni],
                                _x6 = _neiColors1$ni.x,
                                _y = _neiColors1$ni.y;

                            var ii = i + _x6 * 4 + _y * row;
                            if (ii >= 0 && ii <= len - 4 && data[ii]) {
                                redAround = true;
                                break;
                            }
                        }
                        if (redAround && Math.random() < 0.5) {
                            updates.push({ i: i, r: 255 });
                        }
                    }
                }
            } else {
                if (!cell.value) {
                    var _total = aroundCache[gx + '_' + gy] = aroundCache[gx + '_' + gy] || around(gx, gy).total;
                    if (_total === 0 || cell._state.reducing === true) {
                        if (blue >= 100) {
                            updates.push({ i: i, del: true });
                        } else if (Math.random() < 0.8) {
                            updates.push({ i: i, b: Math.min(251, blue + 10) });
                        }
                    }
                } else {
                    for (var _ni = 0; _ni < neiColors.length; _ni++) {
                        var _neiColors$_ni = neiColors[_ni],
                            _x7 = _neiColors$_ni.x,
                            _y2 = _neiColors$_ni.y;

                        var _ii = i + _x7 * 4 + _y2 * row;
                        if (_ii >= 0 && _ii <= len - 4) {
                            var nred = data[_ii];
                            if (nred > maxR) maxR = nred;
                            if (nred < minR) minR = nred;
                        }
                    }
                    var outR = 0;
                    if (minR == 0) {
                        outR = 255;
                    } else {
                        outR = Math.max(RSTEP, maxR - RSTEP);
                    }
                    if (Math.abs(outR - red) >= SSTEP) {
                        updates.push({ i: i, r: Math.floor(red + SSTEP * Math.sign(outR - red)) });
                    } else if (data[i + 3] < 255) {
                        updates.push({ i: i });
                    }
                }
            }

            x++;
            if (x >= width) {
                x = 0;
                y++;
            }
        }
        if (updates.length) {
            for (var ui = 0; ui < updates.length; ui++) {
                var up = updates[ui];

                if (up.del) {
                    data[up.i + 3] = 0;
                    data[up.i] = 0;
                } else if (up.b) {
                    data[up.i] = 255 - up.b;
                    data[up.i + 2] = up.b;
                } else if (up.r) {
                    data[up.i] = up.r;
                }
                if (data[up.i + 3] < 255) {
                    data[up.i + 3] += 1;
                }
            }
            mb.setDirty(bitmap);
        } else {
            return false;
        }
    }

    return recolorAll;
}

var fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps + " updated: " + updatedCount;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}

var started = false;
document.querySelector("#start").addEventListener("click", function () {
    if (started) timer.resume();else timer.start();
    started = true;
});
document.querySelector("#stop").addEventListener("click", function () {
    return timer.pause();
});
//# sourceMappingURL=bitmap.js.map