export default class Flower extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, "env", 4);
        this.anchor.set(0.5, 0.5);
        this.animations.add("grow", [5,6,7,8,9], 8, false);
        this.animations.add("ungrow", [8,7,6,5,4], 8, false);
        this.grown = false;
        this.grownAnytime = false;
    }


    grow() {
        if (this.grown) return;

        this.animations.play("grow");
        this.grown = true;
        this.grownAnytime = true;
    }

    ungrow() {
        if (!this.grown) return;
        this.animations.play("ungrow");
        this.grown = false;
    }

    update() {
        let anyNear = false;
        for (let light of game.level.lightsGrp.children) {
            if (Phaser.Point.distance(this, light) < light.lightRadius) {
                anyNear = true;
                break;
            }
        }
        anyNear ? this.grow() : this.ungrow();
    }
}