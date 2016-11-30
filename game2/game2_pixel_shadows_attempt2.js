function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('roguelikeSheet_transparent_normales', 'roguelikeSheet_transparent_NRM.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);

    game.load.script('shadow3', 'shadow3.js');

    game.load.image("shadows", "roguelikeSheet_shadows2.png");
    game.load.spritesheet("hotspots", "roguelikeSheet_hotspots.png", 16, 16);
    game.load.spritesheet("heights", "roguelikeSheet_heights.png", 16, 32);

    initHeightConfig();
}

var treesLayer, objectsLayer, map, cursors, buttons = {}, lightHero, shadow2, fire;
var shadow3;
var shadow4;


var hconfig = {
    tiles:
        [ { tileNr: 530, hotspotOffsetY: 4, idx: 0 },
            { tileNr: 644, tileTopNr: 587, hotspotOffsetY: 4, idx: 1 },
            { tileNr: 1411, idx: 2 },
            { tileNr: 1358,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 2,
                idx: 3 },
            { tileNr: 1361,
                projection: 'flatY',
                projectionTile: 1358,
                projectionCoord: 13,
                projectionWidth: 2,
                idx: 4 },
            { tileNr: 544, hotspotOffsetY: 4, tileTopNr: 587, idx: 5 },
            { tileNr: 1136, idx: 6 },
            { tileNr: 1250, projection: 'flatX', projectionCoord: 15, idx: 7, projectionWidth: 1 },
            { tileNr: 1410, idx: 8 },
            { tileNr: 1409, idx: 9 },
            { tileNr: 1362,
                projection: 'flatY',
                projectionTile: 1363,
                projectionCoord: 0,
                projectionWidth: 2,
                idx: 10 },
            { tileNr: 1359,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 2,
                idx: 11 },
            { tileNr: 1363,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 2,
                idx: 12 },
            { tileNr: 1364,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 2,
                idx: 13 },
            { tileNr: 849,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 14 },
            { tileNr: 850,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 15 },
            { tileNr: 792,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 16 },
            { tileNr: 793,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 17 },
            { tileNr: 522,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 18 },
            { tileNr: 680,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 19 },
            { tileNr: 677,
                tileTopNr: 620,
                projection: 'flatX',
                projectionCoord: 13,
                projectionWidth: 1,
                idx: 20 } ] };

function initHeightConfig() {
    hconfig.byIndex = {};
    for (var i = 0; i < hconfig.tiles.length; i++) {
        var tile = hconfig.tiles[i];
        var idx = tile.tileNr + 1;
        hconfig.byIndex[idx] = {
            projection: tile.projection,
            projectionCoord: tile.projectionCoord,
            projectionWidth: tile.projectionWidth,
            hotspot: tile.idx,
            height: tile.tileTopNr ? 32 : 16,
            hotspotOffsetX: tile.hotspotOffsetX || 0,
            hotspotOffsetY: tile.hotspotOffsetY || 0
        };
    }
}

var castedShadowsBitmap;

function create1() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#000000';
    map = game.add.tilemap('level1');

    map.addTilesetImage('roguelikeSheet_transparent');

    var bgLayer = map.createLayer('bg');
    treesLayer = map.createLayer('trees');
    objectsLayer = map.createLayer('objects');
    map.setCollisionByExclusion([], true, treesLayer);
    map.setCollisionByExclusion([], true, objectsLayer);
    cursors = game.input.keyboard.createCursorKeys();
    buttons.up = game.input.keyboard.addKey(Phaser.Keyboard.A);
    buttons.down = game.input.keyboard.addKey(Phaser.Keyboard.Z);

    bgLayer.resizeWorld();

    lightHero = game.add.sprite(500, 190, "sprites", 0);

    game.physics.enable(lightHero, Phaser.Physics.ARCADE);

    var textureSize = 1024;
    
    var hotspotsBitmap = game.add.bitmapData(textureSize, textureSize);
    var heightsBitmap = game.add.bitmapData(textureSize, textureSize);
    var tempSprite = game.add.sprite(textureSize, textureSize, hotspotsBitmap);
    var heightsSprite = game.add.sprite(textureSize, textureSize, heightsBitmap);
    //heightsSprite.x = heightsSprite.y = 0; //for debug
    //tempSprite.x = tempSprite.y = 0; //for debug

    prepareHotspotsMap(hotspotsBitmap, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true));
    prepareHeightsMap(heightsBitmap, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true));
    var shadowsSprite = game.add.sprite(textureSize, textureSize, "shadows");


    castedShadowsBitmap = [
        game.add.bitmapData(game.world.width, game.world.height),
        game.add.bitmapData(game.world.width, game.world.height),
        game.add.bitmapData(game.world.width, game.world.height),
        game.add.bitmapData(game.world.width, game.world.height)
    ];

    castedShadowsBitmap.forEach(function(bm) {
        bm.smoothed = false;
    });



    var tsprite = castedShadowsBitmap.map(function(bm) { return game.add.sprite(textureSize,textureSize,bm)});


    shadow3 = tsprite.map(function(ts, idx) {
        var sh = game.add.filter("Shadow3");
        sh.uniforms.iChannel0.value = ts.texture;
        sh.uniforms.iChannel0.textureData = {nearest: true};
        sh.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
        sh.uniforms.tSize.value = {x: textureSize, y: textureSize};

        sh.uniforms.iChannel1.value = shadowsSprite.texture;
        sh.uniforms.iChannel1.textureData = {nearest: true};
        sh.uniforms.iChannel2.value = heightsSprite.texture;
        sh.uniforms.iChannel2.textureData = {nearest: true};
        sh.uniforms.sSize.value = {x: shadowsSprite.width, y: shadowsSprite.height};
        sh.uniforms.ambientLight.value = idx == 0 ? 0.2 : 0;
        return sh;
    });


    fire = game.add.sprite(29*16, 20*16, "roguelikeSheet_transparent");
    fire.animations.add("idle", [470, 471], 8, true);
    fire.animations.play("idle");

    var a = game.add.bitmapData(game.world.width, game.world.height);
    a.context.fillStyle = "rgba(0,0,0,0.5);";
    a.context.fillRect(0,0,game.world.width, game.world.height);
    var b = game.add.sprite(0,0,a);
    b.filters = shadow3;
    //tsprite[0].x = tsprite[0].y = 0;

}

