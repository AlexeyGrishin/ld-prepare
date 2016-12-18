function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('demo1', 'demo1.json', null, Phaser.Tilemap.TILED_JSON);

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

function createPerfoman(o) {
    var man = game.add.sprite(o.x, o.y+1, "perfoman2");
    man.animations.add("drill", [5,6,7,8,5,6,7,8,5,5,5,9,10,11,10,9,10,11,9,5,5], 10, true)
    man.animations.play("drill");
    man.data.item = {
        type: 'perforator',
        create: createPerforator
    };
    enemiesGroup.add(man);
}

function createPerforator(man) {
    var p = game.add.sprite(man.x, man.y, "items", 0);
    furnitureGroup.add(p);
    //todo: 3d, rotate, I think
    p.data = {
        type: 'perforator',
        opBounds: new Phaser.Rectangle(man.x, man.y, 16, 16),
        operations: [{
            title: "Take",
            execute: function() {
                //todo: takeable, common
                var item = game.add.sprite(items.length*20+2, game.camera.height - 16, "items", p.frame);
                item.data.type = p.data.type;
                item.fixedToCamera = true;
                items.push(item);
                p.destroy();
            }
        }]
    }

}

function createGopokid(o) {
    var kid = game.add.sprite(o.x, o.y-8, "gopokid");
    kid.anchor.x = 0.5;
    kid.animations.add("dance", [4,5,6,7], 10, true);
    enemiesGroup.add(kid);
    kid.scale.x = -1;
    kid.animations.play("dance");
}

function createGirl(o) {
    var kid = game.add.sprite(o.x, o.y+1, "girl1");
    kid.anchor.x = 0.5;
    kid.animations.add("dance", [4,5,6,7], 10, true);
    enemiesGroup.add(kid);
    kid.animations.play("dance");
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
        velocityX: 0
    };
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
        velocityX: 0
    };
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
}

var LAMP_RADIUS = 320;
var LAMP_HALF_ANGLE = Math.PI/2*0.8;

function createLamp(o) {
    var lampItself = game.add.sprite(o.x, o.y-16, "things", 11);    //11 - on, 12 - off
    lampItself.data = {
        type: 'lamp',
        on: true
    };
    lampItself.update = function() {
        this.frame = this.data.on ? 11 : 12;
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
            room.bottom = y*16;
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
        if (Phaser.Math.distance(lampItself.x, bt.x, lampItself.y, bt.y) > LAMP_RADIUS) return;
        //var angle = Phaser.Math.atan2(bt.x - lamp.x, bt.y - lamp.y)
        //todo: check angle?
        var p1 = {x: bt.x, y: bt.y};
        var p2 = {x: bt.x, y: room.bottom};
        var p3 = {y: room.bottom, x: bt.x + (bt.x-lampItself.x)*16/(bt.y - lampItself.y - 16)};
        room.extensions.push({p1: p1, p2: p2, p3: p3, tileX: bt.tileX, tileY: bt.tileY});
    });

    lampItself.data.room = room;
    lampItself.data.color = o.properties.color;

}

var furnitureGroup, enemiesGroup, particlesFar, particlesNear, flyingFurnitureGroup;
var lamps, lightBitmap;

var PerObject = {
    hero: createHero,
    perfoman2: createPerfoman,
    gopokid: createGopokid,
    girl: createGirl,
    door: createDoor,
    garderob: createGarderob,
    audio: createAudio,

    lamp: createLamp
};

