const RR_COLOR = "#24aeb4";
function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('demo1', 'demo1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('world of zzz', 'world of zzz.png');
    game.load.spritesheet('units', 'zzz-units.png', 32, 32);
    game.load.spritesheet('env', 'world of zzz.png', 64, 64);

}

var map, hero, anchor;
var iceLayer, rroadLayer, buildingsLayer, icebergsLayer;
var layers;
var unitsGroup;

function createHero() {
    hero = game.add.sprite(64*4.5,64*9.5, 'units', 1);
    hero.anchor.set(0.5,0.5);
    game.physics.p2.enable(hero);
    game.camera.follow(hero);
    game.camera.deadzone = new Phaser.Rectangle(960/2-64, 640/2-64, 128, 128);
    return hero;
}

function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(1, 1);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

let cursors, space, escape;
let zoomer = createZoomer();
let heroCollisionGroup;
let ropeImage, ropeSprite;

function createAnchorAt(x, y) {
    const DISTANCE = 64;
    if (!anchor) {
        anchor = game.add.sprite(x, y, 'env', 10);
        anchor.anchor.set(0.5, 0.5);
        game.physics.p2.enable(anchor);
        anchor.body.static = true;

        ropeImage = game.add.bitmapData(DISTANCE*4, DISTANCE*4);
        ropeSprite = game.add.sprite(x, y, ropeImage);
        ropeSprite.anchor.set(0.5, 0.5);
        ropeSprite.update = () => {
            ropeImage.cls();
            ropeImage.line(
                DISTANCE*2,DISTANCE*2, DISTANCE*2 + (hero.body.x - anchor.body.x), DISTANCE*2 + (hero.body.y - anchor.body.y),
                hero.data.railroad ? RR_COLOR : 'black', 1);
        }
    }
    anchor.body.x = x;
    anchor.body.y = y;
    ropeSprite.x = x;
    ropeSprite.y = y;
    if (hero.data.rope) {
        game.physics.p2.removeConstraint(hero.data.rope);
        delete hero.data.rope;
    }
    hero.body.y += 5;
    //hero.body.reset(x, y);
    hero.data.ropeCooldown = true;
    //todo: first idea how to temporality subscribe on update calls
    game.add.tween({a:0}).to({a:1000}, 1000, null, true).onUpdateCallback(() => {
        if (!hero.data.ropeCooldown) {
            return;
        }
        if (Phaser.Point.distance(hero, anchor) >= DISTANCE) {
            hero.data.ropeCooldown = false;
            hero.data.rope = game.physics.p2.createDistanceConstraint(hero, anchor, DISTANCE, undefined, undefined, 1000)
        }
    });
    /*game.add.tween(hero.data.rope).to({maxForce: 1000}, 1500, null, true).onUpdateCallback(() => {
        hero.data.rope.setMaxForce(hero.data.rope.maxForce);
    });*/
}

function createTrain(rrX) {
    const maxY = 64*41.5;
    const minY = 64*4.5;
    const DELAY1 = game.rnd.integerInRange(3000,6000);
    const DELAY2 = game.rnd.integerInRange(1000,4000);
    const DELAY3 = game.rnd.integerInRange(1000,4000);
    let train = game.add.sprite((rrX+0.5)*64, minY, 'units', 0);
    train.anchor.set(0.5, 0.5);
    train.data.direction = -1;
    train.update = () => {
        train.body.reset((rrX+0.5)*64, train.y);
        let newdir = Phaser.Math.sign(train.previousPosition.y - train.y);
        if (newdir != 0 && newdir != train.data.direction) {
            train.data.direction = newdir;
        }
        train.scale.y = train.data.direction;
    };


    game.physics.p2.enableBody(train);
    train.body.data.gravityScale = 0;
    train.body.data.mass = 100000;
    train.body.setCollisionGroup(heroCollisionGroup);
    train.body.collides([heroCollisionGroup]);
    game.add.tween(train.body).to({y: maxY}, DELAY1, "Quad.easeInOut", true, DELAY2, -1, true).yoyo(true, DELAY3).repeatDelay(DELAY2);


}

let goldMines = [
    {tileX: 1, tileY: 11}
];

let cities = [
    {tileX: 4, tileY: 7},
    {tileX: 6, tileY: 13},
];

function create() {
    map = game.add.tilemap('demo1');
    game.stage.backgroundColor = '#cccccc';
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.gravity.y = 900;

    makeSharped();

    map.addTilesetImage('world of zzz');

    iceLayer = map.createLayer('ice');
    rroadLayer = map.createLayer('railroad');
    buildingsLayer = map.createLayer('buildings');
    icebergsLayer = map.createLayer('icebergs');
    map.setCollisionByExclusion([], true, iceLayer);
    layers = [iceLayer, rroadLayer, buildingsLayer, icebergsLayer];

    iceLayer.resizeWorld();

    createHero();
    heroCollisionGroup = game.physics.p2.createCollisionGroup(hero);
    hero.body.collides([heroCollisionGroup]);
    createAnchorAt(64*4.5,64*8.5);

    createTrain(8);
    createTrain(21);


    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    escape = game.input.keyboard.addKey(Phaser.Keyboard.ESC);

    game.input.mouse.mouseWheelCallback = function(e) {
        if (e.deltaY > 0) {
            zoomer.zoom(+1);
        } else if (e.deltaY < 0) {
            zoomer.zoom(-1);
        }
        e.preventDefault();
        return false;
    };

    game.world.bringToTop(hero);
}

