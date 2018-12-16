export default class HypTable {

    constructor(steps, stepAngle = 2*Math.PI/steps) {
        this.perAngleStep = [1];
        for (let i = 1; i < steps/4; i++) { //не надо больше pi/2
            let ang = i*stepAngle;
            this.perAngleStep[i] = 1/Math.cos(ang);
        }
        this.stepAngle = stepAngle;
    }

    //normal shall be a) from light to surface b) has valid length
    fillDistancesForArc(distancesMap, ai1, ai2, normal, onSetCallback) {
        const D = normal.getMagnitude();
        const normalAngle = Phaser.Math.normalizeAngle(Math.atan2(normal.y, normal.x)); //baseline
        const normalAngleI = (normalAngle / this.stepAngle)|0; //from 0 to Detailed_steps
        const count = ai2 - ai1 + 1;
        let ai;
        let onDistanceSetCallback = undefined;
        for (let dai = 0; dai < count; dai++) {
            ai = ai1 + dai;
            if (onSetCallback) {
                onDistanceSetCallback = (index) => onSetCallback(index, D*Math.tan(ai*this.stepAngle - normalAngle), ai*this.stepAngle, normalAngle)

            }
            distancesMap.set(ai, D*this.perAngleStep[Math.abs(distancesMap.minus(ai, normalAngleI))], onDistanceSetCallback);
        }
    }
}