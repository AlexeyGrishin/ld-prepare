function preload() {
  game.time.advancedTiming = true;
  //game.load.image('low_infection', 'low_infection.png');
  //game.load.image('circle_infection', 'circle_infection.png');
  game.load.image('noise', 'noise.png');

}



let options = initOptions({
  cachedPointsList: ["boolean", true],
  debugPointsList: ["boolean", false],
  debugGrid: ["boolean", false],
  spawnDelay: ["int", 1000],
  showGrid: ["boolean", false],
  autoUpdate: ["boolean", true],
  useShaders: ["boolean", true]
});

const SIZE = 256;
const PIX = 12;

const ALPHA_MODE = null;//'darken';

/*
todo: think about approach. pack all in texture

r|g --> type + number of point (64k... how that will be enough. if not - may use 2-4 bits of blue)
  no need of type - 3 different textures will be used (seems so...)
blue --> distance from center (4bits, 1-16 shall be enough)


shader
 in texture
 in points -> {createdAt, destroyedAt}

 if (createdAt > destroyedAt) {
  //render creation or created state
 } else {
  //render deletion or nothing
 }


 */

/*
  todo: another approach.

  generate only small pupirkas. grow only small pupirkas.
  unite them dynamically
  generate black field around them dynamically
    on grow - before growing generate black circle, then grow into it
    when destroyed - black circle is reduced to keep some distance
    like that
        smallEye.growing = {...}
        ....
        well, not sure how to achieve that

 */

let spritesPerSize = new Map();
let MAX_SIZE = 32;
let multiBitmap;

function prepareInfectionSprites() {

  if (spritesPerSize.size != 0) return;

  let sprites = [];

  [[1,0], [2,0], [3, 0], [4, 0], [5, 0], [6, 1], [7,1], [8,2], [9,2], [10,2], [11,2],[12,2]/*,[13,2],[14,3],[15,3],[16,3]*/].forEach(([r, d]) => {
    for (let si = 0; si < 2; si++) {
      sprites.push(createCircleSprites(r, d, 0, 2));
    }
    spritesPerSize.set(r, []);
  });
  multiBitmap = createMultiBitmap(MAX_SIZE, sprites, true);
  //game.add.sprite(512, 0, multiBitmap.bitmap);

  for (let size of spritesPerSize.keys()) {
    spritesPerSize.set(size, multiBitmap.find(size));
  }

}


function getSprite(size) {
  return game.rnd.pick(spritesPerSize.get(size));
}


