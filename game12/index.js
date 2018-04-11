const AnimationFrames = {
    "rtp": {
        "worker1": 0,
        "worker_work1": 1,
        "worker_work2": 2,
        "tool1": 3,
        "tool2": 4,
        "worker_jump1": 5,
        "worker_jump2": 6,
        "worker_jump3": 7,
        "worker_jump4": 8,
        "worker_walk1": 9,
        "worker_walk2": 10,
        "worker_walk3": 11,
        "bag1": 12,
        "bag2": 13,
        "bag3": 14,
        "ground1": 15,
        "ground2": 16,
        "ground_top1": 17,
        "ground_top2": 18,
        "ground_top3": 19,
        "big_stone": 20,
        "small_stone": 21,
        "tree1": 22,
        "tree2": 23,
        "building1": 24,
        "building2": 25,
        "well1": 26,
        "catapult1": 27,
        "catapult_fire1": 28,
        "catapult_fire2": 29,
        "catapult_fire3": 30
    },
    "rtp2": {
        "sworcher1": 0,
        "sworcher_walk1": 1,
        "sworcher_walk2": 2,
        "sworcher_attack1": 3,
        "sworcher_attack2": 4,
        "sworcher_attack3": 5,
        "sworcher_attack4": 6,
        "archer1": 7,
        "archer_walk1": 8,
        "archer_walk2": 9,
        "archer_ready1": 10,
        "archer_ready2": 11,
        "archer_ready3": 12,
        "archer_ready4": 13,
        "archer_ready5": 14,
        "archer_afterfire1": 15,
        "archer_afterfire2": 16,
        "archer_afterfire3": 17,
    }
};


function preload() {
    game.load.spritesheet("rtp", "rtp.png", 16, 16);
    game.load.spritesheet("rtp2", "rtp2.png", 16, 16);
    game.load.tilemap('level1', 'l1.json', null, Phaser.Tilemap.TILED_JSON);
}

let state = {};


