function preload() {
    game.load.spritesheet('ruslan', './ruslan.png', 16, 16);
    game.load.spritesheet('wood', './ruslan.png', 16, 2);
    game.load.spritesheet('fw', './fw.png', 4, 4);
}
const SPEED = 40;
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

class Wood extends Phaser.Sprite {
    constructor(x, y, width) {
        super(game, x, y);
        this.createTexture(width);

        this.anchor.set(0.5, 1);
        game.physics.arcade.enableBody(this);
        this.body.collideWorldBounds = true;
        this.body.mass = width/16;
        this.body.bounce.set(0.1, 0.4);
        this.body.allowRotation = false;
        this.body.friction.set(0,0);
        this.body.skipQuadTree = true;
        this.wood = true;

    }

    createTexture(width) {
        let bitmapData = game.add.bitmapData(width, 2);
        for (let xi = 0; xi < width; xi += 16) {
            let fr = game.rnd.integerInRange(0, 7);
            bitmapData.copyRect('ruslan', new Phaser.Rectangle(0, fr*2, 16, 2), xi, 0);
        }
        bitmapData.update();
        bitmapData.processPixelRGB((o) => {
            o.r *= 0.5;
            o.g *= 0.5;
            o.b *= 0.5;
            return o;
        }, null, 0, 1, width, 1);
        this.loadTexture(bitmapData);
        //console.log(this.width, this.body && this.body.width);
    }

    shrinkTo(newLength) {
        let currentWidth = this.width;
        this.createTexture(newLength);
        this.data.offset += (currentWidth - newLength)/2;
        this.width = newLength;
        this.body.setSize(newLength, 2);
        this.body.mass = newLength/16;
    }
}

class Saw extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'ruslan', 7);
        this.animations.add('work', [7,8,9,10,11], 16).onComplete.add(this.onComplete.bind(this));
        this.anchor.set(0.5, 0.5);
        this.working = false;
        this.emitter = game.add.emitter(this.centerX, this.bottom, 30);
        let wp = game.add.bitmapData(2, 2);
        wp.fill(0xa1, 0x40, 0x00);
        this.emitter.makeParticles(wp);
        this.emitter.gravity.y = 20;
        this.emitter.setXSpeed(-10, 10);
        this.emitter.setYSpeed(8, 15);
        this.emitter.setScale(1, 1, 1, 1);
    }

    doWork() {
        this.working = true;
        if (!this.animations.currentAnim.isPlaying) {
            this.animations.play('work');
            if (this.hasWoodUnderSaw()) {
                this.emitter.flow(600, 10, 1, 50)
            }
        }
    }

    hasWoodUnderSaw() {
        return hero.handling && hero.handling.left < this.x && hero.handling.right > this.x;
    }

    onComplete() {
        if (this.working) {
            let wood = hero.handling;
            if (wood && this.hasWoodUnderSaw()) {
                let len1 = (this.x - wood.left)|0;
                let len2 = wood.width - len1;
                if (len1 > 1 && len2 > 1) {
                    let newWood = new Wood(wood.left + len1/2, wood.y, len1);
                    woodGrp.add(newWood);
                    wood.shrinkTo(len2);
                }
            }
            this.animations.play('work');
            if (this.hasWoodUnderSaw()) {
                this.emitter.flow(600, 10, 1, 50)
            }

        }
    }


    stop() {
        this.working = false;
    }
}

const HOUSE = [
    {y:0, x:0, width: 4},
    {y:1, x:0, width: 4},
    {y:2, x:0, width: 4},
    {y:3, x:0.5, width: 3},
    {y:4, x:0.5, width: 3},
    {y:5, x:0.5, width: 1},
    {y:5, x:2.5, width: 1},
    {y:6, x:0.5, width: 1},
    {y:6, x:2.5, width: 1},
    {y:7, x:0.5, width: 1},
    {y:7, x:2.5, width: 1},
    {y:8, x:0.5, width: 1},
    {y:8, x:2.5, width: 1},
    {y: 9, x: 0.5, width: 3},
    {y: 10, x: 0.5, width: 3},
    {y: 11, x: 0, width: 4},
    {y: 12, x: 0.5, width: 3},
    {y: 13, x: 1, width: 2},
    {y: 14, x: 1.5, width: 1},
    {y: 15, x: 1.75, width: 0.5},
];

const CAKE = [

]

function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
// scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(2, 2);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

let cursors;
let keys;
let hero;
let grassGrp;
let woodGrp;
let heroBarrier;
let saw;
let goal;