function createInfectionController2(size, pix, infBC, infBE, infSE) {

  prepareInfectionSprites();

  let grid = [];
  for (let i = 0; i < size/pix;i++) {
    let row = [];
    grid.push(row);
    for (let j = 0; j < size/pix;j++) {
      row.push([]);
    }
  }

  let bigCircles = [];
  let smallEyes = [];
  let bigEyes = [];

  let existMap = new Map();



  function initSmallEyes(bc) {
    if (bc.smallEyes) return;
    bc.smallEyes = [];
    let found = infSE.getPointsInsideCircle(bc.x, bc.y, bc.r);
    //console.log('se', found.length);
    for (let se of found) {
      let sid = 'se_' + se.x + '_' + se.y;
      if (!existMap.has(sid)) {
        existMap.set(sid, true);
        bc.smallEyes.push(se);
        se.parent = bc;
        se.step = 0;
        se.id = sid;
        se.sprite = getSprite(se.r);
      }
    }
  }
  function initBigEyes(bc) {
    if (bc.bigEyes) return;
    bc.bigEyes = [];
    for (let be of infBE.getPointsInsideCircle(bc.x, bc.y, bc.r)) {
      let bid = 'be_' + be.x + '_' + be.y;
      if (!existMap.has(bid)) {
        existMap.set(bid, true);
        bc.bigEyes.push(be);
        be.parent = bc;
        be.step = 0;
        be.id = bid;
        be.sprite = getSprite(be.r);
      }
    }
  }

  function initBigCircle({x, y}) {
    if (x < 0 || y < 0 || x >= size || y >= size) return undefined;
    let id = 'bc_' + x + '_' + y;
    let bc = existMap.get(id);
    if (bc) return bc;

    bc = new BigCircle(infBC.getAt(x, y));

    //bc.state = {};
    //bc.cells = [];
    bc.fullId = id;
    for (let gx = ((x - bc.r)/pix)|0; gx <= ((x + bc.r)/pix)|0; gx++) {
      for (let gy = ((y - bc.r)/pix)|0; gy <= ((y + bc.r)/pix)|0; gy++) {
        if (gx < 0 || gy < 0 || gx >= grid[0].length || gy >= grid.length) continue;
        grid[gy][gx].push(bc);
        bc.cells.push({gx,gy});
      }
    }


    existMap.set(id, bc);
    bigCircles.push(bc);
    return bc;
  }

  function initAroundCircles(bc) {
    if (!bc.around) {
      bc.around = infBC.getConnected(bc.id, bc.x, bc.y).map(initBigCircle).filter(c => c);
    }

  }


  let bigCirclesBitmap = game.add.bitmapData(size, size);
  bigCirclesBitmap.sprite = game.add.sprite(0, 0, bigCirclesBitmap);
  let smallEyesBitmap = game.add.bitmapData(size, size);
  smallEyesBitmap.sprite = game.add.sprite(0, 0, smallEyesBitmap);

  let noiseSprite = game.add.sprite(-1000,-1000, 'noise');

  let infShader = new LowInfection(game);
  //let infTextureSprite = game.add.sprite(-100,-100, 'low_infection');
  //infShader.uniforms.iChannel0.value = infTextureSprite.texture;
  infShader.uniforms.iChannel1.value = noiseSprite.texture;
  infShader.uniforms.iChannel1.textureData = {nearest: true};
  //infShader.uniforms.textureSize.value = {x: infTextureSprite.width, y: infTextureSprite.height};
  infShader.uniforms.resolution.value = {x: game.world.width, y: game.world.height};

  if (options.useShaders) bigCirclesBitmap.sprite.filters = [infShader];

  let breShader = new Breathing(game);
  //let breTextureSprite = game.add.sprite(-100,-100, 'circle_infection');
  //breShader.uniforms.iChannel0.value = breTextureSprite.texture;
  //breShader.uniforms.iChannel0.textureData = {nearest: true};
  breShader.uniforms.iChannel1.value = noiseSprite.texture;
  breShader.uniforms.iChannel1.textureData = {nearest: true};
  //breShader.uniforms.textureSize.value = {x: breTextureSprite.width, y: breTextureSprite.height};
  breShader.uniforms.resolution.value = {x: game.world.width, y: game.world.height};

  if (options.useShaders) smallEyesBitmap.sprite.filters = [breShader];

  const NONE = "none";
  const GROWING = "grow.grow";

  const SMALL_EYES_GROWING = "grow.small_eyes";
  const BIG_EYES_GROWING = "grow.big_eyes";
  const IDLE = "idle";

  const DESTROYING = "destroying";
  const DESTROYED = "destroyed";

  const MAX_SMALL_EYES_GROWING = 1000;

  let circlesByState = new Map();
  for (let state of [NONE, DESTROYING, DESTROYED, GROWING, SMALL_EYES_GROWING, BIG_EYES_GROWING, IDLE]) {
    circlesByState.set(state, []);
  }

  class BigCircle {

    constructor(circle) {
      this.x = circle.x;
      this.y = circle.y;
      this.r = circle.r;
      this.id = circle.id;

      this.step = 0;
      this.smallEyes = undefined;
      this.bigEyes = undefined;
      this.around = undefined;

      this.cells = [];
      this.state = null;
      this.expectedGrowState = null;

      this.setState(NONE);
    }

    clearSmallEyes() {
      if (!this.smallEyes) return;
      for (let se of this.smallEyes) existMap.delete(se.id);
      this.smallEyes = undefined;
    }


    clearBigEyes() {
      if (!this.bigEyes) return;
      for (let se of this.bigEyes) existMap.delete(se.id);
      this.bigEyes = undefined;
    }

    setState(newState) {
      if (this.state) {
        let lst = circlesByState.get(this.state);
        lst.splice(lst.indexOf(this), 1);
      }
      this.expectedGrowState = null;
      switch (newState) {
        case GROWING:
          this.step = 0;
          this.clearSmallEyes();
          this.clearBigEyes();
          break;
        case SMALL_EYES_GROWING:
          this.step = 0;
          this.clearBigEyes();
          initSmallEyes(this);
          break;
        case BIG_EYES_GROWING:
          this.step = 0;
          this.clearSmallEyes();
          initBigEyes(this);
          break;
        case IDLE:
          if (this.state === GROWING) {
            this.expectedGrowState = SMALL_EYES_GROWING;
          } else if (this.state === SMALL_EYES_GROWING) {
            this.expectedGrowState = BIG_EYES_GROWING;
          }
          this.clearBigEyes();
          this.clearSmallEyes();
          break;
        case DESTROYING:
          this.clearSmallEyes();
          this.clearBigEyes();
          break;
      }
      this.state = newState;
      circlesByState.get(this.state).push(this);
    }

    get exists() {
      return this.state !== NONE && this.state !== DESTROYED && this.state !== DESTROYING && this.state !== GROWING;
    }

    destroy() {
      this.setState(DESTROYING);
      this.cooldown = 300;
    }

    update() {
      if (this.state === DESTROYED) {
        this.cooldown--;
      }
    }

    get canGrow() {
      return this.state === NONE || (this.state === DESTROYED && this.cooldown <= 0);
    }

    get canRegrow() {
      return this.state === IDLE;
    }

    doGrow(from) {
      this.setState(GROWING);
      this.from = from;
      this.step = from ? 0 : BE_GROW;
    }
  }

  const BC_MOVE = 10;
  const BC_GROW = 10;
  const BE_GROW = 10;
  const SE_GROW = 10;



  const MS_PER_STEP = 1000 / 120;


  function drawCircle(ctx, x, y, r) {
    if ((r|0) === 0) return;
    ctx.moveTo(x|0, y|0);
    ctx.arc(x|0, y|0, r|0, 0, Math.PI*2);
  }

  function drawSprite(ctx, sprite, x, y, r, relStep, mode) {
    if ((r|0) === 0 || relStep == 0) return;
    multiBitmap.drawFrame(ctx, sprite, ((multiBitmap.getFrames(sprite)-1)*relStep)|0, x, y, mode);
  }

  let onUpdateGrid = (gx, gy, infected) => {};
  let isGridFree = (gx, gy) => true;

  return {

    getEntitiesCount() {
      return existMap.size;
    },

    getEntitiesStats() {
      let bcc = bigCircles.length;
      let bec = 0, sec = 0;
      for (let bc of bigCircles) {
        if (bc.smallEyes) sec += bc.smallEyes.length;
        if (bc.bigEyes) bec += bc.bigEyes.length;
      }
      let perState = {};
      for (let [k,v] of circlesByState) perState[k] = v.length;
      return `${bcc} circles, ${bec} big eyes, ${sec} small eyes, ${JSON.stringify(perState)}`;
    },

    onUpdate(fn) {
      onUpdateGrid = fn;
    },

    setGridChecker(fn) {
      isGridFree = fn;
    },

    growAt(gx, gy) {
      infBC.getPointsInside(gx*pix, gy*pix, pix, pix).forEach(initBigCircle);
      for (let c1 of grid[gy][gx]) {
        this.tryGrow(c1);
        initAroundCircles(c1);
      }
      this.updateGridCell(gx, gy);
      //console.log(bigCircles);
    },


    updateGridCells(p) {
      if (p.parent) return this.updateGridCells(p.parent);
      p.cells.forEach(({gx,gy}) => this.updateGridCell(gx, gy));
    },

    updateGridCell(gx, gy) {
      let isFree = true;
      for (let c1 of grid[gy][gx]) {
        if (c1.exists) {isFree = false; break;}
      }
      onUpdateGrid(gx, gy, !isFree)
    },


    collide(x, y, colRadius) {
      //for simplifying - collide by grid. and only by center.
      let gx = (x/pix)|0;
      let gy = (y/pix)|0;
      if (grid[gy] && grid[gy][gx]) {
        return grid[gy][gx].length;
      }
    },

    explode(x, y, expRadius) {
      let circles = [];

      for (let gx =( ((x-expRadius)/pix)|0); gx <= (((x+expRadius)/pix)|0); gx++) {
        if (gx < 0 || gx >= grid[0].length) continue;
        for (let gy = ( ((y - expRadius) / pix) | 0); gy <= (((y + expRadius) / pix)|0); gy++) {
          if (gy < 0 || gy >= grid.length) continue;
          for (let c of grid[gy][gx]) {
            if (Math.hypot(c.x - x, c.y - y) <= expRadius) {
              circles.push(c);
            }
          }
        }
      }
      for (let bc of circles) {
        bc.destroy();
      }
    },

    growAll() {
      for (let c1 of bigCircles) {
        if (c1.exists) {
          initAroundCircles(c1);
          for (let c2 of c1.around) {
            if (c2.canGrow && this.canGrow(c2)) {
              this.tryGrow(c2, c1);
            }
          }
        }
      }
    },

    tryGrow(bigCircle, from) {
      if (bigCircle.canGrow) {
        bigCircle.doGrow(from);
      }
    },

    canGrow(bigCircle) {
      return bigCircle.cells.every(({gx,gy}) => isGridFree(gx, gy));
    },

    update() {
      let initedSmallCircles = circlesByState.get(SMALL_EYES_GROWING).length;
      for (let c1 of bigCircles) {
        c1.update();

        if (c1.state === IDLE && initedSmallCircles < MAX_SMALL_EYES_GROWING) {

          if (c1.expectedGrowState === SMALL_EYES_GROWING) {
            c1.setState(SMALL_EYES_GROWING);
            initedSmallCircles++;
          } else if (c1.expectedGrowState === BIG_EYES_GROWING) {
            let allAroundFilled = c1.around && c1.around.every(c2 => c2.exists);
            if (allAroundFilled) {
              c1.setState(BIG_EYES_GROWING);
              initedSmallCircles++;
            }
          }
        }

        /*
        if (!c1.smallEyes && c1.state.growing && !c1.state.growing.frozen && initedSmallCircles < 2) {
          initSmallEyes(c1);
          initedSmallCircles++;
        }
        if (c1.state.growing && c1.state.growing.done && c1.smallEyes && !c1.state.destroying) {
          let allAroundFilled = c1.around && c1.around.every(c2 => c2.state.growing && c2.state.growing.done);
          let allSmallGrown = true;
          let allBigGrown = true;
          for (let c3 of c1.smallEyes) {
            if (!c3.state.growing) {
              c3.state.growing = {step: game.rnd.integerInRange(-10, 0)};
            }
            allSmallGrown = allSmallGrown && c3.state.growing.done;
          }
          for (let c2 of c1.bigEyes) {
            if (allAroundFilled && allSmallGrown && !c2.state.growing) {
              //here goes merging into big eye
              c2.state.growing = {step: 0};
            }
            allBigGrown = allBigGrown && c2.state.growing && c2.state.growing.done;
          }
          if (allAroundFilled && allBigGrown && c1.smallEyes) {
            for (let se of c1.smallEyes) existMap.delete(se.id);
            for (let be of c1.bigEyes) existMap.delete(be.id);
            delete c1.smallEyes;
            delete c1.bigEyes;
            c1.state.growing.frozen = true;
          }
        }*/
      }
      if (options.useShaders) {
        breShader.update();
        infShader.update();
      }
    },


    render() {
      if (bigCirclesBitmap._dirty) {
        bigCirclesBitmap.dirty = true;
        bigCirclesBitmap._dirty = false;
      } else if (smallEyesBitmap._dirty) {
        smallEyesBitmap.dirty = true;
        smallEyesBitmap._dirty = false;
      } else {
        this.renderBigCircles();
        this.renderSmallEyes();
        this.renderBigEyes();
      }
    },

    renderBigCircles() {
      bigCirclesBitmap.ctx.fillStyle = 'black';
      bigCirclesBitmap.ctx.beginPath();
      let drawnBigCircle = false;
      for (let c1 of circlesByState.get(GROWING)) {
        if (c1.step < BC_MOVE) {
          let step = 0.5 + 0.6 * (c1.step / BC_MOVE);
          drawCircle(bigCirclesBitmap.ctx,
            (c1.from.x + step * (c1.x - c1.from.x))|0,
            (c1.from.y + step * (c1.y - c1.from.y))|0,
            1);
        } else {
          drawCircle(bigCirclesBitmap.ctx, c1.x, c1.y, ((c1.step-BC_MOVE)/(BC_GROW)*(c1.r))|0);
        }

        drawnBigCircle = true;
        c1.step += game.time.physicsElapsedMS / MS_PER_STEP;
        if (c1.step > BC_GROW + BC_MOVE) {
          c1.setState(IDLE);
          this.updateGridCells(c1);
        }
      }
      if (drawnBigCircle) {
        bigCirclesBitmap.ctx.fill();
        bigCirclesBitmap._dirty = true;
      }

      let removedBigCircle = false;
      bigCirclesBitmap.ctx.beginPath();
      bigCirclesBitmap.ctx.globalCompositeOperation = 'destination-out';
      smallEyesBitmap.ctx.globalCompositeOperation = 'destination-out';
      smallEyesBitmap.ctx.beginPath();
      for (let c1 of circlesByState.get(DESTROYING)) {
        drawCircle(bigCirclesBitmap.ctx, c1.x, c1.y, c1.r+3);
        drawCircle(smallEyesBitmap.ctx, c1.x, c1.y, c1.r+3);
        if (c1.around) {
          for (let c2 of c1.around) {
            this.regrow(c2);
          }
        }
        c1.setState(DESTROYED);
        this.updateGridCells(c1);
        removedBigCircle = true;

      }
      if (removedBigCircle) {
        bigCirclesBitmap.ctx.fill();
        bigCirclesBitmap._dirty = true;
        smallEyesBitmap.ctx.fill();
        smallEyesBitmap._dirty = true;
      }
      bigCirclesBitmap.ctx.globalCompositeOperation = 'source-over';
      smallEyesBitmap.ctx.globalCompositeOperation = 'source-over';

    },

    regrow(bigCircle) {
      if (bigCircle.canRegrow) {
        bigCircle.doGrow();
      }
    },

    renderSmallEyes() {
      smallEyesBitmap.ctx.fillStyle = 'red';
      smallEyesBitmap.ctx.beginPath();
      let drawn = false;
      for (let c0 of circlesByState.get(SMALL_EYES_GROWING)) {
        let updatedSomething = false;
        for (let c1 of c0.smallEyes) {
          if (c1.step <= BC_GROW) {
            if (c1.step >= 0) {
              drawSprite(smallEyesBitmap, c1.sprite, c1.x, c1.y, c1.r, (c1.step) / (BC_GROW), ALPHA_MODE);
              drawn = true;
            }
            c1.step += game.time.physicsElapsedMS / MS_PER_STEP;
            updatedSomething = true;
          }
        }
        if (!updatedSomething) {
          c0.setState(IDLE);
        }
      }
      if (drawn) {
        //smallEyesBitmap.ctx.fill();
        smallEyesBitmap._dirty = true;
      }

    },

    renderBigEyes() {
      let drawn = false;
      for (let c0 of circlesByState.get(BIG_EYES_GROWING)) {
        let updatedSomething = false;
        for (let c1 of c0.bigEyes) {
          if (c1.step <= BE_GROW) {
            if (c1.step >= 0) {
              drawSprite(smallEyesBitmap, c1.sprite, c1.x, c1.y, c1.r, (c1.step) / (BE_GROW), ALPHA_MODE);
              drawn = true;
            }
            c1.step += game.time.physicsElapsedMS / MS_PER_STEP;
            updatedSomething = true;
          }
        }
        if (!updatedSomething) {
          c0.setState(IDLE);
        }
      }
      if (drawn) {
        smallEyesBitmap._dirty = true;
      }
    }



  }

}

