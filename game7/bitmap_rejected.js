
function updateCellsToUpdate() {
    cellsToUpdate = [];
    grid.forEach((val, gx, gy, cell, x, y) => {
        if (val) cellsToUpdate.push({cell, x, y, gx, gy});
    });
}

let cellsToUpdate = [];


function createRecolorer() {

    let neiColors = [];

    const RADIUS = 2;

    for (let x = -RADIUS; x <= RADIUS; x++) {
        for (let y = -RADIUS; y <= RADIUS; y++) {
            let nei = {x, y, color: {}};
            if (Math.hypot(x,y) <= RADIUS) neiColors.push(nei);
        }
    }


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
                    if (color.r != r) {
                        updates.push({x: px, y: py, r: color.r + SSTEP*Math.sign(r - color.r)});
                    }
                    if (updates.length > MAX_UPDATES) break outer;
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

    return recolorCell;
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

            let isLeft = xx <= PIX_B1 +  ((Math.cos(yy+gx+gy)*1)|0) + ((Math.sin(Math.cos(yy)+xx+(game.time.time/400))*2)|0);
            let isRight = xx >= PIX_B2 + ((Math.sin(yy-gx+gy)*2)|0) + ((Math.sin(Math.sin(yy)+xx+(game.time.time/400))*2)|0);
            let isUp = yy <= PIX_B1 +    ((Math.cos(xx-gx-gy)*1)|0) + ((Math.cos(Math.cos(xx)+yy+(game.time.time/400))*1)|0);
            let isDown = yy >= PIX_B2 +  ((Math.cos(xx+gx-gy)*2)|0) + ((Math.sin(Math.cos(xx)+yy+(game.time.time/400))*1)|0);

            //middle shall be drawn anywhere
            if (!growing || (!isLeft && !isRight && !isUp && !isDown)) {

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

            } else if (isLeft) {
                checkCell(-1, 0, px, py, color);
            } else if (isRight) {
                checkCell(+1, 0, px, py, color);
            } else if (isUp) {
                checkCell(0, -1, px, py, color);
            } else if (isDown) {
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


function update() {
    let mb = bitmap;

    let gx = (game.input.activePointer.x/PIX)|0, gy = (game.input.activePointer.y/PIX)|0;

    if (buttons.Z.justDown) {
        grid.set(gx, gy, {i: true});
        updateCellsToUpdate();
    }
    if (buttons.X.justDown) {
        grid.set(gx, gy, undefined);
        updateCellsToUpdate();
    }

    let recoloredPerUpdate = 0;
    const MAX_RECOLOR_PER_UPDATE = 40;
    const MAX_CELLS_TO_UPDATE = 240;
    let updatedCells = 0;

    //todo: queue for recolor, queue for cells update - to move in time

    grid.forEach((val, gx, gy, cell, x, y) => {
        if (cell.dirty) {
            let updated = false;
            for (let ax = -1; ax <= +1; ax++) {
                for (let ay = -1; ay <= +1; ay++) {
                    let acell = grid.getCell(gx+ax, gy+ay);
                    updated = updated || updateCell(mb, grid, gx+ax, gy+ay, x+ax*PIX, y+ay*PIX, acell, acell.value)
                    updatedCells++;
                }
            }
            if (updated) cell._recolor = true;
            cell.dirty = updated;
        }
        if (cell._recolor && recoloredPerUpdate < MAX_RECOLOR_PER_UPDATE && game.rnd.frac() < 0.5) {
            recoloredPerUpdate++;
            let recolorAgain = recolorCell(mb, x, y);
            if (!recolorAgain) {
                cell._recolor = false;
            } else {
                cell._recolor = true;
                for (let ax = -1; ax <= +1; ax++) {
                    for (let ay = -1; ay <= +1; ay++) {
                        let acell = grid.getCell(gx+ax, gy+ay);
                        acell._recolor = true;
                    }
                }
            }
        }
    });

    let maxLoop = cellsToUpdate.length; iLoop = 0;

    //todo: need to update each 400ms with different shift,
    while (updatedCells < MAX_CELLS_TO_UPDATE) { break;
        let cell2u = cellsToUpdate.pop();
        cellsToUpdate.unshift(cell2u);
        iLoop++; if (iLoop >= maxLoop) break;
        let {gx,gy,x,y,cell} = cell2u;
        if (!cell.value) continue;

        updateCell(mb, grid, gx, gy, x, y, cell, cell.value);
        updatedCells++;

    }

    mb.update();

    pix++;
}
