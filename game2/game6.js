
var Performance = {
    ShadowsBitmask: 1,  //not used
    LightsAmount: 1,
    Debug: false,
    ShadowStep: 1,
    ShadowsStepsCount: 64,
    UseShadowBitmask: false,

    Map3dScale: 1
};

function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('roguelikeSheet_transparent_normales', 'roguelikeSheet_transparent_NRM.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);

    game.load.script('shadow5', 'shadow5.js');
    game.load.script('shadow6', 'shadow6.js');
    game.load.script('blur', 'blurs.js');

    game.load.image("shadows", "roguelikeSheet_shadows2.png");
    game.load.spritesheet("hotspots", "roguelikeSheet_hotspots.png", 16, 16);
    game.load.spritesheet("heights", "roguelikeSheet_heights.png", 16, 32);

    initHeightConfig();
}
var treesLayer, objectsLayer, map, cursors, buttons = {}, lightHero, shadow5, fire;


var shadow6m, shadow6r;

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

var shadowMaskBitmaps;
var rr, smSprite;


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
    //game.world.width = game.world.height = 513;

    lightHero = game.add.sprite(120, 30, "sprites", 0);

    game.physics.enable(lightHero, Phaser.Physics.ARCADE);

    var textureSize = 1024;



    var hotspotsBitmap = game.add.bitmapData(textureSize, textureSize);
    var heightsBitmap = game.add.bitmapData(textureSize, textureSize);
    var tempSprite = game.add.sprite(textureSize, textureSize, hotspotsBitmap);
    var heightsSprite = game.add.sprite(textureSize, textureSize, heightsBitmap);
    shadowMaskBitmaps = [];
    for (var i = 0; i < Performance.LightsAmount; i++) shadowMaskBitmaps.push(game.add.bitmapData(game.world.width / Performance.ShadowsBitmask, game.world.height / Performance.ShadowsBitmask));
    var shadowMaskSprites = shadowMaskBitmaps.map(function(bm) {
        return game.add.sprite(game.world.width, 0, bm);
    });
    //shadowMaskSprites[0].x = shadowMaskSprites[0].y = 0;

    //1. prepare BIG height texture
    var map3d = game.add.bitmapData(game.world.width * 2 / Performance.Map3dScale, game.world.height / Performance.Map3dScale);
    var map3dSprite = game.add.sprite(game.world.width, 0, map3d);
    //map3dSprite.x = 0;

    prepareMap3d(map3d, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true), Performance.Debug);

    //todo: do I really need heights map for now? map3d is not enought?
    prepareHeightsMap(heightsBitmap, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true));


    var shadowsMap = shadowMaskSprites.map(function(_, i) {return game.add.bitmapData(256,64);});
    smSprite = shadowsMap.map(function(s) { return game.add.sprite(640,0, s);});;

    //smSprite[1].x = 0;

    var shadowsOverlay = game.add.bitmapData(game.world.width, game.world.height);
    shadowsOverlay.context.fillStyle = "rgba(0,0,0,0.5);";
    shadowsOverlay.context.fillRect(0,0,shadowsOverlay.width, shadowsOverlay.height);
    var soSprite = game.add.sprite(0,0,shadowsOverlay);
    //soSprite.scale.setTo(Performance.Map3dScale, Performance.Map3dScale);
    //console.log(soSprite.width);
    var amb = game.add.filter("AmbientColor5");

    rr = smSprite.map(function() { return game.add.renderTexture(256,64)});// return new Phaser.RenderTexture(game, 256, 64); });

    //var rrsprite = rr.map(function(r) { return game.add.sprite(640,0,rr);});

    shadow6m = smSprite.map(function(sp, i) {
        //sp.setTexture(rr[i]);
        var f = game.add.filter("Shadow6_Map");
        f.uniforms.iChannel0.value = map3dSprite.texture;
        f.uniforms.iChannel0.textureData = {nearest: true};
        //f.uniforms.iChannel1.value = shadowMaskSprites[i].texture;
        //f.uniforms.iChannel1.textureData = {nearest: true};
        f.uniforms.iChannel2.value = heightsSprite.texture;
        f.uniforms.iChannel2.textureData = {nearest: true};
        /*f.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
        f.uniforms.shSize.value = {x: game.world.width / Performance.Map3dScale, y: game.world.height/ Performance.Map3dScale};
        f.uniforms.tSize.value = {x: textureSize, y: textureSize};
        f.uniforms.shadowPrecision.value = Performance.ShadowsBitmask;
        f.uniforms.shadowQ1.value = Performance.ShadowStep;*/
        sp.filters = [f];
        return f;
    });
    
    shadow6r = smSprite.map(function(_, i) {
        var f = game.add.filter("Shadow6_Render");
        f.uniforms.iChannel0.value = rr[i];//smSprite[i].texture;
        f.uniforms.iChannel0.textureData = {nearest: true, width: 256, height: 64};
        /*f.uniforms.iChannel1.value = shadowMaskSprites[i].texture;
        f.uniforms.iChannel1.textureData = {nearest: true};
        f.uniforms.iChannel2.value = heightsSprite.texture;
        f.uniforms.iChannel2.textureData = {nearest: true};*/
        /*f.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
        f.uniforms.shSize.value = {x: game.world.width / Performance.Map3dScale, y: game.world.height/ Performance.Map3dScale};
        f.uniforms.tSize.value = {x: textureSize, y: textureSize};
        f.uniforms.shadowPrecision.value = Performance.ShadowsBitmask;
        f.uniforms.shadowQ1.value = Performance.ShadowStep;*/
        return f;
    });

    soSprite.filters = [amb].concat(shadow6r);
    //smSprite.filters = shadow6;

    if (Performance.Map3dScale > 1) {
        var rb = game.add.filter("ResizeBack");
        var bx = game.add.filter("BlurX");
        var by = game.add.filter("BlurY");
        soSprite.filters = soSprite.filters.concat([rb, bx, by]);
    }

    //heightsSprite.x = heightsSprite.y = 0; //for debug
    //tempSprite.x = tempSprite.y = 0; //for debug

    /*
    prepareHotspotsMap(hotspotsBitmap, treesLayer.getTiles(0, 0, game.world.width, game.world.height, true));

    shadow2 = game.add.filter("Shadow2");
    game.world.filters = [shadow2];

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
*/

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
                    if (shadowsBitmap.getPixel(z*16 + x, baseY + y).a > 0)
                        colors[ci] = setBit(colors[ci], z % 16);
                    //bitmap.copyRect(shadows, frame, tile.x*16, tile.y*16 - 16);
                }};
                //colors[1] = 0xff000000;
                var idx = ((((tileY+y+config.hotspotOffsetY) / Performance.Map3dScale)|0) * bitmap.width + (((tileX + x) / Performance.Map3dScale)|0));
                bitmap.pixels[idx] = bitmap.pixels[idx] | colors[0];
                bitmap.pixels[idx+ bitmap.width/2] = bitmap.pixels[idx+ bitmap.width/2] | colors[1];
                //bitmap.pixels[((tileY+y+config.hotspotOffsetY) * bitmap.width + tileX + x + bitmap.width/2)|0] = colors[1];
                //console.log(colors);
            }
        }
        //console.log("last for", tile.index, colors.map(function(s) { return s.toString(16)}));

        //var frame = game.cache.getFrameByIndex("shadows", config.hotspot);
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
];

