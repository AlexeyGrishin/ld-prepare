const SIZE = 16;

const Methods = {
    drawImage: {
        init(bitmap) {
            let c = document.createElement('canvas');
            c.width = SIZE;
            c.height = SIZE;
            let ctx = c.getContext('2d');
            ctx.fillStyle = "red";
            ctx.arc(5, 5, 4, 0, Math.PI*2);
            ctx.fill();
            Methods.drawImage.canvas = c;
        },
        drawParticle(bitmap, x, y)  {
            bitmap.ctx.drawImage(Methods.drawImage.canvas, x, y);
        },
        flush(bitmap) {

        },
        name: "drawImage"
    },
    putImageData: {
        init(bitmap) {
            let c = document.createElement('canvas');
            c.width = SIZE;
            c.height = SIZE;
            let ctx = c.getContext('2d');
            ctx.fillStyle = "red";
            ctx.arc(5, 5, 4, 0, Math.PI*2);
            ctx.fill();
            Methods.drawImage.imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;

            bitmap.update(0, 0, bitmap.width, bitmap.height);
        },
        drawParticle(bitmap, x, y) {
            for (let ax = 0; ax < SIZE; ax++) {
                for (let ay = 0; ay < SIZE; ay++) {
                    let i = ay*SIZE*4+ax*4;
                    if (Methods.drawImage.imageData[i] > 0) {
                        bitmap.setPixel32(x+ax, y+ay, Methods.drawImage.imageData[i], 0, 0, 255, false);
                    }
                }
            }
        },

        flush(bitmap) {
            bitmap.context.putImageData(bitmap.imageData, 0, 0);
            bitmap.dirty = true;
        },
        name: "putImageData"
    },
    arc: {
        init(bitmap) {
            bitmap.context.fillStyle = 'red';
            bitmap.context.beginPath();
        },
        drawParticle(bitmap, x, y) {
            bitmap.context.arc(x+5, y+5, 4, 0, Math.PI*2);
        },
        flush(bitmap) {
            bitmap.context.closePath();
            bitmap.context.fill();
            bitmap.context.beginPath();
        },
        name: "arc"
    },

    putImageDataRecolor: {
        init(bitmap) {
            bitmap._first = true;
            bitmap.update(0, 0, bitmap.width, bitmap.height);
        },
        drawParticle(bitmap, x, y) {
            if (!bitmap._first) return;
            bitmap._first = false;
            let data = bitmap.imageData.data;
            let row = bitmap.width*4;
            for (var i = 0; i < data.length; i+= 4) {
                var around = [
                    i > 0 ? data[i-4] : 0,
                    i < data.length-4 ? data[i+4] : 0,
                    i > row ? data[i-row] : 0,
                    i < data.length-row-4 ? data[i+row] : 0
                ];
                data[i] = Math.max.apply(null, around) + 1;
                data[i+3] += 1;
            }
        },
        flush(bitmap) {
            bitmap.context.putImageData(bitmap.imageData, 0, 0);
            bitmap.dirty = true;
            bitmap._first = true;
        },
        name: "recolor"
    }
};

let methodName = location.search.split("?")[1];
if (!methodName) methodName = "drawImage";

document.querySelector("#links").innerHTML = Object.keys(Methods).map(mname => {
   return `<a href="?${mname}"> ${mname == methodName ? "<b>" : ""} ${mname} ${mname == methodName ? "</b>" : ""}</a>`
}).join("");

let method = Methods[methodName];

function preload() {
    game.time.advancedTiming = true;
}

let bitmap;
function create() {
    game.stage.backgroundColor = "#cccccc";
    bitmap = game.add.bitmapData(512, 512);
    game.add.sprite(0, 0, bitmap);
    method.init(bitmap);
}

let lastFps = [], avgFps = 0, stopped = false, count = 100;

function update() {
    if (stopped) return;
    lastFps.push(game.time.fps);
    if (lastFps.length > 60) {
        lastFps.shift();
    }
    avgFps = lastFps.length ? Math.max.apply(null, lastFps) : 0;
    if (avgFps < 50 && game.time.totalElapsedSeconds() > 2) {
        stopped = true;
    }

    for (let i = 0; i < count; i++) {
        method.drawParticle(bitmap, i%512, (i/512)|0);
    }
    method.flush(bitmap);
    bitmap.dirty = true;
    count+=100;
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = `count = ${count} max fps = ${avgFps} last fps = ${game.time.fps} ${stopped ? "STOPPED" : ""}`;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}