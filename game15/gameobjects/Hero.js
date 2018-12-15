import getBitmap from "./Bitmaps";

export default class Hero extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, getBitmap("black", 16));
        this.anchor.set(0.5, 0.5);
        this.addChild(game.add.sprite(-4, -4, getBitmap("white", 4)));
        this.addChild(game.add.sprite(4, -4, getBitmap("white", 4)));
        for (let c of this.children) c.anchor.set(0.5, 0.5);
    }
}