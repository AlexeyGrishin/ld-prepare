import getBitmap from './Bitmaps'

const SLOWDOWN = 100;
const RADIUS = 140;

export default class Firefly extends Phaser.Sprite {
    constructor(x, y, baseRadius = RADIUS, floating) {
        super(game, x, y, getBitmap("yellow", 8));
        this.anchor.set(0.5, 0.5);
        this.lightRadius = baseRadius;
        this.baseRadius = baseRadius;

        this.cx = x;
        this.cy = y;
        this.t = game.rnd.realInRange(0, 10);
        this.floating = floating;
        this.grabbed = false;
    }

    update() {
        if (this.floating && !this.grabbed) {
            this.t += game.time.physicsElapsedMS/SLOWDOWN;
            this.x = this.cx + Math.sin(this.t / 4) * 2;
            this.y = this.cy + Math.cos(this.t) * Math.cos(this.t / 2) * 1;
            this.lightRadius = this.baseRadius + Math.sin(this.t) * 2;
        }

    }
}