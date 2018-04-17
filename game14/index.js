window.ALEXEY_PROVED = true;

class LoadState {
    preload() {
        game.load.image("level1.bg", "level1.png");
        game.load.image("level2.bg", "level2.png");
        game.load.image("level3.bg", "level3.png");
        game.load.spritesheet("cat", "meteo-cat.png", 16, 16);
        game.load.spritesheet("grass", "meteo-grass.png", 16, 16);
        game.load.spritesheet("misc", "meteo-misc.png", 16, 16);
        game.load.spritesheet("trees", "meteo-trees.png", 16, 16);
        game.load.spritesheet("fire", "fire.png", 16, 16);
        game.load.image("firetexture", "firetexture.png");
        game.load.image("lava-1", "lava-1.png");
        game.load.image("water-1", "water-1.png");
        game.load.image("pipe-2", "pipe-2.png");
        game.load.image("water-2", "water-2.png");
        game.load.image("water-31", "water-31.png");
        game.load.image("water-32", "water-32.png");
        game.load.tilemap("level1", "map1.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.tilemap("level2", "map2.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.tilemap("level3", "map3.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.audio("music1", "frozen-1.ogg");
        game.rnd.sow([0]);
        game.time.advancedTiming = true;
        makeSharped();
    }

    create() {
        createMaskSpritesheet('grass', true, false, (fi) => fi < 21);
        createMaskSpritesheet('fire', false, true);
        createMaskSpritesheet('trees', true, false, () => true);
        createMaskSpritesheet('cat', false, true);
        createMaskSpritesheet('misc', false, true);
        game.music = game.add.sound("music1").play(undefined, undefined, 0.6, true);
        let lib = {"explosion":{"Frequency":{"Start":44,"Slide":-0.71,"RepeatSpeed":0.07,"ChangeSpeed":0.6767148937582615,"ChangeAmount":11.496596211476469,"Max":220,"Min":153},"Generator":{"Func":"noise","B":0},"Volume":{"Sustain":0.14,"Decay":0.251,"Punch":0.11,"Attack":0.011,"Master":0.52},"Filter":{"LP":0.99,"HP":0,"LPSlide":1,"HPSlide":-0.11,"LPResonance":0.89},"Vibrato":{"Frequency":0.01,"Depth":0.08,"FrequencySlide":0.01},"Phaser":{"Offset":0.75,"Sweep":-0.65}},"fire":{"Frequency":{"Start":76,"Slide":-0.01,"RepeatSpeed":0,"Min":113,"Max":251,"ChangeAmount":-12,"DeltaSlide":-1},"Generator":{"Func":"triangle","ASlide":-0.5,"BSlide":1,"B":1,"A":0},"Phaser":{"Offset":-0.03,"Sweep":-0.82},"Volume":{"Sustain":0.17,"Decay":0.471,"Punch":0.19,"Attack":0.001,"Master":1},"Vibrato":{"Frequency":1.01,"Depth":0.18,"FrequencySlide":0.6,"DepthSlide":0.83},"Filter":{"HP":0,"LP":1}},"freeze":{"Frequency":{"Start":200,"Slide":0.1,"Min":278,"Max":398},"Vibrato":{"Depth":0.2,"Frequency":3.01,"DepthSlide":-0.03,"FrequencySlide":0.83},"Generator":{"Func":"synth"},"Volume":{"Sustain":0.31795825857994836,"Decay":1.331,"Attack":0.091}},"cool":{"Frequency":{"Start":184.21439605070142,"Min":530.993599988916,"Max":1447.1188719523338,"Slide":0.17936147773177602,"DeltaSlide":-0.45662796368987024,"RepeatSpeed":2.112301481170091,"ChangeAmount":3.9970456539836476,"ChangeSpeed":0.7917707252304746},"Vibrato":{"Depth":0.686114126329183,"DepthSlide":0.5874120889378238,"Frequency":42.91891942369315,"FrequencySlide":-0.4637672665849397},"Generator":{"Func":"synth","A":0.15995785189304712,"B":0.4826123672769218,"ASlide":-0.5252949980079618,"BSlide":-0.720506290725186},"Guitar":{"A":0.26376978931430206,"B":0.9191230664957835,"C":0.4521463298105701},"Phaser":{"Offset":0,"Sweep":-0.61},"Volume":{"Master":0.4,"Attack":0.6258079433110993,"Sustain":1.877912696679962,"Punch":2.794075926428912,"Decay":1.8527269593245017}},"freeze2":{"Frequency":{"Start":242.31667764078972,"Min":1524.694537020016,"Max":1603.911308040573,"Slide":0.4287598898750109,"DeltaSlide":0.4495420723338399,"RepeatSpeed":1.5246908030943396,"ChangeAmount":2.2322994115414687,"ChangeSpeed":0.12389445705853919},"Vibrato":{"Depth":0.12046225739266436,"DepthSlide":-0.05,"Frequency":21.01,"FrequencySlide":-0.2},"Generator":{"Func":"sine","A":0.5604263639818596,"B":0.7483387944605602,"ASlide":-0.8235948958841464,"BSlide":-0.8068134580551054},"Guitar":{"A":0.7487069465854195,"B":0.3182362739352764,"C":0.34710223860056266},"Phaser":{"Offset":-0.77,"Sweep":-0.07},"Volume":{"Master":0.4,"Attack":0.071,"Sustain":0.14356821439301948,"Punch":0.23,"Decay":0.221}},"win":{"Frequency":{"Start":184,"Min":297,"Max":579,"Slide":0.48,"DeltaSlide":-0.17,"RepeatSpeed":3,"ChangeAmount":-12,"ChangeSpeed":0},"Vibrato":{"Depth":0.47,"DepthSlide":-0.03,"Frequency":1.01,"FrequencySlide":-0.20169023403657382},"Generator":{"Func":"synth","A":0.24094215779136285,"B":0.8047674164546779,"ASlide":-0.5746110122236354,"BSlide":-0.8234057866069842},"Guitar":{"A":0.8680376992535788,"B":0.787662149701966,"C":0.18344977594642198},"Phaser":{"Offset":0.82,"Sweep":-1},"Volume":{"Master":0.4,"Attack":0.10125296047186062,"Sustain":0.047382540142184126,"Punch":1.0075817094466677,"Decay":1.9227613181283023},"Filter":{"HP":0,"LP":0.98,"LPSlide":0.41}}};
        lib = Object.assign(lib, {"cannot":{"Frequency":{"Start":96,"Min":30,"Max":96,"Slide":1,"RepeatSpeed":0.11,"DeltaSlide":-0.69,"ChangeSpeed":0,"ChangeAmount":-11},"Vibrato":{"Frequency":1.01,"Depth":0,"FrequencySlide":-0.03},"Generator":{"Func":"saw"},"Filter":{"LP":1,"HP":0.05,"LPSlide":0.03,"LPResonance":0},"Phaser":{"Offset":-0.03,"Sweep":-0.01},"Volume":{"Punch":0,"Decay":0.001,"Master":0.25,"Sustain":0.32,"Attack":0.001}}});
        game.sfx = jsfx.Sounds(lib);
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
        game.music.fadeOut(500);

        game.add.sprite(MAP_WIDTH_PIX/2, MAP_HEIGHT_PIX/2+20, "cat", 0);


        let membraneSettings = {
            pitchDelay: 0.5,
            octaves: 5,
            oscillator: {
                type: 'sine',
                volume: +5
            },
            envelope  : {
                attack  : 0.5 ,
                decay  : 0.4 ,
                sustain  : 0.01 ,
                release  : 1.4 ,
            },
        }

        let drum = new Tone.MembraneSynth(membraneSettings).toMaster();

        let stringSettings = {
            attackNoise  : 16 ,
            dampening  : 1000 ,
            resonance  : 1
        };

        let vibratoSettings = {
            type: 'square'
        };
        let vibrato = new Tone.Vibrato(vibratoSettings).toMaster();

        let strings = new Tone.PluckSynth(stringSettings).connect(vibrato);

        Tone.MultiPlayer = Tone.Expr = Tone.TimelineSignal = function() {};

        /*Tone.Editor
            .add({drum, strings, vibrato}).master();
        Tone.Editor.options({
            // Align the panel left or right
            align: 'right'
        });*/

        let stringNotes = ["C1", "E1", "A1", "B1", "C1", "F1", "B1", "A1"];
        let stringsLoop = new Tone.Sequence(function(time, n){
            if (n !== -1) {
                //metal.frequency.setValueAtTime(n * 100, time);
                //synt.triggerAttackRelease(notes[n], "8n", time);
                strings.triggerAttackRelease(stringNotes[n], "16n", time);
            } else {
            }
        }, [0,-1,1,-1,2,-1,3,-1,4,-1,5,-1,6,-1,7,-1], "8n");

        let drumNotes = ["C2", "E2", "A2", "B2"];
        let drumsLoop = new Tone.Sequence(function(time, n) {
            if (n !== -1) {
                drum.triggerAttackRelease(drumNotes[n], "16n", time);
            }
        }, [0,0,-1,-1,2,3,-1,-1,0,0,-1,-1,1,-1, 1,-1], "8n")

        drumsLoop.start();
        stringsLoop.start();
        setTimeout(() => {
            Tone.Transport.start();
        }, 0);

        Tone.Transport.schedule(() => {
            console.log("ramping down");
            Tone.Transport.bpm.rampTo(10, 120);
            Tone.Master.volume.rampTo(-100, 200);

        }, "4:0")

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

const FireShaderParts = `
            #define HEIGHT 3.
            #define SMOKE_HEIGHT 5.
            //#define DX(dy) dy*pow(abs(dy)/(HEIGHT+SMOKE_HEIGHT), 5.)
            #define DX(dy) floor(abs(dy) > HEIGHT ? -(abs(dy)/(HEIGHT+SMOKE_HEIGHT)*2.) : 0.)
            //#define DX(dy) 0.
            #ifndef GET_BY_OFFSET
            #define GET_BY_OFFSET(dx, dy) getByOffset(dx, dy)
            #endif
            
            float rand(vec2 n) { 
                return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
            }
        
            vec4 getByOffset(float dx, float dy) {
                vec2 xy = gl_FragCoord.xy + vec2(dx,dy);
                xy.y = ${MAP_HEIGHT_PIX}. - xy.y;
                vec2 uv = xy / vec2(${MAP_WIDTH_PIX}., ${MAP_HEIGHT_PIX}.);
                return texture2D(MAIN_TEXTURE, uv);
            }
            
            vec4 getFlameFor(float dy, float seed) {
                vec4 clr = GET_BY_OFFSET(DX(dy), dy);
                float randomU = fract(seed + (time*4.));
                float a = mix(0., 1.0, seed*fract(time*seed*4.));
                return clr.a * texture2D(FIRE_TEXTURE, vec2(randomU, abs(dy)/HEIGHT * 0.6))*a;
            }
            
            vec4 getSmokeFor(float dy, float seed) {
                vec4 clr = GET_BY_OFFSET(DX(dy), dy);
                float randomU = 0.5;//seed;
                float v = fract(abs(seed-time*5.))*(abs(dy)-HEIGHT)/SMOKE_HEIGHT * 0.3 + 0.8;
                float a = mix(0., 0.7, seed*fract(time)/10.);
                return clr.a * texture2D(FIRE_TEXTURE, vec2(randomU, v)) * a;
            }
            
            
            vec4 getFireColor(vec4 result) {
                float seed = rand(gl_FragCoord.xy);// * vec2(time, -time));
                vec4 flame1 = getFlameFor(0., seed);
                vec4 flame2 = getFlameFor(-1., seed);
                vec4 flame3 = getFlameFor(-2., seed);
                vec4 flame4 = getFlameFor(-3., seed);
                vec4 flame44 = getFlameFor(-4., seed);
                vec4 flame5 = getSmokeFor(-5., seed);
                vec4 flame6 = getSmokeFor(-6., seed);
                vec4 flame7 = getSmokeFor(-7., seed);
                vec4 flame8 = getSmokeFor(-8., seed);
                
                result = mix(result, flame1, flame1.a);
                result = mix(result, flame2, flame2.a);
                result = mix(result, flame3, flame3.a);
                result = mix(result, flame4, flame4.a);
                result = mix(result, flame44, flame44.a);
                result = mix(result, flame5, flame5.a);
                result = mix(result, flame6, flame6.a);
                result = mix(result, flame7, flame7.a);
                result = mix(result, flame8, flame8.a);
                
                return result;           
            }
            
            vec4 getFireColor() {
                return getFireColor(getByOffset(0., 0.));
            }
`;


//t. 0 = absolute cold (nothing to move out), 255 - absolute heat

//todo[grishin]: so what I've learned: I cannot put filter over sprite with bitmapData and pass another bitmapData as texture
//not used

class FireShader extends Phaser.Filter {
    constructor(burnTexture, x, y, myTexture, burnedTexture) {
        super(game);

        this.uniforms.iChannel4 = { type: 'sampler2D', value: burnTexture, textureData: { nearest: true } };

        this.uniforms.iChannel3.value = burnTexture;
        this.uniforms.iChannel3.textureData = {nearest: true};
        this.uniforms.iChannel1.value = myTexture;
        this.uniforms.iChannel1.textureData = {nearest: true};
        this.uniforms.iChannel2.value = burnedTexture;
        this.uniforms.iChannel2.textureData = {nearest: true};
        this.uniforms.offsetSize = {type: '4f', value: {x,y: y,z:burnTexture.width,w:burnTexture.height}};

        this.fragmentSrc = `
        precision mediump float;
        #define M_PI 3.141592653589793
        #define M_PI2 6.283185307179586
        
        varying vec2       vTextureCoord;
        uniform vec4       offsetSize;
        uniform float      time;
        uniform sampler2D  uSampler;    
        uniform sampler2D  iChannel4;   //burn texture
        uniform sampler2D  iChannel1;   //original sprite
        uniform sampler2D  iChannel2;   //burned sprite
        
        #define iChannel3 iChannel4
        
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
            return vec4(0xb0, 0x12 * 2, 0x17, 255)/255. * (.5 + .2*rand(vec2(sx,sy)));
        }
        
        vec4 smokeColor(float sx, float sy) {
            return vec4(0x01, 0x01, 0x01, 255)/255. * (.5 + .2*rand(vec2(sx,sy)));
        }

        vec4 getColor(vec2 xy, sampler2D channel) {
            return texture2D(channel, vec2(xy.x - offsetSize.x, ${MAP_HEIGHT_PIX}. - xy.y - offsetSize.y)/offsetSize.zw);
        }
        
        vec4 getOrigColor(vec2 xy) {
            return getColor(xy, iChannel3);
        }
        
        float particlePoint(float sx, float sy) {
            vec2 xy = vec2(sx,sy);
            return getColor(xy, iChannel3).a * getColor(xy, iChannel1).a;
        }
        
        float particleCircle(float sx, float sy) {
            vec4 color = getOrigColor(vec2(sx,sy));
            float radius1 = particlePoint(sx,sy);
            /*float radius2 = 0.5 * particlePoint(sx-1., sy)
                          + 0.5 * particlePoint(sx+1., sy)
                          + 0.5 * particlePoint(sx, sy-1.)
                          + 0.5 * particlePoint(sx, sy+1.);*/
                          
            /*float radius3 = 0.2 * particlePoint(sx-2., sy)              
                          + 0.2 * particlePoint(sx-1., sy-1.)
                          + 0.2 * particlePoint(sx, sy-2.)
                          + 0.2 * particlePoint(sx+1., sy-1.)
                          + 0.2 * particlePoint(sx+2., sy)
                          + 0.2 * particlePoint(sx+1., sy+1.)
                          + 0.2 * particlePoint(sx, sy+2.)
                          + 0.2 * particlePoint(sx-1., sy+1.);*/
            return color.r * radius1;// + color.g * radius2;// + color.b * radius3;
        }
        
        #define MAX_O 3.
        #define fireHeight 9.
        #define fireRadius 2.
        
      
        vec4 fireParticle(vec2 xy, float timeline, float offsetSeed) { //timeline = 0..1, offsetSeed = 0..1
            float dx = (2.*rand(xy) - 1.)*4.;
            float dy = (1. + /*rand(xy.xy)*1. + */sin(dx+time*3.))*fireHeight;
            float revtimeline = pow(1. - timeline, 1.);
            
            float sdx = /*rand*/(offsetSeed)*MAX_O;
            float sdy = /*rand*/(sdx)*MAX_O;
            
            float sx = floor(xy.x - dx*timeline + sdx);
            float sy = floor(xy.y - dy*timeline + sdy);
            float r = 1. + /*rand(xy.xy)**/fireRadius;
            float targetR = r*revtimeline;
            vec4 baseColor = mix(fireColor(sx,sy), smokeColor(sx,sy), pow(timeline, 10.));
            return baseColor * particleCircle(sx, sy) * revtimeline;// * (0.5 + 0.5*noise(vec2(sx,sy)));            
        }
        
                
        vec4 fireColor() {
            float tl1 = (0.5 + 0.5*sin(time/1.));
            tl1 = ceil(tl1*10.)/100.;
            
            return fireParticle(gl_FragCoord.xy, fract(tl1+0.0), fract(tl1-0.0))
                         //+ fireParticle(gl_FragCoord.xy, fract(tl1+0.2), fract(tl1-0.2))
                         + fireParticle(gl_FragCoord.xy, fract(tl1+0.4), fract(tl1-0.4))
                         //+ fireParticle(gl_FragCoord.xy, fract(tl1+0.6), fract(tl1-0.6))
                         + fireParticle(gl_FragCoord.xy, fract(tl1+0.8), fract(tl1-0.8));
        }
        
        void main(void) {
            vec4 data = texture2D(uSampler, vTextureCoord);
            vec2 bxy = vec2(gl_FragCoord.x - offsetSize.x, ${MAP_HEIGHT_PIX}. - gl_FragCoord.y - offsetSize.y)/offsetSize.zw;
            
            //vec2 bxy = vec2(gl_FragCoord.x - 432., 500. - gl_FragCoord.y - 194.) / vec2(48., 106.);
            
            vec4 burn = texture2D(iChannel3, bxy);
            vec4 orig = texture2D(iChannel1, bxy);
            vec4 burnt = texture2D(iChannel2, bxy);
            
            if (burn.a > 0.) {
                vec4 fc = fireColor();
                gl_FragColor = burnt + fc;
            } else {
                gl_FragColor = orig;
            }
            //gl_FragColor = burn;
            //gl_FragColor.r = bxy.y;
            //gl_FragColor.g = 0.;
            //gl_FragColor.b = 0.;
        }
        `;
    }
}

//not used
class FireProcess {
    constructor(spriteNormal, spriteBurned) {
        this.burnBitmap = game.add.bitmapData(spriteNormal.width, spriteNormal.height);
        this.burnBitmap.sprite = game.add.sprite(-1000, -1000, this.burnBitmap);
        this.burnBitmap.ctx.fillStyle="rgba(255,255,255,0)";
        this.burnBitmap.ctx.fillRect(0,0,spriteNormal.width, spriteNormal.height);
        this.burnBitmap.ctx.fillStyle = "black";
        this.burnBitmap.ctx.strokeStyle = "red";
        this.burnBitmap.ctx.lineWidth = 3;
        this.spriteNormal = spriteNormal;
        this.spriteBurned = spriteBurned;

        this.burnBitmap.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        window.bb = this.burnBitmap;


    }

    burn(x, y) {
        this._burn = {
            x: x - this.spriteNormal.left,
            y: y - this.spriteNormal.top,
            r: -10,
            maxr: Math.max(this.burnBitmap.width, this.burnBitmap.height)
        };
        //this.tchanger = game.heatmap.addTchanger(game.heatmap.x(x), game.heatmap.y(y), 600);
        this.spriteFake = game.add.sprite(this.spriteNormal.x, this.spriteNormal.y);
        this.spriteFake.anchor.set(this.spriteNormal.anchor.x, this.spriteNormal.anchor.y);
        this.spriteFake.width = this.spriteNormal.width;
        this.spriteFake.height = this.spriteNormal.height;
        this.spriteNormal.parent.add(this.spriteFake);
        this.spriteNormal.visible = false;
        this.spriteFake.filters = [
            new FireShader(this.burnBitmap.sprite.texture, this.spriteNormal.left, this.spriteNormal.top, this.spriteNormal.texture, this.spriteBurned.texture)
        ];
    }

    update() {
        if (!this._burn) return;
        this._burn.r += 1;
        if (this._burn.r >= 1) {
            let ctx = this.burnBitmap.ctx;
            ctx.beginPath();
            ctx.arc(this._burn.x, this._burn.y, this._burn.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            this.burnBitmap.dirty = true;
            this.spriteNormal.model.maskSprite._changed = true;
            for (let x = this.spriteNormal.left; x < this.spriteNormal.right; x+=HEAT_PIX) {
                for (let y = this.spriteNormal.top; y < this.spriteNormal.bottom; y+=HEAT_PIX) {
                    game.heatmap.addT(game.heatmap.x(x), game.heatmap.y(y), 10);
                }
            }

        }
        if (this._burn.r >= this._burn.maxr) {
            //game.heatmap.removeTchanger(this.tchanger);
            this.spriteNormal.onBurnt();
            this._burn = undefined;
            this.spriteFake.filters = [];
            this.spriteFake.destroy();
            this.spriteNormal.model.maskSprite._changed = true;

        }
    }
}



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
        if (WaterShader.texture) return WaterShader.texture;
        let bm = game.add.bitmapData(16,16);
        let tempSprite = game.add.sprite(-1000,-1000, "misc", 11);
        bm.draw(tempSprite, 0, 0);
        tempSprite.destroy();
        tempSprite = game.add.sprite(-1000,-1000, bm);
        WaterShader.texture = tempSprite.texture;
        return tempSprite.texture;
    }
}

class Flow {
    constructor(type) {
        this.type = type;
        this.segments = [];
        this.line = [];
        this.bitmap = null;
        this.textureWidth = 16;
        this.textureHeight = 16;
        this._clr = {};
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
        this.id = id;
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

        this.bitmap.update();
    }

    isOn(x, y) {
        let relx = x - this.sprite.left, rely = y - this.sprite.top;
        if (relx < 0 || rely < 0 || relx >= this.sprite.width || rely >= this.sprite.height) return false;
        this.bitmap.getPixel(relx, rely, this._clr);
        return this._clr.a > 0;
    }

    renderWith(shaderClass) {
        this.sprite.filters = [new shaderClass()];
    }

}



function createMaskSpritesheet(key, addPixelsOnTop = true, ignoreMask = false, burnable = () => false) {
    let img = game.cache.getImage(key);
    let fd = game.cache.getFrameData(key);
    let maskBm = game.add.bitmapData(img.width, img.height);
    //maskBm.fill(0,0,0);
    maskBm.draw(img, 0, 0);
    maskBm.update();
    let fi = 0;
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
            out.g = 240;
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
            if (burnable(fi)) out.g += 1;
            out.r = ox-x+128;// Math.max(0, x-ox);
            //out.g = Math.max(0, ox-x);
            out.b = oy-y;
            return out;
        }, this, f.x, f.y, f.width, f.height);
        fi++;
    }
    game.cache.addSpriteSheet(key + ".mask", null, maskBm.canvas, 16, 16);
}

