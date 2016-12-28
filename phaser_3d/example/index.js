var USE_THREE = location.search === "?3d";
/*
game itself:
    * attack for field
    * p2 physics (to rotate body)
    * goal? (why to destroy all the islands?)
    *   maybe we need to destroy something else. islands just are on way, and they invinsible
    *   sharks!
    * show aim
    * randomly rotate islands
    *
    *
 */

function initScene3d() {
    if (!USE_THREE) return;
    scene3d = game.three.createScene(ships, bombs, rocks, {
        lights: [
            {color: 0xffffff, intensity: 0.5}
        ],
        shadows: true,
        floor: [0xcccccc, 0.6]
    });
    daylight = scene3d.addLight(ThreePlugin.DirectionalLight, {
        color: 0xffffff,
        intensity: 0.5,
        distance: 1000,
        position: {x: 0, y: -game.world.height/2, z: 500},
        target: {x: game.world.width/2, y: game.world.height/2, z: 0}
    });

    game.add.tween(daylight.three).to({
        intensity: 0,
        x: game.world.width,
        z: 50
    }, 30000, null, true).onUpdateCallback(function() {
        var gb = (0xff*daylight.three.intensity*daylight.three.intensity)|0;
        daylight.three.color = 0xff0000 | (gb << 8) | gb ;
    });

    scene3d.prepareCache("bombs", ThreePlugin.PointLight, 3);

}

var daylight;

function preload() {
    game.plugins.add(ThreePlugin);

    game.time.advancedTiming = true;
    game.load.spritesheet("ship", "ship_sprite.png", 32, 32);
    game.load.spritesheet("bomb", "bomb_sprite.png", 32, 32);
    game.load.spritesheet("rock", "rocks_sprite.png", 32, 32);
    game.load.image("water", "tex_Water.jpg"); // author: http://www.godsandidols.com/
    game.load.script("water_shader", "water_shader.js");

    game.load.obj3d("ship", {insteadOf: ["ship", 0], rotate: {x: Math.PI/2}, spriteRotation: "-z"});
    game.load.obj3d("bomb", {insteadOf: ["bomb", 0], rotate: {x: Math.PI/2}, spriteRotation: "-z"});
    game.load.obj3d("rock1", {insteadOf: ["rock", 0], rotate: {x: Math.PI/2}, spriteRotation: "-z"});
    game.load.obj3d("rock2", {insteadOf: ["rock", 1], rotate: {x: Math.PI/2}, spriteRotation: "-z"});
    //game.load.obj3d("rock1", {insteadOf: ["rock", 1], rotate: {x: Math.PI/2}, spriteRotation: "-z"});
}

var ground, ships, bombs;
var hero, rocks, scene3d;
var cursors, emitter;