class SideShader extends Phaser.Filter {
    constructor() {
        super(game);
        this.uniforms.points = {value: 0, type: '4fv'};
        this.uniforms.npoints = {value: 0, type: '1f'};
        this.fragmentSrc = [`
         precision highp float;
         uniform sampler2D uSampler;
         varying vec2 vTextureCoord;
         uniform vec2 resolution;
         uniform vec4 points[50];
         uniform float npoints;
         
         #define WHITE 1.
         #define BLACK 0.
         
        float dithering2(vec2 xy) {
           return ceil(mod(xy.x+xy.y, 2.));
         }
         
         float dithering4(vec2 xy) {
           return floor(mod(xy.x*2.+xy.y, 4.));
         }
         
         float dithering42(vec2 xy, float edge) {
           float a1 = step(fract(xy.x / edge), 1./edge);
           float a2 = step(fract(xy.y / edge), 1./edge);
           return a2*a1;
         }
         float dithering52(vec2 xy, float edge) {
           float a1 = step(fract(xy.x / edge), 1./edge);
           float a2 = step(fract(xy.y / edge), 1./edge);
           float a3 = step(fract((xy.x+0.5*edge) / edge), 1./edge);
           float a4 = step(fract((xy.y+0.5*edge) / edge), 1./edge);
           return max(a2*a1, a3*a4);
         }         
         
         float dither(vec2 xy, float white) {
            if (white < 0.1) return 0.;
            if (white < 0.2) return dithering42(xy, 8.); 
            if (white < 0.3) return dithering52(xy, 8.); 
            if (white < 0.4) return dithering52(xy, 4.); 
            //if (white < 0.5) return dithering2(xy); 
            if (white < 0.6) return dithering2(xy); 
            if (white < 0.7) return 1. - dithering52(xy, 4.); 
            if (white < 0.8) return 1. - dithering52(xy, 8.); 
            if (white < 0.9) return 1. - dithering42(xy, 8.); 
            return 1.;
           
         }         
         
        
         void main() {
            vec2 coord = gl_FragCoord.xy;
            vec4 color = texture2D(uSampler, vTextureCoord);
            gl_FragColor = color;
            
            bool weOnBackground = color.r == 0.;
            bool weOnUnit = color.g == 1. && color.a == 1.;
            bool weOnGround = !weOnBackground && !weOnUnit;
            
            //if (!weOnBackground && !weOnUnit) return;

            
            float minblacks[3];
            minblacks[0] = minblacks[1] = minblacks[2] = 10000.;
            float minwhites[3];
            minwhites[0] = minwhites[1] = minwhites[2] = 10000.;
            
            float allblacks = 0.;
            float allwhites = 0.;
            for (int i = 0; i < 50; i++) {
                if (float(i) >= npoints) break;
                float len = length(points[i].xy - coord);
                if (points[i].w == WHITE) {
                  allwhites += 1./len * points[i].z;
                  if (len < minwhites[0]) minwhites[0] = len; 
                  else if (len < minwhites[1]) minwhites[1] = len;
                  else if (len < minwhites[2]) minwhites[2] = len;
                } else {
                  allblacks += 1./len * points[i].z ;
                  if (len < minblacks[0]) minblacks[0] = len; 
                  else if (len < minblacks[1]) minblacks[1] = len;
                  else if (len < minblacks[2]) minblacks[2] = len;
                }
            }
            
            float clr = 0.;
            float EDGE = 2.;
            if (minwhites[0] < EDGE && minblacks[0] > EDGE) {
              clr = 1.;
            } else if (minblacks[0] < EDGE && minwhites[0] > EDGE) {
              clr = 0.;
            } else {
              #define CLR(i) (minblacks[i] / (minblacks[i]+minwhites[i]))
              //clr = (minblacks[0] + minblacks[1] + minblacks[2]) / ((minblacks[0] + minblacks[1] + minblacks[2]) + (minwhites[0] + minwhites[1] + minwhites[2]));
              //clr = CLR(0)*0.7 + CLR(1)*0.2 + CLR(2)*0.1;
              clr = allwhites / (allwhites + allblacks);
            }
            
            float pw = 0.5;
            //clr = clr < 0.5 ? pow(clr, pw) : (1. - pow(1. - clr, pw));
            clr = clr < 0.5 ? 0.5 - pow(0.5 - clr, pw) : (0.5 + pow(clr - 0.5, pw));
            
            // minblack = 10, minwhite = 20, clr = 10/30 = 0.333
            // minblack = 20, minwite = 10, clr = 20/30 = 0.666
            
            //white side - background is black, units are white
            //black side - background is white, units are black
            
            #define DITHER(clr) dither(gl_FragCoord.xy, 1. - clr)
            //#define DITHER(clr) (1.-clr)
            
            if (weOnBackground) {
                gl_FragColor = vec4(vec3(1.,1.,1.) * DITHER(clr), 1.);
            } else if (weOnUnit) {
                gl_FragColor = vec4(vec3(1.,1.,1.) * (clr), 1.);
            } else if (weOnGround) {
                gl_FragColor = vec4(vec3(1.,1.,1.) * (1. - DITHER(clr)), 1.);
            }
         }
        
        `];
    }

    setPoints(objects) {
        this.uniforms.points.value = objects.reduce((a,b) => a.concat([b.x, game.world.height - b.y, b.radius, b.side]), []);
        this.uniforms.npoints.value = objects.length;
    }
}

class Dithering extends Phaser.Filter {

