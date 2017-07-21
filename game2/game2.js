var game = new Phaser.Game(200, 200, Phaser.AUTO, 'container', {
    preload: preload,
    create: create,
    update: update,
    render: debugRender });

function preload() {
    game.time.advancedTiming = true;
    game.load.tilemap('level1', 'l1.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.spritesheet('roguelikeSheet_transparent', 'roguelikeSheet_transparent.png', 16, 16);
    game.load.spritesheet('sprites', 'sprites.png', 16, 16);
    game.load.spritesheet('sprites_normals', 'sprites_NRM.png', 16, 16);
    game.load.script('normal_test', 'normal_test.js');
}

var map;
var treesLayer;
var objectsLayer;
var cursors;

var hero;

var lamp1;
var mask1;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.stage.backgroundColor = '#000000';
    map = game.add.tilemap('level1');

    map.addTilesetImage('roguelikeSheet_transparent');

    var bgLayer = map.createLayer('bg');
    treesLayer = map.createLayer('trees');
    objectsLayer = map.createLayer('objects');
    map.setCollisionByExclusion([], true, treesLayer);
    map.setCollisionByExclusion([], true, objectsLayer);

    bgLayer.resizeWorld();


    cursors = game.input.keyboard.createCursorKeys();


    game.plugins.add(Phaser.Plugin.PhaserIlluminated);
    lamp1 = game.add.illuminated.lamp(16*8.5-120, 16*6.5-120, {distance: 120, diffuse:0.1});
    var zabor1 = game.add.illuminated.rectangleObject(2*16, 2*16, 6*16, 1*16);
    var zabor2 = game.add.illuminated.rectangleObject(2*16, 2*16, 4, 6*16);
    var zabor3 = game.add.illuminated.rectangleObject(2*16, 7*16, 4*16, 1*16);
    var tree1 = game.add.illuminated.rectangleObject(4*16, 9*16, 16, 16);
    lamp1.createLighting([zabor1, zabor2, zabor3, tree1]);
    mask1 = game.add.illuminated.darkMask([lamp1], 'rgba(0,0,0,1)');
    mask1.bringToTop();

    norm = game.add.filter('NormalTest');
    var texture = game.cache.getBaseTexture('sprites_normals');
    var sp = game.add.sprite(-16,-16, 'sprites_normals', 0);
    sp.worldVisible = false;


    hero = game.add.sprite(11*16, 15*16, 'sprites', 0);
    game.physics.enable(hero, Phaser.Physics.ARCADE);
    hero.body.collideWorldBounds = true;

    hero.filters = [norm];

    norm.setup(sp.texture);

}
var norm;

var SPEED = 100;

var lampd = {x:0, y:0, ticks: 0};

function update() {

    //lamp1.x = hero.x-200;
    //lamp1.y = hero.y-200;
    //lamp1.x = 16*8.5-100 + lampd.x;
    //lamp1.y = 16*6.5-100 + lampd.y;
    lampd.ticks += game.time.elapsedMS;
    if (lampd.ticks >= 100) {
        lampd.ticks -= 100;
        //lampd.x = game.rnd.integerInRange(-2,+2);
        //lampd.y = game.rnd.integerInRange(-2,+4);
    }

    lamp1.refresh();
    mask1.refresh();
    norm.updateLight(lamp1.x+100, lamp1.y+100);
    //norm.updateLight(160,160);
    norm.setOffset(hero.x, hero.y); //todo: offset shall take camera into consideration
    norm.update();


    game.physics.arcade.collide(hero, treesLayer);
    game.physics.arcade.collide(hero, objectsLayer);
    if (cursors.up.isDown) {
        hero.body.velocity.y = -SPEED;
    } else if (cursors.down.isDown) {
        hero.body.velocity.y = SPEED;
    } else {
        hero.body.velocity.y = 0;
    }
    if (cursors.left.isDown) {
        hero.body.velocity.x = -SPEED;
    } else if (cursors.right.isDown) {
        hero.body.velocity.x = SPEED;
    } else {
        hero.body.velocity.x = 0;
    }
    //console.log(hero.body.speed);
}

function debugRender() {
    
}