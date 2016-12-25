
function preload() {
    game.time.advancedTiming = true;
    game.init3d({assets: "../tr"});
    game.load.spritesheet("tiles", "../game2/roguelikeSheet_extracted.png", 16, 16);
    game.load.spritesheet("sprites", "../game2/sprites.png", 16, 16);
    
    game.load.obj3d("roguelike-0", {rotate: {x: Math.PI/2}, insteadOf: ["tiles", 0]});
    game.load.obj3d("roguelike-7", {rotate: {x: Math.PI/2}, insteadOf: ["tiles", 7]});

}

var ground, trees, men;
var hero, light, light2;
var cursors;

var trees2;

function enablePhysics(sprite) {
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.resize(640, 640);

    ground = game.add.group();
    trees = game.p3d.addGroup3d();
    trees.shadows = "only";
    trees.render = false;

    trees2 = game.p3d.addGroup3d(function(sprite, canvasSrc, canvasTarget) {
        //so our sprite is rendered at (sprite.x, 160, 16, 16)
        //move it to (sprite.x, sprite.y, 16, 16)
        canvasTarget.context.drawImage(canvasSrc, sprite.x - game.camera.x, 160-8 - game.camera.y, 16, 16, sprite.x - game.camera.x, sprite.p3d.z-8 - game.camera.y, 16, 16);
    });
    trees2.shadows = true;
    trees2.render = false;
    trees2._3d.scene.remove(trees2._floor);


    men = game.add.group();


    var bg = game.add.bitmapData(game.world.width, game.world.height);
    var g = bg.context.createLinearGradient(0, 0, game.world.width, 0);
    g.addColorStop(0, "rgb(112,128,112)");
    g.addColorStop(1, "rgb(64,128,64)");
    bg.context.fillStyle = g;
    bg.context.fillRect(0,0,game.world.width,game.world.height);
    game.add.sprite(0,0,bg,undefined,ground);

    var treePos = [{x:300,y:100},{x:280,y:120}, {x:180, y: 50}];

    treePos.forEach(function(t) {
        game.add.sprite(t.x,t.y,"tiles",0,trees);
        var t2 = game.add.sprite(t.x, t.y, "tiles", 0, trees2);
        t2.p3d.rotation.x = -Math.PI/2;
        t2.p3d.y = 160;
        t2.p3d.z = t.y;
    });
    //game.add.sprite(300,100,"tiles",0,trees);
    //game.add.sprite(280,100,"tiles",0,trees);

    game.add.sprite(150,140,"tiles",7,trees);
    //game.add.sprite(350,340,"tiles",8,trees);
    //game.add.tween(t1.p3d.rotation).to({x: Math.PI/3}, 2000, null, true);

    //trees.add(game.p3d.createAmbientLight(0xffffff, 0.5));

    /*trees.add(game.p3d.createSpotLight(0x00ff00, 1, 200, undefined, undefined,
        {x: game.world.width/2, y:0, z:50},
        {x:game.world.width/2, y: 50, z: 0})
    );*/

    light = game.p3d.createPointLight(0xff0000, 1, 600, 0);
    light.p3d.z = 50;
    trees.add(light);

    light2 = game.p3d.createPointLight(0xff0000, 1, 600, 0);
    light2.p3d.y = 160-50;
    trees2.add(light2);

    hero = game.add.sprite(100,100,"sprites", 0, men);
    //hero.addChild(light);
    //trees2.add(game.p3d.createAmbientLight(0xffffff, 0.5));

    cursors = game.input.keyboard.createCursorKeys();

    men.forEach(enablePhysics);
    trees.forEach(enablePhysics);
    trees.forEach(function(t) { t.body.immovable = true;});

    game.camera.follow(hero);
    hero.checkWorldBounds = true;
    hero.body.collideWorldBounds = true;

    //console.log(trees._3d);
}

var SPEED = 150;
function update() {

    game.physics.arcade.collide(men, trees);

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
    
    light.x = hero.x;
    light.y = hero.y;
    light2.p3d.x = hero.x;
    light2.p3d.z = hero.y;
}

function debugRender1() {
    game.debug.text(game.time.fps, game.camera.width/2,game.camera.height-10);
}