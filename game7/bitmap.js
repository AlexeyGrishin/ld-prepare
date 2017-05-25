function preload() {
    game.time.advancedTiming = true;
    game.load.image('texture', 'texture.png');
}
const MIN_SIZE = 1024;

const REGION_SIZE = 512;

let options = initOptions({
    doRecolor: ["boolean", true],
    useRegions: ["boolean", true],
    regionsPerTick: ["int", 8],
    recolorMode: ["int", 1],
    recolorRadius: ["int", 2],
    spawnDelay: ["int", 1000],
    showGrid: ["boolean", false],
    splitRegion: ["int", 3]
});


class MultiBitmap {
    constructor(width, height, sw = MIN_SIZE, sh = MIN_SIZE, sprite = true) {
        this.width = width;
        this.height = height;
        this.sw = sw;
        this.sh = sh;
        this.bitmaps = [];
        for (let r = 0; r < height/sh; r++) {
            let row = [];
            this.bitmaps.push(row);
            for (let c = 0; c < width/sw; c++) {
                let bitmap = game.add.bitmapData(sw, sh);
                //bitmap.baseTexture.premultipliedAlpha = false;
                //bitmap.texture.premultipliedAlpha = false;
                row.push({
                    bitmap,
                    sx: c*sw,
                    sy: r*sh,
                    sprite: game.add.sprite(sprite ? c*sw : -1000, r*sh, bitmap)
                });
            }
        }
        this.dirtyBitmaps = [];

        //todo: for first bitmap only
        this.regions = [];
        for (let x = 0; x < sw-REGION_SIZE/2; x += REGION_SIZE/2) {
            for (let y = 0; y < sh-REGION_SIZE/2; y+= REGION_SIZE/2) {
                this.regions.push({sx: x, sy: y, w: REGION_SIZE, h: REGION_SIZE});
            }
        }
        console.log(this.regions.length, 'regions');
    }
    _bitmap(x,y) {
        return this.bitmaps[(y/this.sh)|0][(x/this.sw)|0];
    }

    bitmap(x,y) {
        return this._bitmap(x,y).bitmap;
    }

    fill(r, g, b) {
        this.forEach(bm => bm.fill(r,g,b));
    }

    setDirty(bitmap, y) {
        if (y !== undefined) {
            bitmap = this.bitmap(bitmap, y);
        }
        if (!bitmap._ourDirty) {
            this.dirtyBitmaps.push(bitmap);
            bitmap._ourDirty = true;
        }
    }

    update() {
        if (options.useRegions) throw new Error('shall not be used');
        let bm = this.dirtyBitmaps.shift();
        if (bm) {
            bm._ourDirty = false;
            bm.context.putImageData(bm.imageData, 0, 0);
            bm.dirty = true;
        }
    }

    getPixel(x, y, obj = {}) {
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
        let {bitmap, sx, sy} = this._bitmap(x,y);
        return bitmap.getPixel(x-sx,y-sy,obj);
    }

    setPixel(x,y,r,g,b,immediate) {
        let {bitmap, sx, sy} = this._bitmap(x,y);
        bitmap.setPixel(x-sx,y-sy,r,g,b,immediate);
        if (!immediate) {
            this.setDirty(bitmap);
        }
    }

    forEach(cb){
        for (let r = 0; r < this.bitmaps.length; r++) {
            for (let c = 0; c < this.bitmaps[r].length; c++) {
                cb(this.bitmaps[r][c].bitmap, r, c);
            }
        }
    }

    updateAll() {
        this.forEach(b => b.update(0, 0, b.width, b.height));
    }
}

const EMPTY = {value: undefined};

class Grid {
    constructor() {
        this.grid = [];
        for (let c = 0; c < W/PIX; c++) {
            let col = [];
            this.grid.push(col);
            for (let r = 0; r < H/PIX;r++) {
                col.push({
                    value: undefined,
                    _state: {},
                    _total: 0
                });
            }
        }
        this.width = this.grid.length;
        this.height = this.grid[0].length;
    }

    get(gx, gy) {
        if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return undefined;
        return this.grid[gx][gy].value;
    }
    getCell(gx, gy) {
        if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return EMPTY;
        return this.grid[gx][gy];
    }

