export default class LineShadowCaster {
    constructor(line) {
        this.line = line;

        this._normalFromLight = new Phaser.Point();
        this._directFromLight = new Phaser.Point();

        this._intersectionPoints = [];
    }

    update() {

    }

    fillDistancesMap(lightSource, distancesMap) {
        let intersection = intersectWithCircle(this.line, lightSource.x, lightSource.y, lightSource.radius);
        if (intersection) {
            let {x1, y1, x2, y2} = intersection;
            let {ang1, ang2} = distancesMap.anglesForSegment(x1, y1, x2, y2);
            let [ai1, ai2] = distancesMap.angles2indexes(ang1, ang2);

            this._intersectionPoints = [{x: x1, y: y1}, {x:x2, y:y2}];
            this._normalFromLight.set(x2 - x1, y2 - y1);
            let dist = this._normalFromLight.getMagnitude();

            let distanceFromLightToLine = Math.abs((y2 - y1)*lightSource.x - (x2 - x1)*lightSource.y + x2*y1 - y2*x1)/dist;
            this._normalFromLight.normalRightHand();
            this._normalFromLight.setMagnitude(distanceFromLightToLine);

            this._directFromLight.set(x2 - lightSource.x, y2 - lightSource.y);
            if (this._normalFromLight.dot(this._directFromLight) < 0) {
                this._normalFromLight.multiply(-1, -1);
            }

            distancesMap.fillDistancesForArc(ai1, ai2, this._normalFromLight);
        }
    }
}


//Done according to http://mathworld.wolfram.com/Circle-LineIntersection.html
//Imma lazy
function intersectWithCircle(line, x, y, radius) {
    let dx = line.end.x - line.start.x;
    let dy = line.end.y - line.start.y;
    let dr = Math.sqrt(dx*dx + dy*dy);
    let D = (line.start.x-x) * (line.end.y-y) - (line.end.x-x) * (line.start.y-y);

    let sgndy = dy < 0 ? -1 : 1;

    let discr = radius*radius*dr*dr - D*D;
    if (discr <= 0) {
        return null;
    }
    let sqrtDiscr = Math.sqrt(discr);
    let dr2 = dr*dr;

    let x1 = x + (D*dy + sgndy*dx*sqrtDiscr)/dr2;
    let y1 = y + (-D*dx + Math.abs(dy)*sqrtDiscr)/dr2;
    let x2 = x + (D*dy - sgndy*dx*sqrtDiscr)/dr2;
    let y2 = y + (-D*dx - Math.abs(dy)*sqrtDiscr)/dr2;

    // todo: тут надо не совсем так. вернее не только так. надо еще учитывать если одна точка за пределами отрезка
    let minx = Math.min(x1, x2);
    let maxx = Math.max(x1, x2);
    let miny = Math.min(y1, y2);
    let maxy = Math.max(y1, y2);

    if (maxx < line.left || minx > line.right || maxy < line.top || miny > line.bottom) return null;

    /*if (!window.d) {
        window.d = true;
        console.log(x, y, radius, line.start.x, line.start.y, line.end.x, line.end.y);
        console.log(dx, dy, dr, D, sgndy, discr, sqrtDiscr, dr2, x1, y1, x2, y2);
    }*/

    return {x1, y1, x2, y2};
}