function preload() {
    game.load.spritesheet('ruslan', '../game10/ruslan.png', 16, 16);
    game.load.spritesheet('wood', '../game10/ruslan.png', 16, 2);
    game.load.spritesheet('cloud', '../game6/cloud.png', 64, 32);
    game.load.spritesheet('ground', '../game3/ground.png', 512, 512);
    game.time.advancedTiming = true;

}

class Fire1 extends Phaser.Filter {
    constructor(parentSprite) {
        super(game);

        this.over = parentSprite;

        this.uniforms.iChannel0.value = parentSprite.texture;
        this.uniforms.iChannel0.textureData = {nearest: true};// = parentSprite.texture;
        this.uniforms.offset = { type: '2f', value: {x:0,y:0} };
        this.uniforms.worldSize = { type: '2f', value: {x:0,y:0} };
        this.uniforms.size = { type: '2f', value: {x:0,y:0} };
        this.uniforms.texOffset = { type: '2f', value: {x:0,y:0} };
        this.uniforms.texFrameSize = { type: '2f', value: {x:1,y:1} };
        this.uniforms.ddx = { type: '1f', value: 0 };
        this.uniforms.fireHeight = { type: '1f', value: 9 };
        this.uniforms.fireRadius = { type: '1f', value: 2 };

        this.fragmentSrc = [`
        
        precision mediump float; 
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform vec2       resolution;
        uniform vec2       size;
        uniform vec2       worldSize;
        uniform float      time;
        uniform float      fireRadius;
        uniform float      fireHeight;
        uniform sampler2D  uSampler;
        uniform sampler2D  iChannel0;
        
        uniform vec2       texOffset;
        uniform vec2       texFrameSize;
        
        uniform float      ddx;
        
        float rand(float n){return fract(sin(n) * 43758.5453123);}
        float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}
	
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

        vec2 pointOn(vec2 xy) {
            vec2 p1 = (xy - vec2(offset.x, worldSize.y-offset.y))/vec2(size.x,size.y);
            p1.y = 1. - p1.y;
            return p1*texFrameSize + texOffset;
        }
        
                
        float inside(vec2 f) {
            return f.x >= texOffset.x && f.y >= texOffset.y && f.x < texOffset.x+texFrameSize.x && f.y < texOffset.y+texFrameSize.y ? 1. : 0.;//todo: ifs!!
        }
        
        #define CHECK_OFFSET 2.
        #define MAX_R 1.
        #define MAX_O 3.
        
        float particlePoint(float sx, float sy) {
            vec2 f = pointOn(vec2(sx,sy));
            vec2 fupper = pointOn(vec2(sx,sy+CHECK_OFFSET)); // pointOn(vec2(sx,sy+ 3.+ cos(sx+time*3.)*2.));
            float ins = inside(f);
            float insupper = inside(fupper);
            return ins * texture2D(iChannel0, f).a * (insupper == 1. /*redo without ifs*/ ? (1. - texture2D(iChannel0, fupper).a) : 1.);
        }
        
        #define CHECK_POINT(dx,dy) {float dist = length(vec2(dx,dy/2.)); float alpha = (1.-step(r,dist))*(1.-dist/r); outf += particlePoint(sx+dx,sy+dy)*alpha;}
        
        float particleCircle(float sx, float sy, float r) {
            float outf = 0.;
            for (float x = -MAX_R; x <= MAX_R; x++) {
                for (float y = -MAX_R; y <= MAX_R; y++) {
                    float dist = abs(length(vec2(x,y/2.)));
                    float alpha = (1.-step(r, dist))*(1. - dist/r);
                    outf += (particlePoint(sx+x,sy+y)*alpha);
                }
            }
            return outf;
        }
        
        vec4 fireColor(float sx, float sy) {
            return vec4(1., 1./3., 0, 1.) * (.3 + .2*rand(vec2(sx,sy)));
        }
        
        vec4 smokeColor(float sx, float sy) {
            return vec4(1./2., 1./2., 1./2., 1.) * (.5 + .2*rand(vec2(sx,sy)));
        }

        vec4 fireParticle(vec2 xy, float timeline, float offsetSeed) { //timeline = 0..1, offsetSeed = 0..1
            float dx = (2.*rand(xy) - 1.)*4. + ddx;
            float dy = (1. + rand(xy.xy)*1. + sin(dx+time*3.))*fireHeight;
            float revtimeline = pow(1. - timeline, 0.2);
            
            float sdx = rand(offsetSeed)*MAX_O;
            float sdy = rand(sdx)*MAX_O;
            
            float sx = floor(xy.x - dx*timeline + sdx);
            float sy = floor(xy.y - dy*timeline + sdy);
            float r = 1. + rand(xy.xy)*fireRadius;
            float targetR = r*revtimeline;
            vec4 baseColor = mix(fireColor(sx,sy), smokeColor(sx,sy), pow(timeline, 0.5));
            //return baseColor * particleCircle(sx, sy, targetR) * revtimeline * (0.5 + 0.5*noise(vec2(sx,sy)));            
            return baseColor * particlePoint(sx, sy) * revtimeline * (0.5 + 0.5*noise(vec2(sx,sy)));            
        }
        
        void main(void) {
        
            vec2 f = pointOn(gl_FragCoord.xy);
            float isinside = inside(f);//f.x >= 0. && f.y >= 0. && f.x < 1. && f.y < 1. ? 1. : 0.;//todo: ifs!!
            //gl_FragColor = vec4(1,0,0,1)* f.y;// ((gl_FragCoord.x-offset.x)/worldSize.x);
            float tl1 = /*noise(gl_FragCoord.xy) +*/ time/1.;
            tl1 = ceil(tl1*10.)/10.;
            gl_FragColor = vec4(0,0,0,0);
            
            for (float c = 0.; c < 1.; c += 0.1) {
                gl_FragColor += fireParticle(gl_FragCoord.xy, fract(tl1+c), c);
            }
            
            //gl_FragColor = fireParticle(gl_FragCoord.xy, fract(tl1), -1.);
            //gl_FragColor += fireParticle(gl_FragCoord.xy, fract(tl1+0.5), 1.);
            
            //gl_FragColor = vec4(1,0,0,0.5)*texture2D(iChannel0, f).a*isinside;
            return;
        }        
        `]
    }

