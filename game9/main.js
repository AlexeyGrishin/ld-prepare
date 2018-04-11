function preload() {
    game.load.spritesheet('hero', './tom-hero.png', 16, 16);
    game.load.spritesheet('enemy', './tom-tomato.png', 16, 16);
    game.load.spritesheet('weapon', './tom-weapons.png', 16, 16);
    game.load.spritesheet('env', './tom-env.png', 16, 16);
}

class Tomato1 extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'enemy', 0);
        this.animations.add("idle", [0], 24, false);
        this.animations.add("jump", [0,1,2,3,4,5,6,7,8,9,10,0], 24, false);
        this.anchor.set(0.5, 1);
    }

    move(dx) {
        this.moving = true;
        this.scale.x = dx > 0 ? -1 : 1;
        this.animations.play('jump').onComplete.addOnce(() => {
            this.moving = false;
        });
        game.add.tween(this).to({x: this.x+dx}, 11/24*1000, null, true);
    }

}

class Tomato2 extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'enemy', 11);
        this.animations.add("idle", [11], 12, false);
        this.animations.add("step", [11,12,13,14,15,16,17,18,19,20], 24, false);
        this.anchor.set(0.5, 1);
    }

    move(dx) {
        this.moving = true;
        this.scale.x = dx > 0 ? -1 : 1;
        this.animations.play('step').onComplete.addOnce(() => {
            this.moving = false;
            this.x += dx;
        });
        //game.add.tween(this).to({x: this.x+dx}, 10/12*1000, null, true);
    }

}

class Bullet extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'env', 9);
        this.animations.add('fly', [9,10,11,12], 24, true);
        this.animations.play('fly');
        this.checkWorldBounds = true;
        this.outOfBoundsKill = true;
    }

    update() {
        this.x += this.dx;
    }
}

class Fork extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'weapon', 0);
        this.animations.add('idle', [0], 24, false);
        this.animations.add('fire-start', [1,2,3,4], 24, false);
        this.animations.add('fire-end', [5,6,7,8], 24, false);

        this.firing = false;

    }

    fire() {
        if (this.firing) return;
        this.firing = true;
        this.animations.play('fire-start').onComplete.addOnce(() => {
            //here damage
            this.animations.play('fire-end').onComplete.addOnce(() => {
                this.animations.play('idle');
                this.firing = false;
            });
        })
    }
}

class Shotgun extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'weapon', 9);
        this.animations.add('idle', [9], 24, false);
        this.animations.add('fire-start', [10,11,12], 24, false);
        this.animations.add('fire-end', [13,14,15,16], 24, false);

        this.firing = false;
    }

    fire() {
        if (this.firing) return;
        this.firing = true;
        this.animations.play('fire-start').onComplete.addOnce(() => {
            let bullet = new Bullet(this.world.x, this.world.y+2);
            bullet.dx = this.parent.scale.x * 10;
            game.add.existing(bullet);
            this.animations.play('fire-end').onComplete.addOnce(() => {
                this.animations.play('idle');
                this.firing = false;
            });
        })
    }
}

