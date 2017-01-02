import Consts from './consts';
import ThreeSprite from './sprite';
import ThreeTile from './tile';
import ThreeLight from './light';
import ThreeSceneRenderer from './scene_renderer';
import ObjectCache from './obj_cache';

export default class ThreeScene {
    constructor(plugin, config) {
        this.parent = plugin;
        this.game = plugin.game;
        this._key = "three";
        this._groups = [];
        this._debug = false;
        this._render = Consts.RenderModels;
        this._shadows = false;
        this._groups = [];
        this._sprites = [];
        this._sceneRenderer = null;
        this._copier = null;
        this._ignore = () => false;
        this._debug = false;
        this._caches = {};
        this._scene = new THREE.Scene();

        if (config) {
            if (config.key !== undefined) this._key = config.key;
            if (config.debug !== undefined) this._debug = config.debug;
            if (config.render !== undefined) this._render = config.render;
            if (config.shadows !== undefined) this._shadows = config.shadows;
            if (config.floor !== undefined) {
                this.addShadowFloor(config.floor === true ? undefined : config.floor);
            }
            if (config.oneByOne) this.renderOneByOne(config.oneByOne);
            if (config.lights) config.lights.forEach((c) => this.addLight(c.type || Consts.AmbientLight, c));
            if (config.groups) config.groups.forEach((g) => this.addGroup(g));
            if (Array.isArray(config.ignore)) {
                this._ignore = (tile_or_sprite) => config.ignore.indexOf(tile_or_sprite.index) != -1
            } else if (config.ignore) {
                this._ignore = config.ignore;
            }
            if (config.caches) {
                for (let key in config.caches) {
                    this.prepareCache(key, config.caches[key]);
                }
            }
            if (config.debugCanvas) this._debugCanvas = true;
            this.update();
        }

    }

    renderOneByOne(copier) {
        this._copier = copier;
    }

    addShadowFloor(material_or_color) {
        let material = this.parent.createMaterial(material_or_color);
        let floor = new THREE.Mesh(
            new THREE.PlaneGeometry( this.game.world.width, this.game.world.height, 1, 1 ),
            material
        );
        floor.receiveShadow = true;
        floor.position.set( this.game.world.width/2, this.game.world.height/2, 0 );
        this._scene.add(floor);
    }

    addGroup(group) {
        let firstGroup = this._groups.length == 0;
        if (firstGroup) {
            this._sceneRenderer = new ThreeSceneRenderer(this);
            group.parent.addAt(this._sceneRenderer.sprite, group.parent.children.indexOf(group));
        }
        let oldUpdate = group.update;
        group.update = () => {
            this._updateGroup(group)
            oldUpdate.call(group);
        };
        this._groups.push(group);
    }

    update() {
        this._groups.forEach((group) => this._updateGroup(group))
    }
    
    _updateGroup(group) {
        if (group instanceof Phaser.TilemapLayer) {
            this.updateTilemapLayer(group)
        } else {
            group.forEach((sprite) => this.addSprite(sprite));
        }   
    }

    updateTilemapLayer(layer) {
        for (let row of layer.layer.data) {
            for (let cell of row) {
                if (cell.index !== -1 && !cell[this._key]) {
                    this.addTile(cell, layer);
                }
            }
        }
    }

    addTile(cell, layer) {
        if (cell[this._key] || this._ignore(cell)) return cell;
        var container = new THREE.Group();
        //todo: tile objects are not centered. need to make it more clear, or get common solution for tiles and sprites
        container.position.set(cell.worldX, this.reverseY(cell.worldY + cell.height), 0);
        var mesh = this.parent.createObjectFromTile(cell, layer);
        container.add(mesh);
        cell[this._key] = new ThreeTile(this, cell, mesh, container, layer);
        this._pushSprite(cell, layer.events);
        return cell;
    }

    removeLight(light, config) {
        if (config.cache) {
            this._caches[config.cache].free(light);
        } else {
            this._scene.remove(light);
        }
    }

    _pushSprite(sprite, events = sprite.events) {
        this._sprites.push(sprite);
        sprite[this._key].insertTo(this._scene);
        events.onDestroy.addOnce(() => {
            sprite[this._key].removeFrom(this._scene);
            let si = this._sprites.indexOf(sprite);
            if (si !== -1) {
                this._sprites.splice(si, 1);
            }
        });
        this.applyConfig(sprite);
    }

    addExisting(sprite, sourceKey) {
        if (sprite[sourceKey] && !sprite[this._key]) {
            sprite[this._key] = sprite[sourceKey].cloneInto(this);
            this._pushSprite(sprite);
        }
        return sprite;
    }

    
    prepareCache(name, constructorProvider, count = 0) {
        if (this._caches[name]) throw new Error(`Cache with name "${name}" already defined`);
        let constructorFn;
        if (typeof constructorProvider === "function") {
            constructorFn = () => new constructorProvider();
        } else if (typeof constructorProvider.factory === "function") {
            constructorFn = () => constructorProvider.factory({});
        } else {
            throw new Error("Please specify a way to construct object in cache");
        }
        this._caches[name] = new ObjectCache(this, constructorFn, count);
        return this._caches[name]
    }

    _createCachedLight(type, config) {
        if (!config.cache) {
            return type.factory(config);
        } else {
            let cache = this._caches[config.cache];
            if (!cache) {
                cache = this.prepareCache(config.cache, type);
            }
            return cache.allocate();
        }

    }

    addLight(type, config) {
        let sprite = this.game.make.sprite();
        
        let light = this._createCachedLight(type, config);
        sprite[this._key] = new ThreeLight(this, sprite, light, type, config);
        this._pushSprite(sprite);
        if ((config.debug || this._debug) && type.helperClass) {
            let helper = new type.helperClass(light);
            let sHelper = new THREE.CameraHelper(light.shadow.camera);
            this._scene.add(helper, sHelper);
            sprite.events.onDestroy.addOnce(() => this._scene.remove(helper, sHelper));
        }
        return sprite;
    }

    addSprite(sprite, obj3dName) {
        if (sprite[this._key] || this._ignore(sprite)) return sprite;
        //add threesprite
        var container = new THREE.Group();
        container.position.set(sprite.x, this.reverseY(sprite.y), 0);
        var mesh = this.parent.createObjectFromSprite(sprite, obj3dName);
        container.add(mesh);
        sprite[this._key] = new ThreeSprite(this, sprite, mesh, container);
        this._pushSprite(sprite);
        return sprite;
    }

    reverseY(y) {
        return this.parent.game.world.height - y;
    }

    applyConfig(sp) {
        if (!sp)  {
            this._sprites.forEach(this.applyConfig.bind(this));
            return;
        }
        sp[this._key].applyRendering(this._render);
        sp[this._key].applyShadows(this._shadows);
        sp[this._key].applyDebug(this._debug);
        //iterate over all sprites and groups, apply shadows/renderable
    }

    get render() { return this._render;}
    set render(val) { this._render = val; this.applyConfig(); }

    get shadows() { return this._shadows;}
    set shadows(val) {
        this._shadows = val;
        this.applyConfig();
    }

    forEach(cb) {
        this._sprites.forEach(cb);
        //assuming that any sprite in group already in _sprites
    }

    get scene() { return this._scene;}
    get renderer() { return this._sceneRenderer.renderer;}
    get camera() { return this._sceneRenderer.camera;}

    get sprite() { return this._sceneRenderer.sprite;}

}