let railroadBitmap, railroadImage;

function createRailroad(x, y) {
    if (!railroadBitmap) {
        railroadBitmap = game.add.bitmapData(game.world.width, game.world.height);
        railroadImage = game.add.sprite(0, 0, railroadBitmap);
        railroadImage.redraw = () => {
            let rtodraw = railroads.slice();
            if (hero.data.railroad && hero.data.railroad.points.length) rtodraw.push(hero.data.railroad);
            railroadBitmap.ctx.clearRect(0, 0, game.world.width, game.world.height);
            railroadBitmap.ctx.strokeStyle = RR_COLOR;
            for (let rr of rtodraw) {
                railroadBitmap.ctx.setLineDash(rr.completed ? [16,0] : [8,8]);
                railroadBitmap.ctx.lineDashOffset = game.time.totalElapsedSeconds() % 16;
                railroadBitmap.ctx.beginPath();
                railroadBitmap.ctx.moveTo(rr.points[0].x, rr.points[0].y);
                rr.points.slice(1).forEach(({x,y}) => railroadBitmap.ctx.lineTo(x,y));
                railroadBitmap.ctx.stroke();
            }
            railroadBitmap.dirty = true;
        }
    }

    let railroad = {
        completed: false,
        points: [{x, y}],

        complete(x, y) {
            this.add(x,y);
            this.completed = true;

            railroadImage.redraw();
        },

        add(x,y) {
            this.points.push({x,y});
            railroadImage.redraw();
        },

        destroy() {
            this.points = [];
            railroadImage.redraw();
        }
    };

    return railroad;

}

function findNear(col) {
    return col
        .map(({tileX, tileY}) => {return {x: (tileX+0.5)*64, y: (tileY+0.5)*64}})
        .filter((item) => 64 > Phaser.Point.distance(item, hero))[0];
}

function createCapsule(railroad) {
    let caps = game.add.sprite(railroad.points[0].x, railroad.points[0].y, 'units', 4);
    const SEGMENT_PASSING_TIME = game.rnd.integerInRange(500,800);
    const WAITING_TIME = game.rnd.integerInRange(1000,2000);

    caps.anchor.set(0.5, 0);
    caps.data.segmentsLeft = railroad.points.slice(1);
    caps.data.forward = true;
    caps.data.state = 'nothing';
    caps.update = () => {
        switch (caps.data.state) {
            case 'moving':
                break;
            case 'waiting':
                caps.data.waitingTime -= game.time.elapsedMS;
                if (caps.data.waitingTime <= 0) {
                    caps.data.state = 'nothing';
                    caps.data.forward = !caps.data.forward;
                    caps.data.segmentsLeft = (caps.data.forward  ? railroad.points : railroad.points.slice().reverse()).slice(1);
                }
                break;
            case 'nothing':
                let target = caps.data.segmentsLeft.shift();
                caps.data.state = 'moving';
                //console.log('moving to', target);
                game.add.tween(caps).to(target, SEGMENT_PASSING_TIME, null, true).onComplete.addOnce(() => {
                    if (caps.data.segmentsLeft.length == 0) {
                        caps.data.state = 'waiting';
                        caps.data.waitingTime = WAITING_TIME;
                    } else {
                        caps.data.state = 'nothing';
                    }
                });
        }
    };

    return caps;


}

let railroads = [];
let capsules = [];

function update() {
    zoomer.update();
    //hero.body.setZeroRotation();

    let goldMineToInteract = findNear(goldMines);
    let cityToInteract = findNear(cities);
    if ((goldMineToInteract && !hero.data.railroad) || (cityToInteract && hero.data.railroad)) {
        hero.tint = 0x88ff00;
    } else {
        hero.tint = 0xffffff;
    }

    if (hero.body.rotation != 0) {
        hero.body.rotation *= 0.9;
        if (Math.abs(hero.body.rotation) < 0.1) {
            hero.body.rotation = 0;
        }
    }
    if (escape.isDown && hero.data.railroad) {
        console.log(1);
        hero.data.railroad.destroy();
        delete hero.data.railroad;
    }
    if (space.isDown && !hero.data.ropeCooldown) {
        if (goldMineToInteract && !hero.data.railroad) {
            createAnchorAt(goldMineToInteract.x, goldMineToInteract.y);
            hero.data.railroad = createRailroad(goldMineToInteract.x, goldMineToInteract.y);
        } else if (cityToInteract && hero.data.railroad) {
            hero.data.railroad.complete(cityToInteract.x, cityToInteract.y);
            railroads.push(hero.data.railroad);
            capsules.push(createCapsule(hero.data.railroad));
            delete hero.data.railroad;
            createAnchorAt(cityToInteract.x, cityToInteract.y);
        }
        else {
            if (hero.data.railroad) {
                hero.data.railroad.add(hero.body.x, hero.body.y);
            }
            createAnchorAt(hero.body.x, hero.body.y);
        }
    }

    if (cursors.left.isDown)
    {
        hero.body.velocity.x -= 10 ;// ([-0.1, 0]);
    } else if (cursors.right.isDown)
    {
        hero.body.velocity.x += 10;
    }
}

function debugRender1() {
    //game.debug.reset();
    game.debug.text(game.time.fps, 32,32);
    let zone = game.camera.deadzone;

    //game.debug.context.fillStyle = 'rgba(255,0,0,0.6)';
    //game.debug.context.fillRect(zone.x, zone.y, zone.width, zone.height);

    //game.debug.cameraInfo(game.camera, 32, 32);
}