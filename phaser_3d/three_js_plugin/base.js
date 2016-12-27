
export class Proxy3d {
    constructor(target, reverseY = (y) => y, postSetFn = () => {}) {
        this.target = target;
        this.postSetFn = postSetFn;
        this.reverseY = reverseY;
    }

    get x() { return this.target.x;}
    set x(val) { this.target.x = val; this.postSetFn();}

    get y() { return this.reverseY(this.target.y);}
    set y(val) { this.target.y = this.reverseY(val); this.postSetFn();}

    get z() { return this.target.z;}
    set z(val) { this.target.z = val; this.postSetFn();}
}

export class ThreeLinkedObject {
    constructor(scene, sprite, mainMesh, rotationAxis = "y") {
        this.parent = scene;
        this.sprite = sprite;
        this.mainMesh = mainMesh;
        this.rotationAxis = rotationAxis;
        this.rotationDirection = 1;
        if (this.rotationAxis[0] === "-") {
            this.rotationAxis = this.rotationAxis[1];
            this.rotationDirection = -1;
        }
        this._rotation = new Proxy3d(mainMesh.rotation, (y) => y, () => this.sprite.rotation = this.rotationDirection * this._rotation[this.rotationAxis]);
        this._scale = new Proxy3d(mainMesh.scale);
        this.update();
    }

    get x() { return this.sprite.x; }
    set x(val) { this.sprite.x = val; this.mainMesh.position.x = val;}

    get y() { return this.sprite.y; }
    set y(val) { this.sprite.y = val; this.mainMesh.position.y = this.parent.reverseY(val); }

    get z() { return this.mainMesh.position.z; }
    set z(val) { this.mainMesh.position.z = val;}

    get rotation() { return this._rotation; }
    get scale() { return this._scale; }

    applyRendering(_rendering) {}
    applyShadows(_shadows) {}
    applyDebug(_debug) {}

    update() {
        this.updateCoords();
    }

    updateCoords() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.rotation[this.rotationAxis] = this.rotationDirection * this.sprite.rotation;
        this.scale.x = this.sprite.scale.x;
        this.scale.y = this.sprite.scale.y;
    }
    
    insertTo(scene) {
        scene.add(this.mainMesh);
    }
    
    removeFrom(scene) {
        scene.remove(this.mainMesh);
    }

    attachTo(anotherSprite, updateFn = () => {}) {
        let oldUpdate = anotherSprite.update;
        anotherSprite.update = () => {
            oldUpdate.call(anotherSprite);
            this.x = anotherSprite.x;
            this.y = anotherSprite.y;
            updateFn(this, anotherSprite);
        };
        anotherSprite.events.onDestroy.addOnce(() => this.sprite.destroy());
    }
}