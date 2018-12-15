export default class LineShadowCaster {
    constructor(line) {
        this.line = line;

        this._normalFromLight = new Phaser.Point();
        this._directFromLight = new Phaser.Point();

        this._intersectionPoints = [];

        this.tmpLine = new Phaser.Line();
    }

    update() {

    }

    fillDistancesMap(lightSource, distancesMap) {
        let intersection = intersectWithCircle(this.line, lightSource.x, lightSource.y, lightSource.radius, this.tmpLine);
        if (intersection) {
            let {x1, y1, x2, y2, distanceFromLightToLine} = intersection;
            let {ang1, ang2} = distancesMap.anglesForSegment(x1, y1, x2, y2);
            let [ai1, ai2] = distancesMap.angles2indexes(ang1, ang2);

            this._intersectionPoints = [{x: x1, y: y1}, {x:x2, y:y2}];
            this._normalFromLight.set(x2 - x1, y2 - y1);

            this._normalFromLight.normalRightHand();
            this._normalFromLight.setMagnitude(distanceFromLightToLine);

            this._directFromLight.set(x2 - lightSource.x, y2 - lightSource.y);
            if (this._normalFromLight.dot(this._directFromLight) < 0) {
                this._normalFromLight.multiply(-1, -1);
            }

            distancesMap.fillDistancesForArc(ai1, ai2, this._normalFromLight);
        } else {
            this._intersectionPoints = [];
        }
    }
}

//Done according to http://mathworld.wolfram.com/Circle-LineIntersection.html
//Imma lazy
function intersectWithCircle(line, x, y, radius, tmpLine) {
    let dx = line.end.x - line.start.x;
    let dy = line.end.y - line.start.y;
    let dr2 = dx*dx + dy*dy;
    let dr = Math.sqrt(dr2);
    let D = (line.start.x-x) * (line.end.y-y) - (line.end.x-x) * (line.start.y-y);

    let distanceFromLightToLine = Math.abs(D)/dr;
    if (distanceFromLightToLine >= radius) return null;

    let sgndy = dy < 0 ? -1 : 1;

    let discr = radius*radius*dr2 - D*D;
    if (discr <= 0) {
        return null;
    }
    let sqrtDiscr = Math.sqrt(discr);

    let x1 = x + (D*dy + sgndy*dx*sqrtDiscr)/dr2;
    let y1 = y + (-D*dx + Math.abs(dy)*sqrtDiscr)/dr2;
    let x2 = x + (D*dy - sgndy*dx*sqrtDiscr)/dr2;
    let y2 = y + (-D*dx - Math.abs(dy)*sqrtDiscr)/dr2;

    let newdx = x2 - x1;
    let newdy = y2 - y1;

    //dot product
    if (newdx*dx + newdy*dy < 0) {
        //need to reverse
        let tmpx = x1, tmpy = y1;
        x1 = x2; y1 = y2;
        x2 = tmpx; y2 = tmpy;
    }

    //now we have old line and new line having same direction.
    tmpLine.start.set(x1, y1);
    tmpLine.end.set(x2, y2);

    let outside = true;
    if (tmpLine.pointOnSegment(line.start.x, line.start.y, 0.01)) {
        x1 = line.start.x;
        y1 = line.start.y;
        outside = false;
    }
    if (tmpLine.pointOnSegment(line.end.x, line.end.y, 0.01)) {
        x2 = line.end.x;
        y2 = line.end.y;
        outside = false;
    }
    if (line.pointOnSegment(x1, y1, 0.01) || line.pointOnSegment(x2, y2, 0.01)) {
        outside = false;
    }
    /*if (!window.d) {
        window.d = true;
        console.log(line.start.x, line.start.y, line.end.x, line.end.y);
        console.log(tmpLine.pointOnSegment(600, 640, 0.0001));
        console.log(x1, y1, x2, y2);
        console.log(outside);
    }*/

    if (outside) return null;


    // todo: тут надо не совсем так. вернее не только так. надо еще учитывать если одна точка за пределами отрезка
    /*let minx = Math.min(x1, x2);
    let maxx = Math.max(x1, x2);
    let miny = Math.min(y1, y2);
    let maxy = Math.max(y1, y2);

    if (maxx < line.left || minx > line.right || maxy < line.top || miny > line.bottom) return null;
*/

    return {x1, y1, x2, y2, distanceFromLightToLine};
}