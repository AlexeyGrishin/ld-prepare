export default class LightSource {
    constructor(sprite) {
        this.sprite = sprite;
        this.x = sprite.x;
        this.y = sprite.y;

        this.radius = sprite.lightRadius || 200;
        this.activeLight = true;
    }

    update() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }

    setDistancesMap(map) {
        this.distancesMap = map;
    }

    fillDistancesForArc(ai1, ai2, normalFromLight) {
        this.distancesMap.fillDistancesForArc(ai1, ai2, normalFromLight);
    }
}