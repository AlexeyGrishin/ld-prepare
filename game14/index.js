class LoadState {
    preload() {
        game.load.image("level1.bg", "level1.png");
        game.load.image("level2.bg", "level2.png");
        game.load.spritesheet("cat", "meteo-cat.png", 16, 16);
        game.load.spritesheet("grass", "meteo-grass.png", 16, 16);
        game.load.spritesheet("misc", "meteo-misc.png", 16, 16);
        game.load.image("lava-1", "lava-1.png");
        game.load.image("water-1", "water-1.png");
        game.load.image("pipe-2", "pipe-2.png");
        game.load.image("water-2", "water-2.png");
        game.load.tilemap("level1", "map1.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.tilemap("level2", "map2.json", null, Phaser.Tilemap.TILED_JSON);
        game.rnd.sow([0]);
        game.time.advancedTiming = true;
        makeSharped();
    }

    create() {
        createMaskSpritesheet('grass');
        createMaskSpritesheet('cat', false, true);
        createMaskSpritesheet('misc', false, true);
        game.state.start("Level1");
    }
}


class WinState {
    create() {
        game.stage.background = "white";
        let bm = game.add.bitmapData(260, 200);
        let sp = game.add.sprite(MAP_WIDTH_PIX/2, MAP_HEIGHT_PIX/2, bm);
        sp.anchor.set(0.5, 0.5);
        bm.ctx.font = "64px Arial";
        bm.ctx.fillStyle = "white";
        bm.ctx.strokeStyle = "white";
        bm.ctx.fillText("You won!", 0, 100);
        bm.dirty = true;

        game.add.sprite(MAP_WIDTH_PIX/2, MAP_HEIGHT_PIX/2+20, "cat", 0);
    }
}

function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(1.5, 1.5);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

const HEAT_PIX = 10;
const MAP_WIDTH = 60;
const MAP_HEIGHT = 50;

const HM_WIDTH = 64;
const HM_HEIGHT = 64;

const MAP_WIDTH_PIX = HEAT_PIX*MAP_WIDTH;
const MAP_HEIGHT_PIX = HEAT_PIX*MAP_HEIGHT;

const DEBUG_HEATMAP = false;
const USE_SHADER = true;

//t. 0 = absolute cold (nothing to move out), 255 - absolute heat

/*

    lava/water
        movements

    add heat source

    balance first map

    water/lava - collision? or it shall be after bg and before hero

 */

class FlowShader extends Phaser.Filter {
    constructor(texture) {
        super(game);

        this.uniforms.iChannel0.value = texture;

        this.fragmentSrc = `
        precision mediump float;
        #define M_PI 3.141592653589793
        #define M_PI2 6.283185307179586
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //lava mask sprite
        uniform sampler2D  iChannel0;   //texture
        
        void main(void) {
            vec4 data = texture2D(uSampler, vTextureCoord);
            vec2 uv = data.rg;
            //float angle = data.b * M_PI2;
            //float dx = cos(angle), dy = sin(angle);
            float speed = data.b * 10.;
            uv.y = mod(1. + uv.y - fract(speed*time), 1.);
            vec4 clrFromTexture = texture2D(iChannel0, uv);
            
            gl_FragColor = clrFromTexture * data.a;
        }
        `;
    }
}

class PipeShader extends Phaser.Filter {
    constructor() {
        super(game);
        this.uniforms.iChannel0.value = PipeShader.prepareMetalTexture();
        this.uniforms.iChannel1.value = game.heatmap.sprite.texture.baseTexture;
        this.uniforms.iChannel1.textureData = {nearest: true};

        this.fragmentSrc = `
        precision mediump float;
        #define M_PI 3.141592653589793
        #define M_PI2 6.283185307179586
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //mask sprite
        uniform sampler2D  iChannel0;   //texture
        uniform sampler2D  iChannel1;   //heatmap
        
        float getTextureT(float tx, float ty) { //tx,ty = 0..MAP_WIDTH. but we have texture = HM_WIDTH*HM_HEIGHT. 
            return texture2D(iChannel1, vec2(tx,ty) / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
        
        float getT(float x, float y) {
            vec2 tt = vec2(gl_FragCoord.x / ${HEAT_PIX}., gl_FragCoord.y / ${HEAT_PIX}.);
            return getTextureT(tt.x, tt.y);
        }
        
        void main(void) {
            vec4 data = texture2D(uSampler, vTextureCoord);
            vec2 uv = data.rg;
            float t = getT(gl_FragCoord.x, gl_FragCoord.y);
            
            float speed = data.b * 10.;
            uv.y = mod(1. + uv.y - fract(speed*time), 1.);
            vec4 clrFromTexture = texture2D(iChannel0, uv);
            
            gl_FragColor = mix(clrFromTexture, vec4(1,0,0,1), smoothstep(0.5, 2., t)) * data.a;
            //gl_FragColor = clrFromTexture * data.a;
        }
        `;

    }

    static prepareMetalTexture() {
        let bm = game.add.bitmapData(16,16);
        let tempSprite = game.add.sprite(-1000,-1000, "misc", 13);
        bm.draw(tempSprite, 0, 0);
        tempSprite.destroy();
        tempSprite = game.add.sprite(-1000,-1000, bm);
        return tempSprite.texture;
    }
}

class LavaShader extends FlowShader {
    constructor() {
        super(LavaShader.prepareLavaTexture());
    }

    static prepareLavaTexture() {
        let bm = game.add.bitmapData(16,16);
        let tempSprite = game.add.sprite(-1000,-1000, "misc", 12);
        bm.draw(tempSprite, 0, 0);
        tempSprite.destroy();
        tempSprite = game.add.sprite(-1000,-1000, bm);
        return tempSprite.texture;
    }
}

class WaterShader extends FlowShader {
    constructor() {
        super(WaterShader.prepareWaterTexture());
    }

    static prepareWaterTexture() {
        let bm = game.add.bitmapData(16,16);
        let tempSprite = game.add.sprite(-1000,-1000, "misc", 11);
        bm.draw(tempSprite, 0, 0);
        tempSprite.destroy();
        tempSprite = game.add.sprite(-1000,-1000, bm);
        return tempSprite.texture;
    }
}

class Flow {
    constructor() {
        this.segments = [];
        this.line = [];
        this.bitmap = null;
        this.textureWidth = 16;
        this.textureHeight = 16;
    }

    destroyAt(x, y, radius) {
        if (!this.damageable) return;
        if (x > this.sprite.left && x < this.sprite.right && y > this.sprite.top && y < this.sprite.bottom) {
            let ex = x - this.sprite.left;
            let ey = y - this.sprite.top;
            let ctx = this.bitmap.ctx;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.fillStyle = "black";
            ctx.moveTo(ex, ey);
            ctx.arc(ex, ey, radius, 0, Math.PI*2);
            ctx.fill();

            ctx.globalCompositeOperation = null;
            this.bitmap.dirty = true;
        }

    }

    addSegment(from, to, width = 16, speed = 1) {
        this.segments.push({from,to, width, speed});
    }

    prepareLine(id) {
        //line is pixel-by-pixel. initially draw it as is, next it could be rounded a bit
        this.line = [];
        if (this.segments.length === 0) return;
        let width = this.segments[0].width, speed = this.segments[0].speed;
        const DWIDTH = 0.1, DSPEED = 0.1, PAD = 20;
        let minx = this.segments[0].from.x, miny = this.segments[0].from.y, maxx=minx,maxy=miny;
        for (let segment of this.segments) {
            let segmentLine = new Phaser.Line(segment.from.x, segment.from.y, segment.to.x, segment.to.y);
            let array = segmentLine.coordinatesOnLine().slice(this.line.length === 0 ? 0 : 1);
            for (let [x,y] of array) {
                if (width !== segment.width) {
                    width += DWIDTH*Math.sign(segment.width-width);
                }
                if (speed !== segment.speed) {
                    speed += DSPEED*Math.sign(segment.speed-speed);
                }
                this.line.push({x,y,width,speed});
                minx = Math.min(x,minx);
                miny = Math.min(y,miny);
                maxx = Math.max(x,maxx);
                maxy = Math.max(y,maxy);
            }
        }
        let ty = 0, pi = 0, pix, prevpix;
        for (; pi < this.line.length; pi++) {
            pix = this.line[pi];
            pix.x -= (minx-PAD);
            pix.y -= (miny-PAD);
            pix.v = ty;
            ty += pix.speed;
            prevpix = this.line[pi-1];
            if (prevpix) {
                prevpix.dx = pix.x - prevpix.x;
                prevpix.dy = pix.y - prevpix.y;
                prevpix.vector = new Phaser.Point(prevpix.dx, prevpix.dy).normalize();
            }
            if (pi === this.line.length-1) {
                pix.dx = prevpix.dx;
                pix.dy = prevpix.dy;
                pix.vector = new Phaser.Point(pix.dx, pix.dy).normalize();
            }
        }


        this.sprite = game.make.sprite(minx-PAD, miny-PAD);
        this.bitmap = game.add.bitmapData(maxx-minx+PAD*2, maxy-miny+PAD*2);
        if (id && game.cache.checkImageKey(id)) {
            this.bitmap.draw(id, 0, 0);
        } else {
            this.bitmap.update();
            let clr = {r:0,g:0,b:0,a:255}, u = 0, v = 0, closest, i, dist, p = new Phaser.Point(0,0), dot, ang;
            this.bitmap.processPixelRGB((color, x, y) => {
                i = this.line.length-1;
                closest = {pix: this.line[0], d: Math.hypot(this.line[0].x-x, this.line[0].y-y)}
                while (i-->1) {
                    pix = this.line[i];
                    if (Math.abs(x-pix.x) > closest.d || Math.abs(y-pix.y) > closest.d) continue;
                    dist = Math.hypot(x-pix.x, y-pix.y);
                    if (dist < closest.d) {
                        closest.d = dist;
                        closest.pix = pix;
                    }
                }
                if (closest.d < closest.pix.width/2) {
                    v = (closest.pix.v % this.textureHeight) / this.textureHeight;
                    p.x = closest.pix.x - x;//  point --> |
                    p.y = closest.pix.y - y;//            v direction
                    p.normalize().perp();
                    dot = p.dot(closest.pix.vector);
                    if (dot >= 0.5) {
                        //it is left
                        u = 0.5 - closest.d / closest.pix.width;
                    } else if (dot < 0.5) {
                        //it is right
                        u = 0.5 + closest.d / closest.pix.width;
                    }

                    clr.r = (u*255)|0;
                    clr.g = (v*255)|0;
                    //clr.b = ((Math.PI+normalizeAngle(Math.atan2(closest.pix.vector.y, closest.pix.vector.x))) / (2*Math.PI) * 255)|0;
                    clr.b = (closest.pix.speed*10)|0;
                    return clr;
                }
            });
            if (id) {
                let divId = document.createElement("div");
                divId.innerText = id;
                let canvasToSave = document.createElement("canvas");
                canvasToSave.setAttribute("width",  this.bitmap.width + "px");
                canvasToSave.setAttribute("height", this.bitmap.height + "px");
                canvasToSave.getContext('2d').drawImage(this.bitmap.canvas, 0, 0);
                document.body.appendChild(canvasToSave);
            }
        }
        this.sprite.loadTexture(this.bitmap);
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.sprite.update = () => (this.sprite.filters || []).forEach(f => f.update());
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.originX = this.x + PAD;
        this.originY = this.y + PAD;
    }

    renderWith(shaderClass) {
        this.sprite.filters = [new shaderClass()];
    }

    static demoFlow() {
        let f = new Flow();
        f.addSegment({x:550,y:50},  {x:500,y:100}, 5);
        f.addSegment({x:500,y:100}, {x:500,y:120}, 5);
        f.addSegment({x:500,y:120}, {x:500,y:160}, 10, 0.5);
        f.addSegment({x:500,y:160}, {x:510,y:180}, 5,1);
        f.addSegment({x:510,y:180}, {x:580,y:180}, 4,1.5);
        f.prepareLine();
        game.add.existing(f.sprite);
    }
}



function createMaskSpritesheet(key, addPixelsOnTop = true, ignoreMask = false) {
    let img = game.cache.getImage(key);
    let fd = game.cache.getFrameData(key);
    let maskBm = game.add.bitmapData(img.width, img.height);
    //maskBm.fill(0,0,0);
    maskBm.draw(img, 0, 0);
    maskBm.update();
    for (let f of fd.getFrames()) {
        //1. find "origin"
        let oy = f.y + f.height-1;
        let ox = f.x;
        for (; ox < f.x + f.width; ox++) {
            if (maskBm.getPixel(ox, oy).a) break;
        }
        let out = {}, pix = {};
        //2. process all pixels. set r = (x-ox) if > 0, g = (ox-x) if > 0, b = (oy-y)
        maskBm.processPixelRGB((color, x, y) => {
            out.a = 255;
            out.g = 255;
            if (color.a === 0) {
                if (addPixelsOnTop && y < f.height-1) {
                    maskBm.getPixel(x, y+1, pix);
                    if (pix.a > 0) {
                        //continue as is
                        out.g = 128;
                    } else {
                        return;
                    }
                } else return;
            }
            if (ignoreMask) out.g = 32;
            out.r = ox-x+128;// Math.max(0, x-ox);
            //out.g = Math.max(0, ox-x);
            out.b = oy-y;
            return out;
        }, this, f.x, f.y, f.width, f.height);
    }
    game.cache.addSpriteSheet(key + ".mask", null, maskBm.canvas, 16, 16);
}

class HeatMap {
    constructor(width = MAP_WIDTH, height = MAP_HEIGHT, t = (x,y) => 200) {
        this.bitmap = game.add.bitmapData(HM_WIDTH, HM_HEIGHT);
        this.bitmap2 = game.add.bitmapData(HM_WIDTH, HM_HEIGHT);
        this.grid = [];
        this.list = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push({t: t(x,y), tspeed: 0.1, x, y, delta: 0, tstepsPerTick: 10}); //tspeed = "part of particles moving for 1 cell for 1 tick"
            }
            this.list.push(...row);
            this.grid.push(row);
        }
        this.list.sort((a,b) => {
            return b.tstepsPerTick - a.tstepsPerTick;
        });
        this.width = width;
        this.height = height;
        this.bitmap.update();
        this.bitmap2.update();
        this.updateBitmap();
        this.sprite = game.add.sprite(-1000, -1000, this.bitmap);
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.LINEAR;

        this.sprite2 = game.add.sprite(-1000, -1000, this.bitmap2);
        this.sprite2.texture.baseTexture.scaleMode = PIXI.scaleModes.LINEAR;

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
    }

    addFlow(flow) {
        let lastPoint = undefined, i, pix, x, y;
        for (i = 0; i < flow.line.length; i++) {
            pix = flow.line[i];
            x = Math.floor((flow.x + pix.x)/HEAT_PIX);
            y = Math.floor((flow.y + pix.y)/HEAT_PIX);
            if (lastPoint === undefined) {
                lastPoint = {x,y};
            } else if (lastPoint.x !== x || lastPoint.y !== y) {
                this.addMovement({x: lastPoint.x, y: lastPoint.y}, {x,y}, pix.speed*0.1, {damageable: flow.damageable});
                lastPoint.x = x;
                lastPoint.y = y;
            }
        }
    }

    t(x,y) {
        return this.grid[this.y(y)][this.x(x)].t;
    }
    x(x) { return (Math.round(x/HEAT_PIX))}
    y(y) { return (Math.round(y/HEAT_PIX))}


    //cellParams = {tspeed, tstepsPerTick}
    setGridParams(x, y, cellParams) {
        this.grid[y][x] = Object.assign(this.grid[y][x], cellParams);
    }

    addTchanger(x, y, tconst) {
        let tc = {x, y, tconst};
        this.tchangers.push(tc);
        this.grid[y][x].t = tconst;
        this.grid[y][x].const = true;
        return tc;
    }

    removeTchanger(tchanger) {
        this.tchangers = this.tchangers.filter(t => t !== tchanger);
        this.grid[tchanger.y][tchanger.x].const = false;
    }

    addMovement(from, to, speed, props = {}) {
        if (!this.valid(from.x, from.y) || !this.valid(to.x, to.y)) return;
        this.movements.push({from, to, speed, props});
        this._dirtyMovements = true;
    }

    destroyMovementAt(x, y, radius) {
        let mi = this.movements.length, mvm;
        while (mi-->0) {
            mvm = this.movements[mi];
            if (mvm.props.damageable && Math.hypot(x - mvm.from.x*HEAT_PIX, y - mvm.from.y*HEAT_PIX) <= radius) {
                this.movements.splice(mi, 1);
                console.log('destroyed mvm at', mvm.from.x, mvm.from.y);
            }
        }
    }

    valid(x ,y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
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

    updateBitmap() {
        this._updateBitmap(this.bitmap);
        this._updateBitmap(this.bitmap2);
    }

    _updateBitmap(bitmap) {
        let i = this.list.length, cell;
        while (i-->0) {
            cell = this.list[i];
            bitmap.setPixel(cell.x, this.height - 1 - cell.y, Math.min(255, cell.t), 0, 0, false);
        }
        bitmap.context.putImageData(bitmap.imageData, 0, 0);
        bitmap.dirty = true;
    }

    addDebugImage() {
        this.debugImage = game.add.bitmapData(MAP_WIDTH_PIX, MAP_HEIGHT_PIX);
        let sprite = game.add.sprite(0, 0, this.debugImage);
        sprite.name = "debug heatmap";
        this.updateDebugImage();
    }

    updateDebugImage() {
        if (!this.debugImage) return;
        this.debugImage.clear();
        this.debugImage.fill(255,255,255);
        let ctx = this.debugImage.ctx;
        ctx.strokeStyle = "black";
        ctx.font = "7px Arial";
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let cell = this.grid[y][x];
                if (cell.t < 128) {
                    ctx.fillStyle = `rgba(0,0,255,${((255-2*cell.t)/255).toFixed(2)})`;
                } else {
                    ctx.fillStyle = `rgba(255,0,0,${((2*(cell.t-128))/255).toFixed(2)})`;
                }
                ctx.fillRect(x*HEAT_PIX, y*HEAT_PIX, HEAT_PIX, HEAT_PIX);
                //ctx.strokeRect(x*HEAT_PIX, y*HEAT_PIX, HEAT_PIX, HEAT_PIX);
                ctx.strokeStyle = cell.delta === 0 ? "black" : "purple";
                ctx.strokeText((cell.t|0).toString(16), x*HEAT_PIX, y*HEAT_PIX+HEAT_PIX);
            }
        }
        this.debugImage.dirty = true;
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
                    if (maxAround === undefined || maxAround.diff < diff /*|| maxAround.tspeed < cell.cell.tspeed*/) {
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

    update() {
        if (this._dirtyMovements) this.prepareMovements();
        this.updateAll();
        this.updateBitmap();
        this.updateDebugImage();

    }

}