function update1() {
    var tiles = treesLayer.getTiles(0, 0, game.world.width, game.world.height, true);
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
        {x: lightHero.x+4, y: lightHero.y+8, z:heroHeight, distance: 200, radius: 40, strength: 2},

        //{x: lightHero.x+10, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16},
        //{x: lightHero.x+16, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16}

    ].concat(fireParticles.map(function(fp) {
        return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, strength: 0.2, distance: fireDistance + fp.ddistance, radius: 3}
    }));



    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });

    lights = lights.slice(0, Performance.LightsAmount);
    lights.forEach(function(light, li) {
        rr[li].render(smSprite[li], undefined, true); //rr[li].requiresUpdate = true;
        //prepareShadowMask(shadowMaskBitmaps[li], tiles, [light]);
        //prepareShadowInitialMask(shadowMaskBitmaps[li], treesLayer, [light]);
        shadow6m[li].uniforms.light.value = {x: light.x / Performance.Map3dScale, y : light.y / Performance.Map3dScale, z: light.z};
        shadow6m[li].uniforms.lightSize.value = {x: light.distance / Performance.Map3dScale, y: light.radius / Performance.Map3dScale};
        shadow6m[li].uniforms.lightStrength.value = light.strength;
        shadow6m[li].update(game.input.mousePointer);
        shadow6r[li].uniforms.light.value = {x: light.x / Performance.Map3dScale, y : light.y / Performance.Map3dScale, z: light.z};
        shadow6r[li].uniforms.lightSize.value = {x: light.distance / Performance.Map3dScale, y: light.radius / Performance.Map3dScale};
        shadow6r[li].uniforms.lightStrength.value = light.strength;
        shadow6r[li].update(game.input.mousePointer);
    });


}

