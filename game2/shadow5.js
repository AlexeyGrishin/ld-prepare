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


    var header = [
        "precision mediump float;",
        "uniform sampler2D iChannel0;", //3d-map
        "uniform sampler2D iChannel2;", //height map
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

        "#define SHADOW_CHECK_DIST " + (Performance.ShadowsStepsCount || 64),
         //1 if match, 0 if not
        "float checkBitF(float val, float bit) { float f = pow(2., floor(mod(bit, 16.))); float vf = val - mod(val,f); return 1. - step(1., abs(floor(vf/f/2.)*2.*f - (vf-f)));  }",

    ];


    function checkPoints(n) {
      var a = [];
      for (var i = 0; i < (n||Performance.ShadowsStepsCount||64); i++) a.push("CHECK_POINT(" + i + ".)");
      return a.join("\n");
    }

    var main = [

        "void checkPoint(inout vec4 color, vec3 point) {",
                "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + shSize.x*floor(point.z / 16.), floor(point.y))/vec2(shSize.x*2., shSize.y));",
                "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
                "color.a = max(color.a, checkBitF(mask, point.z)*0.5);",
        "}",
        "#define CHECK_POINT(n) checkPoint(rcolor, start + toLight * n / maxSteps);",

        "void main(void) {",

        "vec3 coords = vec3(gl_FragCoord.x, wSize.y-gl_FragCoord.y, 0);",
        "if (coords.x > shSize.x || coords.y > shSize.y) return;",
        "gl_FragColor = texture2D(uSampler, vTextureCoord);",
        "float lt = (lightSize.x < 0. ? 1.0 : smoothstep(1.0, 0.0, (distance(coords, light))/lightSize.x));",
        //raycast
        "vec3 point = coords;",
        "vec4 ownHeight = texture2D(iChannel2, point.xy / tSize);",
        "vec4 rcolor = vec4(0);",
        "if (lt > 0.0) {",
            "float dy = ownHeight.y > 0. ? (ownHeight.y * 255.0 - 128.0 + 1.) : 0.0;",
            "point.y += dy;",
            "point.z = ceil(ownHeight.z*255.0);",
            "vec3 start = point;",
            "vec3 toLight = light - start;",
            "float maxSteps = (max(abs(toLight.x), abs(toLight.y)));",
            checkPoints(),
        "}",

        //out
        "gl_FragColor.a = clamp(gl_FragColor.a - lightStrength * lt * (1. - rcolor.a), 0., 1.);",

        "}"
    ];

    this.fragmentSrc = header.concat(main);
    
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

        "void main() { gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x / scale, 1. - (1.-vTextureCoord.y) / scale));}"

    ];
};

Phaser.Filter.ResizeBack.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.ResizeBack.prototype.constructor = Phaser.Filter.ResizeBack;