function createNoise(pix, dpi = 1) {
  let COUNT = 10;
  let PROP = 1;//0.6;
  let R = 100, G = 100, B = 100;
  let c = document.createElement('canvas');
  c.width = pix * COUNT;
  c.height = pix * COUNT;
  let ctx = c.getContext('2d');
  for (let x = 0; x < COUNT; x++) {
    for (let y = 0; y < COUNT; y++) {
      let id = ctx.getImageData(x*PIX, y*PIX, PIX, PIX);
      for (let px = 0; px < PIX; px += dpi) {
        for (let py = 0; py < PIX; py += dpi) {
          let dist = 1 - Math.hypot(px-PIX/2, py-PIX/2) / Math.hypot(PIX,PIX);
          dist = Math.pow(dist, 4);
          let hasPixel = game.rnd.frac() < PROP*dist;
          if (hasPixel) {
            for (let dx = 0; dx < dpi; dx++) {
              for (let dy = 0; dy < dpi; dy++) {
                let i = (py+dy)*4*PIX + (px+dx)*4;
                id.data[i]   = R;
                id.data[i+1] = G;
                id.data[i+2] = B;
                id.data[i+3] = 255;

              }
            }
          }
        }
      }
      ctx.putImageData(id, x*PIX, y*PIX);
    }
  }
  return c;
}


