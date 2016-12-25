//todo: apply sprite's rotation (use custom rotation)
//todo: place for custom code (both init and render)
//todo: share scene between groups, maybe make them independent. it is useful to group sprites in ... groups, even they rendered on same scene
//todo: refactor shadow casting a bit
//todo: offset for rendering (inner position)
//todo: convert layer. layer is a single "sprite", separate tiles cannot be hidden.
//todo: 1-line init (after all loads):
//      game.plugins.add(ThreePlugin) - in load
//      game.three.createScene(group1, group2, group3, {shadows: true, render: false}) <-- creates scene, creates group with scene-sprite, puts group before group1, renders all group sprites to scene. returns scene with all current group3d params
//plugin demo - ships on water. start - 2d. then go to 3d.
//my demo - use in demo5, convert tiles to sprites
//todo: patch loadFile in code

/*

 sprite.p3d.rotation.x = PI/2;

 sprite.p3d.z = 100;
 game.add.tween(sprite.p3d.rotation, {x: 0}).onComplete....

 game.load.obj3d("dalek").useInstead("tiles", 4)

 sprite.p3d.update = function(scene, camera, mesh, container) {
 }

 var group = game.p3d.create3dGroup();
 //group with overriden add


 group.shadows = true;   //adds "floor" with shadow material, sets shadowCast for all meshes inside
 group.shadows = "only"; //additionally does not
 group.x/y ;// moves inner sprite
 game.p3d.createDirectionalLight()
 game.p3d.createPointLight()
 game.p3d.createAmbientLight()
 -> special sprites (which could be attached to another sprites)



 */

function Bridge3d(game) {
    this.game = game;
    this.objLoader = new THREE.OBJLoader();
    this.mtlLoader = new THREE.MTLLoader();
    this._assetsPath = '';
    this._objects = {};
    this._replacement = {};
    this._shadowMaterial = new THREE.ShadowMaterial();
}

function Group3d(game, copier) {
    Phaser.Group.call(this, game);
    this.p3d = game.p3d;
    this.game = game;
    this._shadows = false;
    this._render = true;
    this._copier = copier;
    this._init();
}

Group3d.prototype = new Phaser.Group({world:false});

Group3d.prototype.add = function(child, obj3dName) {
    Phaser.Group.prototype.add.call(this, child);
    if (child._3d) {
        this._3d.scene.add(child._3d.container || child._3d.light);
    } else {
        this.p3d.initSprite3d(child, typeof obj3dName === "string" ? obj3dName : undefined);
    }
    if (child._3d.light) {
        if (!(child._3d.light instanceof THREE.AmbientLight)) {
            child._3d.light.castShadow = !!this._shadows;
         //   console.log(child._3d);
            //this._3d.scene.add(new THREE.CameraHelper( child._3d.light.shadow.camera ));
        }
        if (child._3d.light.target) {
            this._3d.scene.add(child._3d.light.target);
        }
        if (child._3d.light.helper) this._3d.scene.add(child._3d.light.helper);

    } else {
        this.p3d.castShadows(child._3d.mesh, this._shadows);
    }
    child.renderable = this._render;
    return child;
};

Group3d.prototype._reinitializeShadows = function() {
    if (this._shadows) {
        this._3d.renderer.shadowMap.enabled = true;

        if (!this._floor) {
            //create floor
            this._floor = new THREE.Mesh(
                new THREE.PlaneGeometry( this.game.world.width, this.game.world.height, 1, 1 ),
                this.p3d._shadowMaterial
                //new THREE.MeshPhongMaterial({color: 0xcccccc})
            );
            this._floor.receiveShadow = true;
            this._floor.position.set( this.game.world.width/2, this.game.world.height/2, 0 );
            this._3d.scene.add(this._floor);
        }
        //iterate all meshes, update material
        this.forEach(function(sprite) {
            if (sprite._3d && sprite._3d.light) {
                sprite._3d.light.castShadow = true;
            }
            if (sprite._3d && sprite._3d.mesh) {
                this.p3d.castShadows(sprite._3d.mesh, this._shadows);
            }
        }.bind(this));
    } else {
        this._3d.renderer.shadowMap.enabled = false;
        if (this._floor) {
            this._3d.scene.remove(this._floor);
            delete this._floor;
            //destroy floor. todo: how to remove obj from scene in three.js?
        }
        //iterate all meshes, update material
        this.forEach(function(sprite) {
            if (sprite._3d && sprite._3d.light) {
                sprite._3d.light.castShadow = false;
            }
            if (sprite._3d && sprite._3d.mesh) {
                this.p3d.castShadows(sprite._3d.mesh, this._shadows);
            }
        });
    }
};

