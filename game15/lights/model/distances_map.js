import HypTable from "./hyp_table";

export default class DistancesMap {
    constructor(steps, angle = 2*Math.PI/steps, maxDistance = 512, catets = undefined) {
        this.distances = new Array(steps);
        this.maxDistance = maxDistance;
        this.distances.fill(maxDistance, 0, steps);
        this.steps = steps;
        this.stepAngle = angle;

        this.textureOffsets = new Array(steps);
        this.textureOffsets.fill(-1, 0, steps);

        this.catets = catets || new HypTable(steps, angle);
    }

    erase() {
        this.distances.fill(this.maxDistance, 0, this.steps);
        this.textureOffsets.fill(-1, 0, this.steps);
    }

    fillDistancesForArc(ai1, ai2, normal, onSetCallback) {
        this.catets.fillDistancesForArc(this, ai1, ai2, normal, onSetCallback);
    }

    minus(ai1, ai2) {
        let diff = ai1 - ai2;
        if (Math.abs(diff) > this.steps/2) diff = diff - Math.sign(diff)*this.steps;
        return diff;
    }

    set(index, newValue, onSetCallback) {
        index = (index)%this.steps;
        if (newValue < this.distances[index]) {
            this.distances[index] = newValue;
            if (onSetCallback) onSetCallback(index);
        }
    }

    setTextureOffset(index, textureOffset) {
        this.textureOffsets[index] = textureOffset;
    }

    angle2index(ang) {
        return (Phaser.Math.normalizeAngle(ang) / this.stepAngle)|0;
    }

    angles2indexes(ang1, ang2) {
        let ai1 = Math.round(Phaser.Math.normalizeAngle(ang1) / this.stepAngle);
        let ai2 = Math.round(Phaser.Math.normalizeAngle(ang2) / this.stepAngle);
        if (ai2 < ai1) ai2 += this.steps;
        return [ai1, ai2]
    }

    getAngles() {
        return this.distances.map((dist, i) => ({
            distance: dist,
            angle: i*this.stepAngle
        }))
    }

    fillBitmap(data, index) {
        let total = index + this.steps*4;
        let d1, d2, d3;
        let i = 0;
        for (; index < total; index+=4, i++) {
            //max is 512. rgb max = 256*256*256
            d1 = (this.distances[i]/2)|0;
            data[index] = d1;
            d1 = this.distances[i] - d1*2; //so we get remaining < 2
            d2 = (d1*128)|0;
            data[index+1] = d2;

            data[index+2] = this.textureOffsets[i] === -1 ? 255 : this.textureOffsets[i];
            data[index+3] = 255;
        }
    }


    anglesForSegment(x1, y1, x2, y2) {
        let ang1 = Phaser.Math.normalizeAngle(Math.atan2(y1, x1));
        let ang2 = Phaser.Math.normalizeAngle(Math.atan2(y2, x2));

        if (((ang1 > ang2) && (ang1 - ang2 < Math.PI)) || (ang2 - ang1 >= Math.PI)) {
            let tmp = ang1;
            ang1 = ang2;
            ang2 = tmp;
        }

        if (ang2 < ang1) ang2 += 2*Math.PI;

        return {ang1, ang2};
    }
}