var grid, debugBitmap;

function create() {

  document.body.appendChild(createNoise(PIX, 2));

  game.rnd.sow([1]);
  grid = new Grid(SIZE/PIX, SIZE/PIX);
  game.stage.backgroundColor = '#cccccc';

  debugBitmap = drawDebugGrid();
  let points1, points2, points3;
  if (options.cachedPointsList) {
    points1 = restorePoints3(window.P.P1);
    points2 = restorePoints3(window.P.P2);
    points3 = restorePoints3(window.P.P3);
  } else {
    /*
    points1 = preparePoints3(64, 4, 6, -3, true);
    console.log('p1 generated');
    points2 = preparePoints3(32, 3, 4, -1);
    console.log('p2 generated');
    points3 = preparePoints3(32, 1, 2, 1);
    console.log('p3 generated');
    */
    points1 = preparePoints3(128, 8, 10, -7, true, 9);
    console.log('p1 generated');
    points2 = preparePoints3(64, 4, 7, 3);
    console.log('p2 generated');
    points3 = preparePoints3(32, 2, 3, 1);
    console.log('p3 generated');
    //console.log('window.P = ' + JSON.stringify({P1: points1.store(), P2: points2.store(), P3: points3.store()}) + ';');
  }



  if (options.debugPointsList) {
    debugPoints3(debugBitmap, points1, 'red');
    debugPoints3(debugBitmap, points2, 'blue');
    debugPoints3(debugBitmap, points3, 'green');
  }

  controller = createInfectionController2(SIZE, PIX, points1, points2, points3);

  controller.onUpdate((gx, gy, infected) => {
    grid.set(gx, gy, infected ? {i: true} : null);
  });
  controller.setGridChecker((gx, gy) => {
    if (gx < 0 || gy < 0 || gx > SIZE/PIX || gy > SIZE/PIX) return false;

    if (gx >= 10 && gy >= 10 && gx <= 11 && gy <= 11) return false;
    return true;
  });

  //grid.set(8,1, {i:true});
  //grid.set(9,1, {i:true});

  controller.growAt(8, 2);
  controller.growAt(8, 1);
  controller.growAt(8, 3);
  controller.growAt(9, 2);
  controller.growAt(7, 2);
  controller.growAt(8, 8);

  buttons = {
    Z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
    X: game.input.keyboard.addKey(Phaser.Keyboard.X),
    C: game.input.keyboard.addKey(Phaser.Keyboard.C)
  };

  game.world.bringToTop(debugBitmap.sprite);
}


