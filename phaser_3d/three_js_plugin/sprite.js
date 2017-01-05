import {ThreeLinkedObject} from './base';
import Consts from './consts';

export default class ThreeSprite extends ThreeLinkedObject {
    constructor(scene, sprite, mesh, container) {
        super(scene, sprite, container, mesh.threePluginProperties ? mesh.threePluginProperties.spriteRotation : undefined);
        this.mesh = mesh;
        this.container = container;
    }

    get renderOneByOne() { return true; }

    applyShadows(shadows) {
        this.mesh.traverse(function(no) {
            if (no instanceof THREE.Mesh) {
                no.castShadow = shadows;
                no.receiveShadow = shadows;
            }
        });
    }

    applyDebug(debug) {
        if (debug) {
            let box1 = new THREE.BoxHelper(this.container, 0x00ff00);
            let box2 = new THREE.BoxHelper(this.mesh, 0xff0000);
            this.parent.scene.add(box1, box2);
            this.sprite.update = () => {
                box1.update(this.container);
                box2.update(this.mesh);
            }
            this.sprite.events.onDestroy.addOnce(() => this.parent.scene.remove(box1, box2));
        }
    }

    applyRenderingForSprite(rendering) {
        this.sprite.renderable = rendering === Consts.RenderSprites || rendering === Consts.RenderBoth;
    }

    applyRenderingForMesh(rendering) {
        this.mesh.traverse(function(no) {
            if (no instanceof THREE.Mesh) {
                if (rendering === Consts.RenderModels || rendering === Consts.RenderBoth) {
                    if (no.material === Consts.ShadowMaterial) no.material = no._material;
                } else {
                    no._material = no.material;
                    no.material = Consts.ShadowMaterial;
                }
            }
        });
    }

    applyRendering(rendering) {
        this.applyRenderingForSprite(rendering);
        this.applyRenderingForMesh(rendering);
    }


    cloneInto(newParent) {
        return new ThreeSprite(newParent, this.sprite, this.mesh.clone(), this.container.clone());
    }
    
    get polygons() {
        let count = 0;
        this.mesh.traverse(function(no) {
            if (no instanceof THREE.Mesh && no.geometry instanceof THREE.BufferGeometry) {
                count += no.geometry.attributes.position.count;
            }
        });
        return count;
    }
}