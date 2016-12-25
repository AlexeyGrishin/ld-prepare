export default class ThreeSceneRenderer {
    constructor(scene) {
        this.parent = scene;
        this.scene = scene.scene;
        this.game = scene.parent.game;
        this.camera = new THREE.OrthographicCamera( 0, this.game.camera.width, this.game.camera.height, 0, 1, 1000 );
        this.camera.position.z = 1000;
        this.camera.position.x = 0;
        this.camera.position.y = 0;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
        this.renderer.setClearColor( 0x000000, 0 );
        this.renderer.setSize( this.game.camera.width, this.game.camera.height);

        if (scene._copier) {
            this.copier = scene._copier;
            this.targetCanvas = Phaser.Canvas.create(undefined, this.game.camera.width, this.game.camera.height, 0, true);
            this.targetCanvas.context = this.targetCanvas.getContext('2d');
            this.texture = PIXI.Texture.fromCanvas(this.targetCanvas);
            this.render = () => this.renderOneByOne();
        } else {
            this.texture = PIXI.Texture.fromCanvas(this.renderer.domElement);
            this.render = () => this.renderAll();
        }
        this.sprite = this.game.add.sprite(0, 0, this.texture);
        this.sprite.fixedToCamera = true;
        this.sprite.alive = true;
        this.sprite.update = () => this.update();

        if (scene._debugCanvas) {
            document.body.appendChild(this.renderer.domElement);
        }

    }

    renderAll() {
        this.renderer.render(this.scene, this.camera);
    }

    renderOneByOne() {
        let tempScene = new THREE.Scene();
        this.targetCanvas.context.clearRect(0, 0, this.game.camera.width, this.game.camera.height);
        this.parent.forEach((sprite) => {
            if (!sprite[this.parent._key].renderOneByOne) tempScene.add(sprite[this.parent._key].mainMesh);
        });
        this.parent.forEach((sprite) => {
            if (sprite[this.parent._key].renderOneByOne) {
                tempScene.add(sprite[this.parent._key].mainMesh);
                this.renderer.render(tempScene, this.camera);
                this.copier(sprite, this.renderer.domElement, this.targetCanvas.context);
                tempScene.remove(sprite[this.parent._key].mainMesh);
            }
        });
    }

    update() {
        let camera = this.camera;
        delete this.sprite.body;
        this.sprite.renderable = true;
        this.renderer.shadowMap.enabled = this.parent.shadows;
        camera.left = this.game.camera.x;
        camera.top = this.game.world.height - (this.game.camera.y);// + this.game.camera.height;
        //camera.top = this.game.camera.height - this.game.camera.y;
        camera.right = this.game.camera.x + this.game.camera.width;
        camera.bottom = this.game.world.height - this.game.camera.y - this.game.camera.height;
        //camera.bottom = -this.game.camera.y;
        //console.log("ar", (camera.top-camera.bottom)/(camera.right-camera.left));
        this.parent.forEach((sprite) => {
            if (sprite[this._key] && sprite[this._key].update) {
                sprite[this._key].update();
            }
        });
        camera.updateProjectionMatrix();
        this.render();
        this.texture.baseTexture.dirty();
    }

}
