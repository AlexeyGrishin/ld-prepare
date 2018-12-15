import getBitmap from './gameobjects/Bitmaps'
import Wall from "./gameobjects/Wall";
import Hero from "./gameobjects/Hero";
import Bulb from "./gameobjects/Bulb";
import ShadowsDrawer from "./lights/render/shadows_drawer";

const FLOOR_COLOR = "#479995";
const CEIL_COLOR = "#c4d5db";

const Main = {
    preload() {
        game.load.tilemap("Walls", "Walls.json", undefined, Phaser.Tilemap.TILED_JSON);
    },

    create() {
        this.floorGrp = game.add.group(undefined, "floor");
        let floor = game.add.sprite(0, 0, getBitmap(FLOOR_COLOR), 0, this.floorGrp);
        floor.width = game.world.width;
        floor.height = game.world.height;

        this.objGrp = game.add.group(undefined, "objects");
        this.shadowsGrp = game.add.group(undefined, "shadows");
        this.lightsGrp = game.add.group(undefined, "lights");
        this.heroGrp = game.add.group(undefined, "hero");

        this.shadows = new ShadowsDrawer(this.shadowsGrp);
        this.addWalls();
        this.addLights();
        this.addHero();

        game.level = this;

    },

    addWalls() {
        let tilemap = game.add.tilemap("Walls");
        for (let {x, y, properties, polyline} of tilemap.objects.walls) {
            let color = properties && properties.color;
            for (let i = 0; i < polyline.length-1; i++) {
                let wall = new Wall(x + polyline[i][0], y + polyline[i][1], x + polyline[i+1][0], y + polyline[i+1][1], color);
                this.objGrp.add(wall);
                this.shadows.addLineShadowCaster(wall.line);
            }
        }
    },

    addLights() {

    },

    addLight(x, y) {
        let bulb = new Bulb(x, y);
        this.lightsGrp.add(bulb);
        this.shadows.addLight(bulb)
    },

    addHero() {
        this.heroGrp.add(this.hero = new Hero(game.world.width/2, game.world.height/2));
        this.cursors = game.input.keyboard.createCursorKeys();
        this.shadows.addLight(this.hero)
    },


    update() {
        this.shadows.update();
        if (game.input.activePointer.leftButton.isDown) {
            if (!this.isMouseDown) {
                this.isMouseDown = true;
                this.addLight(game.input.activePointer.worldX, game.input.activePointer.worldY);
            }
        } else {
            this.isMouseDown = false;
        }

        let rotspeed = 1;
        if (this.cursors.up.isDown) {
            let speed = 4;
            this.hero.x += speed*Math.cos(this.hero.rotation - Math.PI/2);
            this.hero.y += speed*Math.sin(this.hero.rotation - Math.PI/2);
        } else {
            rotspeed = 2;
        }
        if (this.cursors.left.isDown) {
            this.hero.rotation -= 0.02*rotspeed;
        }
        if (this.cursors.right.isDown) {
            this.hero.rotation += 0.02*rotspeed;
        }

    },

    render() {
        for (let sc of this.shadows.shadowCasters) {
            if (sc._intersectionPoints.length === 0) continue;
            game.debug.geom(new Phaser.Line(sc._intersectionPoints[0].x, sc._intersectionPoints[0].y, sc._intersectionPoints[1].x, sc._intersectionPoints[1].y), "red");
        }
    }
};


window.Main = Main;