Group3d.prototype._init = function() {
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera( 0, this.game.camera.width, this.game.camera.height, 0, 1, 1000 );
    camera.position.z = 1000;
    camera.position.x = 0;
    camera.position.y = 0;//this.game.world.height;

    var renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor( 0x000000, 0 );
    renderer.setSize( this.game.camera.width, this.game.camera.height);

    var texture, pseudoSprite, targetCanvas, tempScene;
    if (this._copier) {
        targetCanvas = document.createElement("canvas");
        targetCanvas.setAttribute("width", this.game.camera.width);
        targetCanvas.setAttribute("height", this.game.camera.height);
        texture = PIXI.Texture.fromCanvas(targetCanvas);
        targetCanvas.context = targetCanvas.getContext("2d");

    } else {
        texture = PIXI.Texture.fromCanvas(renderer.domElement);
    }
    pseudoSprite = game.add.sprite(0, 0, texture);
    pseudoSprite.alive = false;    //so it is not iterated as alive. Better to make it not iterable at all
    pseudoSprite.fixedToCamera = true;
    pseudoSprite.update = function() {
        delete pseudoSprite.body;
        pseudoSprite.renderable = true;
        camera.left = this.game.camera.x;
        camera.top = this.game.world.height - (this.game.camera.y);// + this.game.camera.height;
        //camera.top = this.game.camera.height - this.game.camera.y;
        camera.right = this.game.camera.x + this.game.camera.width;
        camera.bottom = this.game.world.height - this.game.camera.y - this.game.camera.height;
        //camera.bottom = -this.game.camera.y;
        //console.log("ar", (camera.top-camera.bottom)/(camera.right-camera.left));
        this.forEach(function(sprite) {
            if (sprite._3d) {
                sprite._3d.x = sprite.x;
                sprite._3d.y = sprite.y;

                //if (sprite._3d.mesh) console.log(sprite._3d.container.position);
            }
        });
        camera.updateProjectionMatrix();
        if (this._copier) {
            tempScene = new THREE.Scene();
            targetCanvas.context.clearRect(0, 0, this.game.camera.width, this.game.camera.height);
            this.forEach(function(sprite) {
                if (sprite._3d && sprite._3d.light) tempScene.add(sprite._3d.light);
            });
            this.forEach(function(sprite) {
                if (sprite._3d && sprite._3d.container) {
                    tempScene.add(sprite._3d.container);
                    renderer.render(tempScene, camera);
                    this._copier(sprite, renderer.domElement, targetCanvas);
                    tempScene.remove(sprite._3d.container);
                }
            }.bind(this));
        } else {
            renderer.render(scene, camera);
        }

        texture.baseTexture.dirty();
    }.bind(this);

    Phaser.Group.prototype.add.call(this, pseudoSprite);
    this.sendToBack(pseudoSprite);

    //document.body.appendChild(renderer.domElement);

    this._3d = {
        sprite: pseudoSprite,
        scene: scene,
        camera: camera,
        renderer: renderer
    };
};

Object.defineProperty(Group3d.prototype, "shadows", {
    get: function() {
        return this._shadows;
    },
    set: function(val) {
        this._shadows = val;
        this._reinitializeShadows();
    }
});

