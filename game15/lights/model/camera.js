export default class Camera {
    constructor(sprite, pseudo3d) {
        this.sprite = sprite;
        this.x = sprite.x;
        this.y = sprite.y;

        this.radius = game.world.width;
        this.activeLight = false;

        this.pseudo3d = pseudo3d;
    }

    update() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }

    setDistancesMap(map) {
        this.distancesMap = map;
    }


    fillDistancesForArc(ai1, ai2, normalFromLight, getU) {
        this.distancesMap.fillDistancesForArc(ai1, ai2, normalFromLight, (index, minusNormalWidth, angle, normalAngle) => {
            this.distancesMap.setTextureOffset(index, getU(this, normalFromLight, minusNormalWidth, angle, normalAngle));
        });
    }
}