    update() {
        super.update();
        this.uniforms.worldSize.value = {x: game.world.width, y: game.world.height}; //todo: or camera?
        this.uniforms.size.value = {x: this.over.width, y: this.over.height};
        this.uniforms.offset.value = {x: this.over.left, y: this.over.bottom};//todo
        if (this.over.body && this.over.body.velocity) {
            let d = this.uniforms.ddx.value;
            let target = -this.over.body.velocity.x / 10;
            if (d !== target) {
                let maxDelta = (target - d);
                let delta = Math.sign(maxDelta) * 0.2;
                if (Math.abs(delta) > Math.abs(maxDelta)) delta = maxDelta;
                this.uniforms.ddx.value += delta;
            }
        }
        //this.uniforms.time.value = 0;
        //console.log(this.uniforms.resolution.value);
    }
}

let sprite1, fireOver;
let sprite2, fireOver2;
let sprite3, fireOver3;
let sprite4, fireOver4;

let burnedSprites = [];

const OVERWORLD = "overworld";
const PERSPRITE = "persprite";
const PARTICLES = "particles";

let mode = PERSPRITE;

function createBurningSprite(sprite) {
    switch (mode) {
        case OVERWORLD:
            sprite.fireOver = {
                filters: undefined
            };//just to not wall
            break;
        case PERSPRITE:
            let fireOver = game.add.sprite(0, 0);
            fireOver.width = sprite.width*2;
            fireOver.height = sprite.height*4;
            fireOver.anchor.set(0.5, 1);
            sprite.addChild(fireOver);

            let fire = new Fire1(sprite);
            fireOver.filters = [fire];
            sprite.fireOver = fireOver;
            sprite.fireFilter = fire;
            break;
    }
}

let cursors, keys;
function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
// scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(2, 2);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

var burning = false;

