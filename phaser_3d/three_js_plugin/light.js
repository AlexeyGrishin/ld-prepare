import {ThreeLinkedObject, Proxy3d} from './base';

export default class ThreeLight extends ThreeLinkedObject {
    constructor(scene, sprite, light, typeConfig, config) {
        super(scene, sprite, light);
        this.light = light;
        this.typeConfig = typeConfig;
        this.config = config;
        this.applyConfig(typeConfig, config)
    }
    
    applyConfig(typeConfig, config) {
        if (config.position) {
            this.x = config.position.x;
            this.y = config.position.y;
            this.z = config.position.z;
        }
        if (typeConfig.target) {
            this.target = new Proxy3d(this.light.target.position, this.parent.reverseY.bind(this.parent), () => this.light.target.updateMatrixWorld());
            if (config.target) {
                this.target.x = config.target.x;
                this.target.y = config.target.y;
                this.target.z = config.target.z;
            }
        }
        if (config && config.floor !== undefined && config.distance !== undefined) {
            let material = this.parent.parent.createMaterial(config.floor);
            let floor = new THREE.Mesh(
                new THREE.CircleGeometry(config.distance, 32),
                material
            );
            floor.receiveShadow = true;
            floor.position.set( 0, 0, 0 );
            this.floor = floor;
        } else if (this.floor) {
            this.parent.scene.remove(this.floor);
            delete this.floor;
        }
        this.color = config.color;
        this.intensity = config.intensity;
        this.distance = config.distance;
        this.angle = config.angle;
        if (config.attachTo) {
            let [anotherSprite, updateFn] = Array.isArray(config.attachTo) ? config.attachTo : [config.attachTo];
            this.attachTo(anotherSprite, updateFn);
        }
    }
    
    //todo: move helper creation here, inside updateDebug
    
    get color() { return this.light.color.getHex();}
    set color(val) { this.light.color.setHex(val);}
    get intensity() { return this.light.intensity;}
    set intensity(val) { this.light.intensity = val;}
    get distance() { return this.light.distance;}
    set distance(val) { this.light.distance = val;}
    get angle() { return this.light.angle;}
    set angle(val) { this.light.angle = val;}

    get renderOneByOne() { return false; }

    removeFrom(scene) {
        this.parent.removeLight(this.light, this.config);
        if (this.floor) {
            scene.remove(this.floor);
        }
    }

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