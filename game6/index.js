function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(4, 4);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

function preload() {
    game.load.spritesheet('wind', 'wind test.png', 16, 16);
}

var hero, cursors, space;
var groundGrp, grassGrp, windParticlesGrp;

function r(gc) { return 16*gc;}

function addGround(gx,gy) {
    let g = game.add.sprite(r(gx), r(gy), 'wind', 1, groundGrp);
    return g;
}

const GRASSES = [
    {
        frame: 2,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 8, y: 15, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u","u","u","u","u","u","u",
            [["ul"], ["ur"]]
        ]
    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 8, y: 15, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u",[["u", "ur", [["ul"], ["ur", "u"]]], ["ul", "ul", "u", "u"]]
        ]
    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 8, y: 15, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u",[["ur", "u", "ur"], ["ul", "ul", "u"]]
        ]
    },
    {
        frame: 4,
        color: {r: 0x0a, g: 0x84, b: 0x05},
        model: [
            {x: 12, y: 15, color: {r: 0x0a, g: 0x84, b: 0x05}},
            "u", "ur", "u", "u", "ur", "u", "u", "u", "ul", "ul", "ul", "l", "l", "dl","d", "d",
            {key: 'wind', frame: 14, direction: 'd'}
        ]

    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 8, y: 15, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u"
        ]
    },
];

function addGrass(gx, gy, idx = undefined, color) {
    let kind = idx === undefined ? game.rnd.pick(GRASSES) : GRASSES[idx];
    kind.model[0].color = color || kind.color;
    let model = new GrassModel(kind.model);
    //let g = game.add.sprite(r(gx), r(gy), 'wind', kind.frame, grassGrp);
    let g = game.add.sprite(r(gx), r(gy), model.bitmap, 0, grassGrp);
    g.width = 16;
    g.height = 16;
    g.anchor.set(0.5, 0);

    g.update = () => {
        model.update();
    };
    g.updateWind = (p) => {
        model.updateWind(-1, p);
    };
    return g;
}

function throwWindParticle() {
    if (!hero.winding) return;
    let wp = game.add.sprite(hero.x, hero.y, undefined, undefined, windParticlesGrp);
    wp.width = 4;
    wp.height = 4;
    wp.update = () => {
       wp.x -= game.rnd.integerInRange(1,3);
    };
    wp.checkWorldBounds = true;
    wp.outOfBoundsKill = true;
    return wp;
}

function create() {
    makeSharped();

    groundGrp = game.add.group();
    grassGrp = game.add.group();
    windParticlesGrp = game.add.group();

    game.stage.backgroundColor = '#cccccc';
    game.physics.startSystem(Phaser.Physics.ARCADE);

    hero = game.add.sprite(r(9), r(4.5), 'wind');
    hero.anchor.set(0.5, 0.5);
    hero.animations.add('idle', [5,6,7], 12, true);
    hero.animations.add('winding', [8,9], 12);
    hero.animations.add('winded', [10,11,12,13], 6, true);
    hero.animations.play('idle');

    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    game.time.events.loop(200, throwWindParticle);

    hero.update = () => {
        if (space.isDown && !hero.winding) {
            hero.winding = true;
            hero.animations.play('winding').onComplete.addOnce(() => {
                hero.animations.play('winded');
            })
        }
        if (hero.winding && space.isUp) {
            hero.winding = false;
            hero.animations.play('idle');
        }

        if (cursors.left.isDown) {
            hero.x -= 1 ;
        } else if (cursors.right.isDown) {
            hero.x += 1;
        }
        if (cursors.up.isDown) {
            hero.y -= 1;
        } else if (cursors.down.isDown) {
            hero.y += 1;
        }
    };



    addGround(5,5);
    addGround(6,5);
    addGround(7,5);

    let flower = false;
    for (let pix = r(5); pix < r(8); pix+= 1) {
        if (Math.random() < 0.3) continue;
        let rnd = Math.random();
        let idx;
        if (rnd > 0.3) {
            idx = 4;
        } else if (rnd > 0.26 && !flower) {
            idx = 3;
            flower = true;
        } else  {
            idx = ((rnd*10)%3)|0;
        }
        let g = game.rnd.integerInRange(0x40, 0x80);
        let b = game.rnd.integerInRange(0x00, 0x20);
        let r = game.rnd.integerInRange(0x00, 0x20);
        addGrass(pix/16, 4, idx, {r,g,b});
    }


}

function update() {
    grassGrp.forEachAlive(grass => {
       let p = 0;
       windParticlesGrp.forEachAlive(wp => {
           if (wp.overlap(grass)) p++;
       });
       grass.touchedByWind = p;
       grass.updateWind(p);
    });
}

function debugRender1() {
    windParticlesGrp.forEachAlive(wp => {
        //game.debug.spriteBounds(wp, "#00cccc")
    })
}