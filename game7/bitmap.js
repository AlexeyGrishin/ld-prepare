function preload() {
    game.time.advancedTiming = true;
}

class MultiBitmap {
    constructor(width, height, sw = 256, sh = 256) {
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
                    sprite: game.add.sprite(c*sw, r*sh, bitmap)
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
                cb(this.bitmaps[r][c].bitmap);
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
                col.push({value: undefined});
            }
        }
    }

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


let bitmap, grid;
const W = 1024, H = 4096, PIX = 16;
const PIX_MID = PIX/2;
const PIX_B1 = PIX_MID-PIX/4, PIX_B2 = PIX_MID+PIX/4;
let buttons;
function create() {
    bitmap = new MultiBitmap(W, H);
    bitmap.fill(0,0,0);
    bitmap.updateAll();
    bitmap.forEach(b => b.ctx.fillStyle = "red");
    grid = new Grid();

    grid.set(1, 1, {i: true});
    buttons = {
        Z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        X: game.input.keyboard.addKey(Phaser.Keyboard.X)
    }
}
let pix = 0;

function update() {
    //if (pix%10 == 0) {
        //bitmap.setPixel((pix % 1024), (pix / 1024) | 0, 255, 0, 0);
    //}
    //bitmap.ctx.fillRect(pix%W, (pix/W)|0, 1, 1);
    //bitmap.dirty = true;
    let mb = bitmap;

    let gx = (game.input.activePointer.x/PIX)|0, gy = (game.input.activePointer.y/PIX)|0;

    if (buttons.Z.justDown) {
        grid.set(gx, gy, {i: true});
    }
    if (buttons.X.justDown) {
        grid.set(gx, gy, undefined);
    }


    grid.forEach((val, gx, gy, cell, x, y) => {
        if (cell.dirty) {
            //let {bitmap, sx, sy} = mb._bitmap(x, y);
            /*
            if (val) {
                //draw cell
                for (let dx = 0; dx < PIX; dx++) {
                    for (let dy = 0; dy < PIX; dy++) {
                        bitmap.setPixel(x-sx+dx, y-sy+dy, 255, 0, 0, false);
                    }
                }
                console.log('draw  on ', gx, gy);
            } else {
                for (let dx = 0; dx < PIX; dx++) {
                    for (let dy = 0; dy < PIX; dy++) {
                        bitmap.setPixel(x-sx+dx, y-sy+dy, 0, 0, 0, false);
                    }
                }
                console.log('erase on ', gx, gy);
                //undraw cell
            }
            mb.setDirty(bitmap);
            */
            let updated = false;
            for (let ax = -1; ax <= +1; ax++) {
                //let ay = 0;
                for (let ay = -1; ay <= +1; ay++) {
                    let acell = grid.getCell(gx+ax, gy+ay);
                    updated = updated || updateCell(mb, grid, gx+ax, gy+ay, x+ax*PIX, y+ay*PIX, acell, acell.value)
                }
            }
            updated = updated || recolorCell(mb,  x, y);
            cell.dirty = updated;
        }
    });

    mb.update();

    pix++;
}

function recolorCell(mb, x, y) {
    let recolored = false;
    let color = {}, neiColors = [
        {x:+1, y:0, color: {}},
        {x:+1, y:+1, color: {}},
        {x:0, y:+1, color: {}},
        {x:-1, y:+1, color: {}},
        {x:-1, y:0, color: {}},
        {x:-1, y:-1, color: {}},
        {x:0, y:-1, color: {}},
        {x:+1, y:-1, color: {}},
    ];
    let updates = [];
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
                r = maxR - 10;
            }
            if (color.r != r) {
                updates.push({x: px, y: py, r: r});
            }
        }
    }
    recolored = updates.length > 0;
    for (let i = 0; i < updates.length; i++) {
        let {x,y, r} = updates[i];
        //console.log('draw', x, y, color);
        mb.setPixel(x, y, r, 0, 0, false);
    }

    return recolored;
}

function updateCell(mb, grid, gx, gy, x, y, item, growing) {
    let changedSomething = false;
    let cellCache = item._cache;
    if (!cellCache) {
        cellCache = {};
        item._cache = cellCache;
    }
    var color = {}, nearColor = {};

    let updates = [];

    function checkCell(dx, dy, px, py, color) {
        //if dx = -1 - check neibhor on left
        let hasNeighbor = growing ? grid.get(gx+dx, gy+dy) : false;

        if (hasNeighbor && !color.r) {
           //check pixel on right. if red - turn this tor red too
            mb.getPixel(px-dx, py-dy, nearColor);
            if (nearColor.r) {
                updates.push({x: px, y: py, color: {r:255,g:0,b:0}})
            }
        }

        if (!hasNeighbor && color.r) {
            //check pixel on left
            //console.log('no nei, has pix');
            mb.getPixel(px+dx, py+dy, nearColor);
            if (!nearColor.r) {
                updates.push({x:px, y:py, color: {r:0,g:0,b:0}});
                //console.log('delete', px, py);
            }
        }
    }

    for (let xx = 0; xx < PIX; xx++) {
        for (let yy = 0; yy < PIX; yy++) {
            let px = x + xx;
            let py = y + yy;

            mb.getPixel(px, py, color);

            //middle shall be drawn anywhere
            if (!growing || (xx >= PIX_B1 && xx <= PIX_B2 && yy >= PIX_B1 && yy <= PIX_B2)) {

                //first middle point
                if (xx == PIX_MID && yy == PIX_MID && growing && !color.r) {
                    updates.push({x: px, y: py, color: {r:255, g:0, b:0}});
                    continue;
                }
                if (xx == PIX_MID && yy == PIX_MID && !growing && color.r) {
                    updates.push({x: px, y: py, color: {r:0, g:0, b:0}});
                    continue;
                }
                let neiCount = !!mb.getPixel(px+1, py).r
                    + !!mb.getPixel(px-1, py).r
                    + !!mb.getPixel(px, py+1).r
                    + !!mb.getPixel(px, py-1).r;
                //console.log(xx, yy, neiCount);
                if (growing && neiCount > 0 && !color.r) {
                    updates.push({x: px, y: py, color: {r:255, g:0, b:0}});
                }
                if (!growing && neiCount < 4 && color.r) {
                    updates.push({x: px, y: py, color: {r:0, g:0, b:0}});
                }

            } else if (xx <= PIX_B1) {
                checkCell(-1, 0, px, py, color);
            } else if (xx >= PIX_B2) {
                checkCell(+1, 0, px, py, color);
            } else if (yy <= PIX_B1) {
                checkCell(0, -1, px, py, color);
            } else if (yy >= PIX_B2) {
                checkCell(0, +1, px, py, color);
            }

            //checkCell(+1, 0, px, py, color);
            //
            //checkCell(0, +1, px, py, color);
            //checkCell(0, -1, px, py, color);
        }
    }

    if (updates.length) changedSomething = true;
    for (let i = 0; i < updates.length; i++) {
        let {x,y, color} = updates[i];
        let {r,g,b} = color;
        //console.log('draw', x, y, color);
        mb.setPixel(x, y, r, g, b, false);
    }

    //1. create 9x9 matrix (or 16x16) of desired result. todo: cache it?
    //2. find border (red pixels surrounded with black, or edges)
    //3. check where to grow or shrink - and do that (with some probability)
    //4. re-color (make darker)

    return changedSomething;
}


let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}