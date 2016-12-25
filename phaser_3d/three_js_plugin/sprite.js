import {ThreeLinkedObject} from './base';
import Consts from './consts';

export default class ThreeSprite extends ThreeLinkedObject {
    constructor(scene, sprite, mesh, container) {
        super(scene, sprite, container);
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

    applyRenderingForSprite(rendering) {
        this.sprite.renderable = rendering === Consts.RenderSprites;
    }

    applyRenderingForMesh(rendering) {
        this.mesh.traverse(function(no) {
            if (no instanceof THREE.Mesh) {
                if (rendering === Consts.RenderModels) {
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
}