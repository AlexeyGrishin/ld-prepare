Phaser.Filter.Fireball = function(game) {
    Phaser.Filter.call(this, game);

    this.uniforms.offset = { type: '2f', value: {x:0, y:0}};

    this.fragmentSrc = [

        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform vec2       offset;",
        "uniform float      time;",
        "uniform sampler2D  uSampler;",

        "const float size = 48.;",

        "void main(void) {",
            "vec2 coord = vec2(gl_FragCoord.x - offset.x, 640. - gl_FragCoord.y - offset.y);",
            "float distance = distance(coord, vec2(size)/2.);",

            "gl_FragColor = vec4(1,0,0.5,0.9) * (1. - distance/size*2.);",
            "//gl_FragColor = vec4(0,0,1,1) * (1. - coord.y/size);",
            "//if (coord.y < 16.) {gl_FragColor.g = 1.; gl_FragColor.a = 1.;};",
        "}"
    ];

};


Phaser.Filter.Fireball.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Fireball.prototype.constructor = Phaser.Filter.Fireball;