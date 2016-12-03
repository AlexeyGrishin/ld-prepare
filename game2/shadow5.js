/*
    shader1 = 1 light source
        iChannel0 - big map
        iChannel1 - shadow mask (shall be per-light basis!)
        iChannel2 - heights mask (skip for beginning)
        
        lightCoords
        lightSize
        lightStrength
        
        shadowMaskResolution
        
        
        color = texture2D(...)
        
        point = (x,y,z), check with height map
        if (shadowMask.contains(point/shadowMapResolution) || point.height) {
            raycast. limited amount of steps, I hope
        }
        multiply, etc.
        
        
    shader2
        just adds ambient color
 */

Phaser.Filter.Shadow5 = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.wSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.tSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.sSize = {value: {x: 16, y: 16}, type: '2f'};
    this.uniforms.shSize = {value: {x: 16, y: 16}, type: '2f'};

    this.uniforms.light = {value: {x: 0, y: 0, z:0}, type: '3f'};
    this.uniforms.lightSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.lightStrength = {value: 1.0, type: '1f'};
    this.uniforms.shadowPrecision = {value: 1.0, type: '1f'};

    this.uniforms.shadowQ1 = {value: 1, type: '1f'};
    //this.uniforms.shadowQ2 = {value: 32, type: '1i'};

    var header = [
        "precision mediump float;",
        "uniform sampler2D iChannel0;",
        "uniform sampler2D iChannel1;",
        "uniform sampler2D iChannel2;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',

        "uniform vec2 wSize;",
        "uniform vec2 shSize;",
        "uniform vec2 tSize;",
        "uniform vec2 sSize;",
        "uniform vec2 mouse;",

        "uniform vec3 light;",
        "uniform vec2 lightSize;",
        "uniform float lightStrength;",
        "uniform float shadowPrecision;",
        
        //"uniform float map3d"

        "uniform float shadowQ1;",
        "#define SHADOW_CHECK_DIST " + (Performance.ShadowsStepsCount || 64),

        "bool checkBit(float val, float bit) { float f = pow(2., floor(mod(bit, 16.))); float vf = val - mod(val,f); return abs(floor(vf/f/2.)*2.*f - (vf-f)) < 1.;  }",
         //1 if match, 0 if not
        "float checkBitF(float val, float bit) { float f = pow(2., floor(mod(bit, 16.))); float vf = val - mod(val,f); return 1. - step(1., abs(floor(vf/f/2.)*2.*f - (vf-f)));  }",

    ];


    function checkPoints(n) {
      var a = [];
      for (var i = 0; i < (n||Performance.ShadowsStepsCount||64); i++) a.push("CHECK_POINT(" + i + ".)");
      return a.join("\n");
    }

    var jitter = false;

    var main = [

        "void checkPoint(inout vec4 color, vec3 point) {",
                "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + shSize.x*floor(point.z / 16.), floor(point.y))/vec2(shSize.x*2., shSize.y));",
                "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
                "color.a = max(color.a, checkBitF(mask, point.z)*0.5);",
        "}",
        "void checkPointJ(inout vec4 color, vec3 point) {",
                "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + shSize.x*floor(point.z / 16.), floor(point.y))/vec2(shSize.x*2., shSize.y));",
                "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
                "color.a = max(color.a, (checkBitF(mask, point.z)*0.5 + checkBitF(mask, point.z-3.)*0.5 + checkBitF(mask, point.z+3.)*0.5) / 1.5);",
        "}",
        jitter ? 
              "#define CHECK_POINT(n) checkPointJ(rcolor, start + toLight * n / maxSteps);"
            //"#define CHECK_POINT(n) checkPoint(rcolor, start + toLight * n / maxSteps); checkPoint(jcolor1, start + (toLight + vec3(3., 3., 3.)) * n / maxSteps); checkPoint(jcolor2, start + (toLight - vec3(3., 3., 3.)) * n / maxSteps);"
            : "#define CHECK_POINT(n) checkPoint(rcolor, start + toLight * n / maxSteps);",
        

        jitter ? 
             "#define SUMMARIZE rcolor.a = (rcolor.a + jcolor1.a + jcolor2.a)/3.;"
             : "#define SUMMARIZE",
        

        "void main(void) {",

        "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, 0);",
        "if (coords.x > shSize.x || coords.y > shSize.y) return;",
        "gl_FragColor = texture2D(uSampler, vTextureCoord);",
        "float lt = (lightSize.x < 0. ? 1.0 : smoothstep(1.0, 0.0, (distance(coords, light))/lightSize.x));",
        //raycast
        "vec3 point = coords;",
        Performance.UseShadowBitmask ? "vec4 shadowPoint = texture2D(iChannel1, point.xy / shadowPrecision / wSize); float initialStart = shadowPoint.r;" : "",
        "vec4 ownHeight = texture2D(iChannel2, point.xy / tSize);",
        "vec4 rcolor = vec4(0);",
        "vec4 jcolor1 = vec4(0); vec4 jcolor2 = vec4(0);",
        Performance.UseShadowBitmask ? "if (shadowPoint.a > 0.0 && lt > 0.0) {" : "if (lt > 0.0) {",
            "float dy = ownHeight.y > 0. ? (ownHeight.y * 255.0 - 128.0 + 1.) : 0.0;",
            "point.y += dy;",
            "point.z = ceil(ownHeight.z*255.0);",
            "vec3 start = point;",
            "vec3 toLight = light - start;",
            Performance.UseShadowBitmask ? "start = start + initialStart*toLight; toLight = light - start;" : "",
            "float maxSteps = (max(abs(toLight.x), abs(toLight.y))/float(shadowQ1));// int(length(toLight))-1;",
            checkPoints(),
            "SUMMARIZE",
            //"int rg[2];",
            //"for (int i = 0; i < SHADOW_CHECK_DIST; i++) {",
            //    "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + wSize.x*floor(point.z / 16.), floor(point.y))/vec2(wSize.x*2., wSize.y));",
            //    "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
            //    "if (checkBit(mask, point.z)) { rcolor.a = 0.5; break;}",
            //    "point = start + toLight * float(i+1)/float(maxSteps);",
            //"}",

        "}",

        //out
        "gl_FragColor.a = clamp(gl_FragColor.a - lightStrength * lt * (1. - rcolor.a), 0., 1.);",

        "}"
    ];

    var debug_showRay = [
        "void main(void) {",
        "gl_FragColor = vec4(0,0,0,0);",
        "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, 0);",

        //raycast
        "vec3 point = vec3(mouse.x * wSize.x, (1. - mouse.y) * wSize.y, 0.);",
        "vec4 shadowPoint = texture2D(iChannel1, coords.xy / shadowPrecision / wSize);",

        "vec4 hp1 = texture2D(iChannel0, vec2(floor(coords.x) + wSize.x*floor(point.z / 16.), floor(coords.y))/vec2(wSize.x*2., wSize.y));",
        "float mask1 = hp1.g*255.0 * 256. + hp1.r*255.0;",
        "if (checkBit(mask1, coords.z)) {gl_FragColor = vec4(1,0,0,1); }",

        "//if (distance(point, coords) < 10.) {gl_FragColor = vec4(0,1,1,1); return;} ",
        "if (shadowPoint.a > 0.0) gl_FragColor.a = 0.5;",
        "if (shadowPoint.a >= 0.0) {",
            "//float dy = ownHeight.y > 0. ? (ownHeight.y * 255.0 - 128.0 + 1.) : 0.0;",
            "//point.y += dy;",
            "//point.z = ceil(ownHeight.z*255.0);",
            "vec3 start = point;",
            "vec3 toLight = light - start;",
            //"toLight = toLight * min(32.0 / (light.z-point.z), 1.0);",    //no need to see higher than 32
            "int maxSteps = int(max(abs(toLight.x), abs(toLight.y))/shadowQ1);// int(length(toLight))-1;",
            //"int doneSteps = 0;",
            //"vec3 ntl = toLight / float(maxSteps);",
            //"point+=ntl;",
            "int rg[2];",
            "for (int i = 0; i < SHADOW_CHECK_DIST; i++) {",
                "if (i > maxSteps || point.z > 31.) break;",
                //check height 0 only - temp
                "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + wSize.x*floor(point.z / 16.), floor(point.y))/vec2(wSize.x*2., wSize.y));",
                "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
                "if (mask > 0. && point.z>16.) {gl_FragColor = vec4(1,1,0,1); break;} ",
                "if (checkBit(mask, point.z) && distance(point.xy, coords.xy) < 2.) {gl_FragColor += vec4(point.z>16. ? 1. : 0.,0.,0,0); break;} ",
                "if (checkBit(mask, point.z)) { break;}",
                "if (distance(point.xy, coords.xy) < 1.) {gl_FragColor += vec4(0,mod(float(i),2.),1,0); break;} ",
                "point = start + toLight * float(i+1)/float(maxSteps);",
            "}",

        "}",
        "}"
    ];

    var debug_show3dMap = [
        "void main(void) {",
            "gl_FragColor = vec4(0,0,0,0);",
            "float z = mouse.y * wSize.y;",
            //"z = 17.0;",
            "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, z);",
            "vec3 point = coords;",
            "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + wSize.x*floor(point.z / 16.), floor(point.y))/vec2(wSize.x*2., wSize.y));",
            "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
            "if (checkBit(mask, point.z)) {gl_FragColor = vec4(1,0,0,1); }",
            "if (wSize.y-coords.y <= 32.) gl_FragColor = vec4(0,0,0.5,0.5);",
            "if (wSize.y-coords.y <= 16.) gl_FragColor = vec4(0,0,1,0.5);",

        "}"
    ];

    var debug_nothing = ["void main() { gl_FragColor = vec4(0); }"];

    //this.fragmentSrc = header.concat(debug_showRay);
    this.fragmentSrc = header.concat(main);
    //this.fragmentSrc = header.concat(debug_show3dMap);
    //this.fragmentSrc = header.concat(debug_nothing);


};

Phaser.Filter.Shadow5.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow5.prototype.constructor = Phaser.Filter.Shadow5;

Phaser.Filter.AmbientColor5 = function(game) {
    Phaser.Filter.call(this, game);
    
    this.uniforms.ambientColor = {value: {x:0,y:0,z:0,w:0.8}, type: '4f'};
    
    this.fragmentSrc = [
        "precision mediump float;",
        "uniform vec4 ambientColor;",
        "void main() { gl_FragColor = ambientColor;}"
    ]
};

Phaser.Filter.AmbientColor5.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.AmbientColor5.prototype.constructor = Phaser.Filter.AmbientColor5;

Phaser.Filter.ResizeBack = function(game) {
    Phaser.Filter.call(this, game);
    
    this.fragmentSrc = [
        "precision mediump float;",

        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',

        "const float scale = " + (Performance.Map3dScale) + ".;",

        //"void main() { gl_FragColor = texture2D(uSampler, vTextureCoord/" + (Performance.Map3dScale) + ".);}"
        "void main() { gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x / scale, 1. - (1.-vTextureCoord.y) / scale));}"

    ];
};

Phaser.Filter.ResizeBack.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ResizeBack.prototype.constructor = Phaser.Filter.ResizeBack;