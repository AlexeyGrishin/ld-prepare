Phaser.Filter.Shadow1 = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.linesCount = {value: 0, type: '1i'};
    this.uniforms.lightCoords = {value: 0, type: '2fv'};
    this.uniforms.lightSize = {value: 0, type: '2fv'};
    this.uniforms.lightsCount = {value: 0, type: '1i'}

 
    this.fragmentSrc = [
        "precision highp float;",

        "uniform sampler2D iChannel1;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',
        "uniform vec2      resolution;",
        "uniform int linesCount;",
        "uniform vec2 lightCoords[24];",
        "uniform vec2 lightSize[24];",
        "uniform int lightsCount;",

        "const vec4 LightColor = vec4(1.0, 1.0, 240.0/255.0, 1.0);",      //light RGBA -- alpha is intensity
        "const vec4 AmbientColor = vec4(1.0, 1.0, 1.0, 0.5);",    //ambient RGBA -- alpha is intensity
        "const vec3 Falloff = vec3(0.0, 1.0, 0.2);",         //attenuation coefficients
        "bool intersects(vec2 p1, vec2 p2, vec2 l1, vec2 l2) {",    //todo: invalid fn, need to recheck
            "vec3 v1 = vec3(p2 - p1,0); vec3 v2 = vec3(l2 - l1,0);",
            "float d1 = length(cross(v1,v2));",
            "if (d1 == 0.0) return false;",
            "float u = length(cross(vec3(l1-p1,0), v1))/d1;",
            "float t = length(cross(vec3(p1-l1,0), v2))/d1;",
            "return u >= 0.0 && u <= 1.0 && t >= 0.0 && t <= 1.0;",
        "}",
        "bool intersects2(vec2 a, vec2 b, vec2 e, vec2 f) {",
            "float a1 = b.y - a.y;",
            "float a2 = f.y - e.y;",
            "float b1 = a.x - b.x;",
            "float b2 = e.x - f.x;",
            "float c1 = (b.x * a.y) - (a.x * b.y);",
            "float c2 = (f.x * e.y) - (e.x * f.y);",
            "float denom = (a1 * b2) - (a2 * b1);",

            "if (denom == 0.0) return false;",

            "float uc = ((f.y - e.y) * (b.x - a.x) - (f.x - e.x) * (b.y - a.y));",
            "float ua = (((f.x - e.x) * (a.y - e.y)) - (f.y - e.y) * (a.x - e.x)) / uc;",
            "float ub = (((b.x - a.x) * (a.y - e.y)) - ((b.y - a.y) * (a.x - e.x))) / uc;",
            "return ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub < 1.0;",
        "}",
        "",
        "void main(void) {",
            "//int onLine = 0;",
            "vec2 coords = vec2(gl_FragCoord.x, 320.0-gl_FragCoord.y);",
            "int lights = lightsCount;",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "float lightness = 0.0;",
            "for (int l = 0; l < 24; l++) { if (l >= lightsCount) break;",
              "vec2 light = lightCoords[l].xy;",

             "lightness += 0.5+0.5*smoothstep(1.0, 0.0, distance(coords, light)/lightSize[l].x);",
            "if (distance(coords, light) < lightSize[l].y) {",
                "float df = (1.0 - distance(coords, light) / lightSize[l].y);",
                "//gl_FragColor = gl_FragColor + LightColor*df;return;",
                "gl_FragColor = gl_FragColor*(1.0-df) + LightColor*df;return;",
            "} else {",
            "for (int i = 0; i < 1024; i++) {",
                "if (i >= linesCount) break;",
                "float pos = float(i)/1023.0;",
                "vec2 x1v = texture2D(iChannel1, vec2(pos,0.0/3.0)).xy;",
                "float x1 = x1v.x*256.0*255.0 + x1v.y*255.0;",
                "vec2 y1v = texture2D(iChannel1, vec2(pos, 1.0/3.0)).xy;",
                "float y1 = y1v.x*256.0*255.0 + y1v.y*255.0;",
                "vec2 x2v = texture2D(iChannel1, vec2(pos,2.0/3.0)).xy;",
                "float x2 = x2v.x*256.0*255.0 + x2v.y*255.0;",
                "vec2 y2v = texture2D(iChannel1, vec2(pos, 3.0/3.0)).xy;",
                "float y2 = y2v.x*256.0*255.0 + y2v.y*255.0;",
                "vec2 p1 = vec2(x1, y1);",
                "vec2 p2 = vec2(x2, y2);",
                "//vec2 lineVec = p2 - p1;",
                "if (intersects2(light, coords, p2, p1)) {lights--;break;}",
                "//vec2 pVec = coords.xy - p1;",
                "//if (abs(dot(lineVec, pVec)) < 1.0) {onLine = 1;break;}",
                "",
                //"if ((320.0 + 80.0 - gl_FragCoord.y) < p1.y) {onLine = 1; break;}",
                "//if (abs((p1.x-p2.x)/(p1.y-p2.y) - (coords.x-p2.x)/(coords.y-p2.y)) < 0.1) {onLine = 1; break;};",

            "}",
            "}",
            "}",
        "gl_FragColor *= (lightness/float(lightsCount))*(0.8 + 0.2*(float(lights)/float(lightsCount)));",
        //add some "halo" for "sum", as in canvas example
        "float halo = abs(distance(coords,lightCoords[0]) - lightSize[0].x/4.0); if (halo < 20.0) {gl_FragColor *= (1.0 + 0.05*(20.0-halo)/20.0);}",
        "//if ((320.0-gl_FragCoord.y) > 10.0) gl_FragColor.g = 1.0;",
        "//vec4 test = texture2D(iChannel1, vec2(1,0)); if (test.r == 10.0/255.0) gl_FragColor.g = 1.0;",
        "}"
    ]
};

Phaser.Filter.Shadow1.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow1.prototype.constructor = Phaser.Filter.Shadow1;
