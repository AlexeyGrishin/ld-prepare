
export default class ObjectCache {
    constructor(scene, factoryFn, count = 0) {
        this.parent = scene;
        this.game = scene.game;
        this.factoryFn = factoryFn;
        this._autoAdd = true;
        this.count = count || 1;
        this._freeObjects = [];
        this._expand(count);
    }
    
    _expand(exactCount = this.count) {
        for (let i = 0; i < exactCount; i++) {
            let obj = this.factoryFn();
            if (this._autoAdd) this.parent.scene.add(obj);
            this._freeObjects.push(obj);
        }
    }

    allocate() {
        if (this._freeObjects.length == 0) this._expand();
        return this._freeObjects.pop();
    }
    
    free(obj) {
        this._freeObjects.push(obj);
        obj.position.z = -100; //todo: maybe better set alpha & remove shadows
    }
    
    
}