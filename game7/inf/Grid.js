const EMPTY = {value: undefined};

class Grid {
    constructor(width, height) {
        this.grid = [];
        for (let c = 0; c < width; c++) {
            let col = [];
            this.grid.push(col);
            for (let r = 0; r < height;r++) {
                col.push({
                    value: undefined,
                    _state: {},
                    _total: 0
                });
            }
        }
        this.width = this.grid.length;
        this.height = this.grid[0].length;

        this._removed = [];
        this._added = [];
        this._grown = [];
        this._reduced = [];
    }

    get removed() {
        return this._removed;
    }

    get added() {
        return this._added;
    }

    get grown() {
        return this._grown;
    }

    get reduced() {
        return this._reduced;
    }

    clear() {
        this._removed = [];
        this._added = [];
        this._grown = [];
        this._reduced = [];
    }

    justGrown(gx, gy) {
        this._grown.push({gx,gy});
    }

    justReduced(gx, gy) {
        this._reduced.push({gx,gy});
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
        if (val) this._added.push({gx,gy}); else this._removed.push({gx,gy});

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
        return this.get(x / PIX, y / PIX);
    }

    setReal(x, y, val) {
        this.set(x / PIX, y / PIX, val);
    }

    forEach(cb) {
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                cb(this.grid[x][y].value, x, y, this.grid[x][y], x * PIX, y * PIX);
            }
        }
    }
}

window.Grid = Grid;