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
    game.load.spritesheet('owl', 'owl.png', 24, 24);
    game.load.spritesheet('mouse', 'mouse.png', 24, 24);
    game.load.spritesheet('cheese', 'cheese.png', 24, 24);
    game.load.spritesheet('sun', 'sun.png', 32, 32);
    game.load.spritesheet('cloud', 'cloud.png', 64, 32);
    game.load.spritesheet('windmill', 'windmill.png', 32, 32);
}

var hero, cursors, space, owl;
var groundGrp, grassGrp, windParticlesGrp, miceGrp, cheeseGrp, shadow, cloudGrp;
;


function addOwl(gx, gy) {
    let branch = game.add.sprite(r(gx), r(gy), 'wind', 16);
    branch.anchor.set(0.5, 0.19);
    let shadowBitmap = game.add.bitmapData(64, game.height - r(gy));
    shadowBitmap.clear();
    shadowBitmap.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    shadowBitmap.ctx.moveTo(0,0);
    shadowBitmap.ctx.lineTo(16,0);
    shadowBitmap.ctx.lineTo(48,shadowBitmap.height);
    shadowBitmap.ctx.lineTo(0,shadowBitmap.height);
    shadowBitmap.ctx.fill();
    shadowBitmap.dirty = true;
    shadow = game.add.sprite(branch.left, branch.bottom - 5, shadowBitmap);
    game.physics.arcade.enable(shadow);

    let owl = game.add.sprite(r(gx), r(gy), 'owl', 0);
    owl.anchor.set(0.5, 0.5);
    owl.animations.add('idle', [0], 12);
    owl.animations.add('starting', [1,2,3,4,5], 12);
    owl.animations.add('stopping', [5,4,3,2,1,0], 12);
    owl.animations.add('flying', [2,3,4,5,4,3], 12, true);
    owl.animations.add('winded', [3], 12, true);

    game.physics.arcade.enable(owl);

    let state = 'idle';
    let target = null;
    let retPoint = {x: r(gx), y: r(gy)};

    owl.speed = 32;
    owl.speedFactor = 1;
    owl.windForce = {x:0, y:0};

    owl.update = () => {

        if (owl.speedFactor < 1) {
            owl.speedFactor += 0.1;
        }
        if (Math.abs(owl.windForce.x) < 0.05) owl.windForce.x = 0;
        if (owl.windForce.x != 0) owl.windForce.x -= Math.sign(owl.windForce.x)*0.05;
        if (Math.abs(owl.windForce.y) < 0.05) owl.windForce.y = 0;
        if (owl.windForce.y != 0) owl.windForce.y -= Math.sign(owl.windForce.y)*0.05;

        switch (state) {
            case 'idle':
                miceGrp.forEachAlive(mouse => {
                    if (!game.physics.arcade.overlap(mouse, shadow)) {
                        target = mouse;
                        fly();
                    }
                });
                break;
            case 'flying':
                if (game.physics.arcade.overlap(target, shadow)) {
                    back();
                }
                break;
            case 'back':
                if (Phaser.Point.distance(owl, retPoint) < 2) {
                    idle();
                }
                break;
        }
        owl.updateVelocity();

    };

    function idle() {
        state = 'idle';
        owl.x = retPoint.x;
        owl.y = retPoint.y;
        owl.animations.currentAnim.stop();
        owl.animations.play('stopping');
        owl.scale.x = 1;
        owl.body.velocity.set(0);
        owl.updateVelocity = () => {};
    }

    function back() {
        state = 'back';
        performFly(retPoint);
    }

    let loops;
    owl.animations.getAnimation('flying').onLoop.add(() => {
        if (state == 'idle') return;
        loops++;
        if (loops % 5 == 0) {
            owl.animations.play('winded');
            game.time.events.add(1000, () => {
                if (state == 'idle') return;
                owl.animations.play('flying');
            });
        }
    });

    function performFly(target) {
        owl.animations.play('starting').onComplete.addOnce(() => {
            loops = 0;
            owl.animations.play('flying');
            owl.updateVelocity = () => {
                let speed = owl.speed * owl.speedFactor;
                let ang = Phaser.Point.angle(target, owl);
                owl.body.velocity.x = Math.cos(ang)*speed + owl.windForce.x*speed;
                owl.body.velocity.y = Math.sin(ang)*speed + owl.windForce.y*speed;
                owl.scale.x = Math.sign(Math.cos(ang));

            };
        });
    }

    function fly() {
        state = 'flying';
        performFly(target)

    }

    owl.updateVelocity = () => {};

    return owl;
}

