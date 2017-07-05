(function(global) {

    const INSTEP = 50;

    function createMultiBitmap(size, bitmaps, destroyBitmaps = true) {

        let maxFrames = 0;
        for (let bitmap of bitmaps) {
            maxFrames = Math.max(maxFrames, bitmap.width/bitmap.height);
        }

        let bitmap = game.add.bitmapData(maxFrames * size, size * bitmaps.length);
        let bitmapsAttributes = [];
        for (let bi = 0; bi < bitmaps.length; bi++) {
            let frames = bitmaps[bi].width / bitmaps[bi].height;
            let frameSize = bitmaps[bi].height;
            bitmapsAttributes.push({
                frameSize,
                index: bi,
                frames,
                radius: bitmaps[bi].radius
            });
            for (let fi = 0; fi < frames; fi++) {
                bitmap.copyRect(bitmaps[bi], {
                    x: fi*frameSize,
                    y: 0,
                    width: frameSize,
                    height: frameSize
                }, (fi*size + (size-frameSize)/2)|0, (bi * size + (size-frameSize)/2)|0);
            }
            if (destroyBitmaps) {
                bitmaps[bi].destroy();
            }
        }

        function find(radius) {
            return bitmapsAttributes.filter(ba => ba.radius === radius).map(ba => ba.index);
        }

        return {

            bitmap: bitmap,

            find(radius) {
                return find(radius);
            },

            getFrames(index) {
                return bitmapsAttributes[index].frames;
            },


            drawFrame(target,index, frame,  x, y, mode) {
                let frameSize = bitmapsAttributes[index].frameSize;
                target.copyRect(bitmap, {
                    x: size*frame,
                    y: size*index,
                    width: size,
                    height: size
                },
                    (x - size/2)|0,
                    (y - size/2)|0, 1, mode
                )
            }
        }


    }

    function createCircleSprites(radius = 4, delta = 1, T = 1) {
        let spriteSize = radius*2 + 4 + delta;
        let raiseFrames = radius;

        let bitmapWidth = spriteSize * (raiseFrames + 1);
        let bitmapHeight = spriteSize;

        let bitmap = game.add.bitmapData(bitmapWidth, bitmapHeight);

        bitmap.fill(0, 0, 0, 0);

        let frame = 0;
        bitmap.ctx.globalCompositeOperation = 'lighter';
        //bitmap.ctx.scale(1, game.rnd.realInRange(0.7, 1));

        let tentAngles = [];
        for (let ta = 0; ta < 100; ta++) {
            tentAngles.push(game.rnd.realInRange(0, Math.PI*2));
        }

        let curve = [];
        let curveLength = 1;// game.rnd.integerInRange(0, 8);
        let fx = game.rnd.realInRange(-1, 1);
        let fy = game.rnd.realInRange(-1, 1);
        let ffx = game.rnd.realInRange(-1, 1);
        let ffy = game.rnd.realInRange(-1, 1);
        for (let ci = 0; ci < curveLength; ci++) {
            curve.push({fx:fx|0, fy:fy|0, fr: 1 - (1+ci)/curveLength});
            fx += ffx;
            fy += ffy;
        }
        curve.unshift({fx:0,fy:0, fr: 1});
        //curve.unshift({fx:0,fy:0, fr: 0});

        let scale = game.rnd.realInRange(0.9, 1);
        let baseRotate = game.rnd.realInRange(-1, 1);
        function drawCircle(frame, r, tentacles, alt = true, main = true) {
            bitmap.ctx.save();
            bitmap.ctx.translate(spriteSize/2 + frame*spriteSize, spriteSize/2);
            bitmap.ctx.scale(1, scale);
            bitmap.ctx.rotate(baseRotate + frame/raiseFrames);
            let x = 0;
            let y = 0;
            if (main) {
                bitmap.ctx.fillStyle = 'rgb(255,' + (alt ? 0 : 10) + ',0)';
                bitmap.ctx.beginPath();
                for (let {fx,fy,fr} of curve) {
                    bitmap.ctx.moveTo(x+fx, y+fy);
                    bitmap.ctx.arc(x+fx, y+fy, (r*fr)|0, 0, Math.PI * 2);
                    //bitmap.ctx.closePath();
                }
                bitmap.ctx.fill();

                bitmap.ctx.strokeStyle = 'red';
                for (let a = 0; a < tentacles; a++) {
                    let rangle = tentAngles[a];
                    let size = game.rnd.integerInRange(1, delta);
                    let rx = (x - 0.5 + Math.cos(rangle) * (r + size)) | 0;
                    let ry = (y - 0.5 + Math.sin(rangle) * (r + size)) | 0;
                    bitmap.ctx.lineWidth = size;
                    bitmap.ctx.moveTo(x, y);
                    bitmap.ctx.lineTo(rx, ry);
                }


                bitmap.ctx.stroke();
            }
            if (alt) {
                //todo: a bit more chaos needed
                bitmap.ctx.fillStyle = 'blue';
                bitmap.ctx.beginPath()
                let br = -Math.min(r, delta);
                for (let {fx,fy,fr} of curve) {
                    //bitmap.ctx.beginPath();
                    bitmap.ctx.moveTo(x+fx, y+fy);
                    bitmap.ctx.arc(
                        x+fx,
                        y+fy,
                        (r + br)*(1-fr),
                        0, Math.PI * 2);
                    //bitmap.ctx.closePath();
                }
                bitmap.ctx.fill();

                for (let a = 0; a < tentacles; a++) {
                    //bitmap.ctx.strokeStyle = 'rgb(0,0,' + (((a+1)/(1+tentacles)*255)|0) + ')';
                    bitmap.ctx.strokeStyle = 'blue';
                    let size = game.rnd.integerInRange(1, delta);
                    let rangle = tentAngles[tentAngles.length - 1 - a];
                    let rx = (x - 0.5 + Math.cos(rangle) * (r + br + size)) | 0;
                    let ry = (y - 0.5 + Math.sin(rangle) * (r + br + size)) | 0;
                    bitmap.ctx.lineWidth = size;
                    bitmap.ctx.moveTo(x, y);
                    bitmap.ctx.lineTo(rx, ry);
                    bitmap.ctx.stroke();
                }
            }
            bitmap.ctx.restore();


        }

        for (; frame < raiseFrames; frame++) {
            let r = ((frame/raiseFrames)*radius);
            drawCircle(frame, r, T*(frame/2)*r*Math.PI/2);
        }

        drawCircle(frame, radius, T*radius*Math.PI/2);

        bitmap.radius = radius;

        bitmap.update(0, 0, bitmap.width, bitmap.height);
        for (let i = 0; i < bitmap.imageData.data.length; i+= 4) {
            if (bitmap.imageData.data[i] + bitmap.imageData.data[i+1] + bitmap.imageData.data[i+2]) {
                bitmap.imageData.data[i+3] = 255;
            }
        }
        const row = bitmap.width*4;

        let changedSomething = true;


        function process(changes, i) {
            let val = bitmap.imageData.data[i];
            if (!val) return false;
            let around = [
                bitmap.imageData.data[i+4],
                bitmap.imageData.data[i-4],
                bitmap.imageData.data[i+row],
                bitmap.imageData.data[i-row],
            ];
            let min = Math.min(...around);
            let max = Math.max(...around);
            let out = min == 0 ? 255 : Math.max(INSTEP, max-INSTEP);
            if (val !== out) {
                changes.push({i,val:out});
                return true;
            }
            return false;
        }

        for (let t = 0; (t < 50) && changedSomething; t++) {
            changedSomething = false;
            let changes = [];
            for (let i = row+4; i < bitmap.imageData.data.length-row-4; i+= 4) {
               let p1 = process(changes, i);
                let p2 = process(changes, i+2);
                if (p1 || p2) changedSomething = true;

            }
            if (changedSomething) {
                for (let c of changes) {
                    bitmap.imageData.data[c.i] = c.val;
                }
            }
        }
        bitmap.ctx.putImageData(bitmap.imageData, 0, 0);

        return bitmap;

    }

    global.createCircleSprites = createCircleSprites;
    global.createMultiBitmap = createMultiBitmap;

})(window);