    set(gx, gy, val) {
        let oldT = this.grid[gx][gy].value ? 1 : -1;
        this.grid[gx][gy].value = val;
        this.grid[gx][gy].dirty = true;
        let t = val ? 1 : -1;
        if (t == oldT) return;
        let y1 = gy > 0;
        let y2 = gy < this.height-1;
        if (gx > 0) {
            this.grid[gx-1][gy]._total += t;
            if (y1) {
                this.grid[gx-1][gy - 1]._total += t;
            }
            if (y2) {
                this.grid[gx-1][gy + 1]._total += t;
            }
        }
        if (gx < this.width-1) {
            this.grid[gx + 1][gy]._total += t;
            if (y1) {
                this.grid[gx + 1][gy - 1]._total += t;
            }
            if (y2) {
                this.grid[gx + 1][gy + 1]._total += t;
            }
        }
        {
            if (y1) {
                this.grid[gx][gy - 1]._total += t;
            }
            if (y2) {
                this.grid[gx][gy + 1]._total += t;
            }
        }
    }

    getReal(x, y) {
        return this.get(x >> PIX_SHIFT, y >> PIX_SHIFT);
    }

    setReal(x, y, val) {
        this.set(x >> PIX_SHIFT, y >> PIX_SHIFT, val);
    }

    forEach(cb) {
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                cb(this.grid[x][y].value, x, y, this.grid[x][y], x << PIX_SHIFT, y << PIX_SHIFT);
            }
        }
    }
}

let particles = [];


let bitmap, grid, growingBitmap, tempCanvas;
const W = 1024, H = 1024, PIX = 16, PIX_SHIFT = 4;
const PIX_MID = PIX/2;
const PIX_B1 = PIX_MID-PIX/4, PIX_B2 = PIX_MID+PIX/4;
let buttons;

let timer;
let inited = false;
let SX = 12, SY = 12;

let infection;
function create() {
    game.stage.backgroundColor = '#cccccc';

    bitmap = new MultiBitmap(W, H);
    //bitmap.fill(0,0,0);
    bitmap.updateAll();

    growingBitmap = new MultiBitmap(W, H, MIN_SIZE, MIN_SIZE, false);

    //tempCanvas = (() => {let c = document.createElement('canvas'); c.width=MIN_SIZE; c.height=MIN_SIZE; c.context = c.ctx = c.getContext('2d'); return c;})();

    grid = new Grid();

    grid.set(SX, SY, {i: true});
    buttons = {
        Z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        X: game.input.keyboard.addKey(Phaser.Keyboard.X),
        C: game.input.keyboard.addKey(Phaser.Keyboard.C)
    };
    prepareParticles();

    timer = game.time.create();
    timer.loop(options.spawnDelay, () => {
        let toAdd = [];
        grid.forEach((val, x, y) => {
            if (!val) {
                let total = around(x, y).total;
                if (total >= 2 && total < 7 && Math.random() < 0.5) {
                    toAdd.push({x,y});
                }
            }
        });
        toAdd.forEach(({x,y}) => grid.set(x, y, {i:true}))
    }, this);
    infection = new Infection(game);
    let infTextureSprite = game.add.sprite(-100,-100, 'texture');
    infection.uniforms.iChannel0.value = infTextureSprite.texture;
    infection.uniforms.textureSize.value = {x: infTextureSprite.width, y: infTextureSprite.height};
    infection.uniforms.resolution.value = {x: game.world.width, y: game.world.height};
    game.world.filters = [infection];

    //bitmap.fill(255,0,0);
    //timer.start();
}

let pix = 0;
let recolor = createRecolorer();

let toRecolor = [], regionsToRecolor;
const MAX_RECOLOR = options.useRegions ? options.regionsPerTick : 1;

