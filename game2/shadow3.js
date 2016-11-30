Phaser.Filter.Shadow3 = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.wSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.tSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.sSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.light = {value: {x: 0, y: 0, z:0}, type: '3f'};
    this.uniforms.lightSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.lightStrength = {value: 1.0, type: '1f'};
    this.uniforms.ambientLight = {value: 0.2, type: '1f'};

    this.fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D iChannel0;",
        "uniform sampler2D iChannel1;",
        "uniform sampler2D iChannel2;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',

        "uniform vec2 wSize;",
        "uniform vec2 tSize;",
        "uniform vec2 sSize;",

        "uniform vec3 light;",
        "uniform vec2 lightSize;",
        "uniform float lightStrength;",
        "uniform float ambientLight;",


        "bool enterExit(vec3 line, vec4 rect, out vec3 enter, out vec3 exit, float pad) {",
            "float xmin = min(rect.x, rect.z);",
            "float xmax = max(rect.x, rect.z);",
            "float ymin = min(rect.y, rect.w);",
            "float ymax = max(rect.y, rect.w);",
            "vec2 ee = vec2(0);",
            "if (line.x == 0.) { ee = vec2(min(ymin/line.y,ymax/line.y), max(ymin/line.y,ymax/line.y));}",
            "if (line.y == 0.) { ee = vec2(min(xmin/line.x,xmax/line.x), max(xmin/line.x,xmax/line.x));}",
            "if (line.x * line.y != 0.) {",
                "float A = (xmin/line.x);",    //todo: remove ifs
                "float B = (xmax/line.x);",
                "float C = (ymin/line.y);",
                "float D = (ymax/line.y);",

                "float min1 = min(min(A,B),min(C,D));",
                "float max1 = max(max(A,B),max(C,D));",
                "float A1 = max1;",
                "A1 = A > min1 && A < A1 ? A : A1;",
                "A1 = B > min1 && B < A1 ? B : A1;",
                "A1 = C > min1 && C < A1 ? C : A1;",
                "A1 = D > min1 && D < A1 ? D : A1;",

                "float A2 = min1;",
                "A2 = A < max1 && A > A1 ? A : A2;",
                "A2 = B < max1 && B > A1 ? B : A2;",
                "A2 = C < max1 && C > A1 ? C : A2;",
                "A2 = D < max1 && D > A1 ? D : A2;",

                "ee = vec2(A1, A2);",
                "}",
            "enter = line*ee.x; exit = line*ee.y;",
            "return enter.x <= xmax+pad && enter.x >= xmin-pad && enter.y <= ymax+pad && enter.y >= ymin-pad;",
        "}",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, 0);",
            "float lt = (lightSize.x < 0. ? 1.0 : smoothstep(1.0, 0.0, (distance(coords, light))/lightSize.x));",
            "vec4 ownHeight = texture2D(iChannel2, coords.xy / tSize);",

            "vec4 shadowOf = texture2D(iChannel0, coords.xy/wSize);",
            "if (ownHeight.z > 0.) {gl_FragColor.a -= ambientLight + lightStrength * lt; return;}",
            "//if (shadowOf.r == 0.) return;",    //todo: if
            "float idx =  ceil(shadowOf.r / shadowOf.a *255.0)-1.;",
        
            "float tileX = shadowOf.g*255.0 * 16.0;",
            "float tileY = shadowOf.b*255.0 * 16.0;",
            //here we need to calculate exact point (or points) in shadows texture
            //assuming we know light position 
            "vec3 toLight = light - coords;",
            "vec4 rect = vec4(tileX-coords.x, tileY-coords.y, tileX-coords.x+15., tileY-coords.y+15.);",
            "vec3 enterPoint, exitPoint;",
            "bool inside = enterExit(toLight, rect, enterPoint, exitPoint, 1.);",
            "//if (!inside) {gl_FragColor.r = 1.; return;}",
        "//if (inside && length(enterPoint) < length(exitPoint)) {gl_FragColor.r = 1.; return;}",
        "//if (inside && length(enterPoint) > length(exitPoint)) {gl_FragColor.g = 1.; return;}",

            "enterPoint = coords + enterPoint - vec3(tileX, tileY, 0);",
            "exitPoint = coords + exitPoint - vec3(tileX, tileY, 0);",
            "vec3 inTile = exitPoint - enterPoint;",
            "float maxSteps = max(max(abs(inTile.x), abs(inTile.y)), abs(inTile.z))*2.;", //+2 - just to be sure

            "vec3 nv = inTile/maxSteps;",
            "vec3 p = enterPoint;",
            "vec4 rcolor = vec4(0,0,0,0);",

            "if (lt > 0.0 && idx >= 0. && inside) for (int i = 0; i < 16; i++) {",
                "p.x = clamp(p.x, 0., 15.);",
                "p.y = clamp(p.y, 0., 15.);",
                "//p.z = clamp(p.z, 0., 32.);", //better with commenting this out

                "vec2 shadowCoord1 = vec2(floor(p.z) * 16. + (p.x), float(idx)*16. + (p.y));",
                "vec4 ccolor = texture2D(iChannel1, shadowCoord1/sSize);",
                "rcolor = ccolor;//mix(rcolor, ccolor, ccolor.a );",
                "if (ccolor.a == 1.) break;",   //better with this line than without it
                "p += nv;",
                "if (float(i) > maxSteps) break;",
            "}",
            "gl_FragColor.rgb += rcolor.rgb * lightStrength * lt;",
            "gl_FragColor.a = clamp(gl_FragColor.a - ambientLight - (1.-ambientLight)*lightStrength * lt * (1. - rcolor.a), 0., 1.);",

        "}"
    ]
};

Phaser.Filter.Shadow3.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow3.prototype.constructor = Phaser.Filter.Shadow3;

Phaser.Filter.Shadow4 = function(game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',

        "void main(void) {",
            "gl_FragColor = vec4(0, 0, 0, 0.5);//texture2D(uSampler, vTextureCoord);",
        "}"
    ]
};

Phaser.Filter.Shadow4.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow4.prototype.constructor = Phaser.Filter.Shadow4;

