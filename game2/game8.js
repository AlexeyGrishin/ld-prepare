var Performance = initOptions({
    LightsAmount: ["int", 4],
    Blur: ["boolean", true],
    UseShadowMaterial: ["boolean", false],
    RotateModels: ["boolean", true]
});

function preload() {
    game.time.advancedTiming = true;
    game.plugins.add(ThreePlugin);
    game.three.assets = "convert/obj";
    game.load.tilemap('level1', 'l4.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.script('blur', 'blurs.js');

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16, -1, 0, 1);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);
    
    game.three.autoConvertSpritesUsing(Threedify({
        "roguelikeSheet_transparent": {
            530: {projection: Threedify.Sym, data: {translate: {y: 4}}},
            1411: {projection: Threedify.Sym},
            1136: {projection: Threedify.Sym},
            1410: {projection: Threedify.Sym},
            1409: {projection: Threedify.Sym},
            644: {projection: Threedify.Sym, top: 587},
            1358: {projection: Threedify.X, offset: 0, width: 2},
            1250: {projection: Threedify.X, offset: 0, width: 2},
            1361: {projection: Threedify.Y, base: 1358,  offset: 0, width: 2},
            1359: {projection: Threedify.X, offset: 0, width: 2},
            1363: {projection: Threedify.X, offset: 0, width: 2},
            1364: {projection: Threedify.X, offset: 0, width: 2},
            849: {projection: Threedify.X, offset: 0, width: 1},
            850: {projection: Threedify.X, offset: 0, width: 1},
            792: {projection: Threedify.X, offset: 0, width: 1},
            793: {projection: Threedify.X, offset: 0, width: 1},
            522: {projection: Threedify.X, offset: 0, width: 1},
            680: {projection: Threedify.X, offset: 0, width: 1},
            677: {projection: Threedify.X, top: 620, offset: 0, width: 1},
            1362: {projection: Threedify.Y, base: 1364,  offset: 0, width: 2},
            default: {projection: Threedify.X}
        }

    }).fromSpriteToGeometry);

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
        floor: Performance.UseShadowMaterial ? true : 0xffffff,
        ignore: [621,588]
    });
    scene2 = game.three.createScene(treesLayer, {
        lights: [{color: 0xcccccc, intensity: 0.5}],
        key: "three2",
        shadows: true,
        render: ThreePlugin.RenderModels,
        ignore: [621,588],
    });

    lightForHero = scene.addLight(ThreePlugin.PointLight, {intensity: 2, distance: 200});
    if (scene2) scene2.addExisting(lightForHero, "three");
    fireLights = [];
    for (var i = 0; i < Performance.LightsAmount-1;i++) {
        let sp = scene.addLight(ThreePlugin.PointLight, {intensity: 0.3, distance: 300});
        if (scene2) scene2.addExisting(sp, "three");
        fireLights.push(sp);
    }

    if (Performance.RotateModels) {
        if (scene2) scene2.forEach(function (sp) {
            if (!sp.three2.mesh) return;
            sp.three2.mesh.children[0].material = createRotatedMaterialFrom(sp.three2.mesh.children[0].material, game.world.width / 2);
        });
    }

    //
    game.world.bringToTop(treesLayer);

    if (!Performance.UseShadowMaterial) {
        scene.sprite.x = game.world.width;  //move outside
        scene.sprite.fixedToCamera = false;

        var shadowsOverlay = game.add.bitmapData(game.world.width, game.world.height);
        shadowsOverlay.context.fillStyle = "rgba(0,0,0,0.5);";
        shadowsOverlay.context.fillRect(0, 0, shadowsOverlay.width, shadowsOverlay.height);

        var amb = game.add.filter("AmbientColor7");
        shadow7 = [0, 1, 2, 3].map(function (_, i) {
            var f = game.add.filter("Shadow7");
            f.uniforms.iChannel0.value = scene.sprite.texture;
            f.uniforms.iChannel0.textureData = {nearest: true};
            f.uniforms.wSize.value = {x: game.world.width, y: game.world.height};
            return f;
        });

        var soSprite = game.add.sprite(0, 0, shadowsOverlay);
        soSprite.filters = [amb]
            .concat(shadow7)
            .concat(Performance.Blur ? [game.add.filter("BlurX"), game.add.filter("BlurY")] : []);
    }
    if (scene2) game.world.bringToTop(scene2.sprite);
}


var lightForHero, fireLights, shadow7;

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

    lightForHero.three.x = lightHero.x;
    lightForHero.three.y = lightHero.y;
    lightForHero.three.z = heroHeight;
    if (scene2) {
        lightForHero.three2.x = lightHero.x;
        lightForHero.three2.y = lightHero.y;
        lightForHero.three2.z = heroHeight;
    }

    var fireDistance = 300;

    fireParticles.forEach(function(fp, fi) {
        if (game.rnd.integerInRange(0, 100) < 10) {
            fp.dy -= game.rnd.integerInRange(0, 2);
            fp.ddistance += game.rnd.integerInRange(-5, +5);
        }
        if ( fireLights && fireLights[fi]) {
            fireLights[fi].three.color = 0xffcc00;
            fireLights[fi].three.distance = fireDistance + fp.ddistance;
            fireLights[fi].three.x = fire.centerX + fp.dx;
            fireLights[fi].three.y = fire.centerY + fp.dy;
            fireLights[fi].three.z = 15;
            if (scene2) {
                fireLights[fi].three2.color = 0xffcc00;
                fireLights[fi].three2.distance = fireDistance + fp.ddistance;
                fireLights[fi].three2.x = fire.centerX + fp.dx;
                fireLights[fi].three2.y = fire.centerY + fp.dy;
                fireLights[fi].three2.z = 15;

            }
            //fireLights[fi].three2.z = fire.centerY + fp.dy;
            //fireLights[fi].three2.y = 15 + BASE_Y;
        }
    });


    if (!Performance.UseShadowMaterial) {
        var lights = [
            {x: lightHero.x+4, y: lightHero.y+8, z:heroHeight, distance: 400, radius: 40, strength: 1},
        ].concat(fireParticles.map(function(fp) {
            return {x: fire.centerX + fp.dx, y: fire.centerY + fp.dy, z: 15, distance: fireDistance + fp.ddistance, radius: 3, strength: 0.3}
        }));

        lights.slice(0, shadow7.length).forEach(function (light, li) {
            shadow7[li].uniforms.light.value = {x: light.x, y: light.y, z: light.z};
            shadow7[li].uniforms.lightSize.value = {x: light.distance, y: light.radius};
            shadow7[li].uniforms.lightStrength.value = light.strength;
            shadow7[li].update();
        });
    }

    fireParticles.forEach(function(fp) {
        if (fp.dy < -4) {fp.dy = 0; fp.ddistance = 10;}
    });

}
function debugRender1() {
    game.debug.text(game.time.fps, 32,32);
    if (window.performance && window.performance.memory && window.performance.memory.usedJSHeapSize) {
        game.debug.text((window.performance.memory.usedJSHeapSize / 1000 / 1000).toFixed(1) + " MB", 32, 64);
    }
    game.debug.text("height=" + heroHeight, 32, game.world.height-32);
}