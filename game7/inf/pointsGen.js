(function(global) {

    const MIN_SIZE = 2;
    const MAX_SIZE = 10;
    const PAD = 0;
    const MAX_COUNT = 8000;
    const ATTEMPTS = 10;

    function preparePoints(fieldSize, cellSize) {
        let points = [];
        let cellsFree = [];

        let gridSize = Math.ceil(fieldSize / cellSize);

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                cellsFree.push(x+'_'+y);
            }
        }

        function tryAddTo(x, y, r) {
            let hasTooClose = false;
            for (let px of points) {
                if (Math.hypot(px.x - x, px.y - y) < r + px.r + PAD) {
                    hasTooClose = true;
                    break;
                }
            }
            if (!hasTooClose) {

                let gridCells = [];
                for (let dx = -r; dx <= r; dx++) {
                    for (let dy = -r; dy <= r; dy++) {
                        if (Math.hypot(dx,dy) <= r) {
                            let gx = ((x + dx)/cellSize)|0;
                            let gy = ((y + dy)/cellSize)|0;
                            if (!gridCells.some(gp => gp.gx == gx && gp.gy == gy)) {
                                gridCells.push({gx, gy});
                            }
                            cellsFree = cellsFree.filter(xy => xy != gx+'_'+gy)
                        }
                    }
                }

                points.push({x, y, r, cells: gridCells});
                return true;
            }
            return false;

        }

        //sqrt(1) - 1
        //sqrt(0.5) - 0.7
        //sqrt(0) - 0

        for (let i = 0; i < MAX_COUNT; i++) {
            let gotSomething = false;
            let r = Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * ((1 - Math.pow(i / MAX_COUNT, 1/2))));

            for (let attempts = ATTEMPTS; attempts >= 0 && !gotSomething; attempts--) {
                let x = game.rnd.integerInRange(0, fieldSize-1);
                let y = game.rnd.integerInRange(0, fieldSize-1);
                gotSomething = tryAddTo(x,y,r);
            }
            if (!gotSomething) {
                let cf = cellsFree.pop();
                if (cf) {
                    let [gx, gy] = cf.split('_').map(parseFloat);
                    let x = (gx + 0.5) * cellSize;
                    let y = (gy + 0.5) * cellSize;
                    tryAddTo(x, y, r);
                }

            }
            console.log(i, 'of', MAX_COUNT, 'done');
        }

        return points;

    }


    function debugPoints(bitmap1, points) {
        bitmap1.ctx.fillStyle = 'red';
        bitmap1.ctx.beginPath();
        for (let {x,y,r} of points) {
            bitmap1.ctx.arc(x, y, r, 0, Math.PI*2);
            bitmap1.ctx.closePath();
        }
        bitmap1.ctx.fill();
    }

    function initCircles(bitmap1) {
        let p = [];
        let maxSize = RSIZE - 1;
        let repeatX = 1024/RSIZE;
        for (let i = 0; i < MAX_COUNT; i++) {
            for (let attempts = ATTEMPTS; attempts >= 0; attempts--) {
                let x = game.rnd.integerInRange(0, maxSize);
                let y = game.rnd.integerInRange(0, maxSize);
                let r = Math.round(MIN_SIZE + (MAX_SIZE-MIN_SIZE) * (1 - i/MAX_COUNT));
                let hasTooClose = false;
                for (let px of p) {
                    if (Math.hypot(px.x - x, px.y - y) < r + px.r + PAD) {
                        hasTooClose = true;
                        break;
                    }
                }
                if (!hasTooClose) {
                    for (let rx = 0; rx < repeatX; rx++) {
                        for (let ry = 0; ry < repeatX; ry++) {
                            p.push({
                                x: x + RSIZE*rx,
                                y: y + RSIZE*ry,
                                r,
                                dev: game.rnd.integerInRange(0, r),
                                c2: {
                                    x: x + RSIZE*rx,
                                    y: y + RSIZE*ry,
                                    r}});
                        }
                    }

                    break;
                }
            }
        }

        bitmap1.ctx.fillStyle = 'red';
        bitmap1.ctx.beginPath();
        for (let {x,y,r, dev, c2} of p) {
            bitmap1.ctx.arc(x, y, r, 0, Math.PI*2);
            bitmap1.ctx.closePath();
            let nx = x, ny = y, nr = r;
            for (let di = 0; di < dev; di++) {
                nx += game.rnd.realInRange(-1, 1);
                ny += game.rnd.realInRange(-1, 1);
                nr += game.rnd.realInRange(-1, 1);
                bitmap1.ctx.arc(nx|0, ny|0, nr|0, 0, Math.PI*2);
                bitmap1.ctx.closePath();
                c2.x = nx|0;
                c2.y = ny|0;
                c2.r = nr|0;
            }
        }
        bitmap1.ctx.fill();


        bitmap1.update(0, 0, bitmap1.width, bitmap1.height);
        const row = bitmap1.width*4;

        for (let i = row+4; i < bitmap1.imageData.data.length-row-4; i+= 4) {
            let r = bitmap1.imageData.data[i];
            let b = bitmap1.imageData.data[i + 2];
            let a = bitmap1.imageData.data[i + 3];
            if (r && a) {
                bitmap1.imageData.data[i+3] = a > 128 ? 255 : 0;
                bitmap1.imageData.data[i] =  a > 128 ? 255 : 0;
            }
        }

        let changedSomething = true;
        for (let t = 0; (t < 50) && changedSomething; t++) {
            changedSomething = false;
            let changes = [];
            for (let i = row+4; i < bitmap1.imageData.data.length-row-4; i+= 4) {
                let r = bitmap1.imageData.data[i];
                let b = bitmap1.imageData.data[i+2];
                if (b || !r) continue;
                let aroundR = [
                    bitmap1.imageData.data[i+4],
                    bitmap1.imageData.data[i-4],
                    bitmap1.imageData.data[i+row],
                    bitmap1.imageData.data[i-row],
                ];
                let minR = Math.min(...aroundR);
                let maxR = Math.max(...aroundR);
                let outR = minR == 0 ? 255 : maxR-10;
                if (r !== outR) {
                    changes.push({i,r:outR});
                    //bitmap1.imageData.data[i] = outR;
                    changedSomething = true;
                }

            }
            if (changedSomething) {
                for (let c of changes) {
                    bitmap1.imageData.data[c.i] = c.r;
                }
            }
        }
        bitmap1.context.putImageData(bitmap1.imageData, 0, 0);
        bitmap1.dirty = true;


        return;

        bitmap1.ctx.fillStyle = 'blue';
        bitmap1.ctx.beginPath();
        for (let {x,y,r, dev, c2} of p) {
            bitmap1.ctx.rect(x,y,1,1);
        }

        bitmap1.ctx.fill();

        let pairs = [];
        let pairsMap = {};
        p.forEach((point,i) => point.id = i);
        p.forEach((point,i) => {

            let nearest = p.map(p2 => [Math.hypot(p2.x-point.x, p2.y-point.y), p2])
                .sort((p1,p2) => p1[0] - p2[0])
                .slice(0, 4)
                .map(p => p[1]);

            point.neighbours = nearest;

            nearest.forEach(p2 => {
                let ids = [point.id, p2.id].sort((a,b) => a-b);
                if (!pairsMap[ids.join('_')]) {

                    pairs.push(ids);
                    pairsMap[ids.join('_')] = true;
                }
            });

        });

        bitmap1.ctx.strokeStyle = 'white';
        bitmap1.ctx.beginPath();
        for (let [id1, id2] of pairs) {
            bitmap1.ctx.moveTo(p[id1].x, p[id1].y);
            bitmap1.ctx.lineTo(p[id2].x, p[id2].y);
        }

        bitmap1.ctx.stroke();

    }

    global.debugPoints = debugPoints;
    global.preparePoints = preparePoints;

})(window);