function enablePhysics(sprite) {
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
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

function createRock() {
    var rock = game.add.sprite(game.world.randomX, game.world.randomY, "rock", game.rnd.integerInRange(0,1), rocks);
    enablePhysics(rock);
    rock.anchor = {x:0.5, y: 0.5};
    rock.rotation = Math.random() * Math.PI*2;
    rock.body.immovable = true;
    rock.body.setCircle(12, 6, 5);
    return rock;
}

function createAim(noAnimation) {
    var aim = game.add.bitmapData(32, 32);
    aim.context.strokeStyle = "white";
    aim.context.lineWidth = 4;
    //todo: better aim
    var a1 = Math.PI/8;
    [0, 0.5, 1, 1.5].forEach(function(s) {
        aim.context.beginPath();
        aim.context.arc(16, 16, 13, s*Math.PI+a1, (s+0.5)*Math.PI-a1);
        aim.context.stroke();
    });

    var aimSprite = game.add.sprite(0, 0, aim, undefined, ui);
    aimSprite.anchor = {x: 0.5, y: 0.5};
    if (!noAnimation) {
        game.add.tween(aimSprite.scale).to({x: 1.2, y: 1.2}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
        game.add.tween(aimSprite).to({rotation: Math.PI/2}, 2000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1);
    }
    return aimSprite;
}

var ui;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.resize(320, 320);
    makeSharped();
    ground = game.add.group();
    ships = game.add.group();
    rocks = game.add.group();
    bombs = game.add.group();
    ui = game.add.group();

    var bg = game.add.sprite(0,0,"water",undefined,ground);
    bg.filters = [game.add.filter("WaterShader")];
    bg.update = function() {
        bg.filters[0].update();
    }

    cursors = game.input.keyboard.createCursorKeys();
    cursors.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    hero = game.add.sprite(game.world.width/2, game.world.height/2, "ship", 0, ships);
    hero.anchor = {x: 0.5, y: 0.5};

    enablePhysics(hero);
    hero.checkWorldBounds = true;
    hero.body.collideWorldBounds = true;
    hero.data.cannons = [
        {x: -6, y: -4, dx: -1, dy:0},
        {x: 6, y: -4, dx: 1, dy:0},
        {x: -6, y: 4, dx: -1, dy:0},
        {x: 6, y: 4, dx: 1, dy:0},
    ];
    hero.data.fireCooldown = 0;
    hero.data.aim = createAim();

    for (var i = 0; i < 20; i++) {
        createRock();
    }


    //hero.tint = 0xff0000;
    initScene3d();


    if (scene3d) {
        hero.three.mesh.rotation.y = -Math.PI / 16;
        hero.three.mesh.rotation.x = -Math.PI / 32;
        game.add.tween(hero.three.mesh.rotation).to({y: Math.PI / 16}, 2000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
        game.add.tween(hero.three.mesh.rotation).to({x: Math.PI / 32}, 4000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    }
}

var SPEED = 15;

function update() {

    predictBomb(hero);
    game.physics.arcade.collide(hero, rocks);

    if (cursors.left.isDown) {
        hero.body.angularVelocity = -45;
    } else if (cursors.right.isDown) {
        hero.body.angularVelocity = 45;
    } else {
        hero.body.angularVelocity = 0;
    }

    var currentSpeed = hero.body.speed;
    var acceleration = 0.5;

    if (cursors.down.isDown) {
        currentSpeed = Math.max(0, currentSpeed - acceleration);
    } else if (currentSpeed < SPEED) {
        currentSpeed = Math.min(SPEED, currentSpeed + acceleration);
    }

    hero.body.angularVelocity *= (currentSpeed / SPEED);

    hero.body.velocity = {
        x: currentSpeed * Math.cos(hero.rotation - Math.PI/2),
        y: currentSpeed * Math.sin(hero.rotation - Math.PI/2),
    };

    hero.data.fireCooldown -= game.time.elapsed;

    if (cursors.space.isDown) {
        fireBomb(hero);
    }

}
var BOMB_SPEED = 30;

function predictBomb(ship) {
    var currentCannon = ship.data.cannons[0];
    var velocity = {
        x: ship.body.velocity.x + currentCannon.dx * BOMB_SPEED * -Math.sin(ship.rotation - Math.PI/2),
        y: ship.body.velocity.y +currentCannon.dx * BOMB_SPEED * Math.cos(ship.rotation - Math.PI/2)
    };
    var totalTime = 2000;   //3 frames/s + 2 frames
    var resultX = ship.x + currentCannon.x + velocity.x * totalTime/1000;
    var resultY = ship.y + currentCannon.y + velocity.y * totalTime/1000;
    ship.data.aim.x = resultX;
    ship.data.aim.y = resultY;
}

function fireBomb(ship) {
    if (ship.data.fireCooldown <= 0) {
        var predicted = createAim(true);
        predicted.x = ship.data.aim.x;
        predicted.y = ship.data.aim.y;
        predicted.tint = 0xff0000;
        ship.data.fireCooldown = 1000;
        var currentCannon = ship.data.cannons.shift();
        ship.data.cannons.push(currentCannon);
        var bomb = game.add.sprite(ship.x + currentCannon.x, ship.y + currentCannon.y, "bomb", 0, bombs);
        bomb.animations.add("charging", [0,1,2,3,4,4], 3);
        bomb.anchor = {x:0.5, y: 0.5};
        bomb.scale = {x: 0.2, y: 0.2};
        enablePhysics(bomb);
        bomb.body.setCircle(8, 8, 8);
        bomb.body.velocity = {
            x: ship.body.velocity.x + currentCannon.dx * BOMB_SPEED * -Math.sin(ship.rotation - Math.PI/2),
            y: ship.body.velocity.y +currentCannon.dx * BOMB_SPEED * Math.cos(ship.rotation - Math.PI/2)
        };
        bomb.body.angularVelocity = 360;
        game.add.tween(bomb.scale).to({x: 1, y: 1}, 1000, null, true).onComplete.addOnce(function() {
            game.add.tween(bomb.scale).to({x: 0.2, y: 0.2}, 1000, null, true);
        });
        bomb.animations.play("charging").onComplete.addOnce(function() {
            var rockDestroyed = false;
            rocks.forEachAlive(function(rock) {
                if (Phaser.Point.distance(bomb, rock) < 16) {
                    rock.destroy();
                    rockDestroyed = true;
                }
            });

            var emitter = game.add.emitter(bomb.x, bomb.y, 200);
            var bm = game.add.bitmapData(4,4);
            bm.fill(255,255,255);
            emitter.makeParticles([bm]);
            emitter.forEach(function(particle) {
                particle.width = game.rnd.integerInRange(1,4);
                particle.height = game.rnd.integerInRange(1,4);
                var color = game.rnd.integerInRange(100,150);
                particle.tint = rockDestroyed ? ((color << 16) | (color << 8) | (color)) : 100+color;
            });
            emitter.x = bomb.x;
            emitter.y = bomb.y;
            emitter.explode(200, 50);
            //todo: destroy emitter on end?

             //explode
             bomb.destroy();
            predicted.destroy();
        });


        if (scene3d) {
            bomb.data.light = scene3d.addLight(ThreePlugin.PointLight, {
                cache: "bombs", 
                intensity: 1, 
                distance: 150, 
                color: 0xff4400, 
                attachTo: [bomb, (three) => {
                    three.z = 100 + bomb.scale.x * 50;
                    bomb.three.mesh.rotation.y += Math.PI*game.time.elapsed/1000;
                }]
            });
        }
    }
}

function debugRender1() {
    game.debug.text(game.time.fps, game.camera.width/2,game.camera.height-10);

    //game.debug.body(hero);
    //rocks.forEach(function(r) { game.debug.body(r);});
    //bombs.forEachAlive(function(r) { game.debug.body(r);});
}