function update() {
    infection.update();
    if (!regionsToRecolor) {
        regionsToRecolor = bitmap.regions.slice();
    }
    if (!inited && grid.getCell(SX, SY)._state.growing === true) {
        grid.set(SX+1, SY, {i: true});
        inited = true;
        //timer.start();
    }

    let mb = bitmap;

    let gx = (game.input.activePointer.x / PIX) | 0, gy = (game.input.activePointer.y / PIX) | 0;

    if (buttons.Z.justDown) {
        grid.set(gx, gy, {i: true});
    }
    if (buttons.X.justDown) {
        grid.set(gx, gy, undefined);
    }
    if (buttons.C.justDown) {
        console.log(JSON.stringify(grid.getCell(gx, gy), null, 4));
    }

    growingBitmap.forEach((bm) => {
        bm._inited = false;
    });
    mb.forEach((bm) => {
        bm._updated = false;
    });

    updatedCount = 0;
    grid.forEach((val, gx, gy, cell, x, y) => {
        if (cell.dirty) {
            let updated = updateCell(mb, cell, x, y, gx, gy);
            cell.dirty = updated;
            updatedCount++;
        }
        //todo: optimize. it shall not be in per-cell loop, it is about bitmaps
        let {bitmap, sx, sy} = mb._bitmap(x, y);
        if ((cell.value || cell.dirty) && options.doRecolor && !options.useRegions && !bitmap._scheduledForRecolor) {
            toRecolor.push({bitmap, sx, sy});
            bitmap._scheduledForRecolor = true;
        }
    });
    growingBitmap.forEach((bm, r, c) => {
        if (bm._inited) {
            let resultBitmap = mb.bitmaps[r][c].bitmap;
            bm.ctx.drawImage(resultBitmap.canvas, 0, 0);
            resultBitmap.ctx.globalCompositeOperation = "source-over";
            resultBitmap.ctx.drawImage(bm.canvas, 0, 0);
            resultBitmap.dirty = true;
        }
    });
    if (options.doRecolor) {
        if (!options.useRegions) {
            r.innerHTML = "";
            for (let i = 0; i < MAX_RECOLOR && i < toRecolor.length; i++) {
                let {bitmap, sx, sy} = toRecolor.shift();
                bitmap._scheduledForRecolor = false;
                if (!bitmap._updated) {
                    bitmap.update(0, 0, bitmap.width, bitmap.height);
                    bitmap._updated = true;
                }
                recolor(mb, bitmap, sx, sy, bitmap.width, bitmap.height);
            }
            mb.update();
        }
        else {
            r.innerHTML = "-";
            let getDataTime = 0, putDataTime = 0, recolorTime1 = 0, recolorTime2 = 0, recolorTime3 = 0;
            let onlyBitmap = mb.bitmaps[0][0].bitmap;
            let count = 0;
            let checkedPixelsTotal = 0;
            for (let i = 0; i < MAX_RECOLOR && i < regionsToRecolor.length; i++) {
                let s1 = new Date().getTime();
                let region = regionsToRecolor.shift();
                regionsToRecolor.push(region);
                if (region.sx == 0 && region.sy == 0) r.innerHTML = "*";
                onlyBitmap.update(region.sx, region.sy, region.w, region.h);
                let s2 = new Date().getTime();
                let [t1,t2,updated,checked] = recolor(mb, onlyBitmap, region.sx, region.sy, region.w, region.h, PIX);
                recolorTime1+= t1;
                recolorTime2+= t2;
                let s3 = new Date().getTime();
                if (updated) {
                    onlyBitmap.ctx.putImageData(onlyBitmap.imageData, region.sx, region.sy);
                    onlyBitmap.dirty = true;
                }
                checkedPixelsTotal += checked;
                let s4 = new Date().getTime();
                getDataTime += (s2-s1);
                putDataTime += (s4-s3);
                count++;
            }
            times.push([getDataTime, recolorTime1, recolorTime2, recolorTime3, putDataTime]);
            if (times.length > 60) {
                getDataTime = recolorTime1 = recolorTime2 = recolorTime3 = putDataTime = 0;
                for (let [a,b1,b2,b3,c] of times) {
                    getDataTime += a;
                    recolorTime1 += b1;
                    recolorTime2 += b2;
                    recolorTime3 += b3;
                    putDataTime += c;
                }
                console.log(checkedPixelsTotal, ' =>',  [getDataTime, recolorTime1, recolorTime2, recolorTime3, putDataTime].map(s => (s/60).toFixed(2)).join(" / "));
                times = [];
            }
        }

    } else {
        r.innerHTML = "";
    }
    r.innerHTML += " bm: " + (mb.bitmaps[0][0].bitmap.dirty ? "dirty" : "-");
}
let times = [];

let r = document.querySelector("#recolor");

let updatedCount = 0;

function aroundBase(getter, gx, gy) {
    let res = {
        total: 0,
        list: []
    };
    for (let ax = -1; ax <= 1; ax++) {
        //let r = {};
        //res[ax] = r;
        for (let ay = -1; ay <= 1; ay++) {
            let val = /*r[ay] = */getter(gx+ax, gy+ay);
            if (val && (ay != 0 || ax != 0)) {
                res.total++;
                res.list.push({ax, ay, val});
            }
        }
    }
    return res;
}

