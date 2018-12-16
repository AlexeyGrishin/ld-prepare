import Wall from "./gameobjects/Wall";
import Hero from "./gameobjects/Hero";
import Bulb from "./gameobjects/Bulb";
import ShadowsDrawer, {MODE_SHADOWS, MODE_SIMPLE} from "./lights/render/shadows_drawer";
import "../common/opts"
import Pseudo3d from "./3d/render_pseudo_3d";
import {intersectsLineWithCircle} from "./math";
import Flower from "./gameobjects/Flower";
import Firefly from "./gameobjects/Firefly";

const FLOOR_FRAME_NR = 8;
const CEIL_FRAME_NR = 16;
const PAD = 32;

const fpsEl = document.querySelector("#fps");

var options = window.initOptions({
    showSegmentsDebug: ["boolean", false],
    showRaycastDebug: ["boolean", false],
    showRaycastShaderDebug: ["boolean", false],
    collideWalls: ["boolean", false],

    steps: ["int", 512],
    mode: ["select", MODE_SHADOWS, [MODE_SIMPLE, MODE_SHADOWS]],
    lightDecay: ["boolean", true],
    smoothShadow: ["boolean", true],
    randomLightsOnStart: ["int", 1],
    floatingBulbs: ["boolean", true],
    bulbRadius: ["int", 140],

    pseudo3d: ["boolean", false],
    pseudo3dTexture: ["boolean", true],
    pseudo3dLights: ["boolean", true],

    gameplay: ["boolean", false],

    hidden: ["boolean", false]
});


