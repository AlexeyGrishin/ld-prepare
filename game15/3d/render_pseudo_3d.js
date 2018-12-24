import {MAX_LIGHTS} from "../lights/render/shadows_drawer";


const VIEWPORT_ANGLE = Phaser.Math.degToRad(60);
const HALF_VIEWPORT_ANGLE = VIEWPORT_ANGLE / 2;


class Pseudo3dShader extends Phaser.Filter {
    constructor(shadowsDrawer, width, height, useColor, useLights) {
        super(game);
        this.uniforms.iChannel0.value = shadowsDrawer.distancesBitmap.sprite.texture;
        let lightsArray = new Array(MAX_LIGHTS*4);
        lightsArray.fill(0, 0, lightsArray.length);

        this.uniforms.lightsCount = {type: '1i', value: 0};
        this.uniforms.hero = {type: '4f', value: {x:0, y:0, z:0}};
        this.uniforms.lights = {type: '4fv', value: lightsArray};

        if (useColor) {
            let colorsSprite = game.add.sprite(-1000, -1000, "colors");
            colorsSprite.texture.scaleMode = PIXI.scaleModes.NEAREST;
            this.uniforms.iChannel1.value = colorsSprite.texture;
            this.uniforms.iChannel1.textureData = {
                magFilter: game.renderer.gl.NEAREST,
                minFilter: game.renderer.gl.NEAREST
            };
        } else {

            let texSprite = game.add.sprite(-1000, -1000, "walls");
            texSprite.texture.scaleMode = PIXI.scaleModes.NEAREST;
            this.uniforms.iChannel1.value = texSprite.texture;
            this.uniforms.iChannel1.textureData = {
                magFilter: game.renderer.gl.NEAREST,
                minFilter: game.renderer.gl.NEAREST
            };
        }

        this.fragmentSrc = `

            precision highp float;
            
            uniform int lightsCount;
            uniform vec4 lights[${MAX_LIGHTS}]; 
            uniform sampler2D  uSampler;
            uniform sampler2D  iChannel0;
            uniform sampler2D  iChannel1;
            
            uniform vec4 hero;
            
            #define M_PI 3.141592653589793
            #define M_PI2 6.283185307179586
            
            #define W ${width}.
            #define H ${height}.
            
            #define ANGLE ${(HALF_VIEWPORT_ANGLE).toFixed(8)}
            #define ANGLE_COS ${Math.cos(HALF_VIEWPORT_ANGLE).toFixed(8)}
            #define STRENGTH 0.3
            #define TEX_IN_HEIGHT 4.
            #define TEX_IN_WIDTH 4.
        
           
            ${useColor ? "#define USE_COLOR" : ""}
            ${useLights ? "#define USE_LIGHTS" : ""}
            
            float decodeDist(vec4 color) {
                return color.r*255.*2. + color.g*2.;
            }         
            
            vec4 decodeTexture(vec4 color, float v) {
                #ifdef USE_COLOR
                return texture2D(iChannel1, vec2(color.b, 0.));
                #else
                return texture2D(iChannel1, vec2(color.b, v*0.5)); //first row only, and 1 tile in height
                #endif
            }
            
            vec4 getDistanceAndTexture(int i, float angle) {
                float u = mod(angle/M_PI2, 1.);
                float v = float(i)/${MAX_LIGHTS}.;
                return texture2D(iChannel0, vec2(u, v));
            }            
                
                
            vec2 getNormalizedCoords() {
                //normalize - 0-1
                vec2 xy = vec2(gl_FragCoord.x/W, (${game.camera.height}. - gl_FragCoord.y)/H);
                return (xy - 0.5)*2.;
            }
            
            float distance2z(float d) { return d / 100.; }
            float z2distance(float z) { return z * 100.; }
            
            
            vec2 getWorldXY(float angle, vec2 screenCoords, float distance, float isInsideWall, float k) {
                float z = screenCoords.y == 0. ? 1000. : 1./abs(screenCoords.y);
                float actualDistance = mix(z2distance(z)*k, distance-4., isInsideWall);  //-4 for wall width
                
                return vec2(cos(angle), sin(angle))*actualDistance + hero.xy;
                
            }
            
            float applyHeroVisibility(vec2 worldCoords) {
                float d = length(worldCoords - hero.xy);
                return mix(0.1, 0.5, pow(clamp(1. - d/400., 0., 1.), 2.));
            }
            
            float getShadow(int i, float angle, float distance) {
                float u = angle/M_PI2;
                float v = float(i)/${MAX_LIGHTS}.;
                float shadowAfterDistance = decodeDist(texture2D(iChannel0, vec2(u, v)));
                return step(shadowAfterDistance, distance);
            }        
                     
            //todo: this is copy-paste from shadows_drawer. here shall be reusing instead
            float applyLights(float lightness, vec2 worldCoords) {
                for (int i = 0; i < ${MAX_LIGHTS}; i++) {
                    if (i >= lightsCount) break;
                    vec4 light = lights[i];
                    if (light.w == 0.) continue;
                    vec2 light2point = worldCoords.xy - light.xy;
                    
                    float radius = light.z;
                    float distance = length(light2point);
                    float inLight = step(distance, radius);
                    if (inLight == 0.) continue;
                    float angle = mod(atan(light2point.y, light2point.x), M_PI2);
                    
                    float thisLightness = (1. - getShadow(i, angle, distance));

                    thisLightness = thisLightness*smoothstep(0., 1., pow(1.-distance/radius, 0.5));
                    
                    lightness += thisLightness*STRENGTH;
                }
                return clamp(0., 1., lightness);     
            }
            
            void main() {
            
                vec4 floorColor = texture2D(iChannel1, vec2(0., 1.));
                vec4 ceilColor = texture2D(iChannel1, vec2(1., 1.));
            
                //x,y -> -1 - 1
                vec2 screenCoords = getNormalizedCoords();
                
                //float angle = hero.z + acos(screenCoords.x*ANGLE_COS);
                float relAngle = (screenCoords.x * ANGLE);
                float angle = hero.z + relAngle;
                float maybeFloor = step(screenCoords.y, 0.);
                
                float k = (cos(relAngle));
                
                vec4 dnt = getDistanceAndTexture(0, angle);
                float distance = decodeDist(dnt)*k;
                
                float z = distance2z(distance);
                vec2 wallY = vec2(-1., 1.);
                wallY /= z;
                
                float isInsideWall = step(wallY.x, screenCoords.y)*step(screenCoords.y, wallY.y);
                float v = mod((screenCoords.y - wallY.x)/wallY.y/2. * TEX_IN_HEIGHT, 1.);
                
                //vec4 color = vec4(dnt.b, 0, 0, 1);
                vec4 wallColor = decodeTexture(dnt, v);
                
                #ifdef USE_LIGHTS
                vec2 worldCoords = getWorldXY(angle, screenCoords, distance, isInsideWall, k);
                float lightness = applyHeroVisibility(worldCoords);
                lightness = applyLights(lightness, worldCoords);
                #else
                float lightness = 1.;
                #endif
                
                vec4 defaultColor = mix(floorColor, ceilColor, maybeFloor);
                vec4 outColor = mix(vec4(0., 0., 0., 1.), mix(defaultColor, wallColor, isInsideWall), lightness);
                
                gl_FragColor = outColor;
            }
        
        
        
        `;
    }

