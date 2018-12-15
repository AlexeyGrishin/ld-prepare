import getBitmap from './Bitmaps'

export default class Wall extends Phaser.Sprite {
    constructor(x1, y1, x2, y2, color = "black", thickness = 4) {
        super(game, x1, y1, getBitmap(color));
        this.color = color;
        this.line = new Phaser.Line(x1, y1, x2, y2);

        this.anchor.set(0, 0.5);
        this.height = thickness;
        this.width = this.line.length;
        this.rotation = this.line.angle;
    }
}