function prepareCastedShadowsBitmap1(bitmap, tiles, light) {
    bitmap.context.clearRect(0,0,bitmap.width, bitmap.height);
    tiles = tiles.slice().map(function(tile) {
       return {
           tile: tile,
           distance: Math.hypot(tile.x*16.5 - light.x, tile.y*16.5 - light.y)
       }
    })
        .filter(function(a) { return light.distance == -1 || a.distance <= light.distance+16;})
        .sort(function(a,b) { return a.distance - b.distance;}).map(function(t) { return t.tile;});
    tiles.forEach(function(tile, idx) {
        var config = hconfig.byIndex[tile.index]; if (!config) return;
        var tileCenter = {x: tile.x*16 + 8, y: tile.y*16 + 8 + (config.hotspotOffsetY||0)};

        var figure;
        var projection = config.projection || "sym";
        switch (projection) {
            case "sym":
                var dx = light.x - tileCenter.x;
                var dy = light.y - tileCenter.y;
                var dist = Math.hypot(dx, dy);
                dx /= dist;
                dy /= dist;
                var line = new Phaser.Line(tileCenter.x + (dx*9), tileCenter.y + (dy*9), tileCenter.x + (-dx*8), tileCenter.y + (-dy*8));
                line.rotate(Math.PI/2);
                figure = {x1: line.end.x, y1: line.end.y, x2: line.start.x, y2: line.start.y};
                break;
            case "flatX":
                figure = {
                    rect: true,
                    x1: tile.x*16, y1: tile.y*16 + config.projectionCoord + config.projectionWidth,
                    x2: tile.x*16 + 16, y2: tile.y*16 + config.projectionCoord};
                break;
            case "flatY":
                figure = {
                    rect: true,
                    x1: tile.x*16 + config.projectionCoord + config.projectionWidth, y1: tile.y*16,
                    x2: tile.x*16 + config.projectionCoord, y2: tile.y*16 + 16};
                break;
        }
        figure.z1 = 0;
        figure.z2 = config.height;

        function findRayEndpoint(x,y,z) {
            if (light.z > z) {
                //length from light to point = D
                //dz = light.z - z
                //dz/D = light.z / D2
                //D2 = light.z*D/dz
                //D2/D = light.z/dz

                //so then we muptiply dx/dy by D2/D

                var dz = light.z - z;
                var m = light.z / dz;
                var dx = m*(x - light.x);
                var dy = m*(y - light.y);
                return {x: light.x + dx, y: light.y + dy, z: 0}
            } else {
                //well, just multiply to world's size
                var m = 320;
                var dx = m*(x - light.x);
                var dy = m*(y - light.y);
                var dz = m*(z - light.z);
                return {x: light.x + dx, y: light.y + dy, z: light.z + dz};
            }
        }

        bitmap.context.fillStyle = "rgba(" + (1+config.hotspot) + "," + tile.x + "," + tile.y + ",1.0)";
        function drawShadow(x1, y1, x2, y2) {
            //cast ray from light to (x1,y1,z2), find when it crosses ground (z==0) or world bounds
            var p1 = findRayEndpoint(x1, y1, figure.z2);
            var p2 = findRayEndpoint(x2, y2, figure.z2);
            var p3 = {x: x2, y: y2, z: figure.z1};
            var p4 = {x: x1, y: y1, z: figure.z1};
            //cast ray from light to (x1,y1,z2)

            bitmap.context.beginPath();
            bitmap.context.moveTo(p1.x|0, p1.y|0);
            bitmap.context.lineTo(p2.x|0, p2.y|0);
            bitmap.context.lineTo(p3.x|0, p3.y|0);
            bitmap.context.lineTo(p4.x|0, p4.y|0);
            bitmap.context.fill();
        }

        if (figure.rect) {
            drawShadow(figure.x1, figure.y1, figure.x1, figure.y2);
            drawShadow(figure.x1, figure.y2, figure.x2, figure.y2);
            drawShadow(figure.x2, figure.y2, figure.x2, figure.y1);
            drawShadow(figure.x2, figure.y1, figure.x1, figure.y1);
        } else {
            drawShadow(figure.x1, figure.y1, figure.x2, figure.y2);
        }


    });
    bitmap.dirty = true;
}

