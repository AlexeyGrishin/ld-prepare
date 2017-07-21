function createZoomer(initialZoom = 1) {

    let worldScale = initialZoom, zoomDirty = worldScale != 1;
    const SCALE_STEP = 0.02;
    let BW, BH;
    //const BASE = 640;

    function zoom(d) {
        worldScale = Phaser.Math.clamp(worldScale + d * SCALE_STEP, 0.25, 2);
        //game.camera.scale.set(worldScale);
        //hero.scale.set(worldScale);
        zoomDirty = true;

    }

    function updateZoom() {
        if (!zoomDirty) return;
        if (!BW) {
            BW = game.canvas.width;
            BH = game.canvas.height;
        }
        game.renderer.resize(BW / worldScale, BH / worldScale);
        layers.forEach((l) => {
            //l.scale.set(worldScale);
            l.resize(BW / worldScale, BH / worldScale);
        });
        game.camera.setSize(BW / worldScale, BH / worldScale);
        game.input.scale.setTo(1 / worldScale);
        game.camera.focusOn(hero);
        zoomDirty = false;
    }

    return {
        update() {
            updateZoom();
        },

        zoom(d) {
            zoom(d);
        }
    }
}