function create() {
    makeSharped();

    game.stage.backgroundColor = !burning ? "#220011" : "#ccecff";

    game.physics.startSystem(Phaser.Physics.ARCADE);
    //game.physics.arcade.gravity.y = 100;


    /*let bitmap = game.add.bitmapData(24,24);
    bitmap.ctx.fillStyle = "green";
    bitmap.ctx.fillRect(6,2,4,14);
    bitmap.ctx.fillRect(2,6,12,4);
    sprite1 = game.add.sprite(12, 70, bitmap);
    sprite1.anchor.set(0.5, 1);
    sprite1.bitmap = bitmap;

    fireOver = game.add.sprite(0, 0);
    fireOver.width = 24;
    fireOver.height = 64;
    fireOver.anchor.set(0.5, 1);
    sprite1.addChild(fireOver);

    fireOver.filters = [new Fire1(sprite1)];*/

    cursors = game.input.keyboard.createCursorKeys();

    keys = {
        space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
    };

    /*sprite2 = new Hero(30, 70-8);
    game.world.add(sprite2);

    fireOver2 = game.add.sprite(0, 0);
    fireOver2.width = 24;
    fireOver2.height = 64;
    fireOver2.anchor.set(0.5, 1);
    sprite2.addChild(fireOver2);

    let fire2 = new Fire1(sprite2);
    fireOver2.filters = [fire2];
    fire2.uniforms.texOffset.value = {x:1/13,y:0};
    fire2.uniforms.texFrameSize.value = {x:1/13,y:1};

    sprite3 = game.add.sprite(100, 100, 'cloud');
    sprite3.anchor.set(0.5, 1);
    fireOver3 = game.add.sprite(0, 0);
    fireOver3.width = 128;
    fireOver3.height = 64;
    fireOver3.anchor.set(0.5, 1);
    fireOver3.filters = [new Fire1(sprite3)];
    sprite3.addChild(fireOver3);

    let bm4 = game.add.bitmapData(40,80);
    let bm4burn = game.add.bitmapData(40, 80);
    burned = new Burned(bm4, bm4burn);
    sprite4 = game.add.sprite(200, 120, bm4);
    sprite4.bitmap = bm4;
    sprite4.burnmap = bm4burn;
    sprite4.anchor.set(0.5, 1);
    sprite4.burnsprite = game.add.sprite(200, 120, bm4burn);
    sprite4.burnsprite.anchor.set(0.5, 1);
    game.world.bringToTop(sprite4);
    //sprite4.burnsprite.visible = false;
    //sprite4.addChild(sprite4.burnsprite);

    fireOver4 = game.add.sprite(0,0);
    fireOver4.width = 64;
    fireOver4.height = 128;
    fireOver4.anchor.set(0.5, 1);
    fireOver4.filters = [new Fire1(sprite4.burnsprite)];
    sprite4.burnsprite.addChild(fireOver4);

    fireOver.visible = fireOver2.visible = fireOver3.visible = fireOver4.visible = burning;*/

    for (let i = 0; i < 100; i++) {
        let oneMoreSprite = new Hero(10, 50+i/2);
        game.world.add(oneMoreSprite);
        createBurningSprite(oneMoreSprite);
        if (oneMoreSprite.fireFilter) {
            oneMoreSprite.fireFilter.uniforms.texOffset.value = {x: 1 / 13, y: 0};
            oneMoreSprite.fireFilter.uniforms.texFrameSize.value = {x: 1 / 13, y: 1};
        }
        burnedSprites.push(oneMoreSprite);
    }

    if (mode === OVERWORLD) {
        let overallFilter = new Fire1({
            width: game.world.width,
            height: game.world.height,
            left: 0,
            bottom: game.world.height
        });
        game.world.filters = [overallFilter];
        game.world.fireOver = {};
        burnedSprites.push(game.world);
    }

    burnedSprites.forEach(bs => bs.fireOver.visible = burning);


}

var burned;

class Burned {
    constructor(bitmap, bitmapburn) {
        this.bitmap = bitmap;
        this.bitmapburn = bitmapburn;
        bitmap.fill(255,255,240);
        this.bitmapburn.ctx.fillStyle = "green";
        this.model = [];
        for (let x = 0; x < bitmap.width; x++) {
            this.model.push({y:0, ts: game.rnd.integerInRange(500,800)});
            this.bitmapburn.ctx.fillRect(x, 0, 1, 1);
        }
    }

    update() {
        let updated = false;
        for (let x = 0; x < this.model.length; x++) {
            if (this.model[x].y >= this.bitmap.height) return;
            this.model[x].ts -= game.time.elapsedMS;
            if (this.model[x].ts < 0) {
                this.model[x].ts = game.rnd.integerInRange(500,800) - 200*((x)/this.model.length);
                this.bitmap.ctx.clearRect(x, this.model[x].y, 1, 1);
                this.bitmapburn.ctx.clearRect(x, this.model[x].y, 1, 1);
                this.model[x].y++;
                this.bitmapburn.ctx.fillRect(x, this.model[x].y, 1, 1);
                updated = true;
            }
        }
        if (updated) {
            this.bitmap.dirty = true;
            this.bitmapburn.dirty = true;
        }
    }
}


function updateFilters(...sprites) {
    for (let s of sprites) {
        if (s.filters) s.filters.forEach(f => f.update())
    }
}

