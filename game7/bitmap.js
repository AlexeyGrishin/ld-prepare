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

    setPixel(x,y,r,g,b,immediate) {
        let {bitmap, sx, sy} = this._bitmap(x,y);
        bitmap.setPixel(x-sx,y-sy,r,g,b,immediate);
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


let bitmap, sprite;
const W = 1024, H = 4096;
function create() {
    bitmap = new MultiBitmap(W, H);

    bitmap.fill(55,55,55);

    //sprite = game.add.sprite(0,0,bitmap);

    bitmap.updateAll();
    bitmap.forEach(b => b.ctx.fillStyle = "red");
}
let pix = 0;

function update() {
    //if (pix%10 == 0) {
        bitmap.setPixel((pix % 1024), (pix / 1024) | 0, 255, 0, 0);
    //}
    //bitmap.ctx.fillRect(pix%W, (pix/W)|0, 1, 1);
    //bitmap.dirty = true;
    pix++;
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}