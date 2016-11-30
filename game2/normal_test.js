Phaser.Filter.NormalTest = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.lightPosition = {type: '2f', value: {x:0, y:0}};
    this.uniforms.lightDistance = {type: '1f', value: 100};
    this.uniforms.offset = {type: '2f', value: {x:0, y:0}};
    this.uniforms.size = {type: '2f', value: {x:0, y:0}};

    this.fragmentSrc = [
        "precision mediump float;",

        "uniform sampler2D iChannel1;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',
        "uniform vec2      resolution;",
        "uniform vec2      offset;",
        "uniform vec2      size;",
        "uniform vec2      lightPosition;",

        "const vec4 LightColor = vec4(1.0, 1.0, 1.0, 1.0);",      //light RGBA -- alpha is intensity
        "const vec4 AmbientColor = vec4(1.0, 1.0, 1.0, 0.5);",    //ambient RGBA -- alpha is intensity
        "const vec3 Falloff = vec3(0.0, 1.0, 0.2);",         //attenuation coefficients

        "",
        "void main(void) {",
            //"vec2 coords = vec2(gl_FragCoord.x - offset.x, gl_FragCoord.y - offset.y) / vec2(resolution.x,-resolution.y);",
            "vec2 coords = vec2(gl_FragCoord.x, 320.0 - gl_FragCoord.y) / vec2(511,511);",
            "vec4 origColor = texture2D(uSampler, vTextureCoord);",
        "gl_FragColor = origColor;" +
            "vec4 normColorA = texture2D(iChannel1, coords); vec3 normColor = normColorA.rgb;",
            "if (normColorA.a == 0.0) {return;}",
            "vec2 a = vec2(gl_FragCoord.x / 320., (320. - gl_FragCoord.y)/320.);",
            "//a.y = 1.0-a.y;",
            "vec3 LightDir = vec3(lightPosition.xy - a, 0);",
            "//LightDir = vec3(0, 1, 0);", //todo: temp
             "float D = length(LightDir);",
            "vec3 N = normalize(normColor * 2.0 - 1.0);",
            "vec3 L = normalize(LightDir);",
            "vec3 Diffuse = (LightColor.rgb * LightColor.a) * max(dot(N, L), 0.0);",

            //pre-multiply ambient color with intensity
            "vec3 Ambient = AmbientColor.rgb * AmbientColor.a;",

            //calculate attenuation
            "float Attenuation = 1.0;// 1.0 / ( Falloff.x + (Falloff.y*D) + (Falloff.z*D*D) );",

        //the calculation which brings it all together
            "vec3 Intensity = Ambient + Diffuse * Attenuation;",
            "vec3 FinalColor = origColor.rgb * Intensity;",
            "//gl_FragColor = vec4(FinalColor, origColor.a);",
            "//gl_FragColor.rgb = normColor;",
            "//gl_FragColor = origColor*Attenuation;",
            "gl_FragColor.rgb = origColor.rgb / origColor.a * (0.8 + 0.5*max(0.0, dot(N, L)));",
            //todo: do not understand exactly why max(0, dot)
            //todo: stupid me. angle between NORMAL and LIGHT. if parallel - will be 1. if orthogonal will be 0. if acute - will be from 0 to 1. if "TUPOJ" - will be less than 0, no need to use -> max
            "//if (gl_FragCoord.y < 10.0) gl_FragColor = vec4(1,0,0,1);",
        "}"
    ]
};

Phaser.Filter.NormalTest.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.NormalTest.prototype.constructor = Phaser.Filter.NormalTest;

Phaser.Filter.NormalTest.prototype.setup = function(texture) {
    this.uniforms.iChannel1.value = texture;
    this.uniforms.iChannel1.textureData = {nearest: true};
    this.uniforms.size.value = {x:texture.width, y:-texture.height};

    //console.log(texture);
    //this.uniforms.iChannel1.textureData = {width: 16, height: 16};
};
Phaser.Filter.NormalTest.prototype.updateLight = function(lightX, lightY) {
    this.uniforms.lightPosition.value = {x:lightX/320, y:lightY/320};

};
Phaser.Filter.NormalTest.prototype.setOffset = function(x, y) {
    //vec2(11*16, 15*16)
    this.uniforms.offset.value = {x:x,y:320-y-16-16-8};     //todo: it is mad.. I'm a bit confused why it is so
};