function around(gx, gy) {
    return aroundBase((gx,gy) => grid.get(gx, gy), gx, gy);
}

function aroundGrown(gx, gy) {
    return aroundBase((gx, gy) => {
        let cell = grid.getCell(gx, gy);
        return cell && cell._state && cell._state.growing === true
    }, gx, gy)
}


function prepareParticles() {
    for (let i = 0; i < 10; i++) {
        let canvas1 = document.createElement('canvas');
        document.body.appendChild(canvas1);
        canvas1.width = PIX;
        canvas1.height = PIX;
        let context = canvas1.getContext('2d');
        //context.globalAlpha = 1;// + 0.1*game.rnd.frac();
        context.fillStyle = `rgb(${game.rnd.integerInRange(250,255)},0,50)`;
        context.beginPath();
        context.arc(PIX / 2, PIX / 2, PIX / 8 * 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(255,0,255,255)';
        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        for (let j = 0; j < i*10; j++) {
            context.rect(
                game.rnd.integerInRange(0, PIX-1),
                game.rnd.integerInRange(0, PIX-1),
                game.rnd.integerInRange(1,2),
                game.rnd.integerInRange(1,2)
            );
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
            let oldW = PIX, oldH = PIX, oldMiddle = PIX/2;
            let newW = (oldW*mode.scale) |0, newH = (oldH*mode.scale)|0;
            let newMiddle = (newW/2)|0;
            let diff = newMiddle - oldMiddle;
            //todo: cache sized particles
            //console.log(mode, ': ', x,y, '->', newX, newY, newW, newH);

            let c = document.createElement('canvas');
            c.width = PIX;
            c.height = PIX;
            let ctx = c.getContext('2d');

            ctx.drawImage(particle, 0, 0, oldW, oldH, -diff, -diff, newW, newH);
            particle.cache[mode.scale] = c;
        }
        context.drawImage(particle.cache[mode.scale], x|0, y|0);


    }
    //todo: different particles. pre-print and now copy
}


function updateCell(mb, cell, x, y, gx, gy) {
    let {sx, sy, bitmap} = mb._bitmap(x, y);
    let resultBitmap = bitmap;
    bitmap = growingBitmap.bitmap(x, y);
    if (!bitmap._inited) {
        bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
        bitmap._inited = true;
    }
    let ar = aroundGrown(gx, gy);
    if (!cell._state) {
        cell._state = {};
    }
    const SPEED = 2;
    const PIX_PER_STEP = 4;
    if (cell.value) {
        //growing
        if (!cell._state.growing) {
            if (options.showGrid) {
                bitmap.context.strokeStyle = 'gray';
                bitmap.context.lineWidth = 1;
                bitmap.context.strokeRect(x - sx, y - sy, PIX, PIX);
            }
            cell._state.delay = game.rnd.integerInRange(0, 5);
            //need to init
            if (ar.total == 0) {
                //console.log('alone');
                cell._state.growing = [{
                   particle: game.rnd.pick(particles),
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    stepsLeft: PIX/2,
                    skipLeft: (x+y)%SPEED,
                    size: (stepsLeft) => (1-stepsLeft/PIX*2)*1
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
                let ps = [];
                ar.list.forEach(({ax,ay,val}) => {
                   ps.push({
                       x: x+ax*PIX+game.rnd.integerInRange(-1,1),
                       y: y+ay*PIX+game.rnd.integerInRange(-1,1),
                       dx: -ax*PIX_PER_STEP,
                       dy: -ay*PIX_PER_STEP,
                       stepsLeft: PIX/PIX_PER_STEP+1,
                       particle: game.rnd.pick(particles),
                       skipLeft: (x+y)%SPEED,
                       size: (stepsLeft) => { return (Math.abs(((stepsLeft-2)/(PIX/PIX_PER_STEP) - 0.5)))*2*0.5 + 0.5}
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
        if (cell._state.delay-->0) return true;

        if ( cell._state.growing !== true) {
            let somethingChanged = 0;
            cell._state.growing.forEach(part => {
                //todo: between-canvases
                if (part.skipLeft == 0) {
                    part.skipLeft = SPEED;
                } else {
                    part.skipLeft--;
                    return;
                }
                bitmap.ctx.globalCompositeOperation = "source-over";
               drawParticle(bitmap.ctx, part.x-sx, part.y-sy, part.particle, {scale: part.size(part.stepsLeft)});
                //debug
                //bitmap.context.strokeStyle = 'black';
                //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
               part.x += part.dx + Math.sign(part.dx)*game.rnd.pick([0,0,0,0,0,-1,1]);
               part.y += part.dy + Math.sign(part.dy)*game.rnd.pick([0,0,0,0,0,-1,1]);
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
                    skipLeft: (x+y)%SPEED,
                    size: (stepsLeft) => (1-stepsLeft/PIX)*1.5
                }];
            } else {
                let ps = [];
                ar.list.forEach(({ax,ay,val}) => {
                    ps.push({
                        x: x,
                        y: y,
                        dx: ax*PIX_PER_STEP/2,
                        dy: ay*PIX_PER_STEP/2,
                        stepsLeft: PIX/PIX_PER_STEP+1,
                        particle: particles[0],
                        skipLeft: (x+y)%SPEED,
                        size: (stepsLeft) => { return 1}
                    });
                });
                ps.push({
                    x: x,
                    y: y,
                    dx: 0,
                    dy: 0,
                    particle: particles[0],
                    stepsLeft: PIX/2,
                    skipLeft: (x+y)%SPEED,
                    size: (stepsLeft) => (1-stepsLeft/PIX*2)*1.5
                });

                cell._state.reducing = ps;
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
            let somethingChanged = 0;
            resultBitmap.ctx.globalCompositeOperation = "destination-out";
            cell._state.reducing.forEach(part => {
                //todo: between-canvases
                if (part.skipLeft == 0) {
                    part.skipLeft = SPEED;
                } else {
                    part.skipLeft--;
                    return;
                }
                drawParticle(resultBitmap.ctx, part.x-sx, part.y-sy, part.particle, {scale: part.size(part.stepsLeft)});
                //debug
                //bitmap.context.strokeStyle = 'black';
                //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
                part.x += part.dx + Math.sign(part.dx)*game.rnd.pick([0,0,0,0,0,-1,1]);
                part.y += part.dy + Math.sign(part.dy)*game.rnd.pick([0,0,0,0,0,-1,1]);
                //bitmap.context.lineTo(100+part.x-sx,part.y-sy);
                //bitmap.context.stroke();
                part.stepsLeft--;
                if (part.stepsLeft == 0) {
                    cell._state.reducing = true;
                    //bitmap.update(0, 0, bitmap.width, bitmap.height);
                }
                somethingChanged++;
            });
            if (somethingChanged) {
                resultBitmap.dirty = true;
            }
        }

    }
        //bitmap.ctx.fillStyle = cell.value ? "red" : "black";
    //bitmap.ctx.fillRect(x-sx,y-sy,PIX,PIX);


    return true;
}


function createRecolorer() {

    let neiColors = [];
    let neiColors1 = [];

    const RADIUS = options.recolorRadius;

    if (options.recolorMode == 1) {
        for (let x = -RADIUS; x <= RADIUS; x++) {
            for (let y = -RADIUS; y <= RADIUS; y++) {
                let nei = {x, y, color: {}};
                if (Math.hypot(x, y) <= RADIUS) neiColors.push(nei);
            }
        }
    } else if (options.recolorMode == 2) {
        neiColors.push({x:-2,y:+1,color:{}});
        neiColors.push({x:+1,y:-2,color:{}});
        neiColors.push({x:-1,y:-2,color:{}});
        neiColors.push({x:0,y:+1,color:{}});
    } else if (options.recolorMode == 3) {
        neiColors.push({x:-RADIUS,y:0,color:{}});
        neiColors.push({x:RADIUS,y:0,color:{}});
        neiColors.push({x:0,y:-RADIUS,color:{}});
        neiColors.push({x:0,y:RADIUS,color:{}});

    }


    neiColors1.push({x:-1,y:0,color:{}});
    neiColors1.push({x:+1,y:0,color:{}});
    neiColors1.push({x:0,y:-1,color:{}});
    neiColors1.push({x:0,y:+1,color:{}});



    let aroundCache = {};


    function recolorAll(mb, bitmap, sx, sy, width, height, pad = 0) {
        const RSTEP = 16;
        const SSTEP = 8;

        let data = bitmap.imageData.data;
        let len = data.length;
        let row = width * 4;

        let updates = [];
        let checked = 0;
        let x = 0, y = 0;
        let s1 = new Date().getTime();
        aroundCache = {};
        var red, blue, green, alpha, maxR, minR, gx = 0, gy = 0, cell;
        let updatesCount = 0;
        var ni, nc, nred, ii;

        let maxSkip = options.splitRegion;
        let skip = game.rnd.integerInRange(0, maxSkip-1);

        for (let i = 0; i < len; i+= 4) {
            if (x < pad || x > width-pad || y < pad || y > height-pad) {
                x++;
                skip++;
                if (x >= width) {
                    x = 0;
                    y++;
                }
                continue;
            }

            red = data[i];
            blue = data[i+2];
            green = data[i+1];
            maxR = red;
            minR = red;
            alpha = data[i+3];

            gx = (sx+x)>>PIX_SHIFT;// 0;// ((sx+x)/PIX) |0;
            gy = (sy+y)>>PIX_SHIFT;//0;// ((sy+y)/PIX) |0;
            cell = grid.grid[gx][gy];
            //if (cell._total == 8) console.log(gx,gy);

            if (green && red && alpha < 250) {
                data[i+3] += 5;
                updatesCount++;
            }
            //if (alpha > 100) {

            if (!red) {
                if (cell.value && cell._total == 8) {
                    let redAround = false;
                    for (ni = 0; ni < neiColors1.length; ni++) {
                        nc = neiColors1[ni];
                        ii = i + nc.x * 4 + nc.y * row;
                        if (ii >= 0 && ii <= len - 4 && data[ii]) {
                            redAround = true;
                            break;
                        }
                    }
                    if (redAround) {
                        updates.push({i, r: 255, g: 3});
                    }
                }
            } else {
                if (!cell.value) {
                    if (cell._total === 0 || cell._state.reducing === true) {

                        if (blue >= 30) {
                            updates.push({i, del: true});
                        } else {
                            let emptyAround = false;
                            for (ni = 0; ni < neiColors1.length; ni++) {
                                nc = neiColors1[ni];
                                ii = i + nc.x * 4 + nc.y * row;
                                if (ii >= 0 && ii <= len - 4 && data[ii + 3] < 100) {
                                    emptyAround = true;
                                    break;
                                }
                            }
                            if (emptyAround) updates.push({i, b: Math.min(251, blue + 10)});
                        }
                    }
                } else if (alpha > 100 && skip%maxSkip == 0) {
                    checked++;
                    for (ni = 0; ni < neiColors.length; ni++) {
                        nc = neiColors[ni];
                        ii = i + nc.x * 4 + nc.y * row;
                        if (ii >= 0 && ii <= len - 4) {
                            nred = data[ii];
                            if (nred > maxR) maxR = nred;
                            if (nred < minR) minR = nred;
                        }

                    }
                    let outR = 0;
                    if (minR == 0) {
                        outR = 255;
                    } else {
                        outR = Math.max(RSTEP, maxR - RSTEP);
                    }
                    if (Math.abs(outR - red) >= SSTEP) {
                        var sgn = Math.sign(outR - red);
                        if (sgn > 0) sgn *= 2;
                        updates.push({i, r: Math.floor(red + SSTEP * sgn)});
                    }

                }
            }
            //}

            x++;
            skip++;
            if (x >= width) {
                x = 0;
                y++;
            }
        }
        let s2 = new Date().getTime();

        if (updates.length) {
            for (let ui = 0; ui < updates.length; ui++) {
                let up = updates[ui];

                if (up.del) {
                    data[up.i+3] = 0;
                    data[up.i] = 0;
                } else if (up.b) {
                    data[up.i] = 255-up.b;
                    data[up.i+1] = 0;
                    data[up.i+2] = up.b;
                } else if (up.r) {
                    data[up.i] = up.r;
                    if (up.g) {
                        //console.log(up.i, 'set up green', up.g, 'from', data[up.i+1]);
                        data[up.i+1] = up.g;
                        data[up.i+3] = 100;
                    }
                }
            }
            //console.log('updated');
            if (!options.useRegions) mb.setDirty(bitmap);
        }
        let s3 = new Date().getTime();

        return [s2-s1,s3-s2,updates.length + updatesCount,checked];
    }

    return recolorAll;
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps + " updated: " + updatedCount;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}

let started = false;
document.querySelector("#start").addEventListener("click", () => {
    if (started) timer.resume(); else timer.start();
    started = true;
});
document.querySelector("#stop").addEventListener("click", () => timer.pause());