class WeatherDebugShader extends Phaser.Filter {
    constructor(heatmapTexture) {
        super(game);
        this.uniforms.iChannel0.value = heatmapTexture;
        this.uniforms.iChannel0.textureData = {repeat: false};
        this.fragmentSrc = `
        precision mediump float;
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //render
        uniform sampler2D  iChannel0;   //heatmap
        uniform sampler2D  iChannel1;   //mask
        
        #define R1 0.45
        #define M 0.5
        #define R2 0.55
        
        float getTextureT(float tx, float ty) { //tx,ty = 0..MAP_WIDTH. but we have texture = HM_WIDTH*HM_HEIGHT. 
            return texture2D(iChannel0, vec2(tx,ty) / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
        
        float getT(float x, float y) {
            vec2 tt = vec2(gl_FragCoord.x / ${HEAT_PIX}., gl_FragCoord.y / ${HEAT_PIX}.);
            return getTextureT(tt.x, tt.y);
        }
        
        
        void main(void) {
            
            float t = getT(gl_FragCoord.x, gl_FragCoord.y);
            if (t < 0.5) {
                gl_FragColor = vec4(0,0,1,1)*2.*(0.5-t);
            } else {
                gl_FragColor = vec4(1,0,0,1)*2.*(t-0.5);
            }
            
        }

        `;
    }
}


