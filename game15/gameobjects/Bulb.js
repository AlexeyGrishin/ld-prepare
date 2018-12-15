import getBitmap from './Bitmaps'

export default class Bulb extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, getBitmap("yellow", 8));
        this.anchor.set(0.5, 0.5);
    }
}