class Goal extends Phaser.Sprite {
    constructor(x, y, goal) {
        super(game, x, y);
        this.goal = goal;
        let bitmap = game.add.bitmapData(100, 160);
        this.loadTexture(bitmap);
        this.bitmap = bitmap;
        this.anchor.set(0,1);
        this.goal[0].pending = true;
        this.ts = 0;
        this.redraw();
        this.firewerk = game.add.emitter(x, y-80, 500);
        this.firewerk.makeParticles('fw', [0,1,2,3]);
        this.firewerk.gravity.y = 10 - game.physics.arcade.gravity.y;
        this.firewerk.setXSpeed(-50, 50);
        this.firewerk.setYSpeed(-50, 50);
        this.firewerk.setScale(0.5, 0.5, 1, 1);
        this.firewerk.setRotation(0, Math.PI);


        this.log("throw woods here!")
    }

    redraw() {
        this.bitmap.clear();
        let tf = (1+Math.sin(this.ts/500))/2;
        this.bitmap.ctx.globalAlpha = 1;
        for (let g of this.goal.filter(g => g.completed)) {
            this.bitmap.ctx.fillStyle = "#00cc00";
            this.bitmap.ctx.fillRect(g.x*16, 160-g.y*2-2, g.width*16, 2);
        }
        this.bitmap.ctx.globalAlpha = 0.8 + 0.2*tf;
        for (let g of this.goal.filter(g => g.pending)) {
            this.bitmap.ctx.fillStyle = "#ffc000";
            this.bitmap.ctx.fillRect(g.x*16, 160-g.y*2-3+2*tf, g.width*16, 2);
        }
        this.bitmap.ctx.dirty = true;
    }

    log(txt) {
        let text = game.add.text(-8, 0, txt, {fontSize: "8px", fontFamily: "monospace"});
        this.addChild(text);
        text.tween = game.add.tween(text).to({y: -100, alpha: 0}, 2000, null, true).onComplete.addOnce(() => {
            text.destroy();
        })
    }

    update() {
        this.ts += game.time.physicsElapsedMS;
        this.redraw();

        woodGrp.children.forEach(w => {
           if (w.overlap(this) && w.body.immovable && !w.data.counted) {
               //something landed here
                for (let g of this.goal.filter(g => g.pending)) {
                    let worldCenterX = this.x + g.x*16 + g.width*16/2;
                    let worldCenterY = this.y - g.y*2 - 1;
                    let difference = Math.abs(g.width*16 - w.width);
                    if (difference >= 16) {
                        this.log("size mismatch!");
                        this.reject(w);
                    } else if (Math.abs(worldCenterY-w.y) > 2) {
                        this.log("place mismatch!");
                        this.reject(w);
                    } else if (Math.abs(worldCenterX-w.x)>=32) {
                        this.log("place mismatch!");
                        this.reject(w);
                    } else {
                        this.accept(w, g, worldCenterX, worldCenterY);
                        break;
                    }
                }
           }
        });
    }

    hooray() {
        game.add.tween(this.firewerk).to({emitX: -60, emitY: +30}, 10000, null, true, null, 10, true);
        this.firewerk.explode(1000, 10);
        game.time.events.add(500, () => this.firewerk.explode(1000, 10));
        game.time.events.add(1000, () => this.firewerk.explode(1500, 20));
        game.time.events.add(2000, () => this.firewerk.explode(1500, 50));
        game.time.events.add(3000, () => this.firewerk.explode(3000, 100));
    }

    reject(w) {
        w.body.immovable = false;
        w.body.allowGravity = true;
        w.body.velocity.set(-120, -60);
    }

    accept(w, g, x, y) {
        w.data.counted = true;
        g.pending = false;
        g.completed = true;
        game.add.tween(w).to({x,y}, 200, null, true).onComplete.addOnce(() => {
           this.selectNextPending();
        });
    }

    selectNextPending() {
        let somePending = false;
        for (let i = 1; i < this.goal.length; i++) {
            let prev = this.goal[i-1];
            let it = this.goal[i];
            //todo
            if (prev.completed && !it.completed) {
                it.pending = true;
                somePending = true;
            }
        }
        if (!somePending) {
            this.log("hooray! happy birthday!");
            this.hooray();
            hero.dance();
        }
    }


}