class WeatherShader extends Phaser.Filter {
    constructor(heatmapTexture, maskTexture) {
        super(game);
        this.uniforms.iChannel0.value = heatmapTexture;
        this.uniforms.iChannel0.textureData = {nearest: true};
        this.uniforms.iChannel1.value = maskTexture;
        this.uniforms.iChannel1.textureData = {nearest: true};
        this.heatmapTexture = heatmapTexture;
        this.maskTexture = maskTexture;
        this.fragmentSrc = `
        precision mediump float;
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //render
        uniform sampler2D  iChannel0;   //heatmap
        uniform sampler2D  iChannel1;   //mask
        
        #define R1 0.45
        #define M 0.5
        #define R2 0.55
        
        float getTextureT(float tx, float ty) { //tx,ty = 0..MAP_WIDTH. but we have texture = HM_WIDTH*HM_HEIGHT. 
            return texture2D(iChannel0, vec2(tx,ty) / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
        
        float getT(float x, float y) {
            vec2 tt = vec2(gl_FragCoord.x / ${HEAT_PIX}., gl_FragCoord.y / ${HEAT_PIX}.);
            return getTextureT(tt.x, tt.y);
        }
        
        
        void main(void) {
            vec4 maskCoords = texture2D(iChannel1, vec2(gl_FragCoord.x, ${MAP_HEIGHT_PIX}.-gl_FragCoord.y)/vec2(${MAP_WIDTH_PIX}., ${MAP_HEIGHT_PIX}));
            
            //r = dx+128
            //b = dy
            float x = gl_FragCoord.x + (maskCoords.r*255.-128.);
            float y = gl_FragCoord.y + maskCoords.b;
            
            float t = getT(x, y);
            
            vec4 origColor = texture2D(uSampler, vTextureCoord);
            vec4 realColor = origColor;
            int a = int(maskCoords.g*255.);
            vec4 middleColor = vec4(vec3(0.2126 * realColor.r + 0.7152 * realColor.g + 0.0722 * realColor.b), 1.);
            middleColor.r = (middleColor.r + realColor.r)/2.;
            if (a == 255) {  //apply fully
                    if (t < R1) {
                        //cold
                        realColor = mix(middleColor, vec4(0.4,0.8,1.0,1.0), 1. - t / R1);
                    } else if (t < R2) {
                        //middle
                        realColor = middleColor;
                    } else {
                        //hot
                        realColor = mix(middleColor, realColor*2., (t-R2)/(1.-R2));
                    }
            } else if (a == 128) { //snow
                    if (t < R1) {
                        realColor = mix(vec4(1,1,1,0), vec4(0.5,1.0,1.0,1.0), 1. - t / R1);
                    }
            } else if (a == 32) { //ignore
                    realColor.a = 1.;
            } else if (a == 0) { //bg
                    //middleColor *= 0.7;
                    if (t < M) {
                        realColor = mix(middleColor, vec4(0.8,0.8,1.,1.), pow(1. - t / R1, 0.5));
                    //} else if (t < R2) {
                    //    realColor = middleColor;
                    } else {
                        realColor = mix(middleColor, clamp(realColor, 0., 1.), pow((t-R2)/(1.-R2), 0.5));
                    }  
                    //realColor *= 0.8;
            } else {
                    realColor = vec4(1,0,1,0.5); //error                   
            }

            
            //gl_FragColor = maskCoords;
            gl_FragColor = realColor;
            
        }

        `;
    }

}