const Main = {

    init() {
        game.time.advancedTiming = true;
    },

    preload() {
        game.load.tilemap("Walls", "Walls.json", undefined, Phaser.Tilemap.TILED_JSON);
        game.load.tilemap("Level1", "Level1.json", undefined, Phaser.Tilemap.TILED_JSON);
        game.load.spritesheet("colors", "colors.png", 4, 1);
        game.load.spritesheet("env", "env.png", 32, 32);
        game.load.spritesheet("walls", "walls.png", 16, 16);

        game.gameplay = options.gameplay;
    },

    create() {
        this.floorGrp = game.add.group(undefined, "floor");
        let floor = game.add.sprite(0, 0, "colors", FLOOR_FRAME_NR, this.floorGrp);
        floor.width = game.world.width;
        floor.height = game.world.height;

        this.objGrp = game.add.group(undefined, "objects");
        this.flowersGrp = game.add.group(undefined, "flowers");
        this.shadowsGrp = game.add.group(undefined, "shadows");
        this.lightsGrp = game.add.group(undefined, "lights");
        this.heroGrp = game.add.group(undefined, "hero");
        this.overallGrp = game.add.group(undefined, "overall");

        this.shadows = new ShadowsDrawer(this.shadowsGrp, options.steps);
        if (options.showRaycastShaderDebug) {
            this.shadows.showRaycastDebug();
        }
        if (options.pseudo3d) {
            this.pseudo3d = new Pseudo3d(640, 480, this.overallGrp, !options.pseudo3dTexture, options.pseudo3dLights);
        }
        this.addWalls();
        this.addHero();
        this.addLights();

        game.level = this;

        this.shadows.init(options.mode, options);

        if (options.pseudo3d) {
            this.pseudo3d.init(this.hero, this.shadows);
        }

        this.fireflyTimeout = 0;
        this.lastFlowersCount = 0;
    },

    addWalls() {
        let tilemap = game.add.tilemap(options.gameplay ? "Level1" : "Walls");
        for (let {x, y, properties, polyline} of tilemap.objects.walls) {
            //if (!properties || !properties.only) continue;
            let color = properties && properties.color;
            let textureNr = properties && properties.texture;
            for (let i = 0; i < polyline.length-1; i++) {
                let wall = new Wall(x + polyline[i][0], y + polyline[i][1], x + polyline[i+1][0], y + polyline[i+1][1], textureNr);
                this.objGrp.add(wall);
                let textureGetter = this.pseudo3d ? this.pseudo3d.createTextureOffsetGetter(textureNr || 0) : undefined;
                this.shadows.addLineShadowCaster(wall.line, textureGetter);
            }
        }
    },

    addLights() {
        game.rnd.sow([1]);
        for (let i = 0; i < options.randomLightsOnStart; i++) {
            let x = game.rnd.integerInRange(PAD, game.world.width-PAD*2);
            let y = game.rnd.integerInRange(PAD, game.world.height-PAD*2);
            this.addLight(x, y);
        }
        game.rnd.sow([2]);
    },

    addLight(x, y) {
        let bulb = game.gameplay ? new Firefly(x, y, undefined, true) : new Bulb(x, y, options.bulbRadius, options.floatingBulbs);
        this.lightsGrp.add(bulb);
        this.shadows.addLight(bulb)
    },

    addHero() {
        this.heroGrp.add(this.hero = new Hero(game.world.width/2, game.world.height/2, options.pseudo3d));
        this.cursors = game.input.keyboard.createCursorKeys();
        this.keys = {
            space: game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR),
            z: game.input.keyboard.addKey(Phaser.KeyCode.Z)
        };
        if (options.pseudo3d) {
            this.shadows.addCamera(this.hero);
        } else {
            this.shadows.addLight(this.hero)
        }
    },

    moveByIfCan(hero, speed, forceVector = undefined) {
        let dx = forceVector === undefined ? Math.cos((this.hero.rotation - Math.PI/2)) : forceVector.x;
        let dy = forceVector === undefined ? Math.sin((this.hero.rotation - Math.PI/2)) : forceVector.y;
        let newx = this.hero.x + speed * dx;
        let newy = this.hero.y + speed * dy;

        if (options.collideWalls) {
            for (let wall of this.objGrp.children) {
                if (intersectsLineWithCircle(wall.line, newx, newy, this.hero.colliderRadius, this.hero.colliderRadius2)) {
                    if (forceVector === undefined) {
                        let p = new Phaser.Point(wall.line.end.x, wall.line.end.y);
                        p.subtract(wall.line.start.x, wall.line.start.y);
                        p.normalRightHand();
                        if (p.dot({x: wall.line.start.x - this.hero.x, y: wall.line.start.y - this.hero.y}) > 0) {
                            p.multiply(-1, -1);
                        }
                        p.add(dx, dy).normalize();
                        return this.moveByIfCan(hero, speed, p);

                    }
                    return;
                }
            }
            this.hero.x = newx;
            this.hero.y = newy;
        } else {
            newx = Math.min(newx, game.world.width-this.hero.width);
            this.hero.x = Math.max(newx, this.hero.width);
            newy = Math.min(newy, game.world.height-this.hero.height);
            this.hero.y = Math.max(newy, this.hero.height);
        }
    },

    update() {
        this.shadows.update();
        if (this.pseudo3d) this.pseudo3d.update();
        if (game.input.activePointer.leftButton.isDown && !game.gameplay) {
            if (!this.isMouseDown) {
                this.isMouseDown = true;
                this.addLight(game.input.activePointer.worldX, game.input.activePointer.worldY);
            }
        } else {
            this.isMouseDown = false;
        }
        if (this.keys.space.justDown && !game.gameplay) {
            this.addLight(this.hero.x, this.hero.y);

        }

        let rotspeed = 2;
        if (this.cursors.up.isDown || this.cursors.down.isDown) {
            let speed = this.cursors.up.isDown ? 4 : -4;
            this.moveByIfCan(this.hero, speed);
            this.hero.onWalk(speed)
        } else {
            rotspeed = 4;
            this.hero.onWalk(0);
        }
        if (this.cursors.left.isDown) {
            this.hero.rotation -= 0.02*rotspeed;
        }
        if (this.cursors.right.isDown) {
            this.hero.rotation += 0.02*rotspeed;
        }

        if (game.gameplay) {
            this.updateGameplay();
        }

    },


    updateGameplay() {
        if (this.keys.z.justDown) {
            let p = new Phaser.Point(0, 16);
            p.rotate(0, 0, this.hero.rotation, false);
            p.add(this.hero.x, this.hero.y);

            this.flowersGrp.add(new Flower(p.x, p.y));
        }

        if (this.keys.space.justDown) {
            if (this.hero.grabbedFirefly) {
                let ff = this.hero.grabbedFirefly;
                ff.grabbed = false;
                this.hero.grabbedFirefly = undefined;
            } else {
                let ff = this.lightsGrp.getClosestTo(this.hero);
                if (ff && Phaser.Point.distance(ff, this.hero) < 32) {
                    this.hero.grabbedFirefly = ff;
                    ff.grabbed = true;
                }
            }
        }

        if (this.hero.grabbedFirefly) {
            this.hero.grabbedFirefly.cx = this.hero.grabbedFirefly.x = this.hero.x + 16*Math.cos(this.hero.rotation - Math.PI/2);
            this.hero.grabbedFirefly.cy = this.hero.grabbedFirefly.y = this.hero.y + 16*Math.sin(this.hero.rotation - Math.PI/2);
        }

        let grownFlowersCount = this.flowersGrp.children.filter(f => f.grownAnytime).length;
        if (grownFlowersCount > this.lastFlowersCount) {
            this.lastFlowersCount = grownFlowersCount;
            if (this.fireflyTimeout < 0) {
                let x = game.rnd.integerInRange(PAD, game.world.width - PAD * 2);
                let y = game.rnd.integerInRange(PAD, game.world.height - PAD * 6);
                this.addLight(x, y);
                this.fireflyTimeout = 4000;
            }

        }
        this.fireflyTimeout -= game.time.physicsElapsedMS;
    },

    render() {
        fpsEl.innerText = game.time.fps || '--';
        if (options.showSegmentsDebug) {
            for (let sc of this.shadows.shadowCasters) {
                if (sc._intersectionPoints.length === 0) continue;
                game.debug.geom(new Phaser.Line(sc._intersectionPoints[0].x, sc._intersectionPoints[0].y, sc._intersectionPoints[1].x, sc._intersectionPoints[1].y), "white");
            }
        }
        if (options.showRaycastDebug) {
            for (let {angle, distance} of this.shadows.lightSources[0].distancesMap.getAngles()) {
                game.debug.geom(new Phaser.Line(this.hero.x, this.hero.y, this.hero.x + Math.cos(angle) * distance, this.hero.y + Math.sin(angle) * distance), "rgba(0,0,255,0.4)")
            }
        }
    }
};


window.Main = Main;