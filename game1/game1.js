var game = new Phaser.Game(960, 600, Phaser.WEBGL, 'container', {
    preload: preload,
    create: create,
    update: update,
    render: debugRender });

function preload() {
    game.init3d();
    game.time.advancedTiming = true;

    game.load.tilemap('level1', 'l1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('platformertiles', 'platformertiles.png');
    game.load.image('tardis', 'tardis.png');
    game.load.image('beam', 'beam.png');
    game.load.spritesheet('sprites', 'sprites.png', 32, 32);
    game.load.spritesheet('clock', 'animated_clock.png', 32, 96);
    game.load.script('gray', 'gray.js');
    game.load.script('glow', 'glow.js');
    game.load.script('blash', 'blast.js');
    game.load.script('lights_round', 'lights_round.js');
    game.load.script('lights_line', 'lights_line.js');
    game.load.image('watches', 'watches.png');

    game.load.obj3d("dalek", {insteadOf: ["sprites", 18]})

}

var map;
var tileset;
var layer;
var jumpTimer = 0;
var cursors;
var useWatches;
var bg;
var clocks;
var daleks;
var tardis;
var watches;

var worldStopped = false;

var D = 500;

var UI = {
    status: null
};

var Doctor = {
    nth: 9,
    sprite: null,
    watches: 0,
    state: {playing: true},

    unfreezeTime: 0,
    freezeRadius: null,
    freezePoint: null,

    freezeHint: null,

    animate: function(name) {
        this.sprite.animations.play("d" + this.nth + "-" + name);
        this.lastAnimation = name;
    },

    onEnterClock: function(clock) {
        if (this.overlappedClock) return;
        worldStopped = true;
        this.overlappedClock = clock;
        this.freezingClock = clock;
        if (this.freezeHint) this.freezeHint.destroy();
        //todo: show hint for first time for particular doctor
        switch (this.nth) {
            case 9:
                this.freezeHint = game.add.text(clock.x, clock.y - clock.height, (3.0).toFixed(1), {
                    font: "Arial 12pt",
                    fill: "#ffc000",
                    align: 'center'
                });
                this.freezeHint.width = clock.width;
                break;
            case 10:
                this.freezeRadius = new Phaser.Circle(clock.centerX, clock.centerY, D-32);
                this.freezeHint = game.add.sprite(clock.centerX, clock.centerY);
                this.freezeHint.width = this.freezeHint.height = D;
                //console.log(clock.centerX-256);
                this.freezeHint.anchor = {x: 0.5, y: 0.5};
                Doctor.lightsRound.setResolution(D, D);
                this.freezeHint.filters = [Doctor.lightsRound];
                //this.freezeHint.debug = true;
                break;
            case 11:
                this.freezePoint = new Phaser.Point(clock.centerX, clock.centerY);
                this.freezeHint = game.add.sprite(clock.centerX, clock.centerY);
                this.freezeHint.filters = [Doctor.lightsLine];
                break;
        }
    },

    onExitClock: function() {
        var clock = this.overlappedClock;
        this.overlappedClock = null;
        switch (this.nth) {
            case 9:
                this.unfreezeTime = game.time.now + 3000;//3sec
                //console.log('unfreeze after', this.unfreezeTime);
                break;
            case 10:
                break;
            case 11:
                //todo:
                break;
        }
    },

    useWatches: function() {
        if (this.watches == 0) return; //todo: beep
        if (worldStopped) return;
        if (this.isRegenerating()) return;
        this.watches--;
        //todo: very ugly, just want to fast switch from clocks to watches
        var pseudoClock = {
            centerX: Doctor.sprite.centerX, centerY: Doctor.sprite.centerY,
            x: Doctor.sprite.x, y: Doctor.sprite.y,
            height: Doctor.sprite.height,
            width: Doctor.sprite.width
        };
        this.onEnterClock(pseudoClock);
        this.onExitClock();
    },

    update: function() {
        //Doctor.lightsRound.update();
        if (this.state.regenerating) {
            Doctor.sprite.body.stopMovement(true);
            Doctor.sprite.body.allowGravity = false;
            Doctor.sprite.filters = [Doctor.glow];
            switch (this.state.phase) {
                case 1: {
                    Doctor.glow.mul += 4*game.time.physicsElapsed;
                    if (game.time.now >= this.state.nextPhase) {
                        this.state.phase = 2;
                        this.state.nextPhase = game.time.now + 1000;
                        game.camera.shake(0.01, 1000);
                        this.state.blast = game.add.sprite(0, this.sprite.y);
                        this.state.blast.width = game.world.width;
                        this.state.blast.height = this.sprite.height;
                        this.state.blast.filters = [Doctor.blast];
                        Doctor.blast.setResolution(this.state.blast.width, this.state.blast.height);
                    }
                    break;
                }
                case 2: {
                    Doctor.blast.setOffset(0, game.camera.y + game.camera.height  - this.sprite.y - this.sprite.height);//game.world.height - this.freezeHint.y - D/2);
                    Doctor.blast.update();

                    if (game.time.now >= this.state.nextPhase) {
                        this.state.blast.destroy();
                        this.nth++;
                        this.animate(this.lastAnimation);
                        this.state.phase = 3;
                        this.state.nextPhase = game.time.now + 1000;
                        if (this.killedBy) {
                            this.killedBy.destroy();
                        }
                    }
                    break;
                }
                case 3: {
                    Doctor.glow.mul -= 4*game.time.physicsElapsed;
                    if (game.time.now >= this.state.nextPhase) {
                        this.state = {playing: true};
                        this.animate(this.lastAnimation);
                    }
                    break;
                }
            }
            //here we shall have some animation
            return;
        } else {
            Doctor.sprite.body.allowGravity = true;
        }
        Doctor.sprite.filters = undefined;
        if (!worldStopped ) return;
        switch (this.nth) {
            case 9:
                if (!this.overlappedClock) {
                    this.freezeHint.text = ((this.unfreezeTime - game.time.now) / 1000).toFixed(1);
                }
                if (!this.overlappedClock && game.time.now >= this.unfreezeTime) {
                    //console.log('unfreeze at', game.time.now);
                    worldStopped = false;
                    this.unfreezeTime = 0;
                    this.freezeHint.destroy();
                }
                break;
            case 10:
                Doctor.lightsRound.update();
                //todo: attach?
                this.freezeHint.x = this.freezingClock.centerX;
                this.freezeHint.y = this.freezingClock.centerY;
                Doctor.lightsRound.setOffset(this.freezeHint.x - D/2, game.camera.y + game.camera.height  - this.freezeHint.y - D/2);//game.world.height - this.freezeHint.y - D/2);
                if (!Phaser.Circle.intersectsRectangle(this.freezeRadius, this.getRect())) {
                    this.freezeRadius = null;
                    worldStopped = false;
                    this.freezeHint.destroy();
                }
                break;
            case 11:
                this.freezeLine = new Phaser.Line(this.sprite.centerX, this.sprite.centerY, this.freezePoint.x, this.freezePoint.y);
                this.freezeHint.x = this.freezeLine.x;
                this.freezeHint.y = this.freezeLine.y;
                this.freezeHint.width = this.freezeLine.width;
                this.freezeHint.height = this.freezeLine.height;
                Doctor.lightsLine.setOffset(this.freezeHint.x, game.camera.y + game.camera.height  - this.freezeHint.y - this.freezeHint.height);//game.world.height - this.freezeHint.y - D/2);
                Doctor.lightsLine.setResolution(this.freezeHint.width, this.freezeHint.height);
                Doctor.lightsLine.setRotation((this.sprite.centerX - this.freezePoint.x) / (this.sprite.centerY - this.freezePoint.y) > 0);
                Doctor.lightsLine.update();
                if (layer.getRayCastTiles(this.freezeLine, undefined, true).length > 0) {
                    worldStopped = false;
                    this.freezeHint.destroy();
                }
                //todo
                break;
        }
        if (!worldStopped) {
            //guard - if regenerating near clock (so onEnter as one doctor, and onExit as another)
            this.freezeRadius = null;
            this.unfreezeTime = 0;
            this.freezeLine = null;
        }
    },

    getRect: function() {
        //todo: better?
       return new Phaser.Rectangle(this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height);
    },

    onKillBy: function(dalek) {
        if (this.nth == 11) return gameOver(false);
        this.state = {regenerating: true, phase: 1};
        Doctor.glow.mul = 1.0;
        //worldStopped = true;
        this.killedBy = dalek;
        this.state.nextPhase = game.time.now + 1000;
    },

    isRegenerating: function() {
        return this.state.regenerating;
    }
};

var stateText;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.stage.backgroundColor = '#000000';

    //bg = game.add.tileSprite(0, 0, 960, 600);
    //bg.fixedToCamera = true;

    map = game.add.tilemap('level1');

    map.addTilesetImage('platformertiles');

    //map.setCollisionByExclusion([ 13, 14, 15, 16, 46, 47, 48, 49, 50, 51 ]);

    map.createLayer('bg');
    map.createLayer('effects');
    layer = map.createLayer('platforms');
    map.setCollisionByExclusion([], true, layer);
    map.setLayer(layer);

    //  Un-comment this on to see the collision tiles
    //layer.debug = true;

    layer.resizeWorld();

    game.physics.arcade.gravity.y = 900;

    //todo: Doctor constructor
    Doctor.sprite = game.add.sprite(32, 100*32-32-32, 'sprites', 4);
    Doctor.gray = game.add.filter('Gray');
    Doctor.glow = game.add.filter('Glow');
    Doctor.lightsRound = game.add.filter('LightsRound');
    Doctor.lightsLine = game.add.filter('LightsLine');
    Doctor.blast = game.add.filter('Blast');
    game.physics.enable(Doctor.sprite, Phaser.Physics.ARCADE);

    //player.body.bounce.y = 0.2;
    Doctor.sprite.body.collideWorldBounds = true;
    Doctor.sprite.body.checkCollision.up = false;
    //player.body.setSize(32, 32);

    Doctor.sprite.animations.add('d9-idle', [4]);
    Doctor.sprite.animations.add('d9-left', [15, 16, 17], 10, true);
    Doctor.sprite.animations.add('d9-right', [15+12, 16+12, 17+12], 10, true);
    Doctor.sprite.animations.add('d10-idle', [4-3]);
    Doctor.sprite.animations.add('d10-left', [15-3, 16-3, 17-3], 10, true);
    Doctor.sprite.animations.add('d10-right', [15+12-3, 16+12-3, 17+12-3], 10, true);
    Doctor.sprite.animations.add('d11-idle', [4-3+48]);
    Doctor.sprite.animations.add('d11-left', [15-3+48, 16-3+48, 17-3+48], 10, true);
    Doctor.sprite.animations.add('d11-right', [15+12-3+48, 16+12-3+48, 17+12-3+48], 10, true);

    game.camera.follow(Doctor.sprite);

    cursors = game.input.keyboard.createCursorKeys();
    useWatches = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);


    daleks = game.p3d.addGroup3d();// game.add.group(undefined, "daleks");
    daleks.render = false;
    daleks.shadows = true;
    //daleks.add(game.p3d.createAmbientLight(0xffffff, 0.5));
    //daleks.add(game.p3d.createDirectionalLight(0xffeeee, 1, {x: game.world.width, y: game.world.height-100, z: 20}, {x: game.world.width-100, y: game.world.height-100, z: 0}));
    /*daleks.add(game.p3d.createSpotLight(0xffeeee, 2, 200,
        undefined, undefined,
        {x: game.world.width/2+350, y: game.world.height-500, z: 40},
        {x: game.world.width/2+350, y: game.world.height-500, z: 20}));*/
    //daleks.add(game.p3d.createDirectionalLight(0xffffff, 4, {x: game.world.width/2, y:  game.world.height-400, z: 50}, {x: game.world.width, y: game.world.height, z: 0}));
    clocks = game.add.group(undefined, "clocks");
    watches = game.add.group(undefined, "watches");

    function addClock(x, y) {
        var clock = game.add.sprite(x, y + 8, 'clock');
        clock.anchor = {x: 0, y: 1};
        clock.animations.add('tick', [0,1,2,1], 2, true).play();
        clocks.add(clock);
    }

    function addDalek(x, y) {
        //todo: random color
        var dalek = game.add.sprite(x, y-32, 'sprites', 18);
        //dalek.anchor.y = 0;
        dalek.animations.add('left', [18,19,20], 10, true);
        dalek.animations.add('right', [18+12,19+12,20+12], 10, true);

        game.physics.enable(dalek, Phaser.Physics.ARCADE);
        dalek.body.collideWorldBounds = true;
        dalek.animations.play('left');
        dalek.body.velocity.x =  -100;
        daleks.add(dalek);

        dalek.p3d.mesh.position.y = -13;
        dalek.p3d.z = 0;
        daleks.add(game.p3d.createSpotLight(0xffeeee, 3, 1000, Math.PI/8, undefined,
            {x: game.width/2, y: dalek.y, z: 100},
            {x: dalek.x, y: dalek.y, z: 10}
        ))
        //dalek.p3d.mesh.children[0].geometry.computeBoundingBox();
        //console.log(dalek.p3d.mesh.children[0].geometry.boundingBox);
        /*dalek.p3d.mesh.traverse(function(no) {
            if (no instanceof THREE.Mesh) no.material = new THREE.MeshPhongMaterial({color: 0xff0000});

        })*/

        dalek.visLine = new Phaser.Line();
    }

    function addWatches(x, y) {
        var w = game.add.sprite(x, y-16, 'watches');
        w.anchor = {x:0.5, y:0.5};
        watches.add(w);
        var bounce = game.add.tween(w);
        bounce.to({y: w.y-10}, 1000, Phaser.Easing.Quadratic.InOut, true, 0, -1, true);
        w.events.onDestroy.addOnce(function() {
            bounce.stop();
        });
    }


    //console.log(map.objects);
    map.objects.objects.forEach(function(o) {
       switch (o.name) {
           case 'start':
               Doctor.sprite.x = o.x;
               Doctor.sprite.y = o.y - Doctor.sprite.height;
               //addWatches(o.x + 200, o.y);
               break;
           case 'dalek':
               addDalek(o.x, o.y);
               break;
           case 'clock':
               //addClock(o.x, o.y);
               break;
           case 'tardis':
               tardis = game.add.sprite(o.x, o.y - 48, "tardis");
               break;
           case 'watches':
               addWatches(o.x, o.y);
               break;
       } 
    });
    stateText = game.add.text(game.world.centerX, tardis.y,' ', { font: '84px Arial', fill: '#fff' });
    stateText.anchor.setTo(0.5, 0.5);
    stateText.visible = false;

    UI.status = game.add.text(0, game.camera.height - 32, '', {backgroundColor: '#ccc', font: '24px'});
    UI.status.fixedToCamera = true;
    //UI.status.height = 32;

    //console.log(daleks._3d);
}
//todo: this.targets.setAll('body.allowGravity', false); <-- to apply same code to all sprites in group!