    constructor() {
        super(game);
        this.fragmentSrc = `
         precision highp float;
         uniform sampler2D uSampler;
         varying vec2 vTextureCoord;

         float dithering2(vec2 xy) {
           return ceil(mod(xy.x+xy.y, 2.));
         }
         
         float dithering4(vec2 xy) {
           return floor(mod(xy.x*2.+xy.y, 4.));
         }
         
         float dithering42(vec2 xy, float edge) {
           float a1 = step(fract(xy.x / edge), 1./edge);
           float a2 = step(fract(xy.y / edge), 1./edge);
           return a2*a1;
         }
         float dithering52(vec2 xy, float edge) {
           float a1 = step(fract(xy.x / edge), 1./edge);
           float a2 = step(fract(xy.y / edge), 1./edge);
           float a3 = step(fract((xy.x+0.5*edge) / edge), 1./edge);
           float a4 = step(fract((xy.y+0.5*edge) / edge), 1./edge);
           return max(a2*a1, a3*a4);
         }         
         
         float dither(vec2 xy, float white) {
            if (white < 0.1) return 0.;
            if (white < 0.2) return dithering42(xy, 8.); 
            if (white < 0.3) return dithering52(xy, 8.); 
            if (white < 0.4) return dithering52(xy, 4.); 
            if (white < 0.5) return dithering2(xy); 
            if (white < 0.6) return 1. - dithering2(xy); 
            if (white < 0.7) return 1. - dithering52(xy, 4.); 
            if (white < 0.8) return 1. - dithering52(xy, 8.); 
            if (white < 0.9) return 1. - dithering42(xy, 8.); 
            return 1.;
           
         }
         
         void main() {
           float d = dither(gl_FragCoord.xy, vTextureCoord.x);
           gl_FragColor = vec4(d,d,d, 1.);
         }
         
        `;
    }
}

class Component {

    constructor() {
        this.sprite = null;
    }

    attachTo(sprite) {
        this.sprite = sprite;
        this.sprite.events.onDestroy.addOnce(this.detach, this);
        this.setSelf(sprite);
        this.onAttach();
        return this;
    }

    setSelf(sprite) {throw new Error("override")}
    resetSelf(sprite) {throw new Error("override")}

    onAttach() {}
    onDetach() {}
    onUpdate() {}

    detach() {
        this.resetSelf(this.sprite);
        this.onDetach();
        this.sprite.events.onDestroy.remove(this.detach, this);
        this.sprite = null;
    }
}

class ComponentableSprite extends Phaser.Sprite {
    constructor(...args) {
        super(...args);
        this.data.components = this.componentClasses.map(kls => (new kls).attachTo(this));
        this.liveRadius = 16; //todo: component as well!
    }

    get componentClasses() { return [];}

    update() {
        this.updateBeforeComponents();
        for (let c of this.data.components) c.onUpdate();
        this.updateAfterComponents();
        if (!this.alive) {
            this.liveRadius -= 0.2;
        }
        if (this.liveRadius < 0) {
            this.destroy();
        }
    }

    updateAfterComponents() {}
    updateBeforeComponents() {}
}

class Destroyable extends Component {
    constructor() {
      super();
    }
}

//todo: components are done wrong way, so will need to re-iterate anyway
class Selectable extends Component {
    constructor() {
        super();
    }

    static getSelf(sprite) { return sprite.data.selectable; }
    setSelf(sprite) { sprite.data.selectable = this;}
    resetSelf(sprite) { sprite.data.selectable = null;}

    onAttach() {
        this.sprite.inputEnabled = true;
        this.sprite.events.onInputDown.add(this.onClick, this);
    }

    onDetach() {
        if (state.selected === this.sprite) state.selected = null;
    }

    static setSelected(sprite) {
        if (state.selected) {
            Selectable.getSelf(state.selected).onDeselect();
        }
        state.selected = sprite;
        if (state.selected) {
            Selectable.getSelf(state.selected).onSelect();
        }
    }

    onDeselect() {
        this.sprite.tint = 0xffffff;
    }

    onSelect() {
        this.sprite.tint = 0xff0000;
    }

    onClick(p) {
        console.log('sprite click');
        state.selectHandled = true;
        Selectable.setSelected(this.sprite);
    }
}

