
var Performance = {
    LightsAmount: 4,
    Debug: false,
    ShadowStep: 1,
    ShadowsStepsCount: 64,
    UseShadowBitmask: false,

    Map3dScale: 1
};

function preload() {
    game.time.advancedTiming = true;
    //game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('cat', 'cats_extracted.png', 32, 32);
    game.load.spritesheet('cat3d', 'cats_3d.png', 32, 32);

    game.load.script('shadow5', 'shadow5.js');

    game.load.image("shadows", "cats_shadows.png");
    game.load.spritesheet("heights", "cats_heights.png", 32, 64);

    initHeightConfig();
}

var hconfig = {
    tiles:
        [ { tileNr: 12, projection: 'flatX', projectionCoord: 1, idx: 0 },
            { tileNr: 13, projection: 'flatX', projectionCoord: 1, idx: 1 },
            { tileNr: 14, projection: 'flatX', projectionCoord: 1, idx: 2 },
            { tileNr: 0,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 12,
                idx: 3 },
            { tileNr: 1,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 13,
                idx: 4 },
            { tileNr: 2,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 14,
                idx: 5 },
            { tileNr: 24, projection: 'flatX', projectionCoord: 1, idx: 6 },
            { tileNr: 25, projection: 'flatX', projectionCoord: 1, idx: 7 },
            { tileNr: 26, projection: 'flatX', projectionCoord: 1, idx: 8 },
            { tileNr: 36,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 24,
                idx: 9 },
            { tileNr: 37,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 25,
                idx: 10 },
            { tileNr: 38,
                projection: 'flatY',
                projectionCoord: 6,
                projectionTile: 26,
                idx: 11 } ]
}

function initHeightConfig() {
    hconfig.byIndex = {};
    for (var i = 0; i < hconfig.tiles.length; i++) {
        var tile = hconfig.tiles[i];
        var idx = tile.tileNr + 1;
        hconfig.byIndex[idx] = hconfig.tiles[i] = {
            projection: tile.projection,
            projectionCoord: tile.projectionCoord,
            projectionWidth: tile.projectionWidth,
            hotspot: tile.idx,
            height: 32,
            hotspotOffsetX: (tile.hotspotOffsetX || 0),
            hotspotOffsetY: (tile.hotspotOffsetY || 0)
        };
    }
}

var cursors, cat;


var map3d, heightsBitmap;

var shadow5;

function create1() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#bbccbb';
    cursors = game.input.keyboard.createCursorKeys();

    cat = game.add.sprite(120, 30, "cat", 0);
    cat.animations.add("idle", [4], 60, true);
    cat.animations.add("left", [0,1,2], 30, true);
    cat.animations.add("down", [3,4,5], 30, true);
    cat.animations.add("right", [6,7,8], 30, true);
    cat.animations.add("up", [9,10,11], 30, true);

    game.physics.enable(cat, Phaser.Physics.ARCADE);

    map3d = game.add.bitmapData(game.world.width * 2, game.world.height);
    var map3dSprite = game.add.sprite(game.world.width, 0, map3d);
    var textureSize = 512;
    heightsBitmap = game.add.bitmapData(textureSize, textureSize);
    var heightsSprite = game.add.sprite(textureSize, textureSize, heightsBitmap);
    //map3dSprite.x = map3dSprite.y = 0;

    var shadowsOverlay = game.add.bitmapData(game.world.width, game.world.height);
    shadowsOverlay.context.fillStyle = "rgba(0,0,0,0.5);";
    shadowsOverlay.context.fillRect(0,0,game.world.width, game.world.height);
    var soSprite = game.add.sprite(0,0,shadowsOverlay);
    var amb = game.add.filter("AmbientColor5");
    shadow5 = game.add.filter("Shadow5");
    shadow5.uniforms.iChannel0.value = map3dSprite.texture;
    shadow5.uniforms.iChannel0.textureData = {nearest: true};
    shadow5.uniforms.iChannel2.value = heightsSprite.texture;
    shadow5.uniforms.iChannel2.textureData = {nearest: true};
    shadow5.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
    shadow5.uniforms.shSize.value = {x: game.world.width, y: game.world.height};
    shadow5.uniforms.tSize.value = {x: textureSize, y: textureSize};
    shadow5.uniforms.shadowPrecision.value = Performance.ShadowsBitmask;
    shadow5.uniforms.shadowQ1.value = Performance.ShadowStep;

    soSprite.filters = [amb].concat(shadow5);
}

var move = null, speed = 100;