function create() {
    map = game.add.tilemap('demo1');
    game.stage.backgroundColor = '#cccccc';
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 900;

    makeSharped();

    map.addTilesetImage('some things');

    wallsLayer = map.createLayer('walls');
    effectsLayer = map.createLayer('effects');
    particlesFar = game.add.group();
    furnitureGroup = game.add.group();
    enemiesGroup = game.add.group();
    particlesNear = game.add.group();
    flyingFurnitureGroup = game.add.group();
    lamps = game.add.group();
    map.setCollisionByExclusion([], true, wallsLayer);
    //map.setCollisionByExclusion([], true, objectsLayer);

    wallsLayer.resizeWorld();

    map.objects.rooms.forEach(function(o) {
        (PerObject[o.type] || function() {})(o);

        console.log(o);
    });
    map.objects.people.forEach(function(o) {
        (PerObject[o.type] || function() {})(o);
        console.log(o);
    });
    map.objects.furniture.forEach(function(o) {
        console.log(o);
        (PerObject[o.type] || function() {})(o);
    });

    game.camera.follow(hero);

    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    prepareWallsForDrilling();
    lightBitmap = game.add.bitmapData(game.world.width, game.world.height);
    var lightHover = game.add.sprite(0,0, lightBitmap);
    recalculateLights();
}

function recalculateLights() {
    var ctx = lightBitmap.context;
    ctx.clearRect(0, 0, lightBitmap.width, lightBitmap.height);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, lightBitmap.width, lightBitmap.height);
    //ctx.globalCompositeOperation = "copy";
    lamps.forEach(function(lamp) {
        var clr = Phaser.Color.hexToColor("#" + lamp.data.color.substring(3));
        console.log(clr);
        ctx.fillStyle = "rgba(" + clr.r + "," + clr.g + "," + clr.b + ",0.2)";
        //draw room
        ctx.beginPath();
        ctx.moveTo(lamp.centerX, lamp.centerY);
        var angleRight = Math.PI/2 + LAMP_HALF_ANGLE;
        var angleLeft = Math.PI/2 - LAMP_HALF_ANGLE;
        //console.log(angleRight, Math.tan(angleRight), (lamp.data.room.right - lamp.centerX));
        ctx.lineTo(lamp.data.room.right, lamp.centerY - Math.tan(angleRight) * (lamp.data.room.right - lamp.centerX));
        ctx.lineTo(lamp.data.room.right, lamp.data.room.bottom);
        ctx.lineTo(lamp.data.room.left, lamp.data.room.bottom);
        ctx.lineTo(lamp.data.room.left, lamp.centerY - Math.tan(angleLeft) * (lamp.data.room.left - lamp.centerX));
        ctx.lineTo(lamp.centerX, lamp.centerY);
        ctx.fill();

        lamp.data.room.extensions.forEach(function(ext) {
            if (!map.getTile(ext.tileX|0, ext.tileY|0, wallsLayer))  {
                ctx.beginPath();
                ctx.moveTo(ext.p1.x, ext.p1.y);
                ctx.lineTo(ext.p2.x, ext.p2.y);
                ctx.lineTo(ext.p3.x, ext.p3.y);
                ctx.fill();
            }
        });
        //console.log(lamp.data.room);
    });
    lightBitmap.dirty = true;
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


        if (Phaser.Rectangle.intersects(nearBounds, furniture.data.opBounds)) {
            (furniture.data.operations || []).forEach(function(op) {
                allowedOptions.push({operation: op, target: furniture});
            })
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
                    furniture.destroy();
                    break;
                case 2:
                    //broken wall, break through
                    //todo: anim
                    map.removeTile(tileOnWay.x, tileOnWay.y, wallsLayer);
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
                e.destroy();

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

    if (space.justDown && allowedOptions.length > 0) {
        hero.animations.stop();
        hero.frame = 0;
        hero.body.velocity.x = 0;
        if (!allowedOptions[0].operation.available || allowedOptions[0].operation.available()) {
            allowedOptions[0].operation.execute();
        }

    }
}

function debugRender1() {
    game.debug.reset();
    //game.debug.text(game.time.fps, 32,32);
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
    allowedOptions.forEach(function(opt, i) {
        var title = opt.operation.title + " " + opt.target.data.type;
        if (opt.operation.available && !opt.operation.available()) {
            title += "(" + opt.operation.unavailableTitle + ")";
        }
        game.debug.text(title, 2, 16+16*i);
    });
}