class Hero extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'hero', 0);
        this.animations.add('idle', [0], 24, false);
        this.animations.add('idle-with-weapon', [0], 24, false);
        this.animations.add('walk', [0,1,2], 24, true);
        this.animations.add('walk-with-weapon', [3,4,5], 24, true);
        this.weapon = null;
        this.anchor.set(0.2, 1);
    }

    move(dx) {
        this.scale.x = dx > 0 ? 1 : -1;
        if (!this.walking) {
            this.walking = true;
            this.animations.play('walk' + this.weaponState);
        }
        this.velocity = dx;
    }

    update() {
        if (this.velocity) this.x += this.velocity;
    }

    stop() {
        this.animations.play('idle' + this.weaponState);
        this.velocity = 0;
        this.walking = false;
    }

    get weaponState() {
        return this.weapon ? '-with-weapon' : '';
    }

    setWeapon(kls) {
        if (this.weapon) {
            this.weapon.destroy();
            this.weapon = null;
        }
        if (kls) {
            this.weapon = new kls(-4, -16);
            this.addChild(this.weapon);
        }
    }

    fire() {
        if (this.weapon) {
            this.weapon.fire();
        }
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

let enemy;
let enemy2;
let cursors;
let keys;
let hero;

function createGrass(x, y, type = 0) {
    let grass1 = game.add.sprite(x, y, 'env', 0)
    grass1.anchor.set(0.5, 4/16);
    return grass1;
}

function createTransporter(x, y, length, direction) {
    let lastX = x+length*16;
    let sections = [];
    for (let i = 0; i < length; i++) {
        let section = game.add.sprite(x+i*16, y, 'env', 14);
        section.animations.add('working', [14,15,16,17], 24, true);
        section.anchor.set(0.5, 4/16);
        sections.push(section);
        section.scale.x = direction === 'right' ? 1 : -1;
        if (i === 0) {
            let s = game.add.sprite(x+i*16, y, 'env', 18);
            s.animations.add('working', direction === 'right' ? [20,19,18] : [18,19,20], 24, true);
            s.anchor.set(0.5, 4/16);
            sections.push(s);
        }
        if (i === length-1) {
            let s = game.add.sprite(x+i*16, y, 'env', 18);
            s.animations.add('working', direction === 'right' ? [18,19,20] : [20,19,18], 24, true);
            s.anchor.set(0.5, 4/16);
            s.scale.x = -1;
            sections.push(s);
        }
    }

    let running = false;

    let transporter = {
        run() {
            for (let s of sections) {
                s.animations.play('working');
            }
        },

        stop() {
                for (let s of sections) {
                    s.animations.currentAnim.stop();
                }
        }
    };
    return transporter;
}

function create() {
    game.stage.backgroundColor = "#ccecff";
    hero = new Hero(100, 100);
    game.add.existing(hero);
    enemy = new Tomato1(200, 100);
    enemy2 = new Tomato2(200, 132);
    game.add.existing(enemy);
    game.add.existing(enemy2);
    hero.setWeapon(Fork);
    for (let x = 100; x < 400; x += 16) {
        createGrass(x, 100, game.rnd.integerInRange(0,1));
    }
    for (let x = 200; x < 300; x += 16) {
        createGrass(x, 132, game.rnd.integerInRange(0,1));
    }
    let t1 = createTransporter(16, 100, 5, 'right'); t1.run();
    let t2 = createTransporter(16, 132, 8, 'left'); t2.run();

    makeSharped();
    cursors = game.input.keyboard.createCursorKeys();
    keys = {
        space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        zero: game.input.keyboard.addKey(Phaser.Keyboard.ZERO),
        one: game.input.keyboard.addKey(Phaser.Keyboard.ONE),
        two: game.input.keyboard.addKey(Phaser.Keyboard.TWO),
    };

}

function update() {
    if (keys.zero.justDown) {
        hero.setWeapon(null);
    } else if (keys.one.justDown) {
        hero.setWeapon(Shotgun);
    } else if (keys.two.justDown) {
        hero.setWeapon(Fork);
    }
    if (cursors.left.isDown) {
        hero.move(-1);
    } else if (cursors.right.isDown) {
        hero.move(+1);
    } else {
        hero.stop();
    }
    if (keys.space.justDown) {
        hero.stop();
        hero.fire();
    }
    if (!enemy.moving) {
        if (enemy.x < 150) enemy.direction = 'right';
        if (enemy.x > 200) enemy.direction = 'left';
        enemy.move(enemy.direction === 'left' ? -30 : +30);
    }
    if (!enemy2.moving) {
        if (enemy2.x < 200) enemy2.direction = 'right';
        if (enemy2.x > 300) enemy2.direction = 'left';
        enemy2.move(enemy2.direction === 'left' ? -2 : +2);
    }

}

function debugRender1() {}