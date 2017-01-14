var Options = initOptions({
   LightsAmount: ["int", 4],
    UseHeightsMap: ["boolean", true],
    HeroX: ["int", 240],
    HeroY: ["int", 500]
}, {screenshot: function() { return lightHero }});

function preload() {
    game.time.advancedTiming = true;
    PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('roguelikeSheet_transparent_normales', 'roguelikeSheet_transparent_NRM.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'adam.png', 16, 16);

    game.load.script('shadow2', 'pixel_shadows_shader.js');
    game.load.script('normal', 'normal_test.js');
    
    game.load.image("shadows", "roguelikeSheet_shadows.png");
    game.load.spritesheet("hotspots", "roguelikeSheet_hotspots.png", 16, 16);
    game.load.spritesheet("heights", "roguelikeSheet_heights.png", 16, 32);

    initHeightConfig();
}

var treesLayer, objectsLayer, map, cursors, buttons = {}, lightHero, shadow2, fire;


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
            hotspot: tile.idx,
            height: tile.tileTopNr ? 32 : 16,
            hotspotOffsetX: tile.hotspotOffsetX || 0,
            hotspotOffsetY: tile.hotspotOffsetY || 0
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

    lightHero = game.add.sprite(Options.HeroX, Options.HeroY, "sprites", 0);
    lightHero.anchor.set(0.5, 0.5);

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

    shadow2 = game.add.filter("Shadow2");
    if (Options.UseHeightsMap) {
        game.world.filters = [shadow2];
    } else {
        bgLayer.filters = [shadow2];
        bgLayer.texture.baseTexture.scaleMode = Phaser.scaleModes.NEAREST;
    }

    shadow2.uniforms.iChannel0.value = tempSprite.texture;
    shadow2.uniforms.iChannel0.textureData = {nearest: true};

    var shadowsSprite = game.add.sprite(textureSize, textureSize, "shadows");

    shadow2.uniforms.iChannel1.value = shadowsSprite.texture;
    shadow2.uniforms.iChannel1.textureData = {nearest: true};
    shadow2.uniforms.iChannel2.value = heightsSprite.texture;
    shadow2.uniforms.iChannel2.textureData = {nearest: true};

    shadow2.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
    shadow2.uniforms.tSize.value = {x: textureSize, y: textureSize};
    shadow2.uniforms.sSize.value = {x: shadowsSprite.width, y: shadowsSprite.height};

    fire = game.add.sprite(29*16, 20*16, "roguelikeSheet_transparent");
    fire.animations.add("idle", [470, 471], 8, true);
    fire.animations.play("idle");
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

    var fireDistance = 200;

    fireParticles.forEach(function(fp) {
       if (game.rnd.integerInRange(0, 100) < 10) {
           fp.dy -= game.rnd.integerInRange(0, 2);
           fp.ddistance += game.rnd.integerInRange(-5, +5);
       }
    });
    
    var lights = [
        {x: lightHero.x+4, y: lightHero.y+8, z:heroHeight, distance: 200, radius: 40},

        //{x: lightHero.x+10, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16},
        //{x: lightHero.x+16, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16}

    ].concat(fireParticles.map(function(fp) {
        return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, distance: fireDistance + fp.ddistance, radius: 3}
    })).slice(0, Options.LightsAmount);

    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });
    
    
    shadow2.uniforms.lightsCount.value = lights.length;
    shadow2.uniforms.lightCoords.value = lights.reduce(function(a, l) { return a.concat([l.x, l.y, l.z])}, []);
    shadow2.uniforms.lightSize.value = lights.reduce(function(a, l) { return a.concat([l.distance, l.radius])}, []);
    //console.log(shadow2.uniforms);
    shadow2.update();

}

function debugRender1() {
    game.debug.text("FPS: 22", 32,32);
    return;
    game.debug.text(game.time.fps, 32,32);
    if (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) {
        game.debug.text((window.performance.memory.usedJSHeapSize / 1000 / 1000).toFixed(1) + " MB", 32, 64);
    }
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}