class Melee extends Component {
    static getSelf(sprite) { return sprite.data.melee; }
    setSelf(sprite) { sprite.data.melee = this;}
    resetSelf(sprite) { sprite.data.melee = null;}

    onAttach() {

    }

    onDetach() {

    }

    onUpdate() {

    }

    onCollideWith(enemy) {
        this.sprite.animations.play('attack').onComplete.addOnce(() => {
           enemy.kill();
           this.sprite.data.walkable.resume();
        });
    }

}

class Walkable extends Component {
    static getSelf(sprite) { return sprite.data.walkable; }
    setSelf(sprite) { sprite.data.walkable = this;}
    resetSelf(sprite) { sprite.data.walkable = null;}

    onAttach() {
        game.physics.arcade.enableBody(this.sprite);
        this.sprite.body.onMoveComplete.add(this.onMoveComplete, this);
    }

    resume() {
        //console.log('resume');
        this.goTo(this.targetXY.x, this.targetXY.y);
    }

    onMoveComplete() {
        //console.log('move complete')
        //this.sprite.x = this.movementTarget.x;
        //this.sprite.y = this.movementTarget.y;
        this.inMovement = false;
    }

    onDetach() {
        if (this.sprite && this.sprite.body) this.sprite.body.onMoveComplete.remove(this.onMoveComplete, this);
    }


    goTo(x, y) {
        let gridx = (x/16)|0, gridy = (y/16)|0;
        let tgrisx = (this.sprite.x/16)|0, tgridy = (this.sprite.y/16)|0;
        this.targetXY = {x,y};
        let way;
        try {
            way = findWay(state.waypoints, {x: tgrisx, y: tgridy+1}, {x:gridx, y: gridy+1});
        }
        catch (e) {
            this.sprite.kill();
            return;
        }
        this.way = null;
        if (way) {
            this.way = way;
        }
    }


    perform(action, x, y) {
        if (this.inMovement) return;
        if (Math.hypot(x-this.sprite.x,y-this.sprite.y) < 4) {
            this.sprite.x = x;
            this.sprite.y = y;
            return;
        }
        if (Math.abs(x-this.sprite.x) > 20) {
            this.goTo(this.targetXY.x, this.targetXY.y);
            return;
        }
        this.inMovement = true;
        //todo: something different for different actions
        this.direction = x > this.sprite.x ? "right" : "left";
        this.sprite.animations.play("walk");
        let p = new Phaser.Point(x-this.sprite.x,y-this.sprite.y);
        //let dist = ;
        this.movementTarget = {x,y};
        this.sprite.body.moveTo(1000, p.getMagnitude(), Phaser.Math.radToDeg(Phaser.Point.angle(p, {x:0,y:0})));
        /*this.tween = game.add.tween(this.sprite).to({x,y}, Math.hypot(x-this.sprite.x,y-this.sprite.y)*10, null, true);
        this.tween.onComplete.addOnce(() => {
            this.inMovement = false;
        })*/
    }



    stop() {
        //this.tween = null;
        this.sprite.body.stopMovement();
        this.inMovement = false;
        this.sprite.animations.stop();
    }

    onUpdate() {
        if (!this.inMovement && this.way) {
            if (!this.way.length) {
                this.stop();
                this.way = null;
            } else {
                let {x,y} = this.way.shift();
                this.perform("move", x*16,y*16-16 );
            }
        }
        if (!this.sprite) return;
        if (!this.inMovement) {
            this.sprite.body.velocity.x = 0;
            this.sprite.body.velocity.y = 0;
        }
        this.sprite.scale.set(this.direction === 'left' ? -1 : 1, 1);
    }

}