function addMouse(gx, gy) {
    let mouse = game.add.sprite(r(gx), r(gy), 'mouse', 0, miceGrp);
    mouse.anchor.set(0.5, 1);

    mouse.animations.add('walking', [0,1,2,1], 8, true);
    mouse.animations.add('idle', [3,4,3,4,3,4,3,4,5,6,5,6,5,6,5,6], 6, true);
    mouse.animations.add('eating', [7,8,9], 6, true);

    mouse.animations.play('idle');

    game.physics.arcade.enable(mouse);

    mouse.nose = game.add.sprite(10, -4);
    mouse.nose.width = 2;
    mouse.nose.height = 2;
    mouse.addChild(mouse.nose);
    game.physics.arcade.enable(mouse.nose);
    //mouse.nose.body.setSize(2,2);

    let state = 'idle';
    let hasCheese = false;

    const SPEED = 32;

    function tryToGetCheese() {
        state = 'tocheese';
        hasCheese = false;
        mouse.body.velocity.x = SPEED;
        mouse.speedX = 1;
        mouse.scale.x = 1;
        mouse.animations.play('walking');
    }

    function rest() {
        state = 'idle';
        mouse.body.velocity.x = 0;
        mouse.speedX = 0;
        if (hasCheese) {
            mouse.animations.play('eating');
            game.time.events.add(5000, tryToGetCheese);
        } else {
            mouse.animations.play('idle');
            game.time.events.add(3000, tryToGetCheese);
        }
    }

    function goBack(noStop = false) {
        state = 'back';
        let goBackImmediately = () => {
            mouse.speedX = -2;
            mouse.body.velocity.x = -SPEED*2;
            mouse.scale.x = -1;
            mouse.animations.play('walking');

        };
        if (noStop) {
            return goBackImmediately();
        }
        mouse.body.velocity.x = 0;
        mouse.speedX = 0;
        mouse.animations.play('idle');
        game.time.events.add(500, goBackImmediately);
    }



    mouse.update = () => {

        switch (state) {
            case 'tocheese':
                if (game.physics.arcade.overlap(mouse, cheeseGrp)) {
                    hasCheese = true;
                    goBack();
                }
                if (owl && Math.abs(owl.y - mouse.y) < 40) {
                    goBack(true);
                }
                break;
            case 'back':
                if (mouse.x < 16) {
                    rest();
                }
                break;
        }


    };

    rest();
    //tryToGetCheese();
    return mouse;
}

function addCheese(gx, gy) {
    let ch = game.add.sprite(r(gx), r(gy), 'cheese', 0, cheeseGrp);
    ch.anchor.set(0.5, 1);
    game.physics.arcade.enable(ch);
    return ch;
}

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
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u","u","u","u","u","u","u",
            [["ul"], ["ur"]]
        ]
    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u",[["u", "ur", [["ul"], ["ur", "u"]]], ["ul", "ul", "u", "u"]]
        ]
    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u","u",[["ur", "u", "ur"], ["ul", "ul", "u"]]
        ]
    },
    {
        frame: 4,
        color: {r: 0x0a, g: 0x84, b: 0x05},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g: 0x84, b: 0x05}},
            "u", "ur", "u", "u", "ur", "u", "u", "u", "ul", "ul", "ul", "l", "l", "dl","d", "d",
            {key: 'wind', frame: 14, direction: 'd'}
        ]

    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u"
        ],
        type: "grass"
    },
    {
        frame: 3,
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u", "u", "u"
        ],
        type: "grass"
    },
    {
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23, color: {r: 0x0a, g:0x63, b:0x19}},
            "u", "u", "u", "u", "u", "u",
            [["ur","ur"], [
                "u", "u", "u", "u", "u", "u",
                {key: 'wind', frame: 17, direction: 'u'}
            ]]
        ]
    },
    {
        color: {r: 0x0a, g:0x63, b:0x19},
        model: [
            {x: 12, y: 23},
            "u", "u", "u", [
                ["ur", "ur", "u", {key: 'wind', frame: 18, direction: 'u', offsetY: +2, offsetX: +1, tint: 0xffffff}],
                ["u", "u", [
                    ["ul", "ul", "l", "ul", "u", {key: 'wind', frame: 18, direction: 'u', offsetY: +2, offsetX: +1, tint: 0xffffff}],
                    ["u", "u", "u", "u", "u", "u", "u", {key: 'wind', frame: 18, direction: 'u', offsetY: +2, offsetX: +1}]
                ]]
            ]
        ]
    }
];

