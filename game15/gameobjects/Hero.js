import getBitmap from "./Bitmaps";

export default class Hero extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, getBitmap("black", 16));
        this.anchor.set(0.5, 0.5);
        if (game.gameplay) {
            this.loadTexture("env", 0);
            this.animations.add("walk", [0,1,2,3], 12, true);
            this.animations.add("idle", [0], 12 ,false);
            this.walking = false;
            this.lightRadius = 50;
        } else {
            this.addChild(game.add.sprite(-4, -4, getBitmap("white", 4)));
            this.addChild(game.add.sprite(4, -4, getBitmap("white", 4)));
            for (let c of this.children) c.anchor.set(0.5, 0.5);
            this.lightRadius = 200;
        }

        this.colliderRadius = 16;
        this.colliderRadius2 = this.colliderRadius*this.colliderRadius;

        this.hasFirefly = 0;
    }

    onWalk(speed) {
        if (game.gameplay) {
            if (speed !== 0 && !this.walking) {
                this.walking = true;
                this.animations.play("walk")
            }
            if (speed === 0 && this.walking) {
                this.walking = false;
                this.animations.play("idle");
            }
        }
    }
}