Phaser.Filter.Shadow2 = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.lightCoords = {value: [], type: '3fv'};
    this.uniforms.lightSize = {value: [], type: '2fv'};
    this.uniforms.lightsCount = {value: 0, type: '1i'};
    this.uniforms.wSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.tSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.sSize = {value: {x: 0, y: 0}, type: '2f'};

    //iChannel0 ==> hotspots map
    //iChannel1 ==> heights map
    
    this.fragmentSrc = [
        "precision highp float;",

        "uniform sampler2D iChannel0;",
        "uniform sampler2D iChannel1;",
        "uniform sampler2D iChannel2;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',
        "uniform vec2      resolution;",
        "uniform vec3 lightCoords[24];",
        "uniform vec2 lightSize[24];",
        "uniform int lightsCount;",

        "uniform vec2 tSize;",
        "uniform vec2 sSize;",
        "uniform vec2 wSize;",

        //todo: check with heights map as well

        "void main(void) {",
            "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, 0);",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            //"if (coords.x < 128.0 && coords.y < 128.0) {",
                //"gl_FragColor = (gl_FragColor + vec4(0.0, 0.0, 0.5, 0.0))*0.8;",
                //"gl_FragColor *= vec4(1.0, 0.4, 1.0, 0.4);",
                //"gl_FragColor *= 0.8;",
                //"return;",
            //"}",
            "vec4 conversion = vec4(1,1,1,1);",
            "vec4 colorChange = vec4(0,0,0,0);",
            "float lightness = 0.0;",
            "int lights = lightsCount;",
            "for (int i = 0; i < 24; i++) {",
                "if (i >= lightsCount) break;",
                "vec3 light = lightCoords[i];",
                "float dist = distance(light, coords);",
                "//conversion = vec4(1,1,1,1)*(1.-dist / lightSize[i].x);",
                "vec3 point = coords;",
                "vec4 ownHeight = texture2D(iChannel2, point.xy / tSize);",
                "float dy = ownHeight.y > 0. ? (ownHeight.y * 255.0 - 128.0 + 1.) : 0.0;",
                "point.y += dy;",
                "//point.xy += ownHeight.xy * 255.0;",
                "//if (ownHeight.y > 0.) point.y -= 1.;", //todo:
                "point.z = ceil(ownHeight.z*255.0);",
                "vec3 toLight = light - point;",
                "vec3 ntl = 2. * toLight / length(toLight);",
                "point+=ntl;",
                "int maxSteps = int(length(toLight))-1;",

        "//vec4 ownHotspot = texture2D(iChannel0, point.xy / tSize);",

                "float lightPass = 1.0;",
                "float lt = (lightSize[i].x < 0. ? 1.0 : smoothstep(1.0, 0.0, (distance(coords, light) - lightSize[i].y)/lightSize[i].x));",

                 "if (lt > 0.0) for (int i = 0; i < 1024; i++) {",  //not sure it is the best way to do that...
                    "vec4 hotspot = texture2D(iChannel0, point.xy / tSize);",
                    "if (hotspot.a == 1.0) {",
                        "vec4 heightPoint = texture2D(iChannel1, vec2(ceil(point.z)*16.0 + ceil(hotspot.x*255.0), ceil(hotspot.b * 255.0) * 16.0 + ceil(hotspot.y*255.0)) / sSize);",   //todo: pass shadows texture size in params
                        "if (heightPoint.a != 0.0) {",
                            "lightPass = 1. - heightPoint.a;",
                            "if (heightPoint.r != 0.0) { colorChange.rgb += 0.5*lt*heightPoint.rgb; }",
                            "if (lightPass == 0.) lights--;",   //todo: needed?
                            "break;",
                        "}",
                    "}",
                    "point += ntl;",
                    "if (i >= maxSteps) break;",
                    "if (point.z > 32. && ntl.z < 0.) break;", // no need to go further, there is nothing up than 32px
                    "if (point.x < 0. || point.x > wSize.x || point.y < 0. || point.y > wSize.y || point.z < 0.) break;",
                "}",
                //"if (ownHeight.z > 0.0) lightPass = 1.0;",
                "lightness += (0.5 + 0.5 * lightPass * lt)/float(lightsCount);",  //distance = -1 for infinite distance
            "}",
            "gl_FragColor = (gl_FragColor + colorChange) * min(1.0, max(0.5, lightness));",
            //"vec4 hotspot = texture2D(iChannel0, coords / vec2(512., 512.));",
            //"if (hotspot.r == 1.0) gl_FragColor.r = 1.0;",
        "}"
    ];   
};

//how to avoid "raycasting" inside shader... so I have point, light and obstacles.

Phaser.Filter.Shadow2.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow2.prototype.constructor = Phaser.Filter.Shadow2;
