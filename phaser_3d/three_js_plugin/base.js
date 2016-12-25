
export class Proxy3d {
    constructor(target, postSetFn = () => {}) {
        this.target = target;
        this.postSetFn = postSetFn;
    }

    get x() { return this.target.x;}
    set x(val) { this.target.x = val; this.postSetFn();}

    get y() { return this.target.y;}
    set y(val) { this.target.y = val; this.postSetFn();}

    get z() { return this.target.z;}
    set z(val) { this.target.z = val; this.postSetFn();}
}

export class ThreeLinkedObject {
    constructor(scene, sprite, mainMesh) {
        this.parent = scene;
        this.sprite = sprite;
        this.mainMesh = mainMesh;
        this._rotation = new Proxy3d(mainMesh.rotation, () => this.sprite.rotation = this._rotation.y);
        this.update();
    }

    get x() { return this.sprite.x; }
    set x(val) { this.sprite.x = val; this.mainMesh.position.x = val;}

    get y() { return this.sprite.y; }
    set y(val) { this.sprite.y = val; this.mainMesh.position.y = this.parent.reverseY(val); }

    get z() { return this.mainMesh.position.z; }
    set z(val) { this.mainMesh.position.z = val;}

    get rotation() { return this._rotation; }

    applyRendering(_rendering) {}
    applyShadows(_shadows) {}

    update() {
        this.updateCoords();
    }

    updateCoords() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.rotation.y = this.sprite.rotation;
    }
}