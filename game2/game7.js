function preload() {
    game.time.advancedTiming = true;
    game.plugins.add(ThreePlugin);
    game.three.assets = "convert/obj";
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);

    var tilesToUse = [530,644,677,680,792,793,849,850,1136,1250,1358,1359,1362,1363,1364,1409,1410,1411];
    tilesToUse.forEach(function(idx) {
        game.load.obj3d("tile-" + idx, {insteadOf: ["roguelikeSheet_transparent", idx], rotate: {x: Math.PI/2}});
    });

    game.load.script("shadows7", "shadows7.js");

}

var map, treesLayer, objectsLayer, cursors, buttons = {}, lightHero, scene, scene2;

var BASE_Y = 100;

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

    fire = game.add.sprite(29*16, 20*16, "roguelikeSheet_transparent");
    fire.animations.add("idle", [470, 471], 8, true);
    fire.animations.play("idle");

    scene = game.three.createScene(treesLayer, {
        //lights: [{color: 0xffffff, intensity: 0.5}],
        shadows: true,
        render: ThreePlugin.RenderNothing,
        floor: 0xcccccc,
        ignore: [621,588],
        //debugCanvas: true
    });
    scene2 = game.three.createScene(treesLayer, {
        key: "three2",
        shadows: true,
        render: ThreePlugin.RenderModels,
        ignore: [621,588],
        //floor: true,
        //debugCanvas: true,
        oneByOne1: function copy(sprite, source, targetContext) {
            targetContext.drawImage(source,
                sprite.three2.x - game.camera.x - 8,
                BASE_Y-24 - game.camera.y, 16, 32,
                sprite.three2.x - game.camera.x,
                sprite.three.y-8 - game.camera.y, 16, 32);

        }
        //lights: [{color: 0xffffff, intensity: 0.5}]
    });

    lightForHero = scene.addLight(ThreePlugin.PointLight, {intensity: 1, distance: 200});
    scene2.addExisting(lightForHero, "three");
    fireLights = [0].map(function() {
        let sp = scene.addLight(ThreePlugin.PointLight, {intensity: 1, distance: 200});
        scene2.addExisting(sp, "three");
        return sp;
    });

    var rotatedThree = game.add.sprite(30, 60, "roguelikeSheet_transparent", 530);
    rotatedThree.rotation = Math.PI/8;
    scene2.addSprite(rotatedThree);
    //console.log(rotatedThree.rotation, rotatedThree.three2.rotation);
    scene2.forEach(function(sp) {
        sp.three2.rotation.x = -Math.PI/2;
        //var y = sp.three2.y;
        //sp.three2.y = sp.three2.z + BASE_Y;
        //sp.three2.z = y;
    });
    //rotatedThree.three2.rotation.y = Math.PI/8;
    //console.log(rotatedThree.rotation, rotatedThree.three2.rotation);


    //
    scene.sprite.x = game.world.width;  //move outside
    scene.sprite.fixedToCamera = false;
    var shadowsOverlay = game.add.bitmapData(game.world.width, game.world.height);
    shadowsOverlay.context.fillStyle = "rgba(0,0,0,0.5);";
    shadowsOverlay.context.fillRect(0,0,shadowsOverlay.width, shadowsOverlay.height);

    var amb = game.add.filter("AmbientColor7");
    shadow7 = [0,1,2,3].map(function(_, i) {
        var f = game.add.filter("Shadow7");
        f.uniforms.iChannel0.value = scene.sprite.texture;
        f.uniforms.iChannel0.textureData = {nearest: true};
        f.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
        return f;
    });

    game.world.bringToTop(treesLayer);
    var soSprite = game.add.sprite(0,0,shadowsOverlay);
    soSprite.filters = [amb].concat(shadow7);

    game.world.bringToTop(scene2.sprite);
}


var lightForHero, fireLights, shadow7;

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

    lightForHero.three.x = lightHero.x;
    lightForHero.three.y = lightHero.y;
    lightForHero.three.z = heroHeight;
    lightForHero.three2.x = lightHero.x;
    lightForHero.three2.y = lightHero.y;
    lightForHero.three2.z = heroHeight;
    //lightForHero.three2.z = lightHero.y;
    //lightForHero.three2.y = heroHeight + BASE_Y;

    var fireDistance = 400;

    fireParticles.forEach(function(fp, fi) {
        if (game.rnd.integerInRange(0, 100) < 10) {
            fp.dy -= game.rnd.integerInRange(0, 2);
            fp.ddistance += game.rnd.integerInRange(-5, +5);
        }
        if ( fireLights && fireLights[fi]) {
            ["three", "three2"].forEach(function(t) {
                fireLights[fi][t].color = 0xffcc00;
                fireLights[fi][t].distance = fireDistance + fp.ddistance;
                fireLights[fi][t].x = fire.centerX + fp.dx;

            });
            fireLights[fi].three.y = fire.centerY + fp.dy;
            fireLights[fi].three.z = 15;
            fireLights[fi].three2.y = fire.centerY + fp.dy;
            fireLights[fi].three2.z = 15;
            //fireLights[fi].three2.z = fire.centerY + fp.dy;
            //fireLights[fi].three2.y = 15 + BASE_Y;
        }
    });


    var lights = [
        {x: lightHero.x+4, y: lightHero.y+8, z:heroHeight, distance: 400, radius: 40, strength: 1},

        //{x: lightHero.x+10, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16},
        //{x: lightHero.x+16, y: lightHero.y+8, z:heroHeight, distance: distance, radius: 16}

    ].concat(fireParticles.map(function(fp) {
        return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, distance: fireDistance + fp.ddistance, radius: 3, strength: 0.3}
    }));

    lights.forEach(function(light, li) {
        //prepareShadowMask(shadowMaskBitmaps[li], tiles, [light]);
        shadow7[li].uniforms.light.value = {x: light.x, y : light.y, z: light.z};
        shadow7[li].uniforms.lightSize.value = {x: light.distance , y: light.radius };
        shadow7[li].uniforms.lightStrength.value = light.strength;
        shadow7[li].update();
    });

    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });

}
function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}