    updateLights(lightSources) {
        this.uniforms.lightsCount.value = lightSources.length;
        let i = 0;
        let array = this.uniforms.lights.value;
        for (let light of lightSources) {
            array[i++] = light.x;
            array[i++] = light.y;
            array[i++] = light.radius;
            array[i++] = light.activeLight ? 1 : 0;
        }
    }

    updateHero(hero) {
        this.uniforms.hero.value = {
            x: hero.x,
            y: hero.y,
            z: hero.rotation - Math.PI/2,
            w: 0
        }
    }
}

export default class Pseudo3d {
    constructor(width, height, group, useColor, useLights) {
        this.sprite = game.add.sprite(0, 0, undefined, undefined, group);
        this.sprite.width = width;
        this.sprite.height = height;
        this.useColor = useColor;
        this.useLights = useLights;
    }

    init(hero, shadowsDrawer) {
        this.hero = hero;
        this.shadowsDrawer = shadowsDrawer;
        this.sprite.filters = [this.shader = new Pseudo3dShader(this.shadowsDrawer, this.sprite.width, this.sprite.height, this.useColor, this.useLights)];
    }

    update() {
        if (this.shader) {
            this.shader.updateHero(this.hero);
            this.shader.updateLights(this.shadowsDrawer.lightSources);
        }
    }

    createTextureOffsetGetter(textureNr) {
        return this.useColor
                ? width => this.getTextureOffsetColor(textureNr, width)
                : width => this.getTextureOffsetTex(textureNr, width)
    }

    getTextureOffsetColor(textureNr, width) {
        return (textureNr*4/31*255)|0;
    }

    getTextureOffsetTex(textureNr, width) {
        while (width < 0) width += 16;
        return ((textureNr*16+((width+16)*2)%16)*2)|0;
    }


}