function prepareShadowInitialMask(bitmap, layer, lights) { if (!Performance.UseShadowBitmask) return;
   var tw = game.world.width/16, th = game.world.height/16;
   var t1 = new Date().getTime();

   bitmap.context.clearRect(0,0,bitmap.width,bitmap.height);

   var ray = new Phaser.Line(0,0, lights[0].x, lights[0].y);
   for (var x = 0; x < tw; x++) {
      for (var y = 0; y < th; y++) {
         ray.start.x = x*16 + 8; ray.start.y = y*16+8;
         var rayZ = {start: 0, end: lights[0].z};
         if (ray.length > lights[0].distance + 16) continue;
         var metTiles = [];//layer.getRayCastTiles(ray, (ray.length / 16)|0, true);
         var p = {x: ray.start.x, y: ray.start.y, z: rayZ.start};
         var count = Math.ceil(ray.length / 16); 
         var dx = (ray.end.x - ray.start.x)/count; var dy = (ray.end.y - ray.start.y)/count;
         var dz = (rayZ.end - rayZ.start)/count;

         var closestTile = {tile: null, distance: -1};
         function checkT(t) { 
		if (t) { 
			var config = hconfig.byIndex[t.index]; 
			if (config && config.height > p.z) {
             			var dist = Phaser.Point.distance({x: t.worldX+8, y: t.worldY+8}, ray.start);
				if (dist < closestTile.distance || closestTile.distance == -1) closestTile.distance = dist;;
			}
		} 
	}
 
         for (var i = 0; i < count; i++) { 
               
             checkT(map.getTile((p.x/16)|0, (p.y/16)|0, layer));
             checkT(map.getTile(((p.x + ray.normalX*8)/16)|0, ((p.y+ray.normalY*8)/16)|0, layer));
             checkT(map.getTile(((p.x - ray.normalX*8)/16)|0, ((p.y-ray.normalY*8)/16)|0, layer));
             
             p.x += dx; p.y += dy; p.z += dz;
             if (p.z > 32.) break;
         }
         
         var r=0,a=0; 
         if (closestTile.distance != -1) { 
             r = (255 * (closestTile.distance / ray.length))|0;
             a = 0.5;
         }
         bitmap.context.fillStyle = "rgba(" + r + ",0,0," + a.toFixed(1) + ")";
         bitmap.context.fillRect(x*16, y*16, 16, 16);
      }
   }
   bitmap.dirty = true;
   //console.log("done in ", (new Date().getTime() - t1), "ms");
}

function prepareShadowMask(bitmap, tiles, lights) {
    bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
    bitmap.context.fillStyle = "black";
    bitmap.context.beginPath();
    lights.forEach(function(light) {
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

            function drawShadow(x1, y1, x2, y2) {
                //cast ray from light to (x1,y1,z2), find when it crosses ground (z==0) or world bounds
                var p1 = findRayEndpoint(x1, y1, figure.z2);
                var p2 = findRayEndpoint(x2, y2, figure.z2);
                var p3 = {x: x2, y: y2, z: figure.z1};
                var p4 = {x: x1, y: y1, z: figure.z1};
                //cast ray from light to (x1,y1,z2)

                [p1,p2,p3,p4].forEach(function(p) {
                    p.x = (p.x/Performance.ShadowsBitmask)|0;
                    p.y = (p.y/Performance.ShadowsBitmask)|0;
                });


                bitmap.context.moveTo(p1.x|0, p1.y|0);
                bitmap.context.lineTo(p2.x|0, p2.y|0);
                bitmap.context.lineTo(p3.x|0, p3.y|0);
                bitmap.context.lineTo(p4.x|0, p4.y|0);

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
    });
    bitmap.context.fill();
    bitmap.dirty = true;
}

function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}