function update1() {

    if (cursors.left.isDown) {
        cat.body.velocity.x = -speed;
        cat.body.velocity.y = 0;
        cat.animations.play("left");
    } else if (cursors.right.isDown) {
        cat.body.velocity.x = speed;
        cat.body.velocity.y = 0;
        cat.animations.play("right");
    } else if (cursors.down.isDown) {
        cat.body.velocity.y = speed;
        cat.body.velocity.x= 0;
        cat.animations.play("down");
    } else if (cursors.up.isDown) {
        cat.body.velocity.y = -speed;
        cat.body.velocity.x = 0;
        cat.animations.play("up");
    } else {
        cat.body.velocity.x = cat.body.velocity.y = 0;
        cat.animations.play("idle");
    }

    prepareMap3d(map3d, [cat]);
    prepareHeightsMap(heightsBitmap, [cat]);

    shadow5.uniforms.light.value = {x: 320, y: 160, z: 48};
    shadow5.uniforms.lightSize.value = {x: 300, y: 20};
    shadow5.uniforms.lightStrength.value = 1.0;
    shadow5.update();
}

function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
}


function prepareHeightsMap(bitmap, sprites) {
    var heights = game.cache.getImage("heights");
    bitmap.context.clearRect(0,0,bitmap.width, bitmap.height);
    sprites.forEach(function(sprite) {
        var config = hconfig.tiles[sprite.animations.currentFrame.index];
        if (!config) return;
        var frame = game.cache.getFrameByIndex("heights", config.hotspot);
        bitmap.copyRect(heights, frame.getRect(), sprite.x, sprite.y - sprite.height);
    });
}

var shadowsBitmap;

function setBit(i, nr) {
    var mask = 0x01 << nr;
    return i | mask;
}

function prepareMap3d(bitmap, sprites) {
    bitmap.clear(0,0,bitmap.width,bitmap.height);
    var s3d = game.cache.getImage("cat3d");
    sprites.forEach(function(sprite) {
        var idx = sprite.animations.currentFrame.index;
        bitmap.copyRect(s3d, sprite.animations.currentFrame, sprite.x, sprite.y)
        bitmap.copyRect(s3d, {
            x: sprite.animations.currentFrame.x,
            y: sprite.animations.currentFrame.y + 32,
            width: 32,
            height: 32
        }, sprite.x + (bitmap.width/2)|0, sprite.y)
    });
}

function prepareMap3d_old(bitmap, sprites) {
    if (!shadowsBitmap) {
        var shadows = game.cache.getImage("shadows");
        shadowsBitmap = game.add.bitmapData(shadows.width, shadows.height);
        shadowsBitmap.copy(shadows);
        shadowsBitmap.update(0, 0, shadows.width, shadows.height);
    }
    bitmap.context.clearRect(0,0,bitmap.width,bitmap.height);
    bitmap.update(0,sprites[0].y,bitmap.width,32);
    //1pix = 16 heights
    sprites.forEach(function(sprite) {
        var config = hconfig.tiles[sprite.animations.currentFrame.index];
        if (!config) return;
        var baseY = config.hotspot * 32;
        var tileY = sprite.y - sprites[0].y;
        var tileX = sprite.x;
        for (var y = 0; y < 32; y++) {
            for (var x = 0; x < 32; x++) {
                var colors = [0xff000000, 0xff000000];
                if (false) {colors[0] = 0xff00ffff; colors[1] = 0xff00ffff; } else {
                    for (var z = 0; z < config.height; z++) {
                        //var frame = {x: z*16, y: baseY, width: 16, height: 16};
                        var ci = (z/16)|0;
                        if (shadowsBitmap.getPixel(z*32 + x, baseY + y).a > 0)
                            colors[ci] = setBit(colors[ci], z % 16);
                        //bitmap.copyRect(shadows, frame, tile.x*16, tile.y*16 - 16);
                    }}
                //colors[1] = 0xff000000;
                bitmap.pixels[((tileY+y+config.hotspotOffsetY) * bitmap.width + tileX + x)|0] = colors[0];
                bitmap.pixels[((tileY+y+config.hotspotOffsetY) * bitmap.width + tileX + x + bitmap.width/2)|0] = colors[1];
                //console.log(colors);
            }
        }
        //console.log("last for", tile.index, colors.map(function(s) { return s.toString(16)}));

        //var frame = game.cache.getFrameByIndex("shadows", config.hotspot);
    });
    bitmap.context.putImageData(bitmap.imageData, 0,sprites[0].y);
    bitmap.dirty = true;
}