function preload() {
    game.load.spritesheet("girl", "girl.png", 16, 16);
    game.load.spritesheet("boy", "boy.png", 16, 16);
    game.load.spritesheet("walker", "walker1.png", 64, 64);
}

class BW extends Phaser.Filter {

    constructor() {
        super(game);
        this.fragmentSrc = `
         precision highp float;
         uniform sampler2D uSampler;
         uniform sampler2D iChannel0;
         varying vec2 vTextureCoord;

         void main() {
           vec4 orig = texture2D(uSampler, vTextureCoord);
           float d = orig.a;
           bool invisibleInLight = orig.r != orig.g;
           float light = texture2D(iChannel0, vec2(vTextureCoord.x, 1. - vTextureCoord.y)).a;
           gl_FragColor = vec4(1., 1., 1., 1.) * (light > 0. ? light - d : (invisibleInLight ? 0. : d));
         }
        `;
    }
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
    makeSharped();
    let boy = game.add.sprite(160,320,'boy',0);
    boy.anchor.set(0.5,1);
    boy.animations.add('stand', [0]);
    boy.animations.add('run', [1,2,3,4], 12, true);
    boy.animations.add('fall', [5,6,7], 12);
    boy.animations.add('stand', [7,6,5], 12);

    let girl = game.add.sprite(168,320,'girl',0);
    girl.anchor.set(0.5,1);
    girl.animations.add('stand', [0]);
    girl.animations.add('run', [1,2,3,4,5,6,7,8],12,true);
    girl.animations.add('revert-1', [9,10,11],12);
    girl.animations.add('revert-2', [12,13],12);
    girl.animations.add('sitdown', [14,15,16,17],12);
    girl.animations.add('standup', [18,19,20],12);

    let mech = game.add.sprite(40,320,'walker',0);
    mech.anchor.set(0.5,1);
    mech.animations.add('run', [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],12,true);
    mech.animations.add('stop', [15,16,17,18],12);

    boy.animations.play('run');
    girl.animations.play('run');
    mech.animations.play('run');

    girl.tint = 0xff0000;
    boy.tint = 0xff0000;

    mech.scale.x = 1.5;
    mech.scale.y = 1.5;

    let lightbitmap = game.add.bitmapData(320,320);
    let light = game.add.sprite(-1000,0, lightbitmap);

    let L1 = 100;
    let L2 = 230;

    boy.update = () => {
        boy.x += boy.vx;
    };
    boy.vx = 0;
    girl.update = () => {
        girl.x += girl.vx;
        if (girl.checkBoy && girl.x-4 < boy.x+4) {
            girl.checkBoy = false;
            girl.vx = 0;
            girl.scale.x = 1;
            girl.animations.play('sitdown').onComplete.addOnce(() => {
                boy.animations.play('stand');
                girl.animations.play('standup').onComplete.addOnce(() => {
                    girl.animations.play('run');
                    boy.animations.play('run');
                    girl.vx = 2;
                    boy.vx = 2;
                });
            })
        }
    };
    girl.vx = 0;

    let lightparams = {L1:10, L2: 20, watchboy: false};

    game.time.events.add(500, () => {
        game.add.tween(lightparams).to({L1:70,L2:200}, 800, Phaser.Easing.Back.Out, true).onComplete.addOnce(() => {

        })
    });

    game.time.events.add(4000, () => {
        lightparams.watchboy = true;
        boy.animations.play('fall').onComplete.addOnce(() => {
            boy.vx = 0;
            girl.vx = 1;
            mech.animations.play('stop');
            girl.animations.play('revert-1').onComplete.addOnce(() => {
                girl.vx = 0;
                girl.animations.play('revert-2').onComplete.addOnce(() => {
                    girl.animations.play('run');
                    girl.scale.x = -1;
                    girl.vx = -1;
                    girl.checkBoy = true;
                });
            });
        });
        boy.vx = -2;
    });

    light.update = () => {
        if (lightparams.watchboy) {
            let tx = boy.x - mech.x;
            let NewL1 = tx - tx/3;
            let NewL2 = tx + tx/2;
            lightparams.L1 = stepTo(lightparams.L1, NewL1, 1);
            lightparams.L2 = stepTo(lightparams.L2, NewL2, 1);
        }
        let ctx = lightbitmap.ctx;
        ctx.clearRect(0,0,320,320);
        let x = mech.centerX + 16*mech.scale.x;
        let offset = [0,0,-0.5,-1,-1,-1,-0.5,0,0,-0.5,-1,-1,-0.5,0,0,0,0,0,0][mech.frame];
        let y = mech.centerY + offset;
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.moveTo(x,y);
        ctx.lineTo(x + lightparams.L2+offset, 320);
        ctx.lineTo(x + lightparams.L1+offset, 320);
        ctx.closePath();
        ctx.fill();
        lightbitmap.dirty = true;
    };

    let filter = new BW();
    filter.uniforms.iChannel0.value = light.texture;
    filter.uniforms.iChannel0.textureData = {nearest:true};


    game.world.filters = [filter];
}

function stepTo(current, target, step) {
    if (Math.abs(target-current) < step) {
        return target;
    }
    if (target > current) {
        return current + step;
    } else {
        return current - step;
    }
}

function update() {

}

function debugRender1() {

}