Phaser.Sprite.prototype.getRealLeft = function() {
    return this.x - this.width*this.anchor.x;
};
Phaser.Sprite.prototype.getRealRight = function() {
    return this.x + this.width*(1 - this.anchor.x);
};


class ChangeWatchingTexture {
    constructor(grp, getter = (sprite) => sprite.model.maskSprite) {
        this.grp = grp;
        this.renderTexture = game.add.bitmapData(MAP_WIDTH_PIX, MAP_HEIGHT_PIX);
        //this.renderTexture.op = 'lighten';
        this.sprite = game.add.sprite(-1000, -1000, this.renderTexture);
        this.getter = getter;
        this._first = true;
        this._maxRedrawn = 0;
    }

    render() {
        let changed = {
            x0: undefined,
            y0: undefined,
            x1: undefined,
            y1: undefined,

            get width() { return this.x1 - this.x0},
            get height() { return this.y1 - this.y0}
        };
        if (this._first) {
            changed.x0 = changed.y0 = 0;
            changed.x1 = this.renderTexture.width;
            changed.y1 = this.renderTexture.height;
        } else {
            let ar = this.grp.children || this.grp, i = ar.length, sprite;

            while (i-->0) {
                sprite = ar[i];
                if (sprite.ghost) {
                    if (changed.x0 === undefined || changed.x0 > sprite.x) changed.x0 = sprite.x;
                    if (changed.y0 === undefined || changed.y0 > sprite.y) changed.y0 = sprite.y;
                    if (changed.x1 === undefined || changed.x1 < sprite.x) changed.x1 = sprite.x;
                    if (changed.y1 === undefined || changed.y1 < sprite.y) changed.y1 = sprite.y;
                    continue;
                }
                if (sprite.model && sprite.model.maskSprite && sprite.model.maskSprite._changed) {
                    //sprite.model.maskSprite._changed = false;
                    if (changed.x0 === undefined || changed.x0 > sprite.realBounds.left) changed.x0 = sprite.realBounds.left;
                    if (changed.y0 === undefined || changed.y0 > sprite.realBounds.top) changed.y0 = sprite.realBounds.top;
                    if (changed.x1 === undefined || changed.x1 < sprite.realBounds.right) changed.x1 = sprite.realBounds.right;
                    if (changed.y1 === undefined || changed.y1 < sprite.realBounds.bottom) changed.y1 = sprite.realBounds.bottom;
                }
            }
            if (changed.x0 !== undefined) {
                const PAD = 20;
                changed.x0 = Math.max(0, changed.x0 - PAD)|0;
                changed.y0 = Math.max(0, changed.y0 - PAD)|0;
                changed.x1 = Math.min(this.renderTexture.width, changed.x1 + PAD)|0;
                changed.y1 = Math.min(this.renderTexture.height, changed.y1 + PAD)|0;
            }
        }
        if (changed.x0 === undefined) return;
        //console.log('redraw', changed.x0, changed.y0, ' -> ', changed.x1, changed.y1);
        this.renderTexture.clear(changed.x0, changed.y0, changed.width, changed.height);
        let ar = this.grp.children || this.grp, i = ar.length, sprite;

        let redrawn = 0;
        while (i-->0) {
            sprite = ar[i];
            if (sprite.model && sprite.model.maskSprite) {
                let renderSprite = this.getter(sprite);
                if (!renderSprite || !renderSprite.alive || renderSprite.pendingDestroy) continue;
                if (sprite.realBounds.left >= changed.x1) continue;
                if (sprite.realBounds.right <= changed.x0) continue;
                if (sprite.realBounds.bottom <= changed.y0) continue;
                if (sprite.realBounds.top >= changed.y1) continue;
                this.renderTexture.fastDrawSprite(renderSprite, renderSprite.x, renderSprite.y);
                redrawn++;
            }
        }
        this._maxRedrawn = Math.max(this._maxRedrawn, redrawn);
        this.renderTexture.dirty = true;
        this._first = false;
    }
}