Object.defineProperty(Group3d.prototype, "render", {
    get: function() {
        return this._render;
    },

    set: function(val) {
        this._render = val;
        this.forEach(function(sprite) { sprite.renderable = val;})
    }
})


function proxify(obj, innerObj, prop1) {
    var postSetFn = function(){};
    var len = arguments.length;
    if (typeof arguments[len-1] === "function") {
        postSetFn = arguments[len-1];
        len--;
    }
    for (var i = 2; i < len; i++) {
        (function(prop) {
            Object.defineProperty(obj, prop, {
                get: function () {
                    return innerObj[prop];
                },
                set: function (val) {
                    innerObj[prop] = val;
                    postSetFn();
                }
            });
        })(arguments[i]);
    }
}

Bridge3d.prototype = {
    loadObj: function(name, props, cb) {
        this.mtlLoader.load(name + '.mtl', function(materials) {
            materials.preload();
            this.objLoader.setMaterials(materials);
            this.objLoader.load(name + '.obj', function(obj) {
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
            }.bind(this));
        }.bind(this));
    },

    createAmbientLight: function(color, intensity) {
        return this.createLightSprite(new THREE.AmbientLight(color, intensity));
    },

    createSpotLight: function(color, intensity, distance, angle, penumbra, position, target) {
        var dl = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
        if (position) {
            dl.position.x = position.x;
            dl.position.y = this.game.world.height - position.y;
            dl.position.z = position.z || 100;
        }
        if (target) {
            dl.target.position.x = target.x;
            dl.target.position.y = this.game.world.height - target.y;
            dl.target.position.z = target.z || 0;
            dl.target.updateMatrixWorld();
        }
        dl.helper = new THREE.SpotLightHelper(dl);
        return this.createLightSprite(dl);
    },

    createDirectionalLight: function(color, intensity, position, target) {
        var dl = new THREE.DirectionalLight(color, intensity);
        if (position) {
            dl.position.x = position.x;
            dl.position.y = this.game.world.height - position.y;
            dl.position.z = position.z || 100;
        }
        if (target) {
            dl.target.position.x = target.x;
            dl.target.position.y = this.game.world.height - target.y;
            dl.target.position.z = target.z || 0;
            dl.target.updateMatrixWorld();
        }
        dl.helper = new THREE.DirectionalLightHelper(dl);
        return this.createLightSprite(dl);
    },

    createPointLight: function(color, intensity, distance, decay, position) {
        var pl = new THREE.PointLight(color, intensity, distance, decay);
        if (position) {
            pl.position.x = position.x;
            pl.position.y = this.game.world.height - position.y;
            pl.position.z = 100;
        }
        //pl.helper = new THREE.PointLightHelper(pl);
        return this.createLightSprite(pl);
    },

    createLightSprite: function(light, position) {
        var sprite = game.make.sprite(position ? position.x : light.position.x, position ? position.y : this.game.world.height - light.position.y);
        sprite.alive = false;
        sprite._3d = {
            light: light,
            x: 0,
            y: 0,
            z: 0,
            rotation: {
                x:0,y:0,z:0
            },
            target: {
                x:0,y:0,z:0
            },
            color: 0xffffff,
            intensity: 1,
            angle: 0,
            penumbra: 0
        };
        this._defineProperties(sprite, light);
        proxify(sprite._3d, light, "color", "intensity", "distance", "decay", "angle", "penumbra");
        if (light.target) {
            proxify(sprite._3d.target, light.target.position, "x", "y", "z", function() { light.target.updateMatrixWorld();});
        }
        return sprite;
    },

    initSprite3d: function(sprite, obj3dName) {
        var container = new THREE.Group();
        container.position.set(sprite.x, this.game.world.height - sprite.y, 0);
        var obj;
        if (!obj3dName) {
            var searchKeys = [sprite.key + "_" + sprite.frameName, sprite.key + "_" + sprite.frame, sprite.key];
            obj = searchKeys.map(function(sk) { return this._replacement[sk]}.bind(this)).filter(function(a) { return a;})[0];
            if (!obj) throw new Error("You did not specify 3d model name, also I cannot find replacement 3d model for key/frame pair");
        } else {
            obj = this._objects[obj3dName];
            if (!obj) throw new Error("Cannot find 3d model with name '" + obj3dName + "'. Probably it is not loaded");
        }
        var mesh = obj.obj.clone();
        mesh.position.set(0, 0, 0);
        if (obj.rotate) {
            mesh.rotateX(obj.rotate.x || 0);
            mesh.rotateY(obj.rotate.y || 0);
            mesh.rotateZ(obj.rotate.z || 0);
        }
        container.add(mesh);
        sprite.parent._3d.scene.add(container);
        sprite._3d = {
            mesh: mesh,
            container: container,
            x: 0,
            y: 0,
            z: 10,
            rotation: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        this._defineProperties(sprite, container);
        sprite._animations = sprite.animations;
        sprite.animations = {
            add: function() {},
            play: function() {},
            stop: function() {},
            currentAnim: {
                paused: false
            },
            destroy: function() {},
            update: function() {

            }
            //todo: temp
        };

        sprite.events.onDestroy.addOnce(function() {
            sprite.parent._3d.scene.remove(container);
        });
    },

    castShadows: function(name, mode) {
        var no = name;
        if (typeof name === "string") {
            no = this._objects[name];
        }
        no.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                if (mode === "only") {
                    child._oldMaterial = child.material;
                    child.material = this._shadowMaterial;
                } else if (child.material == this._shadowMaterial && child._oldMaterial) {
                    child.material = child._oldMaterial;
                    delete child._oldMaterial;
                }
                //console.log(child, mode);
                child.receiveShadow = !!mode;
                child.castShadow = !!mode;
            }
        }.bind(this) );
    },

    createGroup3d: function(copier) {
        return new Group3d(this.game, copier);
    },

    addGroup3d: function(copier) {
        return this.game.world.add(this.createGroup3d(copier));
    },


    _defineProperties: function(sprite, mesh) {
        Object.defineProperty(sprite._3d, 'x', {
            get: function() { return sprite.x},
            set: function(val) {
                sprite.x = val;
                mesh.position.x = sprite.left + sprite.width/2;
            }
        });
        Object.defineProperty(sprite._3d, 'y', {
            get: function() { return sprite.y},
            set: function(val) {
                sprite.y = val;
                mesh.position.y = sprite.game.world.height - sprite.top - sprite.height/2;
            }
        });
        proxify(sprite._3d, mesh.position, "z");
        Object.defineProperty(sprite, 'p3d', {
            get: function() { return sprite._3d;}
        });
        proxify(sprite._3d.rotation, mesh.rotation, "x", "y", "z");
    }


};

Object.defineProperty(Bridge3d.prototype, "assetsPath", {
    get: function() { return this._assetsPath;},
    set: function(val) {
        if (val[val.length-1] != "/") {
            val += "/";
        }
        this._assetsPath = val;
        this.objLoader.setPath(val);
        this.mtlLoader.setPath(val);
    }
});

Phaser.Game.prototype.init3d = function(props) {
    this._bridge3d = new Bridge3d(this);
    if (props) {
        if (props.assets !== undefined) {
            this._bridge3d.assetsPath = props.assets;
        }
    }
};

Object.defineProperty(Phaser.Game.prototype, 'p3d', {
    get: function() { return this._bridge3d;}
});

//1. extend loader
Phaser.Loader.prototype.obj3d = function(name, props) {
    var game = this.game;
    if (props === undefined) props = {};
    props.load = function(onComplete) {
        var file = this;
        game._bridge3d.loadObj(name, props, function(obj) {
            props.obj = obj;
            onComplete(file);
        });
    };
    this.addToFileList("custom", name, name, props)
};


//2. add 3d info to sprite

//3. render group with three.js