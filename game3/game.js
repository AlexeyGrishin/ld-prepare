function preload() {
    game.time.advancedTiming = true;

    game.load.spritesheet("cacodemon", "cacodemon.png", 76, 78);
    game.load.image("ground", "ground.png");
    game.load.script('fb', 'fireball.js');
    game.load.script('gd', 'Ground.js');
}

var hero, cursors, fire, fireCooldown = 0, world;


var frames = [
    {idx: 0, scale: 1}, 
    {idx: 1, scale: 1}, 
    {idx: 2, scale: 1}, 
    {idx: 3, scale: 1}, 
    {idx: 4, scale: 1}, 
    {idx: 3, scale: -1}, 
    {idx: 2, scale: -1}, 
    {idx: 1, scale: -1}, 
];

function frameIdx(hero, point) {
    return  (3 + Math.floor((Phaser.Point.angle(hero, point) - Math.PI/8) / Math.PI / 2 * 8) + 8) % 8 ;
}

function lookAt(hero, point) {
    var fi = frameIdx(hero, point);
    hero.frame = frames[fi].idx;
    hero.scale.x = frames[fi].scale;
}

var fireballs;

function createFireball(target) {
    var bm = game.add.bitmapData(48,48);
    bm.context.fillStyle = "green";
    bm.context.fillRect(0,0,48,48);
    var fb = game.add.sprite(hero.centerX-24, hero.centerY-24, bm);
    fb.filters = [game.add.filter('Fireball')];
    fb.checkWorldBounds = true;
    fb.outOfBoundsKill = true;
    fb.data.velocity = {
        x: 5 * (target.x - hero.x) / Phaser.Point.distance(hero, target),
        y: 5 *(target.y - hero.y) / Phaser.Point.distance(hero, target),
    };
    fireballs.add(fb);
}

function create1() {

    world = game.add.bitmapData(game.world.width, game.world.height);
    prepareWorld();

    var wsprite = game.add.sprite(0,0,world);
    wsprite.filters = [game.add.filter("Ground")];
    
    var texSprite = game.add.sprite(1000,0, "ground");
    wsprite.filters[0].uniforms.iChannel0.value = texSprite.texture;

    hero = game.add.sprite(320, 320, "cacodemon");
    hero.anchor = {x:0.5, y:0.5};

    cursors = game.input.keyboard.createCursorKeys();
    fire = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    hero.data.velocity = {x:0, y: 0};

    fireballs = game.add.group();
}

function prepareWorld() {
    world.clear(0,0,world.width,world.height);
    world.context.fillStyle = "black";
    world.context.fillRect(0,0,world.width,world.height);
    world.context.fillStyle = "white";
    world.context.beginPath();
    world.context.arc(320, 320, 100, 0, Math.PI*2);
    world.context.fill();

    world.update(0,0,world.width,world.height);
}


function makeAHole(x, y, size) {
    world.context.fillStyle = "white";
    world.context.beginPath();
    world.context.arc(x, y, size, 0, Math.PI*2);
    world.context.fill();

    world.dirty = true;
    world.update(0,0,world.width,world.height);
}

var SPEED = 5;

function update1() {
    lookAt(hero, game.input.mousePointer);
    fireCooldown -= game.time.elapsedMS;

    if (cursors.left.isDown) {
        hero.data.velocity.x = -SPEED;
    } else if (cursors.right.isDown) {
        hero.data.velocity.x = SPEED;
    } else {
        hero.data.velocity.x = 0;
    }

    if (cursors.down.isDown) {
        hero.data.velocity.y = SPEED;
    } else if (cursors.up.isDown) {
        hero.data.velocity.y = -SPEED;
    } else {
        hero.data.velocity.y = 0;
    }

    calculateMovement();

    if (fire.isDown && fireCooldown <= 0) {
        createFireball(game.input.mousePointer);
        fireCooldown = 200;
    }

    fireballs.forEachAlive(function(fb) {
        fb.filters[0].uniforms.offset.value = {x: fb.x, y: fb.y};
        if (isFreeAreaToMove(getDesiredRect(fb, 20))) {
            fb.x += fb.data.velocity.x;
            fb.y += fb.data.velocity.y;
        } else {
            makeAHole(fb.x, fb.y, 72);
            fb.destroy();

        }
    });
    fireballs.forEachDead(function(fb) { fb.destroy();});
}


function getDesiredRect(obj, pad) {
    obj = obj || hero;
    pad = pad || 5;
    return {
        //needed because when scale.x = -1 left and right are interchanged
        x1: (Math.min(obj.left, obj.right) + obj.data.velocity.x + pad)|0,
        y1: (obj.top + obj.data.velocity.y + pad)|0,
        x2: (Math.max(obj.left, obj.right)  + obj.data.velocity.x - pad)|0,
        y2: (obj.bottom + obj.data.velocity.y - pad)|0
    };
}


function calculateMovement() {
    if (isFreeAreaToMove(getDesiredRect())) {
        //ok
    } else {
        if (hero.data.velocity.x) {
            hero.data.velocity.y = SPEED;
            if (!isFreeAreaToMove(getDesiredRect())) {
                hero.data.velocity.y = -SPEED;
                if (!isFreeAreaToMove(getDesiredRect())) {
                    hero.data.velocity = {x:0, y:0};
                }
            }
        } else {
            hero.data.velocity.x = SPEED;
            if (!isFreeAreaToMove(getDesiredRect())) {
                hero.data.velocity.x = -SPEED;
                if (!isFreeAreaToMove(getDesiredRect())) {
                    hero.data.velocity = {x:0, y:0};
                }
            }
        }
    }
    hero.x += hero.data.velocity.x;
    hero.y += hero.data.velocity.y;

    var desiredRect = getDesiredRect();
    hero.data.desired = new Phaser.Rectangle(desiredRect.x1, desiredRect.y1, desiredRect.x2-desiredRect.x1, desiredRect.y2-desiredRect.y1);
    hero.data.isFree = isFreeAreaToMove(desiredRect);
}

function print() {
    var desiredRect = {
        x1: hero.left + hero.data.velocity.x,
        y1: hero.top + hero.data.velocity.y,
        x2: hero.right + hero.data.velocity.x,
        y2: hero.bottom + hero.data.velocity.y
    };
    console.log(desiredRect, " == ", isFreeAreaToMove(desiredRect));
}

function isFreeAreaToMove(rect) {
    //console.log(rect);
    //world.update(rect.x1, rect.y1, rect.x2-rect.x1, rect.y2-rect.y1);
    var free = true;
    world.processPixel(function(color) {
        if (color !== 0xffffffff) {
            free = false;
            return false;
        }
        return color;
    }, undefined, rect.x1, rect.y1, rect.x2-rect.x1, rect.y2-rect.y1);
    return free;
}

function couldMoveAt(sprite, newPos) {
    //world.blendXor();
    world.draw(sprite, newPos.x, newPos.y, sprite.width, sprite.height, "multiply");
    world.update(0,0,world.width,world.height);
    world.processPixel(function(color) {
        return color;
    }, newPos.x, newPos.y, sprite.width, 10);
}


function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    //game.debug.geom(hero.data.desired);
}