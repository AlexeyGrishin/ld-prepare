const HEAT_PIX = 10;

class HeatmapInWorker {
    constructor(width, height, t) {
        this.grid = [];
        this.list = [];
        this.gridToReturn = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            let rowToReturn = [];
            for (let x = 0; x < width; x++) {
                row.push({t: t, tspeed: 0.2, x, y, delta: 0, tstepsPerTick: 10}); //tspeed = "part of particles moving for 1 cell for 1 tick"
                rowToReturn.push(t);
            }
            this.gridToReturn.push(rowToReturn);
            this.list.push(...row);
            this.grid.push(row);
        }
        this.list.sort((a,b) => {
            return b.tstepsPerTick - a.tstepsPerTick;
        });
        this.width = width;
        this.height = height;
        this.tchangers = [];
        this.movements = [];

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let cellsAround = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        let ax = x + dx;
                        let ay = y + dy;
                        if ((ax !== x || ay !== y) && ax >= 0 && ay >= 0 && ax < this.width && ay < this.height) {
                            cellsAround.push({
                                cell: this.grid[ay][ax],
                                dist: Math.hypot(ax-x, ay-y)
                            });
                        }
                    }
                }
                this.grid[y][x].around = cellsAround;
            }
        }
        this.sunT = undefined;
        this.sunTDelta = 0.05;
    }

    setSunT(t) {
        this.sunT = t;
    }

    addMovement(from, to, speed, props) {
        if (!this.valid(from.x, from.y) || !this.valid(to.x, to.y)) return;
        this.movements.push({from, to, speed, props});
        this._dirtyMovements = true;
    }

    valid(x ,y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    addTchanger(x, y, tconst) {
        let tc = {x, y, tconst};
        this.tchangers.push(tc);
        this.grid[y][x].t = tconst;
        this.grid[y][x].const = true;
    }

    removeTchanger(x, y, tconst) {
        let tchangersInPoint = this.tchangers.filter(t => t.x === x && t.y === y);
        let myTchanger = tchangersInPoint.find(t => t.tconst === tconst);
        this.tchangers.splice(this.tchangers.indexOf(myTchanger), 1);
        this.grid[y][x].const = false;
    }

    setT(x, y, t) {
        this.grid[y][x].t = t;
        this.gridToReturn[y][x] = t;
    }

    addT(x, y, t) {
        this.grid[y][x].t += t;
        this.gridToReturn[y][x] += t;
    }

    destroyMovementAt(x, y, radius) {
        let mi = this.movements.length, mvm;
        while (mi-->0) {
            mvm = this.movements[mi];
            if (mvm.props.damageable && Math.hypot(x - mvm.from.x*HEAT_PIX, y - mvm.from.y*HEAT_PIX) <= radius) {
                this.movements.splice(mi, 1);
            }
        }
    }

    prepareMovements() {
        for (let m of this.movements) {
            m.to = this.grid[m.to.y][m.to.x];
            m.from = this.grid[m.from.y][m.from.x];
        }
        if (this.movements.length) {
            this.movements.sort((a, b) => b.from.tstepsPerTick - a.from.tstepsPerTick);
        }
        this._dirtyMovements = false;

    }

    updateAll() {
        let maxAround, diff, ci, clength = this.list.length, cell, delta, i, thisCell, step, mi, mlength = this.movements.length, mvm;
        let maxSteps = this.list[0].tstepsPerTick;
        for (step = 0; step < maxSteps; step++) {
            for (ci = 0; ci < clength; ci++) {
                thisCell = this.list[ci];
                if (thisCell.tstepsPerTick < step) break;
                maxAround = undefined;
                for (i = 0; i < thisCell.around.length; i++) {
                    cell = thisCell.around[i];
                    diff = thisCell.t - cell.cell.t;
                    if (diff === undefined || isNaN(diff) || diff === null || typeof diff !== "number") debugger;
                    if (diff > 0 && (maxAround === undefined || maxAround.diff < diff) /*|| maxAround.tspeed < cell.cell.tspeed*/) {
                        maxAround = {cell: cell.cell, tspeed: cell.cell.tspeed, dist: cell.dist, diff};
                    }
                }
                if (maxAround !== undefined) {
                    delta = maxAround.diff/2 * thisCell.tspeed / Math.pow(maxAround.dist,6);
                    maxAround.cell.delta += delta;
                    thisCell.delta -= delta;
                }
            }
            for (ci = 0; ci < clength; ci++) {
                thisCell = this.list[ci];
                if (thisCell.tstepsPerTick < step) break;
                if (thisCell.delta === 0) continue;
                if (!thisCell.const) {
                    thisCell.t = Math.max(0, Math.min(255, thisCell.t + thisCell.delta));
                }
                thisCell.delta = 0;
            }
            for (mi = 0; mi < mlength; mi++) {
                mvm = this.movements[mi];
                if (mvm.from.tstepsPerTick < step) break;
                mvm.to.delta = mvm.speed*(mvm.from.t - mvm.to.t)
            }
            for (mi = 0; mi < mlength; mi++) {
                mvm = this.movements[mi];
                if (mvm.from.tstepsPerTick < step) break;
                if (!mvm.to.const) {
                    mvm.to.t = Math.max(0, Math.min(255, mvm.to.t + mvm.to.delta));
                }
                mvm.to.delta = 0;
            }
        }
    }

    updateReturnAndSun() {
        let ci, clength = this.list.length, thisCell;
        for (ci = 0; ci < clength; ci++) {
            thisCell = this.list[ci];
            if (this.sunT !== undefined && !thisCell.const && thisCell.t < this.sunT) {
                thisCell.t += this.sunTDelta;
            }
            this.gridToReturn[thisCell.y][thisCell.x] = thisCell.t;
        }
    }

    update() {
        if (this._dirtyMovements) this.prepareMovements();
        this.updateAll();
        this.updateReturnAndSun();

        postMessage({
            method: "update",
            grid: this.gridToReturn
        })
    }
}

let instance;

onmessage = (event) => {
    if (event.data.method === "init") {
        instance = new HeatmapInWorker(...event.data.args);
    } else {
        instance[event.data.method](...event.data.args);
    }
};