function addGrass(gx, gy, idx = undefined, color = undefined, ax = +4 + game.rnd.integerInRange(1,3)) {
    let kind = idx === undefined ? game.rnd.pick(GRASSES) : GRASSES[idx];
    kind.model[0].color = color || kind.color;
    let g = new GrassSprite(r(gx), r(gy)+ax, new GrassModel(kind.model), grassGrp);
    return g;
}

function throwWindParticle() {
    if (!hero.winding) return;
    let wp = game.add.sprite(hero.x, hero.y, undefined, undefined, windParticlesGrp);
    game.physics.arcade.enable(wp);
    wp.width = 4;
    wp.height = 4;
    wp.weight = 1;
    wp.update = () => {
       wp.x -= game.rnd.integerInRange(1,3) / 3;
       wp.weight *= 0.99;
    };
    wp.reactedWith = [];
    wp.checkWorldBounds = true;
    wp.outOfBoundsKill = true;
    return wp;
}

function create() {
    makeSharped();

    groundGrp = game.add.group();
    miceGrp = game.add.group();
    cheeseGrp = game.add.group();
    grassGrp = game.add.group();
    windParticlesGrp = game.add.group();
    cloudGrp = game.add.group();

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



    owl = addOwl(0.5,2);
    addMouse(0.5,7);
    addCheese(15.4,7.2);

    for (let p = 0; p < 16; p++) {
        addGround(p, 7);
    }


    let flowers = 5;
    for (let pix = r(2); pix < r(15); pix+= 1) {
        if (Math.random() < 0.3) continue;
        let rnd = Math.random();
        let idx;
        if (rnd > 0.3) {
            idx = game.rnd.pick([4,5]);//Math.random() > 0.5 ? 4 : 5;
        } else if (rnd > 0.26 && flowers) {
            idx = game.rnd.pick([3,6,7]);
            flowers--;
        } else  {
            idx = ((rnd*10)%3)|0;
        }
        let g = game.rnd.integerInRange(0x40, 0x80);
        let b = game.rnd.integerInRange(0x00, 0x20);
        let r = game.rnd.integerInRange(0x00, 0x20);
        addGrass(pix/16, 6, idx, {r,g,b});
    }

    let windmill = new Windmill(r(8),r(7));

    game.sun = new Sun(game.width*2/3, 24);
    let cloud = new Cloud(16,24);

    game.world.bringToTop(cloudGrp);


    //addGround(6, 5);
    //addGround(5, 5);
    //addGrass(6.5, 4, 0, undefined, +4);
    //addGrass(5.5, 4, 0, undefined, +4);

}

function update() {

    grassGrp.forEachAlive(grass => {
       let p = 0;
       windParticlesGrp.forEachAlive(wp => {
            if (game.physics.arcade.overlap(grass, wp) && wp.reactedWith.indexOf(grass) == -1) {
                p += wp.weight;
                wp.reactedWith.push(grass);
            }
       });
       grass.touchedByWind = p;
       grass.updateWind(p, -Math.sign(hero.scale.x), hero.y);
       miceGrp.forEachAlive(mouse => {
            if (game.physics.arcade.overlap(grass, mouse.nose)) {
                grass.updateWind(0.2*Math.abs(mouse.speedX), mouse.speedX, mouse.bottom-2);
            }
       });

    });
    //todo: reuse
    cloudGrp.forEachAlive(cloud => {
        let p = 0;
        windParticlesGrp.forEachAlive(wp => {
            if (game.physics.arcade.overlap(cloud, wp) && wp.reactedWith.indexOf(cloud) == -1) {
                p++;
                wp.reactedWith.push(cloud);
            }
        });
        if (p > 0) {
            cloud.updateWind(1, -Math.sign(hero.scale.x), hero.y)
        }
    });

    if (game.physics.arcade.overlap(owl, windParticlesGrp)) {
        owl.windForce = {y: -1.5, x: -1.5 * Math.sign(hero.scale.x)};
    }
}

function debugRender1() {
    windParticlesGrp.forEachAlive(wp => {
        //game.debug.spriteBounds(wp, `rgba(0,200,200,${wp.weight.toFixed(2)})`);
    });
    miceGrp.forEachAlive(gg => {
        //game.debug.body(gg.nose, "#cc0000");
        //game.debug.spriteBounds(gg.nose, "#440000", false);
    });
}