var gameIsOver = false;
var justFall = false;
var fallY = 0;

function gameOver(good) {
    stateText.text = good ? "You won!" : "Game over :(";
    stateText.visible = true;
    stateText.y = Doctor.sprite.y;
    gameIsOver = true;
    game.physics.arcade.isPaused = true;
}

function update() {

    UI.status.text = "Lives left: " + (12 - Doctor.nth) + "  Watches: " + Doctor.watches;
    if (worldStopped) UI.status.text +="   TIME STOPPED!";

    //todo: also exists game.physics.arcade.overlap - just checks overlaping
    game.physics.arcade.collide(Doctor.sprite, layer);
    game.physics.arcade.collide(daleks, layer);
    Doctor.sprite.body.velocity.x = 0;
    if (gameIsOver) return;

    if (Doctor.sprite.overlap(tardis)) {
        return gameOver(true);
    }

    //worldStopped = false;

    Doctor.update();
    //if (Doctor.isRegenerating()) return;

    watches.forEach(function(w) {
        if (Doctor.sprite.overlap(w) && !w.got) {
            Doctor.watches++;
            w.got = true;
            var hide = game.add.tween(w);
            hide.to({alpha: 0.0}, 200, null, true).onComplete.addOnce(function() {
                w.destroy();
            });
            //w.destroy();
        }
    });

    clocks.forEach(function(clock) {
        if (Doctor.sprite.overlap(clock)) {
            Doctor.onEnterClock(clock);
        } else if (Doctor.overlappedClock == clock) {
            Doctor.onExitClock();
        }
        //worldStopped = worldStopped || Doctor.sprite.overlap(clock);
        //todo: worldstopped - object, with own update. world is stopped while doctor near clocks. when he goes away - depending on doctor's number world running back by different conditions
        //todo: show remaining time for d9
        //todo: show radius for d10
        //todo: show ray for d11
    });
    clocks.forEach(function(clock) {
        clock.animations.currentAnim.isPaused = worldStopped;
    });

    daleks.forEachAlive(function(dalek) {

        if (worldStopped || Doctor.isRegenerating()) {
            dalek.body.enable =false;
            dalek.animations.currentAnim.paused = true;
            return;
        } else {
            dalek.body.enable = true;
            dalek.animations.currentAnim.paused = false;
        }

        var tile = map.getTileWorldXY(dalek.body.x + dalek.body.velocity.x / 10, dalek.body.y + dalek.body.height + 5);
        if (dalek.isAnimating) return;
        if (!tile || dalek.body.blocked.left || dalek.body.blocked.right) {
            dalek.isAnimating = true;
            var velocity = -dalek.body.velocity.x;
            if (dalek.body.blocked.left) velocity = 100;
            if (dalek.body.blocked.right) velocity = -100;
            dalek.body.velocity.x = 0;
            game.add.tween(dalek.p3d.rotation).to({y: dalek.p3d.rotation.y + Math.PI}, 500, null, true).onComplete.addOnce(function() {
               dalek.isAnimating = false;
                dalek.body.velocity.x = velocity;

                dalek.animations.play(dalek.body.velocity.x > 0 ? 'right' : 'left');
            });

        }
        var moveRight = dalek.body.velocity.x > 0;
        dalek.visLine.start.x = dalek.body.x + (moveRight ? dalek.width : 0);
        dalek.visLine.start.y = dalek.body.y+10;
        dalek.visLine.end.y = dalek.body.y+10;
        var endTile;
        if (moveRight) {
            dalek.visLine.end.x = game.world.width;
            endTile = layer.getRayCastTiles(dalek.visLine, undefined, true)[0];
            dalek.visLine.end.x = endTile.worldX;
        } else {
            dalek.visLine.end.x = 0;
            endTile = layer.getRayCastTiles(dalek.visLine, undefined, true).pop();
            dalek.visLine.end.x = endTile.worldX + endTile.width;
            //swap coordinates;
            var oldEnd = dalek.visLine.end;
            dalek.visLine.end = dalek.visLine.start;
            dalek.visLine.start = oldEnd;
        }
        dalek.visDoctor = (Phaser.Line.intersectsRectangle(dalek.visLine, Doctor.sprite));
        if (dalek.visDoctor) {
            dalek.beam = game.add.sprite(dalek.visLine.start.x, dalek.visLine.start.y, "beam");
            dalek.beam.width = dalek.visLine.width;
            game.time.events.add(500, function() {
                dalek.beam.kill();
                delete dalek.beam;
            });
            Doctor.onKillBy(dalek);
        }
    });
    
    //todo: show hints

    if (useWatches.justDown) {
        Doctor.useWatches();
    }

    if (cursors.left.isDown)
    {
        Doctor.sprite.body.velocity.x = -150;

        if (Doctor.facing != 'left')
        {
            Doctor.animate('left');
            Doctor.facing = 'left';
        }
    }
    else if (cursors.right.isDown)
    {
        Doctor.sprite.body.velocity.x = 150;

        if (Doctor.facing != 'right')
        {
            Doctor.animate('right');
            Doctor.facing = 'right';
        }
    }
    else
    {
        if (Doctor.facing)
        {
            Doctor.animate('idle');

            Doctor.facing = undefined;
        }
    }

    if (cursors.up.isDown && Doctor.sprite.body.onFloor() && game.time.now > jumpTimer)
    {
        Doctor.sprite.body.velocity.y = -500;
        jumpTimer = game.time.now + 750;
    }
    if (!cursors.up.isDown && !Doctor.sprite.body.onFloor() && Doctor.sprite.body.velocity.y < 0) {
        Doctor.sprite.body.velocity.y = 0;
    }
    if (!Doctor.sprite.body.checkCollision.down && Doctor.sprite.body.y >= fallY) {
        Doctor.sprite.body.checkCollision.down = true;
    }
    if (cursors.down.isDown && !justFall && Doctor.sprite.body.y < game.world.height - Doctor.sprite.body.height*3) {
        justFall = true;
        Doctor.sprite.body.checkCollision.down = false;
        Doctor.sprite.body.velocity.y = 100;
        fallY = Doctor.sprite.body.y + Doctor.sprite.height;
    }
    if (!cursors.down.isDown) {
        justFall = false;
    }

}

function debugRender() {
    daleks.forEachAlive(function(dalek) {
       //game.debug.geom(dalek.visLine, dalek.visDoctor ? "red" : "yellow");
    });
    if (Doctor.freezeRadius) {
        //game.debug.geom(Doctor.freezeRadius);
    }
    if (Doctor.freezeLine) {
        //game.debug.geom(Doctor.freezeLine);
    }
    game.debug.text(game.time.fps, 32,32);
}

function render () {

    //game.debug.geom(new Phaser.Line(0, game.world.height, 100, game.world.height-100));

    // game.debug.text(game.time.physicsElapsed, 32, 32);
    // game.debug.body(player);
    // game.debug.bodyInfo(player, 16, 24);

}