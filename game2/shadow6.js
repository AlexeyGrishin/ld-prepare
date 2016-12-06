//uSampler - 3d map
// filter1 -> converts 3d map into shadow map
// filter2 -> paints pixels

// ?? how to merge? different offsets? start with 1 light source


Phaser.Filter.Shadow6_Map = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.light = {value: {x: 0, y: 0, z:0}, type: '3f'};
    this.uniforms.lightSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.lightStrength = {value: 1.0, type: '1f'};

    function checkPoints(n) {
      var a = [];
      for (var i = 0; i < (n||Performance.ShadowsStepsCount||64); i++) a.push("CHECK_POINT(" + i + ".)");
      return a.join("\n");
    }


    this.fragmentSrc = [
        "precision mediump float;",
        "uniform sampler2D uSampler;",
        "uniform sampler2D iChannel0;",
        'varying vec2 vTextureCoord;',

        "uniform vec3 light;",
        "uniform vec2 lightSize;",
        "uniform float lightStrength;",

        "#define offsetY 0.",


        "#define M_PI 3.1415926535897932384626433832795",

        "float checkBitF(float val, float bit) { float f = pow(2., floor(mod(bit, 16.))); float vf = val - mod(val,f); return 1. - step(1., abs(floor(vf/f/2.)*2.*f - (vf-f)));  }",

        "void checkPoint(inout vec4 dist, in vec3 point) {",
                "vec4 hp = texture2D(iChannel0, vec2(floor(point.x) + " + (640/Performance.Map3dScale) + ". * floor(point.z / 16.), floor(point.y))/vec2(" + (640/Performance.Map3dScale)*2 + "., " + (640/Performance.Map3dScale) + ".));",
                "float mask = hp.g*255.0 * 256. + hp.r*255.0;",
                "dist.r = min(dist.r, mix(1., distance(point,light)/lightSize.x, checkBitF(mask, point.z)) );",
        "}",

        "#define CHECK_POINT(n) if (n < maxSteps) checkPoint(gl_FragColor, point + toLight * n / maxSteps);",

        "void main(void) {",
            "vec3 coords = vec3(gl_FragCoord.x, 640.-gl_FragCoord.y, 0);",
            //"gl_FragColor = texture2D(uSampler, coords.xy/640.);",
            //x = angle from 0 till 512, y = z from 32 to -32 (for now)
            "if (coords.y < offsetY || coords.y > offsetY + 64.) return;",
            //"if (coords.y > 64.) return;",
            "float angle = 2.*M_PI*coords.x/256.;",
            "float z = coords.y - 32.;",
            "vec3 point = vec3(cos(angle)*80. + light.x, sin(angle)*80. + light.y, z);",
            "gl_FragColor = vec4(1,0,0,1);",
            "vec3 toLight = point - light;",
            "float maxSteps = (max(abs(toLight.x), abs(toLight.y)));",
            checkPoints(),
            
            //todo: unwind loop later
            /*"for (int i = 0; i < 64; i++) {",
               "checkPoint(gl_FragColor, point + float(i)/maxSteps*toLight);",
            "}",*/
           
        "}"

    ];

};

Phaser.Filter.Shadow6_Map.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow6_Map.prototype.constructor = Phaser.Filter.Shadow6_Map;


Phaser.Filter.Shadow6_Render = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.light = {value: {x: 0, y: 0, z:0}, type: '3f'};
    this.uniforms.lightSize = {value: {x: 0, y: 0}, type: '2f'};
    this.uniforms.lightStrength = {value: 1.0, type: '1f'};


    this.fragmentSrc = [

        "precision mediump float;",
        "uniform sampler2D uSampler;",
        "uniform sampler2D iChannel0;",
        'varying vec2 vTextureCoord;',
        "#define M_PI 3.1415926535897932384626433832795",

        "uniform vec3 light;",
        "uniform vec2 lightSize;",
        "uniform float lightStrength;",


        "void main(void) {",
            "vec3 coords = vec3(gl_FragCoord.x, 640.-gl_FragCoord.y, 0);",
            "float lt = clamp(1. - distance(coords, light)/lightSize.x, 0., 1.);",

            "float d1 = distance(coords, light);",
            "float angle = atan(coords.x-light.x, coords.y-light.y);",
            "vec2 cpoint = vec2(cos(angle)*80., sin(angle)*80.); ",
            "vec3 tl = coords - light;",
            "float z = light.z + length(cpoint) / length(tl.xy) * tl.z;",
            "float a = 1.0;",
            "if (z > -32. && z < 32.) {",
                "float distance = lightSize.x * texture2D(iChannel0, vec2(mod(angle + 2. * M_PI, 2. * M_PI) * 256. / 2. / M_PI, (z+32.))).r;",
                "a = step(d1, distance);",
                "gl_FragColor.b = texture2D(iChannel0, vec2(0.,0.)).r;",
            "}",
           "//gl_FragColor.a = clamp(gl_FragColor.a - lightStrength * lt * (1. - a), 0., 1.);",

        "}"

    ];


};

Phaser.Filter.Shadow6_Render.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Shadow6_Render.prototype.constructor = Phaser.Filter.Shadow6_Render;
