import LightSource from "../model/light_source";
import HypTable from "../model/hyp_table";
import DistancesMap from "../model/distances_map";
import LineShadowCaster from "../model/line_shadow_caster";
import Camera from "../model/camera";

export const MAX_LIGHTS = 64;
const STEPS = 128;


class SimpleLightShader extends Phaser.Filter {

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

class ShadowsShader extends Phaser.Filter {
    constructor(sprite, {lightDecay = true, smoothShadow = true} = {}) {
        super(game);

        let lightsArray = new Array(MAX_LIGHTS*4);
        lightsArray.fill(0, 0, lightsArray.length);

        this.uniforms.lightsCount = {type: '1i', value: 0};
        this.uniforms.lights = {type: '4fv', value: lightsArray};

        this.uniforms.iChannel0.value = sprite.texture;

        this.fragmentSrc = `
            precision highp float;
            
            uniform int lightsCount;
            uniform vec4 lights[${MAX_LIGHTS}]; 
            uniform sampler2D  uSampler;
            uniform sampler2D  iChannel0;
            
            #define STRENGTH ${game.gameplay ? "0.2" : "0.3"}
            #define MAX_DARK ${game.gameplay ? "0.9" : "0.7"}

            #define M_PI 3.141592653589793
            #define M_PI2 6.283185307179586
            
            ${lightDecay ? "#define DECAY" : ""}
            ${smoothShadow ? "#define SMOOTH" : ""}
            
            #define SMOOTH_STEP 0.02
            
            float decodeDist(vec4 color) {
                return color.r*255.*2. + color.g*2.;
            }            
            
            float getShadow(int i, float angle, float distance) {
                float u = angle/M_PI2;
                float v = float(i)/${MAX_LIGHTS}.;
                float shadowAfterDistance = decodeDist(texture2D(iChannel0, vec2(u, v)));
                return step(shadowAfterDistance, distance);
            }            
        
        
            void main() {
                float lightness = 0.;
                for (int i = 0; i < ${MAX_LIGHTS}; i++) {
                    if (i >= lightsCount) break;
                    vec4 light = lights[i];
                    if (light.w == 0.) continue;
                    vec2 light2point = gl_FragCoord.xy - light.xy;
                    
                    float radius = light.z;
                    float distance = length(light2point);
                    float inLight = step(distance, radius);
                    if (inLight == 0.) continue;
                    float angle = mod(-atan(light2point.y, light2point.x), M_PI2);
                    
                    float thisLightness = (1. - getShadow(i, angle, distance));

                    #ifdef SMOOTH
                    thisLightness = thisLightness * 0.4 
                        + (1. - getShadow(i, angle-SMOOTH_STEP, distance)) * 0.2   
                        + (1. - getShadow(i, angle+SMOOTH_STEP, distance)) * 0.2
                        + (1. - getShadow(i, angle-SMOOTH_STEP*2., distance)) * 0.1   
                        + (1. - getShadow(i, angle+SMOOTH_STEP*2., distance)) * 0.1;
                       
                    #endif
                    
                    #ifdef DECAY
                    thisLightness = thisLightness*smoothstep(0., 1., pow(1.-distance/radius, 0.5));
                    #endif
                    
                    lightness += thisLightness*STRENGTH;
                }
                lightness = clamp(0., 1., lightness);
            
                gl_FragColor = mix(vec4(0,0,0,MAX_DARK), vec4(0,0,0,0), lightness);
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
            array[i++] = light.activeLight ? 1 : 0;
        }
    }
}

export const MODE_NONE = "none";
export const MODE_SIMPLE = "simple";
export const MODE_SHADOWS = "shadows";

const PerMode = {
    [MODE_SIMPLE]: SimpleLightShader,
    [MODE_SHADOWS]: ShadowsShader
};


export default class ShadowsDrawer {

    constructor(shadowsGroup, steps = STEPS) {
        this.grp = shadowsGroup;
        this.spriteToApplyShader = game.add.sprite(0, 0, undefined, undefined, shadowsGroup);
        this.spriteToApplyShader.width = game.world.width;
        this.spriteToApplyShader.height = game.world.height;

        this.lightSources = [];
        this.shadowCasters = [];

        this.hypTable = new HypTable(steps);
        this.steps = steps;

        this.distancesBitmap = game.add.bitmapData(steps, MAX_LIGHTS);
        this.distancesBitmap.update();
        this.distancesBitmap.sprite = game.add.sprite(-10000, -10000, this.distancesBitmap);
    }

    init(mode = MODE_SIMPLE, options) {
        if (this.shader) return;
        setTimeout(() => {
            this.spriteToApplyShader.filters = [this.shader = new (PerMode[mode])(this.distancesBitmap.sprite, options)];
        }, 0);
    }

    showRaycastDebug() {
        this.distancesBitmap.sprite.x = this.distancesBitmap.sprite.y = 0;
        this.distancesBitmap.sprite.scale.y = 8;
        if (this.steps < 256) {
            this.distancesBitmap.sprite.scale.x = 4;
        }
        if (this.steps < 128) {
            this.distancesBitmap.sprite.scale.x = 8;
        }
    }

    addCamera(sprite, ...args) {
        let camera = new Camera(sprite, ...args);
        this.lightSources.push(camera);
        camera.setDistancesMap(new DistancesMap(this.steps, undefined, camera.radius, this.hypTable));
    }

    addLight(sprite) {
        let src = new LightSource(sprite);
        this.lightSources.push(src);
        src.setDistancesMap(new DistancesMap(this.steps, undefined, src.radius, this.hypTable));
    }

    addLineShadowCaster(line, textureOffsetGetter) {
        this.shadowCasters.push(new LineShadowCaster(line, textureOffsetGetter));
    }

    update() {
        for (let li = this.lightSources.length - 1; li >= 0 ; li--) {
            let light = this.lightSources[li];
            light.update();
            light.distancesMap.erase();
            for (let caster of this.shadowCasters) {
                caster.fillDistancesMap(light, light.distancesMap);
            }
            light.distancesMap.fillBitmap(this.distancesBitmap.imageData.data, li * this.steps * 4);
        }
        this.distancesBitmap.ctx.putImageData(this.distancesBitmap.imageData, 0, 0);
        this.distancesBitmap.dirty = true;
        if (this.shader) {
            this.shader.updateLights(this.lightSources);
        }
    }
}