Phaser.BitmapData.prototype.fastDrawSprite = function(source, x, y) {
    this._pos.set(source.texture.crop.x, source.texture.crop.y);
    this._size.set(source.texture.crop.width, source.texture.crop.height);
    this._anchor.set(source.anchor.x, source.anchor.y);

    this._image = source.texture.baseTexture.source;
    var ctx = this.context;
    var newWidth = this._size.x;
    var newHeight = this._size.y;
    if (source.alpha !== 1) {
        ctx.globalAlpha = source.alpha;
    }
    x = x|0;
    y = y|0;
    ctx.drawImage(this._image,
        this._pos.x, this._pos.y, this._size.x, this._size.y,
        x -newWidth * this._anchor.x, y -newHeight * this._anchor.y, newWidth, newHeight
    );
    if (source.alpha !== 1) {
        ctx.globalAlpha = 1;
    }

    this.dirty = true;
};

class Renduror {
    constructor(grp, heatmap) {
        this.grp = grp;
        this.textureMask = new ChangeWatchingTexture(grp, (sprite) => sprite.model.maskSprite);
        this.textureReal = new ChangeWatchingTexture(grp, (sprite) => !sprite.model.noRender ? sprite : null);

        if (!DEBUG_HEATMAP && USE_SHADER) game.world.filters = [new WeatherShader(heatmap.sprite.texture, this.textureMask.sprite.texture)];
        this._log = true;
    }

    renderMask() {
        let ar = this.grp.children || this.grp, i = ar.length, sprite, bounds;
        while (i-->0) {
            sprite = ar[i];
            if (!sprite.alive || sprite.pendingDestroy || sprite.ghost) continue;
            if (sprite.realBounds !== undefined && sprite.model.static) continue;
            sprite.realBounds = sprite.realBounds || {left:0, right:0, top:0, bottom: 0};
            sprite.realBounds.left = sprite.position.x - sprite.anchor.x*sprite._frame.width;
            sprite.realBounds.right = sprite.position.x + (1 - sprite.anchor.x)*sprite._frame.width;
            sprite.realBounds.top = sprite.position.y - sprite.anchor.y*sprite._frame.height;
            sprite.realBounds.bottom = sprite.position.y + (1 - sprite.anchor.y)*sprite._frame.height;
        }
        this.textureMask.render();
        this.textureReal.render();
        i = ar.length;
        while (i-->0) {
            sprite = ar[i];
            if (sprite.model && sprite.model.maskSprite && sprite.model.maskSprite._changed) {
                sprite.model.maskSprite._changed = false;
            }
            if (sprite.ghost) {
                ar.splice(i, 1);
            }

        }
    }
}

const ICE_COOLDOWN = 10000;

class Hero extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'cat');
        this.vx = 0;
        this.vy = 0;
        //this.scale.set(2,2);
        this.anchor.set(0.5, 1);
        //this.tint = 0xcccccc;
        this.animations.add("idle", [0], 8);
        this.animations.add("move", [1,2,3,4,5,6], 12, true);
        this.model = {
            maskSprite: game.make.sprite(x, y, 'cat.mask')
        };
        this.model.maskSprite.anchor.set(0.5, 1);
        game.physics.arcade.enable(this);
        this.iceCooldown = 0;
        this.active = true;
    }

    restart({x,y}) {
        this.active = false;
        this.x = x;
        this.y = y;
        this.body.velocity.set(0,0);
        this.animations.play('idle');
        game.add.tween(this).to({alpha:0}, 100, null, true, null, 3, true).onComplete.addOnce(() => {
           this.active = true;
        });
    }

    doMove(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.body.velocity.x = vx*this.speed;
        this.body.velocity.y = vy*this.speed;
        //this.x += vx * this.speed;
        //this.y += vy * this.speed;
        if (vx !== 0 || vy !== 0) {
            if (!this.animations.currentAnim || this.animations.currentAnim.name !== "move") {
                this.animations.play("move")
            }
        } else {
            this.animations.play("idle");
        }
    }

    placeIce() {
        if (this.iceCooldown <= 0) {
            this.iceCooldown = ICE_COOLDOWN;
            return true;
        }
        return false;
    }

    get speed() { return 60;}

    update() {
        this.model.maskSprite.change('frame', this.animations.frame, this.model.maskSprite.animations);
        this.model.maskSprite.change('x', this.x);
        this.model.maskSprite.change('y', this.y);

        this.iceCooldown -= game.time.physicsElapsedMS;

        //have to update manually 'coz hero is invisible
        //this.body.position.x = this.getRealLeft();
        //this.body.position.y = this.top;
        if (!this.active) {
            this.model.maskSprite._changed = true;
        }
    }
}

Phaser.Sprite.prototype.change = function changeInMask(prop, nval, obj = this) {
    if (obj[prop] !== nval) {
        obj[prop] = nval;
        this._changed = true;
    }
};

//0 = angle=0, 1,2,3 - left, 4,5,6 = right

class GrassModel {
    constructor(x, y, type = game.rnd.pick([0,7,14])) {
        this.x = x;
        this.y = y;
        if (this.y < 0) this.y = 0;
        if (this.x < 0) this.x = 0;
        this.type = type;
        this.height = 8; //todo: get from image

        this.sprite = game.make.sprite(this.x, this.y, "grass", this.type);
        this.sprite.anchor.set(0.5, 1);
        this.angle = 0;
        this.wave = null;
        let g = game.rnd.integerInRange(150,200);
        let b = game.rnd.integerInRange(10,50);
        //this.sprite.tint = (g<<8) | (b);
        this.sprite.model = this;

        this.maskSprite = game.make.sprite(this.x, this.y, "grass.mask", this.type);
        this.maskSprite.anchor.set(0.5, 1);

        this.static = true;
    }

    applyAngle() {
        //angle - from -Math.PI/4 to Math.PI/4;
        let frame = this.type + Math.abs(Math.round(3*this.angle / (Math.PI/4)));
        if (this.angle < 0 && frame !== this.type) {
            frame += 3;
        }
        this.sprite.animations.frame = frame;
        this.maskSprite.change('frame', frame, this.maskSprite.animations);
        if (this.angle !== 0) this.maskSprite._changed = true;
    }

