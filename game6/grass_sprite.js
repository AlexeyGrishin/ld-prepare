
class GrassSprite extends Phaser.Sprite {
    constructor(x, y, model, group) {
        super(game, x, y, model.bitmap, 0);
        group.add(this);
        game.physics.arcade.enable(this);
        this.anchor.set(0.5, 0.5);
        this.debug = true;
        this.model = model;
        this.model.resize(this);
    }

    update() {
        this.model.update();
    }

    updateWind(p, dir = -1, y) {
        this.model.updateWind(dir, p, this.bottom - y);
    }
}