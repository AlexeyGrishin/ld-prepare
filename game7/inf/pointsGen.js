(function(global) {

  const MIN_SIZE = 2;
  const MAX_SIZE = 10;
  const PAD = 0;
  const MAX_COUNT = 8000;
  const ATTEMPTS = 10;

  function pid(p) {
    return p.x + '_' + p.y;
  }

  function inRect(rx, ry, rr, x, y, width, height) {
    return rx >= x && ry >= y && rx < x + width && ry < y + height;
  }

  class InfinitePointsCollection
  {
    //connections is a Map<idx, {idx, rollx, rolly}>
    //points is a Array<{x,y,r}>
    constructor(size, points, connections) {
      this.size = size;
      this.points = points;
      this.connections = connections;
      this.pmap = new Map();
      this.points.forEach((p, pi) => {
        p.id = pid(p);
        this.pmap.set(p.id, p);
        if (this.connections) p.connections = this.connections.get(pi) || [];
      });
    }

    getPointsInsideCircle(x, y, r) {
      let out = this.getPointsInside(x - r, y - r, x + r, y + r);
      let p;
      for (let pi = out.length-1; pi >= 0; pi--) {
        p = out[pi];
        if (Math.hypot(p.x-x, p.y-y) > r) out.splice(pi, 1);
      }
      return out;
    }

    getId(x, y) {
      return pid({x: x%this.size, y: y%this.size});
    }

    getAt(x, y) {
      let id = this.getId(x, y);
      let p = this.pmap.get(id);
      return {x, y, r: p.r, id}
    }

    getPointsInside(x, y, width, height){ //, matcherFn = inRect) {
      let out = [];
      let tx = (x / this.size)|0;
      let ty = (y / this.size)|0;
      let tx2 = ((x+width)/this.size)|0;
      let ty2 = ((y+height)/this.size)|0;


      let p, ttx, tty, rx, ry, pi;
      for (pi = 0; pi < this.points.length; pi++) {
        p = this.points[pi];
        //i have myself for those var names
        for (ttx = tx; ttx <= tx2; ttx++) {
          for (tty = ty; tty <= ty2; tty++) {
            rx = ttx * this.size + p.x;
            ry = tty * this.size + p.y;
            if (rx >= x && ry >= y && rx < x + width && ry < y + height) {
              out.push({x: rx, y: ry, r: p.r, id: p.id});
            }
          }
        }
      }
      return out;
    }

    get(id) {
      return this.pmap.get(id);
    }

    getConnected(id, rx, ry) {
      let p = this.pmap.get(id);
      let out = [];
      for (let {idx, rollx, rolly} of p.connections) {
        let p2 = this.points[idx];
        let p2x = rx + (p2.x - p.x + (rollx||0)* this.size);
        let p2y = ry + (p2.y - p.y + (rolly||0)* this.size);
        out.push({x: p2x, y: p2y, r: p2.r, id: p2.id});
      }
      return out;
    }


    store() {
      return {
        size: this.size,
        points: this.points
      }
    }

    static restore(stored) {
      return new InfinitePointsCollection(stored.size, stored.points);
    }

  }

  function restorePoints3(stored) {
    return InfinitePointsCollection.restore(stored);
  }

  function preparePoints3(textureSize, minR, maxR, pad = 0, addConnections = false, connectionPad = 0) {
    let points = [];
    let connections = addConnections ? new Map() : undefined;

    function addShifted(x, y, r) {
      points.push({
        x: ((x + game.rnd.integerInRange(-2,2)) + textureSize) % textureSize,
        y: ((y + game.rnd.integerInRange(-2,2)) + textureSize) % textureSize,
        r: r
      })
    }

    function hasPointAround (x, y, r, points) {
      for (let p of points) {
        if (Math.hypot(x - p.x,                 y - p.y)                  < p.r + r + pad - 1) return true;
        if (Math.hypot(x - (p.x + textureSize), y - p.y)                  < p.r + r + pad - 1) return true;
        if (Math.hypot(x - p.x,                 y - (p.y + textureSize))  < p.r + r + pad - 1) return true;
        if (Math.hypot(x - (p.x + textureSize), y - (p.y + textureSize))  < p.r + r + pad - 1) return true;
      }
      return false;
    }

    function getPointsAround(tp, allowedDistance = 0) {
      let pi = 0;
      let out = [];
      let {x,y,r} = tp;
      for (let p of points) {
        if (p === tp) {
          pi++;
          continue;
        }
        for (let rollx = -1; rollx <= 1; rollx++) {
          for (let rolly = -1; rolly <= 1; rolly++) {
            if (Math.hypot(x - (p.x + rollx*textureSize), y - (p.y + rolly*textureSize))  < p.r + r + pad - 1 + allowedDistance) {
              out.push({idx: pi, rollx, rolly});
            }
          }
        }
        pi++;
      }
      return out;
    };

    //first, setup edge points. randomize them a bit.
    let r = game.rnd.integerInRange(minR, maxR);
    let cornerR = r;
    let x = 0;
    let y = 0;

    addShifted(x, y, r);
    while (x < textureSize) {
      x += r;
      r = game.rnd.integerInRange(minR, maxR);
      x += r + pad;
      if (x >= textureSize) break;
      addShifted(x, y, r);
    }
    x = 0;
    r = cornerR;
    while (y < textureSize) {
      y += r;
      r = game.rnd.integerInRange(minR, maxR);
      y += r + pad;
      if (y >= textureSize) break;
      addShifted(x, y, r);
    }

    //now, run generation of rest points
    let maxAttempts = 10000;
    var p, i, angle, nx, ny, pi = 0;
    const ATTEMPTS_AROUND = 10;

    while (maxAttempts-->0 && points.length < 10000 && pi < points.length) {
      p = points[pi];
      r = game.rnd.integerInRange(minR, maxR);
      for (i = 0; i < ATTEMPTS_AROUND; i++) {
        angle = game.rnd.realInRange(0, Math.PI*2);
        nx = (p.x + Math.cos(angle)*(p.r + r + pad) + textureSize) % textureSize;
        ny = (p.y + Math.sin(angle)*(p.r + r + pad) + textureSize) % textureSize;

        //if (nx < 0 || ny  < 0 ) continue;
        if (isNaN(nx)) {
          throw new Error("nx is nan")
        }
        if (!hasPointAround(nx, ny, r, points)) {
          points.push({x: nx, y: ny, r});
        }
      }
      pi++;
    }

    for (p of points) {
      p.x = p.x|0;
      p.y = p.y|0;
      p.r = p.r|0;
    }

    if (addConnections) {
      points.forEach((p1, pi1) => {
        let cons = getPointsAround(p1, connectionPad);
        connections.set(pi1, cons);
      });
    }

    return new InfinitePointsCollection(textureSize, points, connections);
  }

  function preparePoints2(fieldSize, cellSize, minR, maxR, pad = 0, insidePoints = []) {
    let points = [];
    let gridSize = Math.ceil(fieldSize / cellSize);
    let maxAttempts = 10000;
    const ATTEMPTS_AROUND = 10;

    function hasPointAround(x, y, r, points) {
      for (let p of points) {
        if (Math.abs(x - p.x) > p.r + r + pad && Math.abs(y - p.y) > p.r + r + pad) continue;
        if (Math.hypot(x - p.x, y - p.y) < p.r + r + pad - 1) return true;
      }
      if (insidePoints && insidePoints.length) {

        for (let bigPoint of insidePoints) {
          if (Math.hypot(x - bigPoint.x, y - bigPoint.y) <= bigPoint.r - r + 2) return false;
        }
        return true;
      }
      return false;
    }

    let x, y;
    if (insidePoints.length) {
      x = insidePoints[0].x + game.rnd.integerInRange(minR, maxR);
      y = insidePoints[0].y + game.rnd.integerInRange(minR, maxR);
    } else {
      x = game.rnd.integerInRange(maxR, fieldSize - 1 - maxR);
      y = game.rnd.integerInRange(maxR, fieldSize - 1 - maxR);
    }
    points.push({x,y,r:maxR, frozen: false});

    var r, p, i, angle, nx, ny, addedSomething, somethingNotFrozen = true, toAdd = [], pi = 0;

    while (maxAttempts-->0 && somethingNotFrozen && points.length < 10000 && pi < points.length) {
      p = points[pi];
      r = game.rnd.integerInRange(minR, maxR);
      toAdd = [];
      addedSomething = false;
      for (i = 0; i < ATTEMPTS_AROUND; i++) {
        angle = game.rnd.realInRange(0, Math.PI*2);
        nx = p.x + Math.cos(angle)*(p.r + r + pad);
        ny = p.y + Math.sin(angle)*(p.r + r + pad);
        if (nx - r < 0 || nx + r >= fieldSize || ny - r < 0 || ny + r > fieldSize) continue;
        if (isNaN(nx)) {
          throw new Error("nx is nan")
        }
        if (/*!hasPointAround(nx, ny, r, toAdd) && */!hasPointAround(nx, ny, r, points)) {
          points.push({x: nx, y: ny, r, frozen: false});
          addedSomething = true;
        }
      }
      //if (!addedSomething) {
      p.frozen = true;
      //}
      pi++;
    }



    for (p of points) {
      p.x = p.x|0;
      p.y = p.y|0;
      p.r = p.r|0;
      delete p.frozen;
    }
    return points;
  }

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


  function debugPoints(bitmap1, points, color = 'red') {
    bitmap1.ctx.fillStyle = color;
    bitmap1.ctx.beginPath();
    for (let {x,y,r} of points) {
      bitmap1.ctx.arc(x, y, r, 0, Math.PI*2);
      bitmap1.ctx.closePath();
    }
    bitmap1.ctx.fill();
  }

  function debugPoints3(bitmap1, infPoints, color = 'red') {
    bitmap1.ctx.fillStyle = color;
    bitmap1.ctx.beginPath();
    let points = infPoints.getPointsInside(0, 0, bitmap1.width, bitmap1.height);
    for (let {x,y,r} of points) {
      bitmap1.ctx.moveTo(x, y);
      bitmap1.ctx.arc(x, y, r, 0, Math.PI*2);
    }
    bitmap1.ctx.fill();
    if (infPoints.connections) {
      bitmap1.ctx.strokeStyle = 'black';
      bitmap1.ctx.beginPath();
      for (let p of points) {
        for (let p2 of infPoints.getConnected(p.id, p.x, p.y)) {
          bitmap1.ctx.moveTo(p.x, p.y);
          bitmap1.ctx.lineTo(p2.x, p2.y);
        }
      }
      bitmap1.ctx.closePath();
      bitmap1.ctx.stroke();
    }
  }

  global.debugPoints = debugPoints;
  global.debugPoints3 = debugPoints3;
  global.preparePoints = preparePoints;

  global.preparePoints2 = preparePoints2;
  global.preparePoints3 = preparePoints3;
  global.restorePoints3 = restorePoints3;

})(window);