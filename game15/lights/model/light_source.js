export default class LightSource {
    constructor(sprite) {
        this.sprite = sprite;
        this.x = sprite.x;
        this.y = sprite.y;

        this.radius = 200;
    }

    update() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }

    setDistancesMap(map) {
        this.distancesMap = map;
    }
}