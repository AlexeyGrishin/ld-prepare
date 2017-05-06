class Windmill extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'windmill', 0);
        this.anchor.set(0.5, 1);

        game.add.existing(this);

        let base = game.add.sprite(0, -this.height+9, 'windmill', 1);
        base.anchor.set(0.5, 0.5);
        this.addChild(base);

        const R = 7;
        this.wms = [];
        for (let i = 0; i < 8; i++) {
            let angle = i*Math.PI/4;
            let wm = game.add.sprite(base.x + Math.cos(angle)*R, base.y + Math.sin(angle)*R, 'windmill', 2);
            wm.anchor.set(0.5, 0.5);
            let r = game.rnd.integerInRange(100,255);
            let b = game.rnd.integerInRange(100,255);
            let g = game.rnd.integerInRange(100,255);
            let tint = (r << 16) | (g << 8) | b;
            wm.tint = tint;
            this.addChild(wm);
            this.wms.push(wm);
            wm.rotatingSpeed = 0;
            wm.phase = 0;
            game.physics.arcade.enable(wm);
            wm.body.setSize(4,4,wm.width/2-1,wm.height/2-1)
        }

    }

    update() {
        this.wms.forEach(wm => {
            if (game.physics.arcade.overlap(wm, windParticlesGrp)) {
                wm.rotatingSpeed = 4;
            }
            wm.phase += (wm.rotatingSpeed / 4);

            wm.frame = (((wm.phase|0) % 12) + 2);

            wm.rotatingSpeed *= game.rnd.realInRange(0.99, 0.995);
            if (wm.rotatingSpeed < 0.1) wm.rotatingSpeed = 0;

        });
    }
}