//todo: component projectile or like that
class Stone extends Phaser.Sprite {
    constructor(x,y,side) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.big_stone);
        this.anchor.set(0.5, 0.5);
        this.side = side;
        game.physics.arcade.enableBody(this);
    }

    throw(vx, vy) {
        this.body.velocity.x = vx;
        this.body.velocity.y = vy;
        this.lifespan = 5000;
    }

    update() {
        this.body.angle += 0.1 * Math.sign(this.body.velocity.x);
        this.lifespan -= game.time.physicsElapsedMS;
        this.body.velocity.y += 1;
        if (this.lifespan < 0) {
            this.destroy();
        }
    }
}

class CatapultFire extends Component {
    static getSelf(sprite) { return sprite.data.catapultFire; }
    setSelf(sprite) { sprite.data.catapultFire = this;}
    resetSelf(sprite) { sprite.data.catapultFire = null;}

    onAttach() {

    }

    onDetach() {

    }

    attackPoint(x, y) {
        if (this.isFiring) return;
        this.isFiring = true;
        this.sprite.direction = x < this.sprite.x ? "left" : "right";
        this.sprite.animations.play('attack').onComplete.addOnce(() => {
            let proj = new Stone(this.sprite.x, this.sprite.y, this.sprite.side);
            //proj.scale.set(10,10);
            state.groups.projectiles.add(proj);
            let p = new Phaser.Point(x - this.sprite.x, y - this.sprite.y);
            let p2 = p.normalize().multiply(200,100);
            proj.throw(p2.x, p2.y);
            game.time.events.add(1500, () => {
                //todo: if destroyed - do not call
                this.sprite.animations.play('idle');
                this.isFiring = false;
            });
        });
    }

    onUpdate() {
        //todo: copypaste from walkable. directionable? :)
        this.sprite.scale.set(this.sprite.direction === 'left' ? -1 : 1, 1);
    }

}

class Town extends Phaser.Sprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.building1);
        this.side = side;
        this.liveRadius = 32;
    }
}

class Worker extends ComponentableSprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.worker1);
        this.side = side;
        this.anchor.set(0.5, 0);
        this.animations.add('walk', [AnimationFrames.rtp.worker1, AnimationFrames.rtp.worker_walk1, AnimationFrames.rtp.worker_walk2, AnimationFrames.rtp.worker_walk3], 16, true);
        this.animations.add('work', [AnimationFrames.rtp.worker_work1, AnimationFrames.rtp.worker_work1], 16, true);
        this.direction = 'right';
    }

    get componentClasses() { return [Selectable, Walkable]}
}

class Swordsman extends ComponentableSprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp2', AnimationFrames.rtp2.sworcher1);
        this.side = side;
        this.anchor.set(0.5, 0);
        this.animations.add('walk', [AnimationFrames.rtp2.sworcher1, AnimationFrames.rtp2.sworcher_walk1, AnimationFrames.rtp2.sworcher_walk2], 16, true);
        this.animations.add('attack', [AnimationFrames.rtp2.sworcher_attack1, AnimationFrames.rtp2.sworcher_attack2, AnimationFrames.rtp2.sworcher_attack3, AnimationFrames.rtp2.sworcher_attack4, AnimationFrames.rtp2.sworcher1], 16);
        this.direction = 'right';
    }

    get componentClasses() { return [Selectable, Walkable, Melee]}
}

class Catapult extends ComponentableSprite {
    constructor(x, y, {side}) {
        super(game, x, y, 'rtp', AnimationFrames.rtp.catapult1);
        this.side = side;
        this.anchor.set(0.5, 0);
        this.animations.add('attack', [AnimationFrames.rtp.catapult_fire1, AnimationFrames.rtp.catapult_fire2, AnimationFrames.rtp.catapult_fire3], 16);
        this.animations.add('idle', [AnimationFrames.rtp.catapult1], 16, true);
        this.direction = "left";
    }

    get componentClasses() { return [Selectable, CatapultFire]}
}

