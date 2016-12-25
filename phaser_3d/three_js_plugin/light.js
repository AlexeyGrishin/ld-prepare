import {ThreeLinkedObject, Proxy3d} from './base';

export default class ThreeLight extends ThreeLinkedObject {
    constructor(scene, sprite, light, typeConfig, config) {
        super(scene, sprite, light);
        this.light = light;
        this.typeConfig = typeConfig;
        this.config = config;
        if (typeConfig.target) {
            this.target = new Proxy3d(light.target.position, () => light.target.updateMatrixWorld());
        }
        if (config && config.floor !== undefined && config.distance !== undefined) {
            let material = scene.parent.createMaterial(config.floor);
            let floor = new THREE.Mesh(
                new THREE.CircleGeometry(config.distance, 32),
                material
            );
            floor.receiveShadow = true;
            floor.position.set( 0, 0, 0 );
            this.floor = floor;
        }
    }

    get color() { return this.light.color.getHex();}
    set color(val) { this.light.color.setHex(val);}
    get intensity() { return this.light.intensity;}
    set intensity(val) { this.light.intensity = val;}

    get distance() { return this.light.distance;}
    set distance(val) { this.light.distance = val;}

    get renderOneByOne() { return false; }

    applyShadows(shadows) {
        if (this.typeConfig.shadows) {
            this.light.castShadow = shadows;
            if (this.floor && shadows) this.light.parent.add(this.floor);
            if (this.floor && !shadows) this.light.parent.remove(this.floor);
        }
    }

    updateCoords() {
        super.updateCoords();
        if (this.floor) {
            this.floor.position.set(this.light.position.x, this.light.position.y, 0);
        }
    }

    cloneInto(newParent) {
        return new ThreeLight(newParent, this.sprite, this.light.clone(), this.typeConfig, this.config);
    }
}