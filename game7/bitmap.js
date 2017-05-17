function preload() {
    game.time.advancedTiming = true;
}
const MIN_SIZE = 256;

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
                row.push({
                    bitmap,
                    sx: c*sw,
                    sy: r*sh,
                    sprite: game.add.sprite(sprite ? c*sw : -1000, r*sh, bitmap)
                });
            }
        }
        this.dirtyBitmaps = [];
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

class Grid {
    constructor() {
        this.grid = [];
        for (let c = 0; c < W/PIX; c++) {
            let col = [];
            this.grid.push(col);
            for (let r = 0; r < H/PIX;r++) {
                col.push({value: undefined, _state: {}});
            }
        }
    }

    get width() { return this.grid.length;}
    get height() { return this.grid[0].length;}

    get(gx, gy) {
        if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return undefined;
        return this.grid[gx][gy].value;
    }
    getCell(gx, gy) {
        if (gx < 0 || gx >= this.grid.length || gy < 0 || gy >= this.grid[gx].length) return {value: undefined};
        return this.grid[gx][gy];
    }

    set(gx, gy, val) {
        this.grid[gx][gy].value = val;
        this.grid[gx][gy].dirty = true;
    }

    getReal(x, y) {
        return this.get((x/PIX)|0, (y/PIX)|0);
    }

    setReal(x, y, val) {
        this.set((x/PIX)|0, (y/PIX)|0, val);
    }

    forEach(cb) {
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                cb(this.grid[x][y].value, x, y, this.grid[x][y], x*PIX, y*PIX);
            }
        }
    }
}

let particles = [];


let bitmap, grid, growingBitmap, tempCanvas;
const W = 1024, H = 4096, PIX = 16;
const PIX_MID = PIX/2;
const PIX_B1 = PIX_MID-PIX/4, PIX_B2 = PIX_MID+PIX/4;
let buttons;

let timer;
let inited = false;
let SX = 12, SY = 12;
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
        X: game.input.keyboard.addKey(Phaser.Keyboard.X)
    };
    prepareParticles();

    timer = game.time.create();
    timer.loop(500, () => {
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
    //timer.start();
}

let pix = 0;
let recolor = createRecolorer();

let toRecolor = [];
const MAX_RECOLOR = 10;

function update() {
    if (!inited && grid.getCell(SX, SY)._state.growing === true) {
        grid.set(SX+1, SY, {i: true});
        inited = true;
        timer.start();
    }

    let mb = bitmap;

    let gx = (game.input.activePointer.x / PIX) | 0, gy = (game.input.activePointer.y / PIX) | 0;

    if (buttons.Z.justDown) {
        grid.set(gx, gy, {i: true});
    }
    if (buttons.X.justDown) {
        grid.set(gx, gy, undefined);
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
        if (!cell._coords) cell._coords = {x,y};
        if (cell.value && toRecolor.indexOf(cell._coords) == -1) {
            toRecolor.push(cell._coords);
        }
    });
    growingBitmap.forEach((bm, r, c) => {
        if (bm._inited) {
            let resultBitmap = mb.bitmaps[r][c].bitmap;
            bm.ctx.drawImage(resultBitmap.canvas, 0, 0);
            resultBitmap.ctx.drawImage(bm.canvas, 0, 0);
            resultBitmap.dirty = true;
        }
    });
    for (let i = 0; i < MAX_RECOLOR && i < toRecolor.length; i++) {
        let { x, y} = toRecolor.shift();
        let {bitmap, sx, sy} = mb._bitmap(x, y);
        if (!bitmap._updated) {
            bitmap.update(0, 0, bitmap.width, bitmap.height);
            bitmap._updated = true;
        }
        recolor(mb, x, y);
    }
    mb.update();


}

let updatedCount = 0;

function aroundBase(getter, gx, gy) {
    let res = {
        total: 0,
        list: []
    };
    for (let ax = -1; ax <= 1; ax++) {
        let r = {};
        res[ax] = r;
        for (let ay = -1; ay <= 1; ay++) {
            let val = r[ay] = getter(gx+ax, gy+ay);
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
                       dx: -ax*2,
                       dy: -ay*2,
                       stepsLeft: PIX/2+1,
                       particle: game.rnd.pick(particles),
                       skipLeft: (x+y)%SPEED,
                       size: (stepsLeft) => { return (Math.abs(((stepsLeft-2)/(PIX/2) - 0.5)))*2*0.5 + 0.5}
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

            }
            bitmap.ctx.fillStyle = 'rgba(255,0,0,0)';
            bitmap.ctx.fillRect(x-sx, y-sy, PIX, PIX);
            cell._state.reducing = true;
            bitmap.dirty = true;
            //bitmap.update(0, 0, bitmap.width, bitmap.height);
            delete cell._state.growing;
        }
        if (cell._state.reducing === true) {
            return false;
        }

    }
        //bitmap.ctx.fillStyle = cell.value ? "red" : "black";
    //bitmap.ctx.fillRect(x-sx,y-sy,PIX,PIX);


    return true;
}


function createRecolorer() {

    let neiColors = [];

    const RADIUS = 1;

    for (let x = -RADIUS; x <= RADIUS; x++) {
        for (let y = -RADIUS; y <= RADIUS; y++) {
            let nei = {x, y, color: {}};
            if (Math.hypot(x,y) <= RADIUS) neiColors.push(nei);
        }
    }

    console.log(neiColors);

    function recolorCell(mb, x, y) {
        let recolored = false;
        let color = {};
        const RSTEP = 12;
        const SSTEP = 4;
        const MAX_UPDATES = 200;
        let updates = [];
        outer:
            for (let xx = 0; xx < PIX; xx++) {
                for (let yy = 0; yy < PIX; yy++) {
                    let px = x + xx;
                    let py = y + yy;

                    mb.getPixel(px, py, color);
                    if (color.r == 0) continue;
                    let maxR = color.r, minR = color.r;
                    for (let ni = 0; ni < neiColors.length; ni++) {
                        let nc = neiColors[ni];
                        mb.getPixel(px+nc.x, py+nc.y, nc.color);
                        maxR = Math.max(maxR, nc.color.r);
                        minR = Math.min(minR, nc.color.r);
                    }
                    let r;
                    if (minR == 0) {
                        r = 255;
                    } else {
                        r = Math.max(RSTEP, maxR - RSTEP);
                    }
                    if (Math.abs(color.r - r) > SSTEP) {
                        updates.push({x: px, y: py, r: Math.floor(color.r + SSTEP*Math.sign(r - color.r))});
                    }
                    if (updates.length > MAX_UPDATES) break outer;
                }
            }
        recolored = updates.length > 0;
        for (let i = 0; i < updates.length; i++) {
            let {x,y, r} = updates[i];
            //console.log('draw', x, y, r);
            mb.setPixel(x, y, r, 0, 0, false);
        }

        return recolored;
    }

    return recolorCell;
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps + " updated: " + updatedCount;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}