function waypointsSimple(map) {
    let points = [];
    let ID = 1;

    map.forEach((tile) => {
        if (tile.index === -1) return;
        let point = {x: tile.x, y: tile.y, waysfromhere: [], waystohere: [], id: ID++};
        points.push(point);
        tile.point = point;
    },0, 0, 0, map.width, map.height);

    //very unoptimal
    let nei, way;

    function addWay(from, toTile, way) {
        if (!toTile || toTile.index === -1) return false;
        let to = toTile.point;
        way.from = from;
        way.to = to;
        from.waysfromhere.push(way);
        to.waystohere.push(way);
        return true;
    }

    for (let p1 of points) {
        //check left
        if (!addWay(p1, map.getTile(p1.x-1, p1.y), {action: 'move', dx: -1, dy: 0})) {
            //check fall
            for (let y = p1.y + 1; y < map.height; y++) {
                if (addWay(p1, map.getTile(p1.x-1, y), {action: 'fall', dx: -1, dy: 0})) break;
            }
        }
        //check right
        if (!addWay(p1, map.getTile(p1.x+1, p1.y), {action: 'move', dx: +1, dy: 0})) {
            //check fall
            for (let y = p1.y + 1; y < map.height; y++) {
                if (addWay(p1, map.getTile(p1.x+1, y), {action: 'fall', dx: +1, dy: 0})) break;
            }
        }
        for (let y = p1.y - 1; y >= 0; y--) {
            if (map.getTile(p1.x, y)) break;
            if (p1.y - y > 3) break;
            if (map.getTile(p1.x-1, y) && !map.getTile(p1.x-1,y-1)) {
                addWay(p1, map.getTile(p1.x-1, y), {action: 'jump', dx:-1, dy: p1.y-y});
            }
            if (map.getTile(p1.x+1, y) && !map.getTile(p1.x+1,y-1)) {
                addWay(p1, map.getTile(p1.x+1, y), {action: 'jump', dx:+1, dy: p1.y-y});
            }
        }
    }
    return points;
}

function findWay(points, fromxy, toxy) {
    //very unoptimized, im too lazy to connect ngraph.path right now. easier to write it again!
    let fromPoint = points.find(p => p.x === fromxy.x && p.y === fromxy.y);
    if (!fromPoint) throw new Error("no point at " + fromxy.x + "," + fromxy.y);
    let toPoint = points.find(p => p.x === toxy.x && p.y === toxy.y);
    if (!toPoint) throw new Error("no point at " + toxy.x + "," + toxy.y);
    let ways = [[fromPoint]];
    let checked = new Set([fromPoint.id]);
    while (ways.length) {

        let newWays = [];
        for (let way of ways.slice()) {
            let lastPoint = way[way.length-1];
            if (lastPoint.id === toPoint.id) {
                return way;
            }
            for (let nextway of lastPoint.waysfromhere) {
                if (!checked.has(nextway.to.id)) {
                    newWays.push([...way, nextway.to]);
                    checked.add(nextway.to.id);
                }
            }
        }
        ways = newWays;
    }
    return [];
}


function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
// scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(2, 2);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

function create() {
    game.gamestate = state;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    state.map = game.add.tilemap('level1');
    state.map.addTilesetImage('rtp');
    state.platformsLayer = state.map.createLayer('platforms');
    //state.groundLayer = state.map.createLayer('ground');
    state.map.setLayer(state.platformsLayer);
    state.platformsLayer.resizeWorld();
    game.camera.setBoundsToWorld();

    state.selected = null;
    state.mousedown = null;
    state.selectionRect = null;

    //makeSharped();

    state.groups = {
       buildings: game.add.group(),
       units: game.add.group(),
       projectiles: game.add.group()
    };

    for (let {name, type, x, y, properties} of state.map.objects['units']) {
        switch (type) {
            case "Town":
                y -= 16;
                state.groups.buildings.add(new Town(x,y,properties));
                break;
            case "Worker":
                y -= 16;
                state.groups.units.add(new Worker(x,y,properties));
                break;
            case "Sworcher":
                y -= 16;
                state.groups.units.add(new Swordsman(x,y,properties));
                break;
            case "Catapult":
                y -= 15;
                state.groups.units.add(new Catapult(x,y,properties));
                break;
            default:
                console.log(type,x,y, properties && properties.side);

        }
    }

    state.waypoints = waypointsSimple(state.map);

    game.input.onUp.add(onUp);

    game.world.filters = [state.shader = new SideShader()];
}