    checkProjectile(sprite) {
        let dist = Phaser.Point.distance(this, sprite);
        const MAX = 48;
        if (dist < MAX) {
            if (this.wave) return;
            let waveDirection = Math.sign(sprite.x-this.x);
            //if (waveDirection === 0) waveDirection = 1;
            let t1 = game.add.tween(this).to({angle: waveDirection*Math.PI/4*(1-dist/MAX)}, 100, Phaser.Easing.Cubic.Out, false, 2*dist);
            let t2 = game.add.tween(this).to({angle: 0}, 400, Phaser.Easing.Cubic.In, false, 300);
            let t3 = game.add.tween(this).to({angle: -waveDirection*Math.PI/8*(1-dist/MAX)}, 100, Phaser.Easing.Cubic.In);
            let t4 = game.add.tween(this).to({angle: 0}, 100, Phaser.Easing.Cubic.In);
            t1.chain(t2, t3, t4);
            this.wave = t1;
            t1.start();
            t4.onComplete.addOnce(() => {
                this.wave = null;
                this.angle = 0;
            })
        }
    }

    checkCollisionWith(sprite) {
        //compare our y with sprite's y
        if (sprite.left < this.x && sprite.right > this.x && Math.abs(sprite.y - this.y) < 5) {
            if (this.wave) return;
            let waveDirection = 1;
            if (sprite.vx !== undefined) waveDirection = -Math.sign(sprite.vx);
            if (waveDirection === 0 && sprite.vy !== undefined && sprite.vy !== 0) waveDirection = (-Math.sign(this.x - sprite.x)) || 1;
            if (waveDirection === 0) return;
            //todo: wave force/speed
            let t1 = game.add.tween(this).to({angle: waveDirection*Math.PI/4}, 200, Phaser.Easing.Cubic.Out);
            let t2 = game.add.tween(this).to({angle: 0}, 400, Phaser.Easing.Cubic.In);
            let t3 = game.add.tween(this).to({angle: -waveDirection*Math.PI/8}, 200, Phaser.Easing.Cubic.In);
            let t4 = game.add.tween(this).to({angle: 0}, 200, Phaser.Easing.Cubic.In);
            t1.chain(t2, t3, t4);
            this.wave = t1;
            t1.start();
            t4.onComplete.addOnce(() => {
                this.wave = null;
                this.angle = 0;
            })
        }
    }

    update() {
        this.applyAngle();
    }
}

function withMask(key, frame) {
    return {sprite: game.add.sprite(-1000, -1000, key, frame), mask: game.add.sprite(-1000, -1000, key + ".mask", frame)}
}

class Rock {
    constructor(x, y, width, height) {
        width += 8;
        height += 8;
        x-=8;
        y-=8;
        this.bitmap = game.add.bitmapData(width, height);
        this.maskBitmap = game.add.bitmapData(width, height);
        Rock.rocks = Rock.rocks || (function() {
            return [
                withMask("grass", 21),
                withMask("grass", 22),
                withMask("grass", 23)
            ]
        })();
        //fill with rocks
        for (let yy = 16;yy<height; yy+=8) {
            for (let xx = 8; xx < width; xx+=8) {
                let tx = xx + game.rnd.integerInRange(-2,2);
                let ty = yy + game.rnd.integerInRange(-1,1);
                let {sprite, mask} = game.rnd.pick(Rock.rocks);
                sprite.anchor.set(0.5, 1);
                mask.anchor.set(0.5, 1);
                //let scale = game.rnd.realInRange(0.9, 1.1);
                //sprite.scale.set(scale, scale);
                //mask.scale.set(scale, scale);
                this.bitmap.draw(sprite, tx|0, ty|0);
                this.maskBitmap.draw(mask, tx|0, ty|0);
            }
        }
        this.sprite = game.make.sprite(x, y+height, this.bitmap);
        this.sprite.anchor.set(0, 1);
        this.sprite.model = {
            maskSprite: game.make.sprite(x, y+height, this.maskBitmap),
            noRender: true,
            static: true
        };
        this.sprite.model.maskSprite.anchor.set(0, 1);
        game.physics.arcade.enable(this.sprite);
        this.sprite.body.immovable = true;
        this.sprite.rect = {x,y,width,height,right:x+width,bottom:y+height,left:x,top:y};

    }
}

class Exit extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, "misc", 10);
        game.physics.arcade.enable(this);
        this.tint = 0x0000ff;

        this.model = {
            maskSprite: game.make.sprite(x, y, "misc.mask", 10),
            noRender: true,
            static: true
        }
    }
}

class IceDiamond extends Phaser.Sprite {
    constructor(x, y, heatmap) {
        super(game, x, y, "misc", 14);
        this.animations.add("idle", [14,15,16,15], 12, true);
        this.anchor.set(0.5, 1);
        this.lifespan = 10*1000;
        this.tchanger = heatmap.addTchanger(heatmap.x(x), heatmap.y(y), 0);
        this.heatmap = heatmap;

        this.model = {
            maskSprite: game.make.sprite(x, y, "misc.mask", 14),
            static: true
        };
        this.animations.play("idle");
        this.model.maskSprite.anchor.set(0.5, 1);
        this.model.maskSprite._changed = true;
    }

    update() {
        if (this.pendingDestroy) return this.destroy();
        if (!this.alive) {
            this.pendingDestroy = true;
            this.model.maskSprite.pendingDestroy = true;
            this.model.maskSprite.alive = false;
            this.model.maskSprite._changed = true;
        }
        this.model.maskSprite.change('frame', this.animations.frame, this.model.maskSprite.animations);
    }

    destroy() {
        super.destroy();
        this.heatmap.removeTchanger(this.tchanger);
    }
}

function tminmax(tmin, valuemin, tmax, valuemax) {
    return function(t) {
        if (t <= tmin) return valuemin;
        if (t >= tmax) return valuemax;
        return valuemin + (t-tmin)/(tmax-tmin)*(valuemax-valuemin);
    }
}

class Projectile extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, "misc", 2);
        this.anchor.set(0.5, 0.5);
        this.animations.add('explosion', [3,4,5,6,7], 12);
        game.physics.arcade.enable(this);
        this.body.setCircle(4, 8, 8);


    }

    flyTo(goal) {
        let distance = Phaser.Point.distance(this, goal) + 32;
        let angle = Phaser.Point.angle(goal, this);
        this.body.moveTo(300, distance, Phaser.Math.radToDeg(angle));
        this.body.onMoveComplete.addOnce(() => {
           this.onCollide();
        });
    }

    onCollide() {
        this.body.velocity.set(0,0);
        game.onProjectileExplode(this);
        this.animations.play('explosion').onComplete.addOnce(() => {
            this.destroy();
        });
    }


    update() {
        this.rotation += 0.01;
    }
}


