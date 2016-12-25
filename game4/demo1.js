NO_FLASH = false;

function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('demo1', 'demo2.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.image('door_part_1', 'door_part_1.png');
    game.load.image('door_part_2', 'door_part_2.png');
    game.load.spritesheet('hero2', 'hero21.png', 16, 16);
    game.load.spritesheet('perfoman2', 'perfoman2.png', 16, 16);
    game.load.spritesheet('gopokid', 'gopokid.png', 16, 24);
    game.load.spritesheet('girl1', 'girl1.png', 16, 16);
    //game.load.spritesheet('hero2-kick', 'hero2 kick.png', 16, 16);
    game.load.spritesheet('door_fly', 'door_fly.png', 24, 24);
    game.load.spritesheet('garderob_fly', 'garderob_fly.png', 24, 24);
    game.load.spritesheet('things', 'some things.png', 16, 16);
    game.load.image('some things', 'some things.png');

    game.load.spritesheet('audio', 'audio.png', 24, 24);
    game.load.spritesheet('speaker1', 'speaker1.png', 24, 24);
    game.load.spritesheet('speaker2', 'speaker2.png', 24, 24);

    game.load.spritesheet('items', 'items.png', 16, 16);
    game.load.spritesheet('perforator', 'perforator.png', 24, 24);
    game.load.spritesheet('pult', 'pult.png', 24, 24);
    game.load.spritesheet('outside', 'outside.png', 48, 16);
    game.load.spritesheet('baby', 'pups.png', 16, 16);
    game.load.spritesheet('elevator', 'elevator.png', 16, 16);

    game.load.bitmapFont('myfont', 'font.png', 'font.fnt')

}

var map;
var hero;