function update() {
    //updateFilters(fireOver, fireOver2, fireOver3, fireOver4);
    updateFilters(...burnedSprites.map(bs => bs.fireOver));

    for (let bs of burnedSprites) {
        if (bs instanceof Hero) {
            if (!burning) {
                bs.stop();
            } else {
                if (bs.walking) {
                    if (bs.x > 500) {
                        bs.move(-1);
                    }
                    if (bs.x < 10) {
                        bs.move(+1);
                    }
                } else {
                    bs.move(+1);
                }
            }
        }
    }
/*
    if (cursors.left.isDown) {
        sprite2.move(-1);
    } else if (cursors.right.isDown) {
        sprite2.move(+1);
    } else {
        sprite2.stop();
    }

    if (fireOver.visible) burned.update();
*/
    if (keys.space.justDown) {
        let wasVisible = burning;
        /*[fireOver, fireOver2, fireOver3, fireOver4].forEach(v => {
            v.visible = !wasVisible;
        });*/
        burnedSprites.forEach(bs => bs.fireOver.visible = !wasVisible);
        game.stage.backgroundColor = !wasVisible ? "#220011" : "#ccecff";

        burning = !burning;
    }

}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}


const SPEED = 60;

class Hero extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'ruslan', 1);
        this.anchor.set(0.5, 1);
        this.animations.add('walk', [1,2,3], 16, true);
        this.animations.add('handle', [4,5,6], 16, true);
        game.physics.arcade.enableBody(this);
        this.walking = false;
        this.handling = false;
        this.body.collideWorldBounds = true;

        this.aim = game.add.bitmapData(50, 50);
        let aimSprite = game.add.sprite(0, -8, this.aim);
        aimSprite.anchor.set(0.5, 0.5);
        this.addChild(aimSprite);
        this.aimAngle = -Math.PI/4;
        this.ts = 0;
        this.children[0].visible = false;
    }

    updateAim() {
        this.ts += game.time.physicsElapsedMS;
        this.aim.clear();
        this.aim.ctx.strokeStyle = "red";
        this.aim.ctx.lineWidth = 1;
        this.aim.ctx.beginPath();
        this.aim.ctx.moveTo(25, 25);
        let dx = Math.cos(this.aimAngle)*16;
        let dy = Math.sin(this.aimAngle)*16;
        this.aim.ctx.setLineDash([4,4]);
        this.aim.ctx.lineDashOffset = -(this.ts/200)%8;
        this.aim.ctx.lineTo(25+dx, 25+dy);
        this.aim.ctx.stroke();
        this.aim.dirty = true;
    }

    altAngle(delta) {
        this.aimAngle += delta;
        if (this.aimAngle > -Math.PI/6) {
            this.aimAngle = -Math.PI/6;
        }
        if (this.aimAngle < -Math.PI/2) {
            this.aimAngle = -Math.PI/2;
        }
    }

    move(direction) {
        if (this.dancing) return;
        if (direction > 0) {
            this.scale.set(1, 1);
            this.body.velocity.x = SPEED;
        } else {
            this.scale.set(-1, 1);
            this.body.velocity.x = -SPEED;
        }
        if (!this.walking) {
            this.animations.play(this.handling ? 'handle' : 'walk');
            this.walking = true;
        }
    }

    stop() {
        if (this.dancing) return;
        this.body.velocity.x = 0;
        this.animations.stop();
        this.walking = false;
    }

    dance() {
        if (this.handling) this.throwWood();
        this.stop();
        this.dancing = true;
        this.animations.play('handle');
        game.add.tween(this).to({x: this.x+8}, 500, null, true, null, -1, true);
    }

    handleWood(w) {
        if (this.dancing) return;

        this.children[0].visible = true;
        this.handling = w;
        this.animations.play('handle');
        if (!this.walking) {
            this.animations.stop();
        }
        this.handling.data.offset = 0;
        w.body.enable = false;
        //w.body.velocity.set(0, 0);
        //w.body.allowGravity = false;
        this.update();
    }

    update() {
        if (this.handling) {
            this.handling.x = this.x + this.handling.data.offset;
            this.handling.y = this.y - 14;
            if (this.frame === 2 || this.frame === 5) {
                this.handling.y += 1;
            }
        }
        this.updateAim();

    }

    throwWood() {
        if (this.dancing) return;

        this.children[0].visible = false;
        this.handling.body.enable = true;
        this.handling.body.allowGravity = true;
        this.handling.body.immovable = false;
        this.handling.data.offset = 0;
        let sx = Math.cos(this.aimAngle)*100;
        let sy = Math.sin(this.aimAngle)*100;
        this.handling.body.velocity.set(Math.sign(this.scale.x) * sx, sy);
        this.handling = null;
        this.animations.play('walk');
        if (!this.walking) {
            this.animations.stop();
        }

    }


}