class Gun extends Phaser.Sprite {
    constructor(x, y, heatmap) {
        super(game, x, y, "misc", 0);
        this.anchor.set(0.5, 0.5);
        this.gunItself = game.add.sprite(0, 0, "misc", 1);
        this.gunItself.anchor.set(0.5, 0.5);
        this.gunItself.scale.set(2, 2);

        this.gunItself.rotation = 2;

        this.heatmap = heatmap;

        this.visionFn = tminmax(50, 50, 200, 150);

        this.visionBitmap = game.add.bitmapData(400, 400);
        this.visionBitmap.ctx.fillStyle = "rgba(255,0,0,0.1)";
        this.visionBitmap.ctx.strokeStyle = "rgba(255,0,0,0.5)";
        this.visionBitmap.ctx.lineWidth = 4;
        this.visionBitmap.ctx.beginPath();
        this.visionBitmap.ctx.arc(200,200,200,0,Math.PI*2);
        this.visionBitmap.ctx.fill();
        this.visionBitmap.ctx.stroke();

        this.visionSprite = game.add.sprite(0, 0, this.visionBitmap);
        this.visionSprite.anchor.set(0.5, 0.5);
        this.addChild(this.visionSprite);
        this.addChild(this.gunItself);

        this.model = {
            maskSprite: game.make.sprite(-1000, -1000, "misc", 0),
            noRender: true
        };
        this.fireCooldown = 0;
    }

    checkHero(hero) {
        if (!hero) throw new Error("no hero?");
        let distance = Phaser.Point.distance(hero, this);
        if (distance < this.vision && game.hasNoObstacles(this, hero) && this.fireCooldown <= 0) {
            this.fireCooldown = 1000;
            let projectile = game.addProjectile(new Projectile(this.x, this.y));
            projectile.flyTo(this.hero);
        }
        if (distance < this.vision * 2) {
            let ang = (this.gunItself.rotation);
            let goal = (Phaser.Point.angle(this, this.hero)-Math.PI/2);
            if (Math.abs(goal - ang) > Math.PI) {
                goal += Math.PI;
            }
            this.gunItself.rotation = reach(ang, goal, 0.05);
        } else {
            this.gunItself.rotation += 0.02;
        }
    }

    update() {
        this.vision = this.visionFn(this.heatmap.t(this.x, this.y));
        this.visionSprite.width = this.vision*2;
        this.visionSprite.height = this.vision*2;
        this.fireCooldown -= game.time.physicsElapsedMS;
        this.checkHero(this.hero);
    }
}


class HeatSource extends Phaser.Sprite {
    constructor(x,y, heatmap) {
        super(game, x, y, "misc");
        this.animations.add("idle", [17,18,19], 8, true);
        this.animations.play("idle");
        this.model = {
            maskSprite: game.add.sprite(-1000,-1000, "misc.mask", 17),
            noRender: true,
            static: true
        };
        this.anchor.set(0.5, 1);
        this.model.maskSprite.anchor.set(0.5, 1);
        heatmap.addTchanger(heatmap.x(x), heatmap.y(y), 400);
    }
}

class BaseLevel {
    create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.cursors = game.input.keyboard.createCursorKeys();
        this.keys = {
            space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
            z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        };
        this.maskedGrp = [];
        this.invisibleHero = game.add.group();
        this.landscape = game.add.group();
        this.grassAndHero = game.add.group();
        this.walls = game.add.group();
        this.other = game.add.group();
        this.guns = game.add.group();
        this.projectiles = game.add.group();

        this.flows = [];

        this.tilemap = game.add.tilemap(this.levelKey);
        let t = (this.tilemap.properties || {}).t || 200;
        this.heatmap = game.heatmap =  new HeatMap(MAP_WIDTH, MAP_HEIGHT, (x,y) => t);
        this.renduror = new Renduror(this.maskedGrp, this.heatmap);


        for (let obj of this.tilemap.objects.objects) {
            switch (obj.name) {
                case "rocks":
                    let rock = new Rock(obj.x, obj.y, obj.width, obj.height);
                    this.walls.add(rock.sprite);
                    binaryInsertSortY(rock.sprite, this.maskedGrp);
                    break;
                case "start":
                    this.hero = new Hero(obj.x, obj.y);
                    this.heroStart = {x: obj.x, y: obj.y};
                    break;
                case "exit":
                    this.exit = new Exit(obj.x, obj.y);
                    this.other.add(this.exit);
                    binaryInsertSortY(this.exit, this.maskedGrp);
                    break;
                case "gun":
                    let gun = new Gun(obj.x, obj.y, this.heatmap);
                    this.guns.add(gun);
                    binaryInsertSortY(gun, this.maskedGrp);
                    break;
                case "water":
                case "lava":
                case "pipe":
                    let flow = new Flow();
                    flow.damageable = obj.name === "pipe";
                    let props = obj.properties || {};
                    for (let i = 0; i < obj.polyline.length-1; i++) {
                        let p1 = obj.polyline[i];
                        let p2 = obj.polyline[i+1];
                        let segmentSuffix = `${i+1}`;
                        let width = props[`width-${segmentSuffix}`] || props.width || 10;
                        let speed = props[`speed-${segmentSuffix}`] || props.speed || 1;
                        flow.addSegment({x: obj.x+p1[0], y:obj.y+p1[1]}, {x: obj.x+p2[0], y:obj.y+p2[1]}, width, speed);
                    }
                    flow.prepareLine(props.id);
                    flow.renderWith({"lava": LavaShader, "water": WaterShader, "pipe": PipeShader}[obj.name]);
                    this.heatmap.addFlow(flow);
                    this.landscape.add(flow.sprite);

                    let originT = props.t || {"lava": 255, "water": 128, "pipe": undefined}[obj.name];
                    if (originT !== undefined) {
                        this.heatmap.addTchanger(this.heatmap.x(flow.originX), this.heatmap.y(flow.originY), originT);
                    }
                    this.flows.push(flow);
                    break;
                case "heat":
                    let heat = new HeatSource(obj.x, obj.y, this.heatmap);
                    this.other.add(heat);
                    binaryInsertSortY(heat, this.maskedGrp);
                    break;
                default:
                    console.log(obj);
            }
        }

        this.guns.forEach(gun => gun.hero = this.hero);

        this.grass = [];
        let bm = game.add.bitmapData(MAP_WIDTH_PIX, MAP_HEIGHT_PIX);
        bm.draw(this.bgKey, 0, 0);
        this.initGrass(bm);

        for (let g of this.grass) {
            binaryInsertSortY(g.sprite, this.maskedGrp);
        }
        binaryInsertSortY(this.hero, this.maskedGrp);
        this.invisibleHero.add(this.hero);
        this.invisibleHero.alpha = 0.01;

        let bg = game.add.bitmapData(MAP_WIDTH_PIX, MAP_HEIGHT_PIX);
        bg.fill(0xd1, 0xff, 0xa4);
        game.add.sprite(0, 0, bg).sendToBack();
        game.world.sendToBack(this.invisibleHero);

        this.grassAndHero.add(this.renduror.textureReal.sprite);
        this.renduror.textureReal.sprite.x = this.renduror.textureReal.sprite.y = 0;
        //this.grassAndHero.add(this.renduror.textureMask.sprite);
        //this.renduror.textureMask.sprite.x = this.renduror.textureMask.sprite.y = 0;
        if (DEBUG_HEATMAP) {
            //heatmap.sprite.x = 0;
            //heatmap.sprite.y = 0;
            //heatmap.addDebugImage();
            game.world.filters = [new WeatherDebugShader(this.heatmap.sprite.texture)]
        }

