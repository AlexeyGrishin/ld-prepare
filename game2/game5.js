
var Performance = initOptions({
    LightsAmount: ["int", 4],
    ShadowsStepsCount: ["int", 128],
    Map3dScale: ["int", 1],
    Blur: ["boolean", true]
});

function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('roguelikeSheet_transparent_normales', 'roguelikeSheet_transparent_NRM.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);

    game.load.script('shadow5', 'shadow5.js');
    game.load.script('blur', 'blurs.js');

    game.load.image("shadows", "roguelikeSheet_shadows2.png");
    game.load.spritesheet("hotspots", "roguelikeSheet_hotspots.png", 16, 16);
    game.load.spritesheet("heights", "roguelikeSheet_heights.png", 16, 32);

    initHeightConfig();
}
var treesLayer, objectsLayer, map, cursors, buttons = {}, lightHero, shadow5, fire;


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
            { tileNr: 1250, projection: 'flatX', projectionCoord: 15, idx: 7 },
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
            hotspotOffsetX: (tile.hotspotOffsetX || 0),
            hotspotOffsetY: (tile.hotspotOffsetY || 0)
        };
    }
}

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

    lightHero = game.add.sprite(100, 90, "sprites", 0);

    game.physics.enable(lightHero, Phaser.Physics.ARCADE);

    var textureSize = 1024;



    var hotspotsBitmap = game.add.bitmapData(textureSize, textureSize);
    var heightsBitmap = game.add.bitmapData(textureSize, textureSize);
    var tempSprite = game.add.sprite(textureSize, textureSize, hotspotsBitmap);
    var heightsSprite = game.add.sprite(textureSize, textureSize, heightsBitmap);
    var lightsTotal = [];
    for (var i = 0; i < Performance.LightsAmount; i++) lightsTotal.push(i);

    //1. prepare BIG height texture
    var map3d = game.add.bitmapData(game.world.width * 2 / Performance.Map3dScale, game.world.height / Performance.Map3dScale);
    var map3dSprite = game.add.sprite(game.world.width, 0, map3d);
    //map3dSprite.x = 0;

    prepareMap3d(map3d, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true), Performance.Debug);

    //todo: do I really need heights map for now? map3d is not enought?
    prepareHeightsMap(heightsBitmap, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true));

    var shadowsOverlay = game.add.bitmapData(game.world.width, game.world.height);
    shadowsOverlay.context.fillStyle = "rgba(0,0,0,0.5);";
    shadowsOverlay.context.fillRect(0,0,shadowsOverlay.width, shadowsOverlay.height);
    var soSprite = game.add.sprite(0,0,shadowsOverlay);
    var amb = game.add.filter("AmbientColor5");
    shadow5 = lightsTotal.map(function(_, i) {
        var f = game.add.filter("Shadow5");
        f.uniforms.iChannel0.value = map3dSprite.texture;
        f.uniforms.iChannel0.textureData = {nearest: true};
        f.uniforms.iChannel2.value = heightsSprite.texture;
        f.uniforms.iChannel2.textureData = {nearest: true};
        f.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
        f.uniforms.shSize.value = {x: game.world.width / Performance.Map3dScale, y: game.world.height/ Performance.Map3dScale};
        f.uniforms.tSize.value = {x: textureSize, y: textureSize};
        return f;
    });

    soSprite.filters = [amb].concat(shadow5);

    if (Performance.Map3dScale > 1) {
        var rb = game.add.filter("ResizeBack");
        soSprite.filters = soSprite.filters.concat([rb]);
    } if (Performance.Blur) {
        var bx = game.add.filter("BlurX");
        var by = game.add.filter("BlurY");
        soSprite.filters = soSprite.filters.concat([bx, by]);
    }

    fire = game.add.sprite(29*16, 20*16, "roguelikeSheet_transparent");
    fire.animations.add("idle", [470, 471], 8, true);
    fire.animations.play("idle");
}

function setBit(i, nr) {
    var mask = 0x01 << nr;
    return i | mask;
}

function prepareMap3d(bitmap, tiles, debug) {
    var shadows = game.cache.getImage("shadows");
    var shadowsBitmap = game.add.bitmapData(shadows.width, shadows.height);
    shadowsBitmap.copy(shadows);
    shadowsBitmap.update(0, 0, shadows.width, shadows.height);
    bitmap.context.clearRect(0,0,bitmap.width,bitmap.height);
    bitmap.update(0,0,bitmap.width,bitmap.height);

    var voxels = [];

    //1pix = 16 heights
    tiles.forEach(function(tile) {
        var config = hconfig.byIndex[tile.index];
        if (!config) return;
        var baseY = config.hotspot * 16;
        var tileY = tile.y * 16;
        var tileX = tile.x * 16;
        for (var y = 0; y < 16; y++) {
            for (var x = 0; x < 16; x++) {
                var colors = [0xff000000, 0xff000000];
                if (debug) {colors[0] = 0xff00ffff; colors[1] = 0xff00ffff; } else {
                for (var z = 0; z < config.height; z++) {
                    //var frame = {x: z*16, y: baseY, width: 16, height: 16};
                    var ci = (z/16)|0;
                    if (shadowsBitmap.getPixel(z*16 + x, baseY + y).a > 0) {
                        colors[ci] = setBit(colors[ci], z % 16);
                        voxels.push([tileX + x, tileY + y, z]);
                    }
                }};
                var idx = ((((tileY+y+config.hotspotOffsetY) / Performance.Map3dScale)|0) * bitmap.width + (((tileX + x) / Performance.Map3dScale)|0));
                bitmap.pixels[idx] = bitmap.pixels[idx] | colors[0];
                bitmap.pixels[idx+ bitmap.width/2] = bitmap.pixels[idx+ bitmap.width/2] | colors[1];
            }
        }
    });
    bitmap.context.putImageData(bitmap.imageData, 0, 0);
    bitmap.dirty = true;
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
    {dx: -2, dy: 0, ddistance: 10},
    {dx: 0, dy: 0, ddistance: 10},
    {dx: 2, dy: 0, ddistance: 10},
    {dx: -2, dy: 0, ddistance: 10},
    {dx: 0, dy: 0, ddistance: 10},
    {dx: 2, dy: 0, ddistance: 10}
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

    var fireDistance = 200;

    fireParticles.forEach(function(fp) {
        if (game.rnd.integerInRange(0, 100) < 10) {
            fp.dy -= game.rnd.integerInRange(0, 2);
            fp.ddistance += game.rnd.integerInRange(-5, +5);
        }
    });

    var lights = [
        {x: lightHero.x+4, y: lightHero.y+8, z:heroHeight, distance: 200, radius: 40, strength: 1},
    ].concat(fireParticles.map(function(fp) {
        return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, strength: 0.2, distance: fireDistance + fp.ddistance, radius: 3}
    }));



    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });

    lights = lights.slice(0, Performance.LightsAmount);
    lights.forEach(function(light, li) {
        shadow5[li].uniforms.light.value = {x: light.x / Performance.Map3dScale, y : light.y / Performance.Map3dScale, z: light.z};
        shadow5[li].uniforms.lightSize.value = {x: light.distance / Performance.Map3dScale, y: light.radius / Performance.Map3dScale};
        shadow5[li].uniforms.lightStrength.value = light.strength;
        shadow5[li].update(game.input.mousePointer);
    });

}

function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}