function onUp(pointer) {
    //console.log('click', e);
    if (state.selected && Phaser.Point.distance(state.selected, pointer) > 20) {
        console.log('order for selected')
        if (state.selected.data.walkable) {
            state.selected.data.walkable.goTo(game.input.position.x, game.input.position.y);
        }
        if (state.selected.data.catapultFire) {
            state.selected.data.catapultFire.attackPoint(game.input.position.x, game.input.position.y)
        }
    }
}

function update() {
    let pos = game.input.position;
    let tilex = Math.floor(pos.x / 16), tiley = Math.floor(pos.y / 16);
    let tileAt = state.map.getTile(tilex, tiley+1);
    state.shader.setPoints(state.groups.units.children.concat(state.groups.buildings.children).concat(/*state.groups.projectiles.children*/[]).map(b => {
        return {x:b.centerX,y:b.centerY,side: b.side === 'white' ? 1 : 0, radius: b.liveRadius}
    }))
    /*if (tileAt && tileAt.index !== -1 && state.selected) {
        let from = {
            x: (state.selected.x/16)|0,
            y: ((state.selected.y/16)|0) + 1
        };
        state.debugway = findWay(state.waypoints, from, {x:tilex, y:tiley+1} );
    } else {
        state.debugway = [];
    }*/

    //ok, this does not work due to non-physics velocity... let's do overlap and punch them back for 1 grid cell
    game.physics.arcade.collide(state.groups.units, state.groups.units, onUnitsCollide, beforeUnitsCollide);
    game.physics.arcade.collide(state.groups.projectiles, state.groups.units, onProjectileUnitCollide);

    //state.groups.units.forEachDead(u => u.destroy());

    /*if (!state.mousedown && game.input.activePointer.isDown) {
        state.mousedown = {x:pos.x, y:pos.y};
    }
    if (state.mousedown) {
        if (game.input.activePointer.isDown) {
            state.selectionRect = new Phaser.Rectangle(state.mousedown.x, state.mousedown.y, pos.x - state.mousedown.x, pos.y - state.mousedown.y)
           // console.log(state.selectionRect.x, state.selectionRect.y)
        } else {
            state.selectionRect = null;
            state.mousedown = null;
        }
    }*/

    let ordered = 0;
    state.groups.units.forEachAlive(unit => {
        //if (ordered > 10) return;

        let goal = state.groups.buildings.children.find(c => c.side !== unit.side);
       if (unit.data.walkable && !unit.data.walkable.way) {
           unit.data.walkable.goTo(goal.x, goal.y);
       }
       if (unit.data.catapultFire && !unit.data.catapultFire.isFiring) {
           unit.data.catapultFire.attackPoint(goal.x, goal.y-400)
       }
        ordered++;
    });

}

function onProjectileUnitCollide(o1, o2) {
    o2.kill();
    o1.kill();
}

function beforeUnitsCollide(u1,u2) {
    return u1.side !== u2.side;
}

function onUnitsCollide(u1, u2) {
    u1.data.walkable.stop();
    u2.data.walkable.stop();
    if (u1.data.melee) u1.data.melee.onCollideWith(u2);
    if (u2.data.melee) u2.data.melee.onCollideWith(u1);
}


function debugRender1() {
    //game.debug.text(game.input.position, 16, 16);
    if (state.debugway && state.debugway.length) {
        state.debugway.forEach(w => game.debug.geom(new Phaser.Circle(w.x*16,w.y*16,4), "red"))
    }
    if (state.selectionRect) game.debug.geom(state.selectionRect, "rgba(255,0,0,0.2)")
}