function makeSharped() {

    //https://belen-albeza.github.io/retro-canvas/phaser.html
// scale the game 4x
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.setUserScale(4, 4);

// enable crisp rendering
    game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

var wallsLayer, effectsLayer;
var cursors;
var space;


function createHero(o) {
    hero = game.add.sprite(o.x, o.y, "hero2");
    hero.anchor = {x:0.5, y:0.5};
    game.physics.enable(hero, Phaser.Physics.ARCADE);
    hero.body.setSize(10,14,2,1);

    hero.animations.add("kick", [0,1,2,8,9,10], 10);
    hero.animations.add("kick-stop", [16,17,18], 10);
    hero.animations.add("walk", [7,14,15,22], 10, true);
    hero.animations.add("drill", [32,40,48,56], 10, false);
}

function manExplosion(man) {
    return new PixelsExplosion(man);    //todo: color replacement
}

function createPerfoman(o) {
    var man = game.add.sprite(o.x+8, o.y+1, "perfoman2");
    man.anchor.x = 0.5;
    man.animations.add("drill", [5,6,7,8,5,6,7,8,5,5,5,9,10,11,10,9,10,11,9,5,5], 10, true)
    man.animations.play("drill");
    if (o.properties.item) {
        man.data.item = addItem(o.properties.item);
    }
    man.data.explosion = manExplosion(man);
    enemiesGroup.add(man);
}

var words = {
    pult: 'remote control'
}

function addItem(type, key) {
    return {
        type: type,
        create: function(man) {
            var p = game.add.sprite(man.x-8, man.y-8+24, key || type);
            p.animations.add('rotate', range(0,20), 5, true);
            p.animations.play('rotate');
            p.anchor.x = 0.5;
            p.anchor.y = 1;
            p.scale.x = 0.2;
            p.scale.y = 0.2;
            game.add.tween(p.scale).to({x: 1, y: 1}, 500, null, true);
            game.add.tween(p).to({y: p.y - 4}, 1000, Phaser.Easing.Quartic.In, true, 0, true, true);
            furnitureGroup.add(p);
            p.data = {
                type: type,
                title: type,
                opBounds: new Phaser.Rectangle(p.x-12, p.y, 24, 24),
                operations: [{
                    title: "Take",
                    execute: function() {
                        //todo: takeable, common
                        var item = game.add.sprite(game.camera.width - items.length*24-28, game.camera.height - 24, p.key, 0);
                        item.data.type = p.data.type;
                        item.fixedToCamera = true;
                        items.push(item);
                        p.destroy();
                    }
                }]
            }
        }
    }
}


function createGopokid(o) {
    var kid = game.add.sprite(o.x+8, o.y-8, "gopokid");
    kid.anchor.x = 0.5;
    var da = kid.animations.add("dance", [4,5,6,7], 10, true);
    kid.animations.add("mindblow-1", [8,9,10], 10);
    kid.animations.add("mindblow-2", [11,12,11,12,11,12,11,12,11,12,11,12,11,12], 30);
    kid.data.explosion = manExplosion(kid);
    enemiesGroup.add(kid);
    if (o.properties && o.properties.flip) {
        kid.scale.x = -1;
    }
    kid.animations.play("dance");
    if (o.properties && o.properties.frame) {
       da.setFrame(o.properties.frame, true);
    }
    if (o.properties && o.properties.item) {
        kid.data.item = addItem(o.properties.item);
    }
}

function createBaby(o) {
    var baby = game.add.sprite(o.x, o.y, "baby");
    baby.animations.add("leg", [1,2,3,4], 10).onComplete.add(function() {
        baby.frame = 0;
    });
    baby.data = {
        legCooldown: 5000,
        lastLegAnimation: 0
    };
    baby.update = function() {
        baby.data.lastLegAnimation += game.time.elapsed;
        if (baby.data.lastLegAnimation >= baby.data.legCooldown && Math.random() < 0.1) {
            baby.animations.play("leg");
            baby.data.lastLegAnimation = 0;
        }
    }
}

var levels = [];

function createElevator(o) {
    var elevator = game.add.sprite(o.x, o.y, "elevator");
    var doors = game.add.sprite(o.x, o.y, "elevator", 7);
    doors.animations.add("close", [1,2,3,4,5,6,7], 10);
    doors.animations.add("open", [1,2,3,4,5,6,7].reverse(), 10);
    //todo: add small lamp just over elevator
    //windows.push({x: elevator.x + 3, y: elevator.y+1, width: elevator.width-6, height: elevator.height-2});
    elevatorsGroup.add(elevator);
    elevatorDoorsGroup.add(doors);
    levels.push(o.properties.level);

    elevator.data = {
        doors: doors,
        level: o.properties.level,
        use: function(targetLevel) {
            hero.inAction = true;
            hero.x = elevator.x + Math.abs(hero.offsetX);
            var targetElevator = elevatorsGroup.filter(function(e) { return e.data.level == targetLevel;}).list[0];
            doors.animations.play("open").onComplete.addOnce(function() {
                overHeroDoorsGroup.add(doors)
                overHeroDoorsGroup.add(targetElevator.data.doors);
                doors.animations.play("close").onComplete.addOnce(function() {
                   hero.alpha = 0;
                   game.add.tween(hero.body).to({x: targetElevator.x + 4, y: targetElevator.y}, 200, null, true).onComplete.addOnce(function() {

                       targetElevator.data.doors.play("open").onComplete.addOnce(function() {
                           elevatorDoorsGroup.add(doors);
                           elevatorDoorsGroup.add(targetElevator.data.doors);
                           targetElevator.data.doors.play("close");
                           hero.inAction = false;
                       });
                       hero.alpha = 1;
                   })
                });
            });
        }
    };

    return elevator;
}

function createGirl(o) {
    var kid = game.add.sprite(o.x+8, o.y+1, "girl1");
    kid.anchor.x = 0.5;
    kid.animations.add("dance", [4,5,6,7], 10, true);
    kid.animations.add("mindblow-1", [8,9,10], 10, true);
    kid.animations.add("mindblow-2", [11,12,11,12,11,12,11,12,11,12], 30, true);

    kid.data.explosion = manExplosion(kid);
    enemiesGroup.add(kid);
    kid.animations.play("dance");
    if (o.properties && o.properties.item) {
        kid.data.item = addItem(o.properties.item);
    }
}

function pos24To16(o) {
    return {x: o.x - 4+12, y: o.y - 16 - 4}
}

function kickOpExecute(furniture) {
    return function() {
        hero.data.inAction = true;
        var direction = Phaser.Math.sign(furniture.centerX - hero.centerX);
        //todo: align hero
        hero.animations.play("kick").onComplete.addOnce(function() {
            flyingFurnitureGroup.add(furniture);
            furniture.data.velocityX = direction*furniture.data.speed;
            furniture.scale.x = direction; //todo: need 2 different animations instead
            furniture.animations.play("fly");
            if (furniture.data.fakeInvisibleWall) {
                map.removeTile(furniture.data.fakeInvisibleWall.x, furniture.data.fakeInvisibleWall.y, wallsLayer);
                recalculateLights();
            }
            hero.animations.play("kick-stop").onComplete.addOnce(function() {
                hero.data.inAction = false;
            });
        });
    }
}

function createDoor(o) {
    var pos = pos24To16(o);
    var door = game.add.sprite(pos.x, pos.y, "door_fly", undefined, furnitureGroup);
    door.anchor.x = 0.5;
    //game.physics.enable(door, Phaser.Physics.ARCADE);
    var fakeInvisibleWall = map.putTile(1, o.x/16, o.y/16-1, wallsLayer);
    fakeInvisibleWall.alpha = 0;
    door.data = {
        type: 'door',
        fakeInvisibleWall: fakeInvisibleWall,
        opBounds: new Phaser.Rectangle(fakeInvisibleWall.worldX, fakeInvisibleWall.worldY, 16, 16),
        operations: [
            {
                title: 'Kick',
                execute: kickOpExecute(door)
            }
        ],
        speed: 4,
        velocityX: 0,
        explosion: new PixelsExplosion(door)
    };
    door.data.explosion.bounceBack = true;
    door.animations.add("fly", range(0,19), 30, true);
    return door;
}

function range(a,b) {
    var r = [];
    for (var i = a; i <= b; i++) r.push(i);
    return r;
}

function createGarderob(o) {
    var pos = pos24To16(o);
    var garderob = game.add.sprite(pos.x, pos.y, "garderob_fly", undefined, furnitureGroup);
    garderob.anchor.x = 0.5;
    makeKickable(garderob, 'garderob', 3, 0, 19);
    return garderob;
}

function makeKickable(obj, type, speed, animRange1, animRange2) {
    obj.data = {
        type: type,
        opBounds: new Phaser.Rectangle(obj.x-8, obj.y, 16, 24),
        operations: [
            {
                title: 'Kick',
                execute: kickOpExecute(obj)
            }
        ],
        speed: speed,
        velocityX: 0,
        explosion: new PixelsExplosion(obj)
    };
    obj.data.explosion.bounceBack = true;
    obj.animations.add("fly", range(animRange1,animRange2), 30, true);
}

function createAudio(o) {
    //todo: make methods like "play", "stop", "bass" - to control animations
    var pos = pos24To16(o);
    var audio = game.add.sprite(pos.x, pos.y, "audio");
    audio.anchor.x = 0.5;

    var speaker1 = game.add.sprite(pos.x-8, pos.y+24, "speaker1");
    speaker1.anchor.x = 0.5;
    speaker1.anchor.y = 1.0;
    speaker1.animations.add("play", [0,1,2,1], 30, true);
    speaker1.animations.play("play");
    var speaker2 = game.add.sprite(pos.x+10, pos.y+24, "speaker2");
    speaker2.anchor.x = 0.5;
    speaker2.anchor.y = 1.0;

    speaker1.scale = {x:1.0, y: 1.1};
    game.add.tween(speaker1.scale).to({x: 1.1, y: 0.9}, 500, Phaser.Easing.Sinusoidal.In, true, 0, -1, true);
    game.add.tween(speaker2.scale).to({y: 0.9}, 500, Phaser.Easing.Sinusoidal.Out, true, 0, -1, true);

    makeKickable(speaker1, 'speaker', 5, 3, 21);
    makeKickable(speaker2, 'speaker', 5, 0, 19);
    makeKickable(audio, 'audio', 5, 0, 19);
    furnitureGroup.add(speaker1);
    furnitureGroup.add(audio);
    furnitureGroup.add(speaker2);

    if (o.properties && o.properties.controllable) {

        var pseudoFurniture = game.add.sprite(pos.x, pos.y + 4);
        pseudoFurniture.anchor.x = 0.5;
        pseudoFurniture.width = 16 * 6;
        pseudoFurniture.height = 16;
        pseudoFurniture.data = {
            type: 'audio',
            opBounds: new Phaser.Rectangle(pseudoFurniture.left, pseudoFurniture.top, pseudoFurniture.width, pseudoFurniture.height),
            operations: [{
                title: "Max bass",
                execute: function () {
                    var enemiesToBlowMinds = enemiesGroup.filter(function (en) {
                        return Phaser.Point.distance(en, pseudoFurniture) < 16 * 3;
                    }).list;
                    var audioDestroyed = false;
                    enemiesToBlowMinds.forEach(function (en) {
                        en.animations.play("mindblow-1").onComplete.addOnce(function () {
                            en.animations.play("mindblow-2").onComplete.addOnce(function () {
                                en.data.explosion.impactPoint = {x: 0.5, y: 0.2};
                                en.data.explosion.impactForce = {x: 5, y: 5};
                                en.data.explosion.start();
                                if (!audioDestroyed) {
                                    audio.data.explosion.start();
                                    speaker1.data.explosion.start();
                                    speaker2.data.explosion.start();
                                    audioDestroyed = true;
                                    pseudoFurniture.destroy();
                                }
                            });
                        });
                    });
                },
                available: function () {
                    return items.some(function (item) {
                        return item.data.type == "pult"
                    });
                },
                unavailableTitle: 'need remote control'

            }]
        };
        furnitureGroup.add(pseudoFurniture);
    }

}

var LAMP_RADIUS = 320;
var LAMP_HALF_ANGLE = Math.PI/2*0.8;

function createLamp(o) {
    var lampItself = game.add.sprite(o.x, o.y-16, "things", 11);    //11 - on, 12 - off
    lampItself.data = {
        type: 'lamp',
        on: true,
        power: true,
        _oldLight: true,
        id: o.properties.id
    };

    if (o.properties.flashing && !NO_FLASH) {
        lampItself.data.schedule = o.properties.flashing.split(",").map(function(f) { return parseInt(f)});
        lampItself.data.passed = 0;
    }
    lampItself.update = function() {
        if (lampItself.data.schedule) {
            lampItself.data.passed += game.time.elapsed;
            if (lampItself.data.passed >= lampItself.data.schedule[0]) {
                lampItself.data.passed -= lampItself.data.schedule[0];
                lampItself.data.schedule.push(lampItself.data.schedule.shift());
                lampItself.data.on = !lampItself.data.on;
            }
        }

        var light = this.data.on && this.data.power;
        if (light != this.data._oldLight) {
            this.data._oldLight = light;
            recalculateLights();
        }
        this.frame = light ? 11 : 12;
    };
    lamps.add(lampItself);

    //so inspect the room to know limits and possible break-throughts
    var tileX = o.x/16, tileY = o.y/16;
    var room = {left: tileX, right: tileX, top: tileY, bottom: tileY};
    for (var x = tileX; x < map.width; x++) {
        if (map.getTile(x, tileY, wallsLayer)) {
            room.right = x*16 + 8; break;
        }
    }
    for (var x = tileX; x >=0; x--) {
        if (map.getTile(x, tileY, wallsLayer)) {
            room.left = x*16 + 8; break;
        }
    }
    for (var y = tileY; y < map.height; y++) {
        if (map.getTile(tileX, y, wallsLayer)) {
            room.bottom = y*16; break;
        }
    }
    room.top = tileY*16 - 13;
    //no need for top - lamp always under ceiling

    room.extensions = [];
    var possibleBT = [
        {x: room.left, y: room.bottom-16, tileX: (room.left-8)/16, tileY: (room.bottom/16)-1},
        {x: room.right, y: room.bottom-16, tileX: (room.right-8)/16, tileY: (room.bottom/16)-1}
    ];
    possibleBT.forEach(function(bt) {
        //if (Phaser.Math.distance(lampItself.x, bt.x, lampItself.y, bt.y) > LAMP_RADIUS) return;
        //var angle = Phaser.Math.atan2(bt.x - lamp.x, bt.y - lamp.y)
        //todo: check angle?
        var p1 = {x: bt.x, y: bt.y};
        var p2 = {x: bt.x, y: room.bottom};
        var p3 = {y: room.bottom, x: bt.x + (bt.x-lampItself.x)*16/(bt.y - lampItself.y - 16)};
        room.extensions.push({p1: p1, p2: p2, p3: p3, tileX: bt.tileX, tileY: bt.tileY});
    });

    lampItself.data.room = room;
    lampItself.data.color = o.properties.color;

    //prepare polygons for light
    var angleRight = Math.PI / 2 + LAMP_HALF_ANGLE;
    var angleLeft = Math.PI / 2 - LAMP_HALF_ANGLE;
    room.lighted = [
        {x: lampItself.centerX, y: lampItself.centerY},
        {x: room.right, y: lampItself.centerY - Math.tan(angleRight) * (room.right - lampItself.centerX)},
        {x: room.right, y: room.bottom},
        {x: room.left, y: room.bottom},
        {x: room.left, y: lampItself.centerY - Math.tan(angleLeft) * (room.left - lampItself.centerX)}
    ];
    room.semiLighted = [
        {x: lampItself.centerX, y: lampItself.centerY},
        {x: room.right, y: lampItself.centerY - Math.tan(angleRight) * (room.right - lampItself.centerX)},
        {x: room.right, y: room.top},
        {x: room.left, y: room.top},
        {x: room.left, y: lampItself.centerY - Math.tan(angleLeft) * (room.left - lampItself.centerX)}

    ];


}

function createSwitcher(o) {
    var sw = game.add.sprite(o.x, o.y-16, "things", 17); //17 - on, 18 - off
    sw.data = {
        on: true,
        type: "",
        opBounds: new Phaser.Rectangle(sw.x, sw.y, sw.width, sw.height),
        lampIds: o.properties.lamps.split(",").map(function(l) { return parseInt(l)}),
        operations: [
            {
                title: "Turn light",
                execute: function() {
                    sw.data.on = !sw.data.on;
                    lamps.filter(function(lamp) { return sw.data.lampIds.indexOf(lamp.data.id) != -1}).list.forEach(function(lamp) {
                        lamp.data.power = sw.data.on;
                    });
                }
            }
        ]
    };
    sw.update = function() {
        this.frame = this.data.on ? 18 : 17;
    };
    furnitureGroup.add(sw);
}

var furnitureGroup, enemiesGroup, particlesFar, particlesNear, flyingFurnitureGroup, elevatorsGroup, elevatorDoorsGroup, overHeroDoorsGroup;
var bgGroup;
var lamps, lightBitmap, windows = [];

var PerObject = {
    hero: createHero,
    perfoman2: createPerfoman,
    gopokid: createGopokid,
    girl: createGirl,
    door: createDoor,
    garderob: createGarderob,
    audio: createAudio,

    lamp: createLamp,
    switcher: createSwitcher,
    baby: createBaby,
    elevator: createElevator
};

function create() {
    map = game.add.tilemap('demo1');
    game.stage.backgroundColor = '#cccccc';
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 900;

    makeSharped();

    map.addTilesetImage('some things');

    bgGroup = game.add.group();
    wallsLayer = map.createLayer('walls');
    effectsLayer = map.createLayer('effects');
    particlesFar = game.add.group();
    furnitureGroup = game.add.group();
    elevatorsGroup = game.add.group();
    elevatorDoorsGroup = game.add.group();
    overHeroDoorsGroup = game.add.group();
    enemiesGroup = game.add.group();
    particlesNear = game.add.group();
    flyingFurnitureGroup = game.add.group();
    lamps = game.add.group();
    map.setCollisionByExclusion([], true, wallsLayer);
    //map.setCollisionByExclusion([], true, objectsLayer);

    wallsLayer.resizeWorld();

    function create(o) {
        (PerObject[o.type] || function() {})(o);
    }

    map.objects.rooms.forEach(create);
    map.objects.people.forEach(create);
    map.objects.furniture.forEach(create);

    game.camera.follow(hero);

    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    prepareWallsForDrilling();
    prepareWindows();
    lightBitmap = game.add.bitmapData(game.world.width, game.world.height);
    var lightHover = game.add.sprite(0,0, lightBitmap);
    recalculateLights();
    //todo: may add shader, but actually no need


    game.world.bringToTop(particlesNear);
    game.world.bringToTop(overHeroDoorsGroup);
    game.world.bringToTop(lightHover);

    optionsText = game.add.bitmapText(2,game.camera.height-10,'myfont','',12);
    optionsText.fixedToCamera = true;
}

function drawRoom(ctx, lamp, clr) {
    if (clr) {
        ctx.fillStyle = "rgba(" + clr.r + "," + clr.g + "," + clr.b + ",0.2)";
    }
    //draw room
    ctx.beginPath();
    ctx.moveTo(lamp.data.room.lighted[0].x, lamp.data.room.lighted[0].y);
    lamp.data.room.lighted.slice(1).forEach(function(p) {
        ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(lamp.data.room.lighted[0].x, lamp.data.room.lighted[0].y);
    ctx.fill();

    lamp.data.room.extensions.forEach(function (ext) {
        if (!map.getTile(ext.tileX | 0, ext.tileY | 0, wallsLayer)) {
            ctx.beginPath();
            ctx.moveTo(ext.p1.x, ext.p1.y);
            ctx.lineTo(ext.p2.x, ext.p2.y);
            ctx.lineTo(ext.p3.x, ext.p3.y);
            ctx.fill();
        }
    });

    //draw "penumbra"
    if (clr) {
        ctx.fillStyle = "rgba(" + Math.floor(clr.r/2) + "," + Math.floor(clr.g/2) + "," + Math.floor(clr.b/2) + ",0.2)";
        //ctx.fillStyle = "rgba(255,0,0,0.4)";
    }
    ctx.beginPath();
    ctx.moveTo(lamp.data.room.semiLighted[0].x, lamp.data.room.semiLighted[0].y);
    lamp.data.room.semiLighted.slice(1).forEach(function(p) {
        ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(lamp.data.room.semiLighted[0].x, lamp.data.room.semiLighted[0].y);
    ctx.fill();
}


function recalculateLights() {
    var ctx = lightBitmap.context;
    ctx.clearRect(0, 0, lightBitmap.width, lightBitmap.height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, lightBitmap.width, lightBitmap.height);
    //ctx.globalCompositeOperation = "copy";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)"; //no matter what color, alpha shall be = 1
    var onlyLightedLamps = lamps.filter(function(lamp) { return lamp.data.on && lamp.data.power;}).list;
    onlyLightedLamps.forEach(function(lamp) {
        drawRoom(ctx, lamp);
    });
    windows.forEach(function(w) {
        ctx.fillRect(w.x, w.y, w.width, w.height);
    });
    ctx.globalCompositeOperation = "source-over";
    onlyLightedLamps.forEach(function(lamp) {
        var clr = Phaser.Color.hexToColor("#" + lamp.data.color.substring(3));
        drawRoom(ctx, lamp, clr);
        //todo: draw some "penumbra" under ceiling
        //console.log(lamp.data.room);
    });

    lightBitmap.dirty = true;
}

function prepareWindows() {
    var wi = 0;
    effectsLayer.getTiles(0,0,game.world.width,game.world.height).forEach(function(tile) {
        if ([20,22].indexOf(tile.index) != -1) {
            //this is window
            var bounds = {x: tile.worldX, y: tile.worldY, width: 16, height: 16};
            if (tile.index == 22) bounds.width = 10;
            if (tile.index == 20) bounds.width = 32;
            windows.push(bounds);

            var bg = game.add.sprite(tile.worldX, tile.worldY, "outside", wi, bgGroup);
            var minCrop = 0;
            var maxCrop = bg.width - bounds.width;
            bg.crop(new Phaser.Rectangle(0, 0, bounds.width, bounds.height))
            wi++;
            var centerX = bg.x + bounds.width/2;
            var maxDistance = Math.max(centerX, game.world.width - centerX);

            bg.update = function() {
                var distanceProp = game.camera.x / (game.world.width - game.camera.width);
                distanceProp = Math.min(1, Math.max(0, distanceProp));
                var nx = maxCrop * distanceProp;
                if (Math.abs(nx - bg.cropRect.x) > 1) {
                    bg.cropRect.x = nx;
                    bg.updateCrop();
                }

            }

        }
    })
}

function prepareWallsForDrilling() {
    wallsLayer.getTiles(0, 0, game.world.width, game.world.height).forEach(function(tile) {
        if ([3,5,8].indexOf(tile.index) != -1) {
            //floor
            var tileOverFloor = map.getTile(tile.x, tile.y-1, wallsLayer);
            if (tileOverFloor && tileOverFloor.index === 1 && tileOverFloor.alpha > 0) {
                //fake furniture... what's wrong with me?
                var fakeFurniture = game.add.sprite(tileOverFloor.worldX, tileOverFloor.worldY);
                furnitureGroup.add(fakeFurniture);
                fakeFurniture.width = 16;
                fakeFurniture.height = 16;
                fakeFurniture.data = {
                    type: 'wall',
                    opBounds: new Phaser.Rectangle(fakeFurniture.x, fakeFurniture.y, 16, 16),
                    operations: [{
                        title: 'Drill',
                        available: function() {
                            return items.some(function(item) { return item.data.type == 'perforator';})
                        },
                        unavailableTitle: 'need perforator',
                        execute: function() {
                            hero.data.inAction = true;
                            hero.animations.play("drill").onComplete.addOnce(function() {
                                hero.animations.play("drill").onComplete.addOnce(function() {
                                    fakeFurniture.destroy();
                                    map.putTile(2, tileOverFloor.x, tileOverFloor.y, wallsLayer);
                                    hero.data.inAction = false;
                                    hero.animations.stop();
                                });
                            });


                        }
                    }]
                }

            }
        }

    })
}

var allowedOptions = [];
var items = [];


var optionsText;

function update() {

    game.physics.arcade.collide(hero, wallsLayer, undefined, function(sprite, tile) {
        if (tile.index === 1 || tile.index === 2) { //vertical wall
            var tileCenterX = tile.x*16 + 8;
            var tileRealWidth = 4;
            var shallStop = (sprite.centerX > tileCenterX)
                ? sprite.body.left <= tileCenterX+tileRealWidth
                : sprite.body.right >= tileCenterX-tileRealWidth;
            if (shallStop) {
                //process manually
                sprite.body.x = (sprite.centerX > tileCenterX) ? tileCenterX + tileRealWidth : tileCenterX-tileRealWidth - sprite.body.width;
                sprite.body.velocity.x = 0;
            }
            return false;
        }
        return true;
    });

    var nearBounds = new Phaser.Rectangle(hero.x-Math.abs(hero.width)/2, hero.y+4, Math.abs(hero.width), hero.height-8);
    allowedOptions = [];
    furnitureGroup.forEach(function(furniture) {
        if (furniture.data.opBounds && Phaser.Rectangle.intersects(nearBounds, furniture.data.opBounds)) {
            (furniture.data.operations || []).forEach(function(op) {
                allowedOptions.push({operation: op, target: furniture});
            })
        }
    });
    var elevatorHint = null;

    elevatorsGroup.forEach(function(elevator) {
        if (hero.inAction) return;
        if (hero.overlap(elevator)) {
            var lvl = elevator.data.level;
            var directions = [];
            if (levels.indexOf(lvl-1) != -1) {
                directions.push("down");
                if (cursors.down.isDown) {
                    elevator.data.use(lvl-1);
                }
            }
            if (levels.indexOf(lvl+1) != -1) {
                directions.push("up");
                if (cursors.up.isDown) {
                    elevator.data.use(lvl+1);
                }
            }
            elevatorHint = "use " + directions.join("/") + " to change floor";

        }
    });

    flyingFurnitureGroup.forEach(function(furniture) {

        furniture.x += furniture.data.velocityX;

        var frontRect = new Phaser.Rectangle(furniture.data.velocityX < 0
            ? furniture.x
            : furniture.x+furniture.width/2-14,
            furniture.top+12, 4, 4);

        var tileOnWay = wallsLayer.getTiles(frontRect.x, frontRect.y, frontRect.width, frontRect.height)[0];
        furniture.data._debugGeom = frontRect;
        //console.log(tileOnWay);
        if (tileOnWay) {
            switch (tileOnWay.index) {
                case 1:
                    //concrete wall, break
                    //todo: anim
                    //furniture.data.velocityX = 0;
                    //furniture.animations.stop();
                    if (furniture.data.explosion) {
                        furniture.data.explosion.impactPoint = {x: furniture.data.velocityX > 0 ? 1 : 0, y: 0.5};
                        furniture.data.explosion.impactForce = {x: -1.5, y: 0};
                        furniture.data.explosion.start();
                    } else {
                        furniture.destroy();
                    }
                    break;
                case 2:
                    //broken wall, break through
                    //todo: anim
                    map.removeTile(tileOnWay.x, tileOnWay.y, wallsLayer);
                    var tempWall = game.add.sprite(tileOnWay.worldX + 8, tileOnWay.worldY, "things", 1);
                    tempWall.anchor.x = 0.5;
                    var brokenWallExplosion = new PixelsExplosion(tempWall);
                    brokenWallExplosion.impactPoint = {x: furniture.data.velocityX > 0 ? 0 : 1, y: 0.5};
                    brokenWallExplosion.impactForce = {x: 5, y: 2};
                    brokenWallExplosion.start();

                    recalculateLights();
                    map.putTile(4, tileOnWay.x, tileOnWay.y, effectsLayer);
                    break;
            }
        }

        enemiesGroup.forEach(function(e) {
            if (Phaser.Rectangle.intersects(new Phaser.Rectangle(e.left-Math.abs(e.width)/2, e.top, Math.abs(e.width), e.height), frontRect)) {
                //todo: anim
                if (e.data.item) {
                    e.data.item.create(e);
                }
                if (e.data.explosion) {
                    e.data.explosion.impactPoint = {x: furniture.data.velocityX > 0 ? 0 : 1, y: 0.2};
                    e.data.explosion.impactForce = {x: 1, y: Math.abs(furniture.data.velocityX)}
                    e.data.explosion.start();
                }
                else {
                    e.destroy();
                }

            }
        });

    });


    if (!hero.data.inAction) {
        if (cursors.left.isDown) {
            hero.body.velocity.x = -50;
            hero.scale.x = -1;

            if (!hero.animations.currentAnim.isPlayed) {
                hero.animations.play('walk');
            }
        }
        else if (cursors.right.isDown) {
            hero.body.velocity.x = 50;
            hero.scale.x = 1;
            if (!hero.animations.currentAnim.isPlayed) {
                hero.animations.play('walk');
            }
        } else {
            hero.animations.stop();
            hero.frame = 0;
            hero.body.velocity.x = 0;
        }
    }

    optionsText.text = elevatorHint || allowedOptions.map(function(opt) {
        var title = opt.operation.title + " " + (words[opt.target.data.type] || opt.target.data.type);
        if (opt.operation.available && !opt.operation.available()) {
            title += " (" + opt.operation.unavailableTitle + ")";
        }
        return title;
    }).join("\n").toLowerCase();

    if (space.justDown && allowedOptions.length > 0) {
        hero.animations.stop();
        hero.frame = 0;
        hero.body.velocity.x = 0;
        if (!allowedOptions[0].operation.available || allowedOptions[0].operation.available()) {
            allowedOptions[0].operation.execute();
        }

    }
}

var tempCanvas;
//impactPoint - x:0-1, y:0-1
//impactDirection - x:-1-1, y: -1-1
//force = 5

function PixelsExplosion(spriteSource, singleColor, pixelsPercentage) {
    if (spriteSource.anchor.x != 0.5) throw new Error("only middle-anchored sprites could explode, sorry");
    this.impactPoint = {x: 0.5, y: 0.5};
    this.impactForce = {x: 0.5, y: 0.5};
    this.gravity = 0.05;
    this.bounceBack = false;
    //todo: pixel reading could be cached!
    if (pixelsPercentage === undefined) pixelsPercentage = 1;
    this.pixelsPercentage = pixelsPercentage;

    this.spriteSource = spriteSource;
    var width = Math.abs(spriteSource.width); //due to scale it could be negative

    this.partFar = game.add.bitmapData(width*3, spriteSource.height|0);
    this.partNear = game.add.bitmapData(width*3, spriteSource.height|0);
    
    this.baseX = width;
    this.baseY = 0;//spriteSource.height;

    this.swidth = width;
    this.sheight = spriteSource.height|0;

    this.singleColor = singleColor;

    this.started = false;
    this.autoDestroy = true;
    this.stoppedPixels = 0;
}

PixelsExplosion.prototype = {

    preparePixels: function() {

        tempCanvas = tempCanvas || (game.add.bitmapData(48,48));
        tempCanvas.clear(0, 0, 48, 48);
        //here offset shall be used
        //tempCanvas.fill(0,255,0);
        tempCanvas.draw(this.spriteSource, Math.abs(this.spriteSource.offsetX), this.spriteSource.offsetY, this.swidth, this.spriteSource.height|0);
        var pixels = [];
        //game.add.sprite(100,10, tempCanvas);
        tempCanvas.update(0, 0, tempCanvas.width, this.spriteSource.height);
        tempCanvas.processPixelRGB(function(color, x, y) {
            if (color.a > 0 && Math.random() < this.pixelsPercentage) {
                var pix = {
                    x: x,
                    y: y,
                    color: this.singleColor !== undefined ? this.singleColor : color.rgba,
                    far: Math.random() < 0.5,
                    cycles: 0
                };
                //todo: calculate initial velocity - (pix-impactPoint)*force*impactDirection
                pixels.push(pix);
            }
        }.bind(this), null, 0, 0, this.swidth, this.spriteSource.height|0);

        this.pixels = pixels;
    },

    start: function() {
        this.spriteFar = game.add.sprite(this.spriteSource.x - this.swidth/2 - this.baseX, this.spriteSource.top - this.baseY, this.partFar);
        this.spriteNear = game.add.sprite(this.spriteSource.x - this.swidth/2 - this.baseX, this.spriteSource.top - this.baseY, this.partNear);
        this.spriteFar.update = this.update.bind(this);
        this.preparePixels();

        particlesFar.add(this.spriteFar);
        particlesNear.add(this.spriteNear);

        if (this.autoDestroy) this.spriteSource.destroy();
        this.started = true;
        var impactPixel = {
            x: this.swidth*this.impactPoint.x,
            y: this.sheight*this.impactPoint.y
        };
        this.pixels.forEach(function(pix) {
            var dist = Phaser.Math.distance(pix.x, pix.y, impactPixel.x, impactPixel.y);
            pix.velocity = {
                x: this.impactForce.x * (pix.x - impactPixel.x) / dist * (0.9 + Math.random()*0.2),
                y: this.impactForce.y * (pix.y - impactPixel.y) / dist * (0.9 + Math.random()*0.2)
            };

            if (this.pixelOnWall(pix) == "wall" && this.bounceBack) {
                //move outside wall
                pix.velocity.x = -pix.velocity.x;
                while (this.pixelOnWall(pix) == "wall") {
                    pix.x += pix.velocity.x;
                }
            }

        }.bind(this));
    },

    //false - none, "floor" - floor, "wall"
    pixelOnWall: function(pix) {
        //instead of tile method - better to use bitmap
        var absX = this.spriteFar.x + this.baseX + pix.x;
        var absY = this.spriteFar.y + this.baseY + pix.y;

        var tileOnWay = wallsLayer.getTiles(absX, absY, 1, 4).filter(function(f) { return f && f.index > -1;})[0];
        if (tileOnWay) {
            switch (tileOnWay.index) {
                case 1:
                case 2:
                    return absX >= tileOnWay.worldX + 6 && absX <= tileOnWay.worldX + 10 ? "wall" : false;
                    //vertical
                    break;
                case 3:
                case 5:
                case 8:
                    return absY > tileOnWay.worldY-Math.random() ? "floor": false;
                    //horizontal
                    break;
            }
        }
    },
    
    update: function() {
        if (this.started) {
            this.pixels.forEach(function(pix) {
                if (pix.stopped) return;
                var velocitySteps = 1+Math.floor(Phaser.Math.distance(0,0,pix.velocity.x, pix.velocity.y));
                var wasX = pix.x;
                for (var step = 0; step < velocitySteps; step++) {
                    pix.x += pix.velocity.x/velocitySteps;
                    pix.y += pix.velocity.y/velocitySteps;
                    var onWhat = this.pixelOnWall(pix);
                    if (onWhat) {
                        if (onWhat === "wall" && this.bounceBack) {
                            pix.velocity.x = -pix.velocity.x;
                            pix.velocity.y /= 2;
                        } else {
                            pix.stopped = true;
                            this.stoppedPixels++;
                            break;
                        }
                    }
                }
                pix.cycles++;
                pix.velocity.y += this.gravity;


            }.bind(this));

            this.render();
            if (this.stoppedPixels == this.pixels.length) {
                this.started = false;
                //console.log("all stopped");
            }
        }

    },
    
    render: function() {
        var farCtx = this.partFar.context;
        var nearCtx = this.partNear.context;
        nearCtx.clearRect(0, 0, this.partFar.width, this.partFar.height);
        farCtx.clearRect(0, 0, this.partFar.width, this.partFar.height);
        //ctx.fillStyle = "green";
        //ctx.fillRect(0, 0, this.partFar.width, this.partFar.height);
        if (this.singleColor) {
            nearCtx.fillStyle = farCtx.fillStyle = this.singleColor;
        }
        this.pixels.forEach(function(pix) {
            var ctx = pix.far ? farCtx : nearCtx;
            if (!this.singleColor) {
                ctx.fillStyle = pix.color;
                ctx.fillRect(this.baseX + pix.x|0, this.baseY + pix.y|0, 1, 1);
            } else {
                ctx.rect(this.baseX + pix.x|0, this.baseY + pix.y|0, 1, 1);
            }
        }.bind(this));
        if (this.singleColor) {
            farCtx.fill();
            nearCtx.fill();
        };
        this.partFar.dirty = true;
        this.partNear.dirty = true;
    }
};


function debugRender1() {
    game.debug.reset();
    //game.debug.text(game.time.fps, game.camera.width/2,game.camera.height-10);
    //game.debug.geom(new Phaser.Rectangle(hero.x-Math.abs(hero.width)/2, hero.top+4, Math.abs(hero.width), hero.height-8));
    //furnitureGroup.forEach(function(f) { game.debug.geom(f.data.opBounds)})
    //enemiesGroup.forEach(function(e) { game.debug.geom(new Phaser.Rectangle(e.x-Math.abs(e.width)/2, e.top, Math.abs(e.width), e.height), "rgba(255,0,0,0.2)")})
    //flyingFurnitureGroup.forEach(function(f) { game.debug.geom(f.data._debugGeom)})
    /*lamps.forEach(function(lamp) {
        game.debug.geom(
            new Phaser.Rectangle(lamp.data.room.left, lamp.data.room.top,
            lamp.data.room.right-lamp.data.room.left, lamp.data.room.bottom-lamp.data.room.top),
            "rgba(255,255,0,0.2)"
        );
        lamp.data.room.extensions.forEach(function(ex) {
            game.debug.geom(
                new Phaser.Polygon(ex.p1, ex.p2, ex.p3)
            ,"rgba(255,255,0,0.2)" )
        })
    })*/
    /*allowedOptions.forEach(function(opt, i) {
        var title = opt.operation.title + " " + opt.target.data.type;
        if (opt.operation.available && !opt.operation.available()) {
            title += "(" + opt.operation.unavailableTitle + ")";
        }
        game.debug.text(title, 2, 16+16*i);
    });*/
}