export default class ThreeLoader {
    constructor() {
        if (!THREE) throw new Error("Please load three.js first");
        if (!THREE.OBJLoader) throw new Error("Cannot find OBJLoader class, please download it from three.js examples");
        if (!THREE.MTLLoader) throw new Error("Cannot find MTLLoader class, please download it from three.js examples");
        
        this.objLoader = new THREE.OBJLoader();
        this.mtlLoader = new THREE.MTLLoader();
        this._assetsPath = '';
        this._objects = {};
        this._replacement = {};
    }

    get assets() { return this._assetsPath; }
    set assets(val) {
        if (val[val.length-1] !== "/") val += "/";
        this._assetsPath = val;
        this.objLoader.setPath(val);
        this.mtlLoader.setPath(val);
    }


    loadObj(name, props, cb) {
        this.mtlLoader.load(name + '.mtl', (materials) => {
            materials.preload();
            this.objLoader.setMaterials(materials);
            this.objLoader.load(name + '.obj', (obj) => {
                props.obj = obj;
                props.name = name;
                this._objects[name] = props;
                if (props.insteadOf) {
                    var replacementKey = props.insteadOf.key || props.insteadOf[0];
                    if (props.insteadOf.frame !== undefined || props.insteadOf[1] !== undefined) {
                        replacementKey += "_" + (props.insteadOf.frame  === undefined ? props.insteadOf[1] : props.insteadOf.frame);
                        this._replacement[replacementKey] = props;
                    }
                }
                cb(obj);
            });
        });
    }
}