class Firemap {
    constructor(width = MAP_WIDTH, height = MAP_HEIGHT) {
        this.fireBitmap = game.add.bitmapData(HM_WIDTH, HM_HEIGHT);
        this.width = width;
        this.height = height;
        this.sprite = game.add.sprite(-1000, -1000, this.fireBitmap);
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.grid = [];
        this.burning = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(false);
            }
            this.grid.push(row);
        }
        this.fireBitmap.update();
    }

    x(x) { return (Math.floor(x/HEAT_PIX))}
    y(y) { return (Math.floor(y/HEAT_PIX))}

    burn(x, y, lifespan = 2000) {
        if (this.grid[y][x]) {
            this.grid[y][x].left = lifespan;
            return;
        }
        let burncell = {left: lifespan, x, y};
        this.burning.push(burncell);
        this.grid[y][x] = burncell;
        this.fireBitmap.setPixel32(x, this.height - 1 - y, 255, 0, 0, 255, false);
        this.dirty = true;
    }

    isBurning(x, y) {
        if (y >= this.grid.length || y < 0) return false;
        return !!this.grid[y][x];
    }

    getBurningLifespan(x, y) {
        if (y >= this.grid.length || y < 0) return false;
        return this.grid[y][x].left;
    }

    update() {
        for (let i = this.burning.length-1; i >= 0; i--) {
            let bcell = this.burning[i];
            bcell.left -= game.time.physicsElapsedMS;
            game.heatmap.setT(bcell.x, bcell.y, 400);
            if (bcell.left <= 0) {
                this.grid[bcell.y][bcell.x] = false;
                this.burning.splice(i, 1);
                this.fireBitmap.setPixel32(bcell.x, this.height - 1 -bcell.y, 0,0,0,0,false);
                this.dirty = true;
            }
        }
        if (this.dirty) {
            this.fireBitmap.context.putImageData(this.fireBitmap.imageData, 0, 0);
            this.fireBitmap.dirty = true;
            this.dirty = false;
        }
    }
}

