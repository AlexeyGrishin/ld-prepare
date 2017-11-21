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


class Fire2 extends Phaser.Filter {
    constructor() {
        super(game);
        this.uniforms.ddx = { type: '1f', value: 0 };
        this.uniforms.fireHeight = { type: '1f', value: 9 };
        this.uniforms.fireRadius = { type: '1f', value: 2 };

        this.fragmentSrc = [`
        precision mediump float; 
        
        varying vec2       vTextureCoord;
        uniform float      time;
        uniform float      fireRadius;
        uniform float      fireHeight;
        uniform sampler2D  uSampler;
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
        
        vec4 fireColor(float sx, float sy) {
            return vec4(0xb0 / 2, 0x12 * 2, 0x17, 255)/255. * (.5 + .2*rand(vec2(sx,sy)));
        }
        
        vec4 smokeColor(float sx, float sy) {
            return vec4(0x01, 0x01, 0x01, 255)/255. * (.5 + .2*rand(vec2(sx,sy)));
        }
                
        vec2 pointOn(vec2 xy) {
            return xy * vTextureCoord / gl_FragCoord.xy;
        }       
         
        float particlePoint(float sx, float sy) {
            vec2 f = pointOn(vec2(sx,sy));
            return texture2D(uSampler, f).a;
        }
        
        float particleCircle(float sx, float sy) {
            vec2 f = pointOn(vec2(sx,sy));
            vec4 color = texture2D(uSampler, f);
            float radius1 = color.a;
            float radius2 = 0.5 * particlePoint(sx-1., sy)
                          + 0.5 * particlePoint(sx+1., sy)
                          + 0.5 * particlePoint(sx, sy-1.)
                          + 0.5 * particlePoint(sx, sy+1.);
                          
            float radius3 = 0.2 * particlePoint(sx-2., sy)              
                          + 0.2 * particlePoint(sx-1., sy-1.)
                          + 0.2 * particlePoint(sx, sy-2.)
                          + 0.2 * particlePoint(sx+1., sy-1.)
                          + 0.2 * particlePoint(sx+2., sy)
                          + 0.2 * particlePoint(sx+1., sy+1.)
                          + 0.2 * particlePoint(sx, sy+2.)
                          + 0.2 * particlePoint(sx-1., sy+1.);
            return color.r * radius1 + color.g * radius2 + color.b * radius3;
        }
        
        #define MAX_O 3.
        
        
      
        vec4 fireParticle(vec2 xy, float timeline, float offsetSeed) { //timeline = 0..1, offsetSeed = 0..1
            float dx = (2.*rand(xy) - 1.)*4. + ddx;
            float dy = (1. + rand(xy.xy)*1. + sin(dx+time*3.))*fireHeight;
            float revtimeline = pow(1. - timeline, 1.);
            
            float sdx = rand(offsetSeed)*MAX_O;
            float sdy = rand(sdx)*MAX_O;
            
            float sx = floor(xy.x - dx*timeline + sdx);
            float sy = floor(xy.y - dy*timeline + sdy);
            float r = 1. + rand(xy.xy)*fireRadius;
            float targetR = r*revtimeline;
            vec4 baseColor = mix(fireColor(sx,sy), smokeColor(sx,sy), pow(timeline, 10.));
            return baseColor * particleCircle(sx, sy) * revtimeline * (0.5 + 0.5*noise(vec2(sx,sy)));            
        }
        
        void main(void) {
            float tl1 = time/1.;
            tl1 = ceil(tl1*10.)/100.;
            gl_FragColor = vec4(0,0,0,0);
            
            for (float c = 0.; c < 1.; c += 0.1) {
                gl_FragColor += fireParticle(gl_FragCoord.xy, fract(tl1+c), fract(tl1-c));
            }
            //gl_FragColor = fireParticle(gl_FragCoord.xy, .5, 0.);
            
        }   
        
        `]
    }


    update() {
        super.update();
    }
}

class SpecificBlur extends Phaser.Filter {
    constructor() {
        super(game);
        this.fragmentSrc = [`
            precision mediump float; 
            
            varying vec2       vTextureCoord;
            uniform float      time;
            uniform sampler2D  uSampler;
        
            #define OFFSET(dx, dy) texture2D(uSampler, transform * vec2(gl_FragCoord.x + float(dx), gl_FragCoord.y + float(dy)))
            
            float rand(float n){return fract(sin(n) * 43758.5453123);}
            
            void main(void) {
                vec2 transform = vTextureCoord / gl_FragCoord.xy;
                float a = 1. / 9.;
                vec4 avgColor = a*OFFSET(-1,-1) + a*OFFSET(-1,0) + a*OFFSET(-1,1)
                              + a*OFFSET(0,-1)  + a*OFFSET(0,0)  + a*OFFSET(0,1)
                              + a*OFFSET(1,-1)  + a*OFFSET(1,0)  + a*OFFSET(1,1);
                float avgc = avgColor.r * avgColor.a;
                //r = 1 - radius 1 
                //g = 1 - radius 2
                //b = 1 - radius 3
                gl_FragColor.a = step(0.1, avgc);
                float radiusProp = rand(avgc);
                gl_FragColor.r = step(0.3, radiusProp);
                gl_FragColor.g = step(0.5, radiusProp);
                gl_FragColor.b = step(0.7, radiusProp);
                             
            }          
        `];
    }
}

let group;
let flameTexture, flameGroup, flameSprite, flameBitmap;
let cursor, keys;


function create() {
    makeSharped();
    game.stage.backgroundColor = "#2c8196";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    group = game.add.group();


    let cloud1 = game.add.sprite(100,40,'cloud',0);
    group.add(cloud1);

    cloud1.burning = true;

    flameGroup = game.add.group();
    flameTexture = game.add.renderTexture(game.world.width, game.world.height);
    flameSprite = game.add.sprite(0, 0, flameTexture, 0, flameGroup);
    flameSprite.filters = options.useShader ? [new SpecificBlur(), new Fire2()] : undefined;
    updateFlameTexture();

    for (let i = 0; i < options.spritesCount; i++) {
        let sprite1 = game.add.sprite(40+i,40+i,'ruslan', 2);
        group.add(sprite1);
        sprite1.burning = true;
        game.add.tween(sprite1).to({x:sprite1.x + 10+i*5,y: sprite1.y + 20+i}, 500+10*i, null, true, 0, -1, true);
    }
}

function updateFlameTexture() {
    flameTexture.clear();
    group.forEach(sprite => {
        if (sprite.burning) {
            flameTexture.renderRawXY(sprite, sprite.x, sprite.y);
        }
    });


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