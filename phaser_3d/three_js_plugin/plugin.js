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

    autoCreate(...params) {
        if (this._autoCreator) {
            let res = this._autoCreator(...params);
            return Object.assign({}, res.config, {obj: res.geometry});
        }
        return null;
    }

    createObjectFromTile(tile, layer) {
        let index = tile.index;
        let tileset = layer.resolveTileset(index);

        let searchKey = tileset.name + "_" + (index - tileset.firstgid);
        let obj = this.loader._replacement[searchKey];
        if (!obj) {
            obj = this.autoCreate(tile, layer);
        }
        if (!obj) {
            throw new Error("Cannot find 3d obj for tile " + tileset.name + "/" + index);
        }
        return this.createObject(obj, {nocenter: true});
    }

    createObject(obj, opts = {}) {
        let mesh = obj.obj.clone();
        //todo: support more complex model than one mesh/geometry
        mesh.children[0].geometry = mesh.children[0].geometry.clone();
        mesh.threePluginProperties = obj;
        if (obj.rotate) {
            let order = obj.order || "xyz";
            order.split("").forEach((axis) => {
                mesh.children[0].geometry.applyMatrix(
                    new THREE.Matrix4()["makeRotation" + axis.toUpperCase()](obj.rotate[axis] || 0)
                );
            });
        }
        if (obj.translate) {
            mesh.children[0].geometry.applyMatrix(
                new THREE.Matrix4().makeTranslation(obj.translate.x || 0, -obj.translate.y || 0, obj.translate.z || 0)
            );

        }
        if (!opts.nocenter) {
            let {z} = mesh.children[0].geometry.center();
            mesh.position.set(0, 0, -z); // so bottom of figure shall have z = 0
        }
        return mesh;
    }

    autoConvertSpritesUsing(autoCreator) {
        this._autoCreator = autoCreator;
    }

    createMaterial(material, opacity = 1) {
        if (material === undefined || material === true) {
            material = Consts.ShadowMaterial;
        } else if (typeof material === "number") {
            material = new THREE.MeshPhongMaterial({color: material});
            material.opacity = opacity;
        } else if (Array.isArray(material)) {
            return this.createMaterial(material[0], material[1])
        }
        return material;
    }

    createObjectFromSprite(sprite, obj3dName) {
        let obj;
        if (!obj3dName) {
            let searchKeys = [sprite.key + "_" + sprite.frameName, sprite.key + "_" + sprite.frame, sprite.key];
            obj = searchKeys.map((sk) => this.loader._replacement[sk]).filter((a) => a)[0];
            if (!obj) {
                obj = this.autoCreate(sprite);
            }
            if (!obj) {
                throw new Error("You did not specify 3d model name, also I cannot find replacement 3d model for key/frame pair");
            }
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
ThreePlugin.RenderBoth = Consts.RenderBoth;

ThreePlugin.ShadowMaterial = Consts.ShadowMaterial;

if (window !== undefined) {
    window.ThreePlugin = ThreePlugin;
}