let heatmapWorker = new Worker("heatmapWorker.js");

class HeatMapWorkerAPI {
    constructor(width = MAP_WIDTH, height = MAP_HEIGHT, t = (x,y) => 200) {
        heatmapWorker.postMessage({
            method: "init",
            args: [width, height, t(0,0)]
        });
        this.bitmap = game.add.bitmapData(HM_WIDTH, HM_HEIGHT);
        this.width = width;
        this.height = height;
        this.bitmap.update();
        this.sprite = game.add.sprite(-1000, -1000, this.bitmap);
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.LINEAR;

        this.grid = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(t);
            }
            this.grid.push(row);
        }

        heatmapWorker.onmessage = this.onMessage.bind(this);
    }

    onMessage(e) {
        switch (e.data.method) {
            case "update":
                //console.log("update from workr");
                this.grid = e.data.grid;
                this.updateBitmap();
                break;
            default:
                console.error("unknown method", e.data.method);
        }
    }

    addT(x, y, t) {
        heatmapWorker.postMessage({
            method: "addT",
            args: [x,y,t]
        })
    }

    setT(x, y, t) {
        heatmapWorker.postMessage({
            method: "setT",
            args: [x,y,t]
        })
    }

    setSunT(t) {
        heatmapWorker.postMessage({
            method: "setSunT",
            args: [t]
        })
    }

    addFlow(flow, name) {

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

    addMovement(from, to, speed, props) {
        heatmapWorker.postMessage({
            method: "addMovement",
            args: [from, to, speed, props]
        })
    }

    addTchanger(x, y, tconst) {
        heatmapWorker.postMessage({
            method: "addTchanger",
            args: [x,y,tconst]
        });
        return {x,y,tconst}
    }

    removeTchanger(tchangerAt) {
        heatmapWorker.postMessage({
            method: "removeTchanger",
            args: [tchangerAt.x, tchangerAt.y, tchangerAt.tconst]
        })
    }

    destroyMovementAt(x, y, radius) {
        heatmapWorker.postMessage({
            method: "destroyMovementAt",
            args: [x, y, radius]
        });
    }

    updateBitmap(bitmap = this.bitmap) {
        let x, y, width = this.width, height = this.height, cell;
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                cell = this.grid[y][x];
                bitmap.setPixel(x, this.height - 1 - y, Math.min(255, cell), 0, 0, false);
            }
        }
        bitmap.context.putImageData(bitmap.imageData, 0, 0);
        bitmap.dirty = true;
    }

    t(x,y) {
        return this.grid[this.y(y)][this.x(x)];
    }
    x(x) { return (Math.round(x/HEAT_PIX))}
    y(y) { return (Math.round(y/HEAT_PIX))}

    update() {
        heatmapWorker.postMessage({
            method: "update",
            args: []
        })
    }

}