function prepareCastedShadowsBitmap(bitmap, tiles, lights) {
    prepareCastedShadowsBitmap1(bitmap, tiles, lights[0]);
}

function prepareHotspotsMap(bitmap, tiles) {
    var hotspots = game.cache.getImage("hotspots");
    tiles.forEach(function(tile) {
        var config = hconfig.byIndex[tile.index];
        if (!config) return;
        var frame = game.cache.getFrameByIndex("hotspots", config.hotspot);
        var hoy = config.hotspotOffsetY;
        //for (var hoy = 0; hoy <= config.hotspotOffsetY; hoy++ ) {
            bitmap.copyRect(hotspots, frame.getRect(), tile.x * 16 + config.hotspotOffsetX, tile.y * 16 + hoy);
        //}
    });
}

function prepareHeightsMap(bitmap, tiles) {
    var heights = game.cache.getImage("heights");
    tiles.forEach(function(tile) {
        var config = hconfig.byIndex[tile.index];
        if (!config) return;
        var frame = game.cache.getFrameByIndex("heights", config.hotspot);
        bitmap.copyRect(heights, frame.getRect(), tile.x*16, tile.y*16 - 16);
    });
}


var SPEED = 100;
var heroHeight = 40;

var fireParticles = [
    {dx: -2, dy: 0, ddistance: 10},
    {dx: 0, dy: 0, ddistance: 10},
    {dx: 2, dy: 0, ddistance: 10},
];

function update1() {
    lightHero.body.velocity.x = 0;
    lightHero.body.velocity.y = 0;
    if (cursors.left.isDown) {
        lightHero.body.velocity.x = -SPEED;
    } else if (cursors.right.isDown) {
        lightHero.body.velocity.x = +SPEED;
    }

    if (cursors.up.isDown) {
        lightHero.body.velocity.y = -SPEED;
    } else if (cursors.down.isDown) {
        lightHero.body.velocity.y = +SPEED;
    }

    if (buttons.up.justDown) heroHeight+=5;
    if (buttons.down.justDown) heroHeight-=5;
    //lightHero.height = heroHeight;

    var fireDistance = 300;

    fireParticles.forEach(function(fp) {
       if (game.rnd.integerInRange(0, 100) < 10) {
           fp.dy -= game.rnd.integerInRange(0, 2);
           fp.ddistance += game.rnd.integerInRange(-5, +5);
       }
    });
    
    var lights = [
        {x: lightHero.x+8, y: lightHero.y+8, z:heroHeight, distance: 200, radius: 40, strength: 1.0},

        //{x: lightHero.x+10, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16},
        //{x: lightHero.x+16, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16}

    ].concat(fireParticles.map(function(fp) {
        return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, distance: fireDistance + fp.ddistance, radius: 3, strength: 0.2}
    }));

    lights.slice(0,castedShadowsBitmap.length).forEach(function(light, i) {
        prepareCastedShadowsBitmap1(castedShadowsBitmap[i],
            treesLayer.getTiles(0, 0, game.world.width, game.world.height, true),
            light
        );
        shadow3[i].uniforms.light.value = light;
        shadow3[i].uniforms.lightSize.value = {x: light.distance, y: light.radius};
        shadow3[i].uniforms.lightStrength.value = light.strength;
        shadow3[i].update();
    });




    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });

    if (shadow2) {
        shadow2.uniforms.lightsCount.value = lights.length;
        shadow2.uniforms.lightCoords.value = lights.reduce(function (a, l) {
            return a.concat([l.x, l.y, l.z])
        }, []);
        shadow2.uniforms.lightSize.value = lights.reduce(function (a, l) {
            return a.concat([l.distance, l.radius])
        }, []);
        //console.log(shadow2.uniforms);
        shadow2.update();
    }

}

function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}