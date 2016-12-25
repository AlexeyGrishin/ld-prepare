import ThreeSprite from './sprite';
import Consts from './consts';

export default class ThreeTile extends ThreeSprite {
    constructor(scene, sprite, mesh, container, layer) {
        super(scene, sprite, mesh, container, true);
        this.layer = layer;
    }

    get x() { return this.mainMesh.position.x; }
    set x(val) { this.mainMesh.position.x = val; }

    get y() { return this.parent.reverseY(this.mainMesh.position.y); }
    set y(val) {  this.mainMesh.position.y = this.parent.reverseY(val); }

    get z() { return this.mainMesh.position.z; }
    set z(val) {  this.mainMesh.position.z = val; }


    applyRenderingForSprite(rendering) {
        this.layer.renderable = rendering === Consts.RenderSprites;
    }

    updateCoords() {}

    cloneInto(newParent) {
        return new ThreeTile(newParent, this.sprite, this.mesh.clone(), this.container.clone(), this.layer);
    }
}