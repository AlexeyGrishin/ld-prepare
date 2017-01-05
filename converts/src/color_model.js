class ColorModel {
    constructor() {
        this._colors = [];
        this._colorsMap = {};
        this._normalized = null;
    }

    getColorIndex(color) {
        let ci = this._colorsMap[color];
        if (ci === undefined) {
            ci = this._colors.length;
            this._colorsMap[color] = ci;
            this._colors.push(color);
            this._normalized = null;
        }
        return ci;
    }

    get normalizedColors() {
        if (!this._normalized) {
            let count = this._colors.length;
            let nearestPow2 = Math.pow(2, Math.ceil(Math.log(count)/Math.log(2)));
            this._normalized = this._colors.slice();
            while (count < nearestPow2) {
                count++;
                this._normalized.push(0x000000);
            }
        }
        return this._normalized;
    }

    getUVs(colorIndexes) {
        let count = this.normalizedColors.length;
        if (count <= 1) return colorIndexes;
        return colorIndexes.map((ci) => ci / (count-1));
    }

    fillTexture(imageDataCreator) {
        let colors = this.normalizedColors;
        let im = imageDataCreator(colors.length, 1);
        for (let ci = 0; ci < colors.length; ci++) {
            im.data[ci * 4 + 0] = colors[ci] >> 16;
            im.data[ci * 4 + 1] = (colors[ci] >> 8) & 0xff;
            im.data[ci * 4 + 2] = (colors[ci]) & 0xff;
            im.data[ci * 4 + 3] = 0xff;
        }
        return im;
    }
}

module.exports = ColorModel;