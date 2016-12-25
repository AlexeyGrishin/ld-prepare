import ThreeLoader from './loader';
import ThreeScene from './scene';
import Consts from './consts';

export default class ThreePlugin extends Phaser.Plugin {
    constructor(game) {
        super(game);
        game.three = this;
        this.game = game;
        this.loader = new ThreeLoader();
        this.patchPhaserLoader(game);
    }

    createObjectFromTile(tile, layer) {
        let index = tile.index;
        let tileset = layer.resolveTileset(index);

        let searchKey = tileset.name + "_" + (index - tileset.firstgid);
        let obj = this.loader._replacement[searchKey];
        if (!obj) {
            throw new Error("Cannot find 3d obj for tile " + tileset.name + "/" + index);
        }
        return this.createObject(obj);
    }

    createObject(obj) {
        let mesh = obj.obj.clone();
        mesh.position.set(0, 0, 0);
        if (obj.rotate) {
            mesh.rotateX(obj.rotate.x || 0);
            mesh.rotateY(obj.rotate.y || 0);
            mesh.rotateZ(obj.rotate.z || 0);
        }
        return mesh;
    }

    createMaterial(material) {
        if (material === undefined || material === true) {
            material = Consts.ShadowMaterial;
        } else if (typeof material === "number") {
            material = new THREE.MeshPhongMaterial({color: material});
        }
        return material;
    }

    createObjectFromSprite(sprite, obj3dName) {
        let obj;
        if (!obj3dName) {
            let searchKeys = [sprite.key + "_" + sprite.frameName, sprite.key + "_" + sprite.frame, sprite.key];
            obj = searchKeys.map((sk) => this.loader._replacement[sk]).filter((a) => a)[0];
            if (!obj) throw new Error("You did not specify 3d model name, also I cannot find replacement 3d model for key/frame pair");
        } else {
            obj = this.loader._objects[obj3dName];
            if (!obj) throw new Error("Cannot find 3d model with name '" + obj3dName + "'. Probably it is not loaded");
        }
        return this.createObject(obj);

    }

    patchPhaserLoader(game) {
        let oldLoadFile = game.load.loadFile;
        game.load.loadFile = function(file) {
            if (file.type === "three") {
                return file.load(this.fileComplete.bind(this))
            }
            return oldLoadFile.call(game.load, file);
        };
        let self = this;
        game.load.obj3d = function(name, props) {
            if (props === undefined) props = {};
            props.load = function(onComplete) {
                let file = this;
                self.loader.loadObj(name, props, (obj) => {
                    props.obj = obj;
                    onComplete(file);
                });
            };
            this.addToFileList("three", name, name, props)
        };
    }

    get assets() { return this.loader.assets; }
    set assets(val) { this.loader.assets = val;}


    createScene(...groups) {
        let config = {};
        if (groups.length > 0 && !(groups[groups.length-1] instanceof PIXI.DisplayObject)) {
            config = groups.pop();
        }
        let scene = new ThreeScene(this, config);
        for (let g of groups) {
            scene.addGroup(g);
        }
        scene.update();
        return scene;
    }

}

ThreePlugin.AmbientLight = Consts.AmbientLight;
ThreePlugin.DirectionalLight = Consts.DirectionalLight;
ThreePlugin.SpotLight = Consts.SpotLight;
ThreePlugin.PointLight = Consts.PointLight;
    
ThreePlugin.RenderSprites = Consts.RenderSprites;
ThreePlugin.RenderModels = Consts.RenderModels;
ThreePlugin.RenderNothing = Consts.RenderNothing;

ThreePlugin.ShadowMaterial = Consts.ShadowMaterial;

if (window !== undefined) {
    window.ThreePlugin = ThreePlugin;
}