function create() {
    game.stage.backgroundColor = "#ccecff";
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 100;
    goal = new Goal(16*15, 160-16, HOUSE);
    game.add.existing(goal);
    grassGrp = game.add.group();
    grassGrp.enableBody = true;
    grassGrp.physicsBodyType =  Phaser.Physics.ARCADE;
    woodGrp = game.add.group();
    hero = new Hero(16*8, 160-16-16);
    saw = new Saw(32, 160-16-16-8);
    game.add.existing(hero);
    game.add.existing(saw);
    for (let x = 0; x < 320; x+= 16) {
        if (x === 16*13) {
          heroBarrier = new Phaser.Sprite(game, x, 160-32);
          heroBarrier.height = 32;
          heroBarrier.width = 16;
          game.physics.arcade.enableBody(heroBarrier);
          game.add.existing(heroBarrier);
          heroBarrier.body.immovable = true;
          heroBarrier.body.allowGravity = false;
        } else {
          let grass = new Phaser.Sprite(game, x, 160-16, 'ruslan', 12);
          grassGrp.add(grass);
          grass.body.immovable = true;
          grass.body.allowGravity = false;
        }
    }

    for (let si = 0; si < 8; si++) {
        woodGrp.add(new Wood(11*8, 160-16-2-2*si, 4*16))
        woodGrp.add(new Wood(20*8, 160-16-2-2*si, 3*16))
    }
    /*
    let sizes = [];
    for (let si = 0; si < 10; si++) sizes.push(game.rnd.integerInRange(3,4) * 16);
    sizes.sort((a,b) => b-a);
    sizes.forEach((size, idx) => {
        let x = game.rnd.integerInRange(8, 18)*8;
        let y = 160-16-2-idx*4;
        woodGrp.add(new Wood(x, y, size));
    });*/

    makeSharped();
    cursors = game.input.keyboard.createCursorKeys();
    keys = {
        space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        z: game.input.keyboard.addKey(Phaser.Keyboard.Z),
    };

}

function updateVelocity(o1) {
  if (o1.body.touching.down && o1.body.velocity.x) {
    o1.body.velocity.x *= 0.9;
    o1.body.velocity.x = 0;
    if (Math.abs(o1.body.velocity.x) < 0.1) o1.body.velocity.x = 0;
  }
}

function updateVelocityPair(o1, o2) {
  updateVelocity(o1);
  updateVelocity(o2);
}

function update() {
    game.physics.arcade.collide(hero, grassGrp);
    woodGrp.sort('y', Phaser.Group.SORT_DESCENDING);
    for (let wi = 0; wi < woodGrp.children.length; wi++) {
        let wood = woodGrp.children[wi];
        if (wood === hero.handling) continue;
        if (wood.body.velocity.y < 0) continue;
        if (wood.y >= 160-16) {
            wood.y = 160-16;
            wood.body.velocity.y = 0;
            wood.body.velocity.x = 0;
            wood.body.allowGravity = false;
            wood.body.immovable = true;
        } else {
            let found = false;
            for (let cwi = wi-1; cwi >= 0; cwi--) {
                let cwood = woodGrp.children[cwi];
                if (cwood === hero.handling) continue;
                if (cwood.y >= wood.y+2) break;
                if (wood.right <= cwood.left || wood.left >= cwood.right) {
                    //not our case
                } else {
                    found = true;
                    wood.y = cwood.y-2;
                    break;
                }
            }
            if (found) {
                wood.body.allowGravity = false;
                wood.body.immovable = true;
                wood.body.velocity.y = 0;
                wood.body.velocity.x = 0;
            } else {
                wood.body.allowGravity = true;
                wood.body.immovable = false;
            }

        }
    }
    //game.physics.arcade.collide(woodGrp, grassGrp, updateVelocityPair);
    //game.physics.arcade.collide(woodGrp, woodGrp, updateVelocityPair);
    game.physics.arcade.collide(hero, heroBarrier);

    if (cursors.left.isDown) {
        hero.move(-1);
    } else if (cursors.right.isDown) {
        hero.move(+1);
    } else {
        hero.stop();
    }
    if (cursors.up.isDown) {
        hero.altAngle(-0.02);
    } else if (cursors.down.isDown) {
        hero.altAngle(+0.02);
    }
    if (keys.space.justDown) {
        if (hero.handling) {
            hero.throwWood();
        } else {
            woodGrp.sort('y', Phaser.Group.SORT_ASCENDING);
            for (let w of woodGrp.children) {
                if (game.physics.arcade.intersects(hero.body, w.body)) {
                    hero.handleWood(w);
                    break;
                }
            }
        }
    }
    if (keys.z.isDown) {
        saw.doWork();
    } else {
        saw.stop();
    }

}

function debugRender1() {
    //game.debug.body(hero);
    //for (let w of woodGrp.children) game.debug.body(w);
    //game.debug.body(woodGrp.children[0]);
}