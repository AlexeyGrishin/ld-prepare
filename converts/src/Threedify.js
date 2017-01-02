import VoxelModel from './voxel_model';
import ColorModel from './color_model';
import VerticesModel from './vertices_model';
import ThreeExport from './formats/three_export';
import projections from './projections';

export default function Threedify(configs = {}) {

    let configCache = {};
    let geometriesCache = {};
    
    let tempCanvas = document.createElement('canvas');

    let convertor = {
        toGeometry(imageData, key_or_config) {
            //gets config
            let config = configCache[key_or_config] || key_or_config;
            if (!config.projection) throw new Error("Cannot find projection for config/key: " + JSON.stringify(key_or_config));
            //performs projection to voxel model
            let voxModel = new VoxelModel(imageData.width, imageData.width, imageData.height);
            config.projection(imageData, voxModel, config);
            //converts to vertices
            let vertModel = new VerticesModel();
            vertModel.addVoxelModel(voxModel);
            //converts to geometry
            let exp = new ThreeExport();
            let geom = exp.saveGeometry(vertModel);
            let text = exp.saveTexture(vertModel.colorModel);
            //console.log(vertModel.colorModel);
            let mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({map: text}));
            let group = new THREE.Group();
            group.add(mesh);
            geometriesCache[key_or_config] = group;

            return {geometry: group, config: config.data}
        },

        fromTileToGeometry(tile, layer) {

            let index = tile.index;
            let tileset = layer.resolveTileset(index);
            let finalKey = "phaser_sprite_" + tileset.name + "_" + (index - tileset.firstgid);
            let config = configs[tileset.name][(index - tileset.firstgid)] || configs[tileset.name]['default'];
            configCache[finalKey] = config;
            if (geometriesCache[finalKey]) return { geometry: geometriesCache[finalKey], config: config.data};

            let height = config.top !== undefined ? tile.height*2 : tile.height;

            tempCanvas.setAttribute('width', tile.width);
            tempCanvas.setAttribute('height', height);
            let ctx = tempCanvas.getContext('2d');
            ctx.clearRect(0, 0, tile.width, height);

            tileset.draw(ctx, 0, height - tile.height, config.base !== undefined ? (config.base + tileset.firstgid) : index);
            if (config.top) {
                tileset.draw(ctx, 0, 0, tileset.firstgid + config.top);
            }
            let res = this.toGeometry(ctx.getImageData(0, 0, tile.width, height), finalKey);
            
            return res;

        },

        fromSpriteToGeometry(phaserSprite, layer) {
            if (phaserSprite instanceof Phaser.Tile) return convertor.fromTileToGeometry(phaserSprite, layer);
            let key = phaserSprite.key;
            let frame = phaserSprite.frameName || phaserSprite.frame;
            let finalKey = "phaser_sprite_" + key + "_" + frame;
            let config = configs[key][frame] || configs[key]['default'];
            configCache[finalKey] = config;
            if (geometriesCache[finalKey]) return { geometry: geometriesCache[finalKey], config: config.data};

            let srcImage;
            let srcFrame = {x: 0, y: 0, width: phaserSprite.width, height: phaserSprite.height};

            //todo: finish. draw sprite over temp canvas
            if (phaserSprite.texture instanceof Phaser.RenderTexture || phaserSprite.texture instanceof PIXI.RenderTexture) {
                srcImage = phaserSprite.texture.getCanvas();
            } else {
                srcImage = phaserSprite.texture.baseTexture.source;
            }


            throw new Error("not finished yet");

        }
    };
    return convertor;
}

Threedify.Sym = projections.projectSymmetric;
Threedify.X = projections.projectFlatX;
Threedify.Y = projections.projectFlatY;