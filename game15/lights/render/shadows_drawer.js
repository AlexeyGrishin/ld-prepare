import LightSource from "../model/light_source";
import HypTable from "../model/hyp_table";
import DistancesMap from "../model/distances_map";
import LineShadowCaster from "../model/line_shadow_caster";

export const MAX_LIGHTS = 64;
const STEPS = 512;


class ShadowsShader extends Phaser.Filter {

    constructor() {
        super(game);

        let lightsArray = new Array(MAX_LIGHTS*4);
        lightsArray.fill(0, 0, lightsArray.length);

        this.uniforms.lightsCount = {type: '1i', value: 0};
        this.uniforms.lights = {type: '4fv', value: lightsArray};

        this.fragmentSrc = `
            precision highp float;
            
            uniform int lightsCount;
            uniform vec4 lights[${MAX_LIGHTS}]; 
        
        
            void main() {
                float b = 0.;
                for (int i = 0; i < ${MAX_LIGHTS}; i++) {
                    if (i >= lightsCount) break;
                    vec4 light = lights[i];
                    b += step(length(light.xy - gl_FragCoord.xy), light.z);
                }
                b = clamp(0., 1., b);
            
                gl_FragColor = mix(vec4(0,0,0,0.5), vec4(0,0,0,0), b);
            }
        
        `;
    }

    updateLights(lightSources) {
        this.uniforms.lightsCount.value = lightSources.length;
        let i = 0;
        let array = this.uniforms.lights.value;
        for (let light of lightSources) {
            array[i++] = light.x;
            array[i++] = game.world.height - light.y;
            array[i++] = light.radius;
            i++;
        }
    }
}


export default class ShadowsDrawer {

    constructor(shadowsGroup) {
        this.grp = shadowsGroup;
        this.spriteToApplyShader = game.add.sprite(0, 0, undefined, undefined, shadowsGroup);
        this.spriteToApplyShader.width = game.world.width;
        this.spriteToApplyShader.height = game.world.height;

        this.spriteToApplyShader.filters = [this.shader = new ShadowsShader()];

        this.lightSources = [];
        this.shadowCasters = [];

        this.hypTable = new HypTable(STEPS);

        this.distancesBitmap = game.add.bitmapData(STEPS, MAX_LIGHTS);
        this.distancesBitmap.fill(0,0,0);
        this.distancesBitmap.sprite = game.add.sprite(-10000, -10000, this.distancesBitmap, 0, this.grp);

        this.distancesBitmap.sprite.x = this.distancesBitmap.sprite.y = 0;
        this.distancesBitmap.sprite.scale.y = 8;
        this.distancesBitmap.update();
    }

    addLight(sprite) {
        let src = new LightSource(sprite);
        this.lightSources.push(src);
        src.setDistancesMap(new DistancesMap(STEPS, undefined, src.radius, this.hypTable));
    }

    addLineShadowCaster(line) {
        this.shadowCasters.push(new LineShadowCaster(line));
    }

    update() {
        for (let li = 0; li < this.lightSources.length; li++) {
            let light = this.lightSources[li];
            light.update();
            light.distancesMap.erase();
            for (let caster of this.shadowCasters) {
                caster.fillDistancesMap(light, light.distancesMap);
            }
            light.distancesMap.fillBitmap(this.distancesBitmap.imageData.data, li);
        }
        this.distancesBitmap.dirty = true;
        this.distancesBitmap.ctx.putImageData(this.distancesBitmap.imageData, 0, 0);
        this.shader.updateLights(this.lightSources);
        this.shader.update();
    }
}