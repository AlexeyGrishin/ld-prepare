function preload() {
    game.load.spritesheet('ruslan', '../game10/ruslan.png', 16, 16);
    game.load.spritesheet('wood', '../game10/ruslan.png', 16, 2);
    game.load.spritesheet('cloud', '../game6/cloud.png', 64, 32);
    game.load.spritesheet('ground', '../game3/ground.png', 512, 512);
    game.time.advancedTiming = true;

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

let group;
let flameTexture, flameGroup, flameSprite, flameBitmap;
let cursor, keys;

class Fire3 extends Phaser.Filter {
    constructor() {
        super(game);
        this.fragmentSrc = [`
            precision mediump float; 
            
            varying vec2       vTextureCoord;
            uniform float      time;
            uniform sampler2D  uSampler;
        
            //#define OFFSET(dx, dy) texture2D(uSampler, transform * vec2(gl_FragCoord.x + float(dx), gl_FragCoord.y + float(dy)))
            
            float rand(float n){return fract(sin(n) * 43758.5453123);}
            
            vec4 fireColor() {
                return vec4(0xb0, 0x12, 0x17, 255)/255.;
            }
            
            vec4 smokeColor() {
                return vec4(0x0, 0x0, 0x0, 255)/255.;
            }
            
            void main(void) {
                
                float curFrame = fract(time*1.5) / 2.;
                
                vec4 color = texture2D(uSampler, vTextureCoord);
                float minFrame = color.r;
                float maxFrame = color.g;
                float intensity = color.b;
                float something = color.a;
                
                float k1 = (step(minFrame, curFrame)) * (1. - step(maxFrame+1./255., curFrame)) * intensity * 255. * something;
                float k2 = (step(minFrame, curFrame + 0.5)) * (1. - step(maxFrame+1./255., curFrame + 0.5)) * intensity * 255. * something;
                vec4 clr = mix(fireColor(), smokeColor(), pow(0.5*(maxFrame+minFrame), 0.1));
                float alpha = pow(clamp(0.5 - 0.5*(maxFrame+minFrame), 0., 1.), 0.2);
                gl_FragColor = clr * k1 + clr * k2;
                //gl_FragColor = (k1+k2)*vec4(1,0,0,1);
                             
            }          
        `];
    }
}

function createBurningBitmap(opts = {height: 32, dx: 4, ddx: 16, radius1: 4, steps: 16, count: 32, offsetMul: 6, intensityMul: 3}) {
    let bm = game.add.bitmapData(48, 64);

    let {height,dx,ddx,radius1,steps,count,offsetMul,intensityMul} = opts;


    let particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: bm.width/2 + game.rnd.integerInRange(-4,4),
            y: bm.height - radius1 + game.rnd.integerInRange(-4,0),
            r: radius1,// + game.rnd.integerInRange(-2,0),
            vx: (ddx + game.rnd.integerInRange(-dx,dx)) / steps,
            vy: (game.rnd.integerInRange(-height,-height*3/4)) / steps,
            vr: 0.9,
            offset: i*offsetMul// i/COUNT*STEPS*8//game.rnd.integerInRange(i, STEPS)
        });
    }
    bm.update(0, 0, bm.width, bm.height);

    //r = min frame, g = max frame, b = count of intersections
    function drawCircle(x, y, radius, frame, checkObj) {
        for (let xx = x - radius; xx <= x + radius; xx++) {
            for (let yy = y - radius; yy <= y + radius; yy++) {
                if (Math.hypot(xx-x,yy-y) <= radius) {
                    let alreadyUsed = checkObj[xx+'_'+yy];
                    let idx = 4 * yy * bm.width + 4 * xx;
                    let hasSomething = bm.data[idx+3] > 0;
                    bm.data[idx+0] = hasSomething ? Math.min(bm.data[idx+0], frame) : frame;//r
                    bm.data[idx+1] = hasSomething ? Math.max(bm.data[idx+1], frame) : frame;//g
                    if (!alreadyUsed) {
                        bm.data[idx+2] = Math.min(255, bm.data[idx+2] + intensityMul);
                    }
                    bm.data[idx+3] = 255;//a
                    checkObj[xx+'_'+yy] = 1;
                    //console.log(xx,yy, bm.data[idx+0], bm.data[idx+1], bm.data[idx+2], bm.data[idx+3])
                }

            }
        }
    }

    for (let particle of particles) {
        let checkObj = {};
        for (let step = 0; step < steps; step += 1) {
            let frame = particle.offset + (255 * step / steps / 2)|0;
            //console.log(step, '->',frame);

            particle.x += particle.vx + game.rnd.realInRange(-1,1);
            particle.y += particle.vy + game.rnd.realInRange(-1,1);
            particle.r *= particle.vr;

            drawCircle(particle.x|0, particle.y|0, particle.r|0, frame, checkObj);
        }
   }

    bm.context.putImageData(bm.imageData, 0, 0);
    bm.dirty = true;

    return bm;
}

let exampleSprite, burningBitmap, bSprite2;

function create() {
    makeSharped();
    game.stage.backgroundColor = "#2c8196";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    group = game.add.group();


    let cloud1 = game.add.sprite(100,40,'cloud',0);
    group.add(cloud1);

    cloud1.burning = true;

    let burningBitmap = createBurningBitmap();

    exampleSprite = game.add.sprite(-10000, -100, burningBitmap);
    exampleSprite.anchor.set(0.5, 0.9);

    bSprite2 = game.add.sprite(-1000,-100, createBurningBitmap({
        radius1: 3, height: 16, ddx: -4, dx: 4, steps: 16, count: 16, offsetMul: 8, intensityMul:8
    }));
    bSprite2.anchor.set(0.5, 0.9);
    //exampleSprite.filters = [new Fire3()];
    //exampleSprite.update = () => exampleSprite.filters[0].update();


    flameGroup = game.add.group();
    //flameTexture = game.add.renderTexture(game.world.width, game.world.height);
    flameTexture = game.add.bitmapData(game.world.width, game.world.height);
    flameSprite = game.add.sprite(0, 0, flameTexture, 0, flameGroup);
    flameSprite.filters = options.useShader ? [new Fire3()] : undefined;
    updateFlameTexture();

    for (let i = 0; i < options.spritesCount; i++) {
        let sprite1 = game.add.sprite(40+i*10,40+i,'ruslan', 2);
        group.add(sprite1);
        sprite1.burning = bSprite2;
        game.add.tween(sprite1).to({x:sprite1.x + 10+i*5,y: sprite1.y + 20+i}, 500+10*i, null, true, 0, -1, true);
    }
}

function updateFlameTexture() {
    flameTexture.clear();
    flameTexture.blendDarken();
    group.forEach(sprite => {
        if (sprite.burning) {
            flameTexture.draw(sprite.burning instanceof Phaser.Sprite ? sprite.burning : exampleSprite, sprite.centerX, sprite.centerY);
        }
    });
    flameTexture.dirty = true;


}

function update() {
    updateFlameTexture();
    for (let f of flameSprite.filters ||[]) f.update();
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}