        game.onProjectileExplode = this.onProjectileExplode.bind(this);
        game.addProjectile = this.addProjectile.bind(this);
        game.hasNoObstacles = this.hasNoObstacles.bind(this);

        //Flow.demoFlow();

    }

    addProjectile(projectile) {
        this.projectiles.add(projectile);
        projectile.model = {
            maskSprite: game.make.sprite(-1000, -1000, projectile.key + ".mask", projectile.frame),
            noRender: true
        };
        binaryInsertSortY(projectile, this.maskedGrp);
        return projectile;
    }

    onProjectileExplode(projectile) {
        if (Phaser.Point.distance(projectile, this.hero) < 32) {
            this.maskedGrp.push({ghost: true, x: this.hero.x, y: this.hero.y})
            this.hero.restart(this.heroStart);
        }
        for (let g of this.grass) {
            g.checkProjectile(projectile);
        }
        this.heatmap.destroyMovementAt(projectile.x, projectile.y, 32);
        for (let flow of this.flows) {
            flow.destroyAt(projectile.x, projectile.y, 32);
        }

    }

    hasNoObstacles(p1, p2) {
        let line = new Phaser.Line(p1.x, p1.y, p2.x, p2.y), wall;
        for (let wi = 0; wi < this.walls.children.length; wi++) {
            wall = this.walls.children[wi];
            if (Phaser.Line.intersectsRectangle(line, wall.rect)) return false;
        }
        return true;
    }

    initGrass(bm) {
        let n = 0, n2;
        bm.update();
        const K = 5;
        let vals = new Map();
        bm.processPixelRGB((color, x, y) => {
            //a = 1 --> each 5 pix = 5 * pow(10,1-1)
            //a = 0.5 --> each 50pix = 5 * pow(10,1-0.5)
            n = K * Math.pow(10, 1-(color.a / 255)) | 0;
            if (color.a < 2) return;
            n2 = game.rnd.integerInRange(n/2, n);
            //n = Math.pow((color.a/255) * 0.1, 2);
            vals.set(n, (vals.get(n) || 0) + 1);
            if (((x)%n === 0 && y%(2*n) === 0) || ((x+n/2)%n === 0 && (y+n)%(2*n) === 0)) {
                //if (game.rnd.frac() < n) {
                let dx = 0;//game.rnd.integerInRange(-n/2, n/2);
                let dy = game.rnd.integerInRange(-n/2, n/2);
                let count = game.rnd.weightedPick([3,2,1]);//.integerInRange(1,3);
                for (let i = -count; i<=count; i+=K/2) {
                    this.grass.push(new GrassModel(x + dx+i, y + dy));
                }
            }
        });
    }

    get bgKey() { return this.levelKey + ".bg"}
    get levelKey() { throw new Error("override!")}

    onCollideProjectileWithHero(one, two) {
        let proj = one === this.hero ? two : one;
        proj.onCollide();
    }

    update() {
        game.physics.arcade.collide(this.hero, this.walls);
        if (game.physics.arcade.overlap(this.hero, this.exit)) {
            console.log("you win!");
            game.state.start(this.nextState);
        }
        game.physics.arcade.overlap(this.hero, this.projectiles, this.onCollideProjectileWithHero.bind(this));
        if (this.hero.active) {
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown) vx = -1;
            if (this.cursors.right.isDown) vx = 1;
            if (this.cursors.up.isDown) vy = -1;
            if (this.cursors.down.isDown) vy = 1;
            this.hero.doMove(vx, vy);

            if (this.keys.space.isDown && this.hero.placeIce()) {
                let ice = new IceDiamond(this.hero.x, this.hero.y - 2, this.heatmap);
                this.invisibleHero.add(ice);
                binaryInsertSortY(ice, this.maskedGrp);
                ice.events.onDestroy.addOnce(() => {
                    this.maskedGrp.splice(this.maskedGrp.indexOf(ice), 1);
                });
            }
        }

        for (let g of this.grass) {
            g.checkCollisionWith(this.hero);
            g.update();
        }
        //only hero is moving!
        let heroIdx = this.maskedGrp.indexOf(this.hero);
        this.maskedGrp.splice(heroIdx, 1);
        binaryInsertSortY(this.hero, this.maskedGrp);

        //this.maskedGrp = sort(this.maskedGrp);
        //this.maskedGrp.sort((a, b) => a.y-b.y);
        this.renduror.grp = this.maskedGrp;
        this.renduror.renderMask();
        if (!DEBUG_HEATMAP || this.keys.z.isDown) this.heatmap.update();

        (game.world.filters || []).forEach(f => f.update());
    }

    render() {
        fpsEl.innerText = game.time.fps;
    }
}

function sort(array) {
    let copy = array.slice();
    let out = new Array();
    let mi = copy.length;
    while (mi-->0) {
        binaryInsertSortY(copy[mi], out);
    }
    return out;

}

class Level1 extends BaseLevel {

    get levelKey() { return "level1"; }

    get nextState() { return "Level2" }
}

class Level2 extends BaseLevel {
    get levelKey() { return "level2"; }

    get nextState() { return "Win"}
}

let fpsEl = document.querySelector("#fps");


// it shall be from -pi to pi
function normalizeAngle(a1) {
    while (a1 > Math.PI) a1 -= 2 * Math.PI;
    while (a1 < -Math.PI) a1 += 2 * Math.PI;
    return a1;
}

function angleBetween(a, b) {
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
}

function vectorBetween(a, b) {
    return Phaser.Point.subtract(a, b).normalize();
}

function vectorFromAngle(a) {
    return new Phaser.Point(Math.cos(a), Math.sin(a));
}

function reach(currentValue, targetValue, step) {
    if (Math.abs(targetValue - currentValue) < step) return targetValue;
    return currentValue + step*Math.sign(targetValue - currentValue);
}



//got from https://gist.github.com/eloone/11342252
function binaryInsertSortY(sprite, array, start = 0, end = array.length-1){

    let length = array.length;
    let m = start + Math.floor((end - start)/2);

    if (length === 0){
        array.push(sprite);
        return 0;
    }

    if(sprite.y < array[end].y){
        array.splice(end + 1, 0, sprite);
        return end+1;
    }

    if(sprite.y > array[start].y){//!!
        array.splice(start, 0, sprite);
        return start;
    }

    if(start >= end){
        array.splice(end+1, 0, sprite);
        return end+1;
    }

    if(sprite.y > array[m].y){
        binaryInsertSortY(sprite, array, start, m - 1);
    } else if(sprite.y < array[m].y){
        binaryInsertSortY(sprite, array, m + 1, end);
    } else {
        array.splice(m, 0, sprite);
        return m;
    }
}

