function preload() {
    game.load.spritesheet('ruslan', '../game10/ruslan.png', 16, 16);
    game.load.spritesheet('cloud', '../game6/cloud.png', 64, 32);
    game.load.image('fire', './fire.png');
    game.load.image('fire', './fire.png');
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

class Fire4 extends Phaser.Filter {
    constructor() {
        super(game);
        let sprite = game.add.sprite(-10000, -10000, 'fire');
        this.uniforms.iChannel0.value = sprite.texture;
        this.fragmentSrc = [`
            precision mediump float; 
            
            varying vec2       vTextureCoord;
            uniform float      time;
            uniform sampler2D  uSampler;
            uniform sampler2D  iChannel0;
            
            #define HEIGHT 3.
            #define SMOKE_HEIGHT 5.
            #define DX(dy) dy*pow(abs(dy)/(HEIGHT+SMOKE_HEIGHT), 2.)
            
            float rand(vec2 n) { 
                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
            }
        
            vec4 getByOffset(float dx, float dy) {
                vec2 xy = gl_FragCoord.xy + vec2(dx,dy);
                vec2 uv = xy / vec2(${game.world.width}., ${game.world.height}.);
                return texture2D(uSampler, uv);
            }
            
            vec4 getFlameFor(float dy, float seed) {
                vec4 clr = getByOffset(DX(dy), dy);
                float randomU = fract(seed + (time*4.));
                float a = mix(0.5, 1.0, seed*fract(time*seed));
                return clr.a * texture2D(iChannel0, vec2(randomU, abs(dy)/HEIGHT * 0.6))*a;
            }
            
            vec4 getSmokeFor(float dy, float seed) {
                vec4 clr = getByOffset(DX(dy), dy);
                float randomU = 0.5;//seed;
                float v = fract(abs(seed-time*5.))*(abs(dy)-HEIGHT)/SMOKE_HEIGHT * 0.3 + 0.8;
                float a = mix(0.4, 0.7, seed*fract(time)/10.);
                return clr.a * texture2D(iChannel0, vec2(randomU, v)) * a;
            }
        
            void main(void) {
                vec4 result = getByOffset(0., 0.);
                float seed = rand(gl_FragCoord.xy);// * vec2(time, -time));
                vec4 flame1 = getFlameFor(0., seed);
                vec4 flame2 = getFlameFor(-1., seed);
                vec4 flame3 = getFlameFor(-2., seed);
                vec4 flame4 = getFlameFor(-3., seed);
                vec4 flame5 = getSmokeFor(-5., seed);
                vec4 flame6 = getSmokeFor(-6., seed);
                vec4 flame7 = getSmokeFor(-7., seed);
                vec4 flame8 = getSmokeFor(-8., seed);
                
                result = mix(result, flame1, flame1.a);
                result = mix(result, flame2, flame2.a);
                result = mix(result, flame3, flame3.a);
                result = mix(result, flame4, flame4.a);
                result = mix(result, flame5, flame5.a);
                result = mix(result, flame6, flame6.a);
                result = mix(result, flame7, flame7.a);
                result = mix(result, flame8, flame8.a);
                
                gl_FragColor = result;
            }          
        `];
    }
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

    let circle = game.add.bitmapData(100, 120);
    let ctx = circle.ctx;
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(50, 70, 30, 0, Math.PI*2);
    ctx.stroke();
    let cs = game.add.sprite(10, 100, circle);
    group.add(cs);
    cs.burning = true;

    flameGroup = game.add.group();

    game.world.filters = [new Fire4()];

}
function update() {
    for (let f of game.world.filters ||[]) f.update();
}

let fpsEl = document.querySelector("#fps");
function debugRender1() {
    fpsEl.innerText = game.time.fps;
    //game.debug.text(game.time.fps, game.camera.width/2,25);
}