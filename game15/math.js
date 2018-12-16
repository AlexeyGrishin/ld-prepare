export function intersectsLineWithCircle(line, x, y, radius, radius2 = radius*radius) {
    let dx = line.end.x - line.start.x;
    let dy = line.end.y - line.start.y;
    let dr2 = dx*dx + dy*dy;
    let D = (line.start.x-x) * (line.end.y-y) - (line.end.x-x) * (line.start.y-y);

    let sgndy = dy < 0 ? -1 : 1;

    let discr = radius2*dr2 - D*D;
    if (discr <= 0) {
        return false;
    }
    let sqrtDiscr = Math.sqrt(discr);

    let x1 = x + (D*dy + sgndy*dx*sqrtDiscr)/dr2;
    let y1 = y + (-D*dx + Math.abs(dy)*sqrtDiscr)/dr2;
    let x2 = x + (D*dy - sgndy*dx*sqrtDiscr)/dr2;
    let y2 = y + (-D*dx - Math.abs(dy)*sqrtDiscr)/dr2;

    return pointOnSegment(line, x1, y1) || pointOnSegment(line, x2, y2);
}

//Phaser's pointOnSegment does not use epsilon for range checks
export function pointOnSegment(line, x, y, epsilon = 0.01) {
    let xMin = Math.min(line.start.x, line.end.x);
    let xMax = Math.max(line.start.x, line.end.x);
    let yMin = Math.min(line.start.y, line.end.y);
    let yMax = Math.max(line.start.y, line.end.y);

    return (line.pointOnLine(x, y, epsilon) && (x >= xMin - epsilon && x <= xMax + epsilon) && (y >= yMin - epsilon && y <= yMax + epsilon));
}