class WeatherDebugShader extends Phaser.Filter {
    constructor(heatmapTexture) {
        super(game);
        this.uniforms.iChannel0.value = heatmapTexture;
        this.uniforms.iChannel0.textureData = {repeat: false};
        this.uniforms.iChannel1.value = game.firemap.sprite.texture;
        this.fragmentSrc = `
        precision mediump float;
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //render
        uniform sampler2D  iChannel0;   //heatmap
        uniform sampler2D  iChannel1;   //firemap
        
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
        
        float getFire(float x, float y) {
            return texture2D(iChannel1, vec2(gl_FragCoord.x / ${HEAT_PIX}.,gl_FragCoord.y / ${HEAT_PIX}.) / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
        
        
        void main(void) {
            
            float t = getT(gl_FragCoord.x, gl_FragCoord.y);
            float g = getFire(gl_FragCoord.x, gl_FragCoord.y);
            if (t < 0.5) {
                gl_FragColor = vec4(0,g,1,1)*2.*(0.5-t);
            } else {
                gl_FragColor = vec4(1,g,0,1)*2.*(t-0.5);
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
        this.uniforms.iChannel2.value = game.firemap.sprite.texture;
        this.uniforms.iChannel2.textureData = {nearest: true};
        this.uniforms.iChannel3.value = game.fireTexture.texture;
        this.fragmentSrc = `
        precision mediump float;
        
        varying vec2       vTextureCoord;
        uniform vec2       offset;
        uniform float      time;
        uniform sampler2D  uSampler;    //render
        uniform sampler2D  iChannel0;   //heatmap
        uniform sampler2D  iChannel1;   //mask
        uniform sampler2D  iChannel2;   //firemap
        uniform sampler2D  iChannel3;   //firetexture
        
        #define R1 0.45
        #define M 0.5
        #define R2 0.55
        
        #define MAIN_TEXTURE iChannel1
        #define FIRE_TEXTURE iChannel3
        
                
        float getFire(float x, float y) {
            vec2 tt = vec2(x / ${HEAT_PIX}., y / ${HEAT_PIX}.);
            return texture2D(iChannel2, tt / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
                
        vec4 getFiredColor(float dx, float dy) {
            vec4 maskCoords = texture2D(iChannel1, vec2(gl_FragCoord.x+dx, ${MAP_HEIGHT_PIX}.-gl_FragCoord.y-dy)/vec2(${MAP_WIDTH_PIX}., ${MAP_HEIGHT_PIX}));
            float x = gl_FragCoord.x + dx + (maskCoords.r*255.-128.);
            float y = gl_FragCoord.y + dy + maskCoords.b;
            int a = int(maskCoords.g*255.);
            float fireable = 0.;
            if (fract(maskCoords.g*255. / 2.) != 0.) {
                a -= 1;
                fireable = (a == 240 || a == 128 || a == 32) ? 1. : 0.;
            }
            return vec4(0,0,0,fireable) * getFire(x, y);
        }
        
        #define GET_BY_OFFSET(dx,dy) getFiredColor(dx,dy)
        ${FireShaderParts}
        
        float getTextureT(float tx, float ty) { //tx,ty = 0..MAP_WIDTH. but we have texture = HM_WIDTH*HM_HEIGHT. 
            return texture2D(iChannel0, vec2(tx,ty) / vec2(${HM_WIDTH}.,${HM_HEIGHT}.)).r;
        }
        
        float getT(float x, float y) {
            vec2 tt = vec2(x / ${HEAT_PIX}., y / ${HEAT_PIX}.);
            return getTextureT(tt.x, tt.y);
        }


        
        
        void main(void) {
            vec4 maskCoords = texture2D(iChannel1, vec2(gl_FragCoord.x, ${MAP_HEIGHT_PIX}.-gl_FragCoord.y)/vec2(${MAP_WIDTH_PIX}., ${MAP_HEIGHT_PIX}));
            
            //r = dx+128
            //b = dy
            float x = gl_FragCoord.x + (maskCoords.r*255.-128.);
            float y = gl_FragCoord.y + maskCoords.b;
            
            float t = getT(x, y);
            float fire = getFire(x, y);
            
            vec4 origColor = texture2D(uSampler, vTextureCoord);
            vec4 realColor = origColor;
            int a = int(maskCoords.g*255.);
            float fireable = 0.;
            if (fract(maskCoords.g*255. / 2.) != 0.) {
                a -= 1;
                fireable = 1.;
            }
            vec4 middleColor = vec4(vec3(0.2126 * realColor.r + 0.7152 * realColor.g + 0.0722 * realColor.b), 1.);
            middleColor.r = (middleColor.r + realColor.r)/2.;
            realColor = getFireColor(origColor);
            if (realColor != origColor) {
                //do nothing
                //realColor = getFireColor(vec4(1,0,0,1));
            } else if (a == 240) {  //apply fully
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
                    t = getT(gl_FragCoord.x, gl_FragCoord.y);
                    //middleColor *= 0.7;
                    if (t < M) {
                        realColor = mix(middleColor, vec4(0.8,0.8,1.,1.), pow(1. - t / M, 0.5));
                    } else {
                        realColor = mix(middleColor, clamp(realColor, 0., 1.), pow((t-M)/(1.-M), 0.5));
                    }  
            } else {
                    realColor = vec4(1,0,1,0.5); //error                   
            }

            realColor = clamp(realColor, 0., 1.);
            //gl_FragColor = maskCoords;
            gl_FragColor = realColor;  
        }

        `;
    }

}

console.log("VERSION 0.2");

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

    render(changed = undefined) {
        //todo[grishin]: why to do this twice?
        if (changed === undefined) {
            changed = {
                x0: undefined,
                y0: undefined,
                x1: undefined,
                y1: undefined,

                get width() {
                    return this.x1 - this.x0
                },
                get height() {
                    return this.y1 - this.y0
                }
            };
            if (this._first) {
                changed.x0 = changed.y0 = 0;
                changed.x1 = this.renderTexture.width;
                changed.y1 = this.renderTexture.height;
            } else {
                let ar = this.grp.children || this.grp, i = ar.length, sprite;

                while (i-- > 0) {
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
                    changed.x0 = Math.max(0, changed.x0 - PAD) | 0;
                    changed.y0 = Math.max(0, changed.y0 - PAD) | 0;
                    changed.x1 = Math.min(this.renderTexture.width, changed.x1 + PAD) | 0;
                    changed.y1 = Math.min(this.renderTexture.height, changed.y1 + PAD) | 0;
                }
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
        return changed;
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
        let changed = this.textureMask.render();
        this.textureReal.render(changed);
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
        this.drops = new Drops(this);
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
        if (this.died) return;
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
        if (this.died) return;
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
        if (this.died) return;
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

    checkBurn() {
        if (game.firemap.isBurning(game.firemap.x(this.x), game.firemap.y(this.y))) {
            this.isBurning = true;
        } else if (this.isBurning) {
            this.died = true;
            this.sprite.loadTexture("fire", 4);
            this.maskSprite.loadTexture("fire.mask", 4);
            this.maskSprite._changed = true;
        }
    }

    update() {
        if (this.died) return;
        this.checkBurn();
        this.applyAngle();
    }
}

function withMask(key, frame) {
    return {sprite: game.add.sprite(-1000, -1000, key, frame), mask: game.add.sprite(-1000, -1000, key + ".mask", frame)}
}

class Rock {

    getSprites() {
        return [
            withMask("grass", 21),
            withMask("grass", 22),
            withMask("grass", 23)
        ]
    }

    get topPad() {
        return 0;
    }

    constructor(x, y, width, height, circle = false, objectsMap = undefined) {
        width += 8;
        height += 8 + this.topPad;
        x-=8;
        y-= 8 + this.topPad;
        this.bitmap = game.add.bitmapData(width, height);
        this.maskBitmap = game.add.bitmapData(width, height);
        let rocks = game.rocksCache.get(this.constructor.name) || (() => {
            let r = this.getSprites();
            game.rocksCache.set(this.constructor.name, r);
            return r;
        })();

        //fill with rocks
        this.objectsMap = objectsMap;
        if (!objectsMap) {
            this.objectsMap = [];
            for (let yy = 16;yy<height; yy+=8) {
                for (let xx = 8; xx < width; xx+=8) {
                    if (circle) {
                        //let shallAdd = game.rnd.frac() > 1.5*(Math.hypot(xx-width/2, yy-height/2)/Math.hypot(width/2, height/2));
                        let shallAdd = (Math.hypot(xx-width/2, yy-height/2)/Math.hypot(width/2, height/2)) < 0.5;
                        if (!shallAdd) continue;
                    }
                    let tx = xx + game.rnd.integerInRange(-2,2);
                    let ty = yy + game.rnd.integerInRange(-1,1);
                    let sprites = game.rnd.pick(rocks);
                    let {sprite, mask} = sprites;
                    this.objectsMap.push({tx,ty, si: rocks.indexOf(sprites)});
                }
            }
        }

        for (let {tx,ty,si} of this.objectsMap) {
            let {sprite, mask} = rocks[si];
            sprite.anchor.set(0.5, 1);
            mask.anchor.set(0.5, 1);
            this.bitmap.draw(sprite, tx|0, this.topPad + ty|0);
            this.maskBitmap.draw(mask, tx|0, this.topPad + ty|0);

        }

        this.sprite = game.make.sprite(x, y+height, this.bitmap);
        this.sprite.anchor.set(0, 1);
        this.sprite.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
        this.sprite.model = {
            maskSprite: game.make.sprite(x, y+height, this.maskBitmap),
            noRender: true,
            static: true
        };
        this.sprite.model.maskSprite.anchor.set(0, 1);
        game.physics.arcade.enable(this.sprite);
        this.sprite.body.immovable = true;
        if (circle) {
            this.sprite.body.setCircle(width/2-12, 12, 12)
        } else {
            this.sprite.body.setSize(width-8, height-8, 4, 4);
        }
        this.sprite.rect = new Phaser.Rectangle(x,y,width,height);//,right:x+width,bottom:y+height,left:x,top:y};

    }
}

const PASS_TS = 40;
const TREE_BURN_MIN = 4000;

class Trees extends Rock {

    constructor(x, y, width, height, circle) {
        super(x,y,width,height, circle);
        this.burned = new TreesBurned(x, y, width, height, circle, this.objectsMap);
        this.sprite.update = () => {
            this.update();
        };
        this.sprite.burnable = true;
        this.miniFireMap = [];
        for (let cx = game.firemap.x(x-8); cx <= game.firemap.x(x+width); cx++) {
            for (let cy = game.firemap.y(y-8); cy <= game.firemap.y(y+height); cy++) {
                this.miniFireMap.push({x:cx,y:cy})
            }
        }
        this.isBurning = false;
        this.isBurnt = false;
        this.burningTime = 0;
    }

    get topPad() {
        return 0;
    }

    update() {
        if (this.isBurnt) return;
        if (!this.isBurning) {
            for (let cell of this.miniFireMap) {
                if (game.firemap.isBurning(cell.x,cell.y)) {
                    this.isBurning = true;
                    game.firemap.burn(cell.x, cell.y, TREE_BURN_MIN);
                    this.fireOrigin = {x: cell.x, y: cell.y, ls: game.firemap.getBurningLifespan(cell.x, cell.y)};
                    this.switchSpriteIn = game.firemap.getBurningLifespan(cell.x, cell.y) * 0.6;
                    cell.burning = true;
                    cell.passTs = PASS_TS;
                    cell.passed = false;
                    break;
                }
            }
        }
        if (this.isBurning) {
            this.switchSpriteIn -= game.time.physicsElapsedMS;
            this.fireOrigin.ls -= game.time.physicsElapsedMS;
            if (this.switchSpriteIn <= 0 && this.burned) {
                this.sprite.loadTexture(this.burned.sprite.key);
                this.sprite.model.maskSprite.loadTexture(this.burned.sprite.model.maskSprite.key);
                this.sprite.model.maskSprite._changed = true;
                this.burned.sprite.model.maskSprite.destroy();
                this.burned.sprite.destroy();
                this.burned = null;
            }
            if (!game.firemap.isBurning(this.fireOrigin.x, this.fireOrigin.y)) {
                this.isBurning = false;
                this.isBurnt = true;
                this.sprite.body.enable = false;
                return;
            }
            for (let cell of this.miniFireMap) {
                if (cell.burning && !cell.passed) {
                    cell.passTs -= game.time.physicsElapsedMS;
                    if (cell.passTs <= 0) {
                        [{x:+1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:+1}]
                            .map(({x,y}) => this.miniFireMap.find(c => c.x === cell.x+x && c.y === cell.y+y))
                            .filter(c => c && !c.burning)
                            .forEach(c => {
                                game.firemap.burn(c.x, c.y, this.fireOrigin.ls);
                                c.burning = true;
                                c.passTs = PASS_TS;
                            });
                        cell.passed = true;
                    }
                }
            }
        }
    }

    getSprites() {
        return [
            withMask("trees", 1),
            withMask("trees", 3)
        ]
    }

    onBurnt() {
        this.sprite.loadTexture(this.burned.sprite.key);
        this.sprite.visible = true;
        this.burned.sprite.destroy();
        this.sprite.body.enable = false;
    }

    burn(x = this.sprite.centerX, y = this.sprite.centerY) {
        this.sprite.model.maskSprite = this.burned.sprite.model.maskSprite;
        this.fireProcess.burn(x, y);
    }
}

class TreesBurned extends Rock {

    get topPad() {
        return 0;
    }
    getSprites() {
        return [
            withMask("trees", 4),
            withMask("trees", 5)
        ]
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
    constructor(x, y, heatmap, onkill) {
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
        this.onkill = onkill;
        game.sfx.freeze();
    }

    update() {
        if (this.pendingDestroy) return this.destroy();
        if (!this.alive) {
            this.removeChanger();
            this.pendingDestroy = true;
            this.model.maskSprite.pendingDestroy = true;
            this.model.maskSprite.alive = false;
            this.model.maskSprite._changed = true;
        }
        this.model.maskSprite.change('frame', this.animations.frame, this.model.maskSprite.animations);
    }

    kill() {
        super.kill();
        this.removeChanger();
    }

    destroy() {
        super.destroy();
        this.removeChanger();
    }

    removeChanger() {
        if (this.tchanger) {
            this.heatmap.removeTchanger(this.tchanger);
            this.tchanger = undefined;
            this.onkill(this);
        }
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

    get additionalDistance() {
        return 32;
    }

    flyTo(goal) {
        let distance = Phaser.Point.distance(this, goal) + this.additionalDistance;
        let angle = Phaser.Point.angle(goal, this);
        this.body.moveTo(this.flyTime, distance, Phaser.Math.radToDeg(angle));
        this.body.onMoveComplete.addOnce(() => {
           this.onCollide();
        });
    }

    get flyTime() { return 200;}

    onCollide() {
        this.body.velocity.set(0,0);
        game.onProjectileExplode(this);
        game.sfx.explosion();
        this.animations.play('explosion').onComplete.addOnce(() => {
            this.destroy();
        });
    }


    update() {
        this.rotation += 0.01;
    }
}

class FireProjectile extends Projectile {
    constructor(x, y) {
        super(x, y);
        this.frame = 22;
        this.fakeProjectiles = [];
        for (let i = 0; i < 50; i++) {
            let fakeProjectile = game.addProjectile(game.add.sprite(x, y, "misc", 22));
            let sc = game.rnd.realInRange(0.5, 0.8);
            fakeProjectile.anchor.set(0.5, 0.5);
            fakeProjectile.scale.set(sc, sc);
            fakeProjectile.rotation = game.rnd.realInRange(0, Math.PI*2);
            fakeProjectile.tint = 0xffff00;
            fakeProjectile.rndSpeed = game.rnd.realInRange(1.05, 2);
            fakeProjectile.rndDistance = game.rnd.realInRange(0.95, 1.05);
            fakeProjectile.rndAngle = game.rnd.realInRange(0.99, 1.1);
            game.physics.arcade.enable(fakeProjectile);
            fakeProjectile.body.checkCollision.none = true;
            this.fakeProjectiles.push(fakeProjectile);
        }
    }

    flyTo(goal) {
        super.flyTo(goal);
        for (let fk of this.fakeProjectiles) {
            let distance = Phaser.Point.distance(fk, goal)*fk.rndDistance;
            let angle = Phaser.Point.angle(goal, this)*fk.rndAngle;
            fk.body.moveTo(this.flyTime * fk.rndSpeed, distance, Phaser.Math.radToDeg(angle));
            fk.body.onMoveComplete.addOnce(() => {
                fk.pendingDestroy = true;
            });
        }
    }

    get flyTime() { return 900; }

    get additionalDistance() { return 0; }

    get isFire() {
        return true;
    }

    update() {
        super.update();
        game.firemap.burn(game.firemap.x(this.x), game.firemap.y(this.y));
    }
}


class VisionBasedOnT {
    constructor(fn) {
        this.visionFn = fn;

        this.visionBitmap = game.add.bitmapData(400, 400);
        this.visionBitmap.ctx.fillStyle = "rgba(255,0,0,0.05)";
        this.visionBitmap.ctx.strokeStyle = "rgba(255,0,0,0.2)";
        this.visionBitmap.ctx.lineWidth = 4;
        this.visionBitmap.ctx.beginPath();
        this.visionBitmap.ctx.arc(200,200,200,0,Math.PI*2);
        this.visionBitmap.ctx.fill();
        this.visionBitmap.ctx.stroke();

        this.visionSprite = game.make.sprite(0, 0, this.visionBitmap);
        this.visionSprite.anchor.set(0.5, 0.5);
        this.vision = fn(128);
    }

    get sprite() {
        return this.visionSprite;
    }

    update(x, y) {
        this.vision = this.visionFn(game.heatmap.t(x, y));
        this.visionSprite.width = this.vision*2;
        this.visionSprite.height = this.vision*2;
    }

}


class BaseGun extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, "misc", 0); //base
        this.anchor.set(0.5, 0.5);
        this.gunItself = this.createGun();
        this.gunItself.rotation = 2;
        this.vision = new VisionBasedOnT(this.visionFn);

        this.addChild(this.vision.sprite);
        this.addChild(this.gunItself);

        this.model = {
            maskSprite: game.make.sprite(-1000, -1000, "misc", 0),
            noRender: true
        };
        this.fireCooldown = 0;
    }

    get cooldown() { return 1000; }

    get visionFn() {}

    createGun() {}

    update() {
        this.fireCooldown -= game.time.physicsElapsedMS;
        this.vision.update(this.x, this.y);
        this.checkGoal();
    }

    canFireTo(sprite) {
        return this.fireCooldown <= 0 && game.hasNoObstacles(this, sprite) && Phaser.Point.distance(this, sprite) < this.vision.vision;
    }

    doFireWith(projectile, to) {
        this.fireCooldown = this.cooldown;
        this.doFireSound();
        projectile = game.addProjectile(projectile);
        projectile.flyTo(to);
    }

    doFireSound() {
        game.sfx.fire();
    }

    doRotateTo(sprite, speed = 0.05) {
        let ang = normalizeAngle(this.gunItself.rotation);
        let goal = normalizeAngle(Phaser.Point.angle(this, sprite)-Math.PI/2);
        if (goal - ang > Math.PI) {
            goal += 2*Math.PI;
        } else if (ang - goal > Math.PI) {
            goal -= 2*Math.PI;
        }
        this.gunItself.rotation = reach(ang, goal, speed);
        return Math.abs(goal - ang);
    }
}

class Gun extends BaseGun {

    createGun() {
        let gun = game.add.sprite(0, 0, "misc", 1);
        gun.anchor.set(0.5, 0.5);
        gun.scale.set(2, 2);
        return gun;
    }

    get visionFn() {return tminmax(50, 50, 200, 150)}

    checkGoal(hero = this.hero) {
        if (!hero) throw new Error("no hero?");
        let distance = Phaser.Point.distance(hero, this);
        if (this.canFireTo(hero)) {
            this.doFireWith(new Projectile(this.x, this.y), hero);
        }
        if (distance < this.vision.vision * 2) {
            this.doRotateTo(hero);
        } else {
            this.gunItself.rotation += 0.02;
        }
    }

}

class FireGun extends BaseGun {

    constructor(x, y, diamonds) {
        super(x, y);
        this.diamonds = diamonds;
    }

    createGun() {
        let gun = game.add.sprite(0, 0, "misc", 20);
        gun.animations.add("idle", [20,21], 12, true);
        gun.animations.play("idle");
        gun.anchor.set(0.5, 0.5);
        gun.scale.set(2, 2);
        return gun;
    }

    get visionFn() {return tminmax(100, 100, 200, 100)}

    checkGoal() {
        for (let di = 0; di < this.diamonds.children.length; di++) {
            let diamond = this.diamonds.children[di];
            if (diamond instanceof IceDiamond) {
                if (this.canFireTo(diamond)) {
                    if (this.doRotateTo(diamond, 0.1) < 0.1) {
                        this.doFireWith(new FireProjectile(this.x, this.y), diamond);
                    }
                    break;
                }
            }
        }
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

class Drops extends Phaser.Sprite {
    constructor(hero) {
        super(game, hero.x, hero.y, "misc");
        this.hero = hero;
        this.kill();
        this.anchor.set(0.5, 1);
        this.animations.add("main", [23,24,25], 12);
    }

    walkOnWater() {
        if (this.animations.currentAnim.isPlaying) return;
        this.revive(100);
        this.x = this.hero.x;
        this.y = this.hero.y;
        this.animations.play("main", null, false, true);
    }

    update() {
        if (game.isOnWater(this.hero.x, this.hero.y)) {
            this.walkOnWater();
        }
    }
}

class BaseLevel {
    create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.fireTexture = game.add.sprite(-1000, -1000, 'firetexture');
        this.cursors = game.input.keyboard.createCursorKeys();
        this.keys = {
            space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
            z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
        };
        this.rocksCache = game.rocksCache = new Map();
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
        let props = (this.tilemap.properties || {});
        let t = props.t || 200;
        this.heatmap = game.heatmap = new HeatMapWorkerAPI(MAP_WIDTH, MAP_HEIGHT, (x,y) => t);
        this.firemap = game.firemap = new Firemap(MAP_WIDTH, MAP_HEIGHT);
        this.renduror = new Renduror(this.maskedGrp, this.heatmap);
        if (!props.noSun) this.heatmap.setSunT(t);


        for (let obj of this.tilemap.objects.objects) {
            switch (obj.name) {
                case "rocks":
                    let rock = new Rock(obj.x, obj.y, obj.width, obj.height);
                    this.walls.add(rock.sprite);
                    binaryInsertSortY(rock.sprite, this.maskedGrp);
                    break;
                case "trees":
                    let trees = new Trees(obj.x, obj.y, obj.width, obj.height, obj.ellipse || (obj.properties || {}).circle);
                    this.walls.add(trees.sprite);
                    this.invisibleHero.add(trees.burned.sprite);
                    binaryInsertSortY(trees.sprite, this.maskedGrp);
                    /*if (obj.properties && obj.properties.burn) {
                        setTimeout(() => trees.burn(), 1000);
                    }*/
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
                case "firegun":
                    let firegun = new FireGun(obj.x, obj.y, this.invisibleHero);
                    this.guns.add(firegun);
                    binaryInsertSortY(firegun, this.maskedGrp);
                    break;
                case "water":
                case "lava":
                case "pipe":
                    let flow = new Flow(obj.name);
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
                    flow.prepareLine(props.id, this.flows.find(flow => flow.id === props["display-only"]));
                    flow.renderWith({"lava": LavaShader, "water": WaterShader, "pipe": PipeShader}[obj.name]);
                    this.heatmap.addFlow(flow, obj.name);
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
        this.other.add(this.hero.drops);
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
        game.isOnWater = this.isOnWater.bind(this);

        //Flow.demoFlow();

    }

    isOnWater(x, y) {
        for (let f of this.flows) {
            if (f.type === "water" && f.isOn(x,y)) return true;
        }
        return false;
    }

    isOnFlow(x, y) {
        for (let f of this.flows) {
            if (f.isOn(x,y)) return true;
        }
        return false;
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
            this.maskedGrp.push({ghost: true, x: this.hero.x, y: this.hero.y});
            this.hero.restart(this.heroStart);
        }
        for (let g of this.grass) {
            g.checkProjectile(projectile);
        }
        this.heatmap.destroyMovementAt(projectile.x, projectile.y, 32);
        for (let flow of this.flows) {
            flow.destroyAt(projectile.x, projectile.y, 32);
        }

        if (projectile.isFire) {
            let projectileRect = new Phaser.Rectangle(
              projectile.x - 16,
                projectile.y - 16,
                32, 32
            );
            for (let px = projectileRect.x; px <= projectileRect.right; px+=HEAT_PIX/2) {
                for (let py = projectileRect.y; py <= projectileRect.bottom; py+=HEAT_PIX/2) {
                    game.firemap.burn(game.firemap.x(px), game.firemap.y(py));
                }
            }
            for (let d of this.invisibleHero.children) {
                if (d instanceof IceDiamond && Phaser.Point.distance(d, projectile) < 16) {
                    d.kill();
                    this.hero.iceCooldown = 0;
                }
            }

        }

    }

    hasNoObstacles(p1, p2) {
        let line = new Phaser.Line(p1.x, p1.y, p2.x, p2.y), wall;
        for (let wi = 0; wi < this.walls.children.length; wi++) {
            wall = this.walls.children[wi];
            if (wall.rect && Phaser.Line.intersectsRectangle(line, wall.rect)) return false;
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
            game.sfx.win();
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

            if (this.keys.space.isDown) {
                if (this.isOnFlow(this.hero.x, this.hero.y)) {
                    game.sfx.cannot();
                } else if (this.hero.placeIce()) {
                    let ice = new IceDiamond(this.hero.x, this.hero.y - 2, this.heatmap, (ice) => {
                        this.maskedGrp.push({ghost: true, x: ice.x, y: ice.y});
                    });
                    this.invisibleHero.add(ice);
                    binaryInsertSortY(ice, this.maskedGrp);
                    ice.events.onDestroy.addOnce(() => {
                        this.maskedGrp.splice(this.maskedGrp.indexOf(ice), 1);
                    });
                }
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
        if (!DEBUG_HEATMAP || this.keys.z.isDown) {
            this.heatmap.update();
            this.firemap.update();
        }

        if (!DEBUG_HEATMAP && this.keys.z.isDown) game.state.start(this.nextState);

        (game.world.filters || []).forEach(f => f.update());
    }

    render() {
        fpsEl.innerText = game.time.fps;
        let temp = this.heatmap.t(this.hero.x, this.hero.y);//.grid[this.heatmap.y(this.hero.y)][this.heatmap.x(this.hero.x)].t;
        //0..255
        temp = ((temp-128) / 3)|0;
        if (temp > 0) temp = "+" + temp + "C"; else temp = temp + "C";
        game.debug.text(temp, 16, 16);

        //this.walls.forEach(w => game.debug.body(w));
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

    get nextState() { return "Level3"}
}

class Level3 extends BaseLevel {
    get levelKey() { return "level3"; }

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