var buttons, controller;

function drawDebugGrid() {
  let debugBm = game.add.bitmapData(SIZE, SIZE);
  let debugSprite = game.add.sprite(0, 0, debugBm);
  debugSprite.alpha = 0.3;
  debugBm.ctx.strokeStyle = 'gray';
  if (options.showGrid) {
    for (let gx = 0; gx < SIZE; gx += PIX) {
      debugBm.ctx.moveTo(gx, 0);
      debugBm.ctx.lineTo(gx, SIZE);
      debugBm.ctx.moveTo(0, gx);
      debugBm.ctx.lineTo(SIZE, gx)
    }
    debugBm.ctx.stroke();
  }
  debugBm.sprite = debugSprite;
  return debugBm;
}
function update() {
  let gx = (game.input.activePointer.x / PIX) | 0, gy = (game.input.activePointer.y / PIX) | 0;
  if (buttons.Z.justDown) {
    controller.growAt(gx, gy);
    //grid.set(gx, gy, {i: true});
  }
  if (buttons.X.justDown) {
    controller.explode(game.input.activePointer.x, game.input.activePointer.y, PIX*1.5);
    //grid.set(gx, gy, undefined);
  }

  grid.clear();

  if (controller && (options.autoUpdate || buttons.C.isDown)) {
    controller.update();
    controller.render();
  }

  if (options.debugGrid) {
    grid.forEach((val, gx, gy, cell, x, y) => {
      debugBitmap.rect(x+1, y+1, PIX-2, PIX-2, val ? '#aa0000' : '#cccccc')
    });
    debugBitmap.dirty = true;
  }
}


let fpsEl = document.querySelector("#fps");
function debugRender1() {
  fpsEl.innerText = game.time.fps + ' ents: ' + controller.getEntitiesStats();
}

let to;

function doGrow() {
  controller.growAll();
  to = setTimeout(doGrow, options.spawnDelay);
}

document.querySelector("#start").addEventListener("click", () => doGrow());
document.querySelector("#stop").addEventListener("click", () => clearTimeout(to));

/*

  create circles near
  combine circles into bigger ones
  fill grid from circles
  on hit destroy circles, not cell


  what we have:
  - ground
  - black circles
    == several pupirkas
    == then they unite

    ------- shall be some predefined grid which covers most part of grid
  - red pupirkas
    ------- shall have same? predefined grid?

 */
