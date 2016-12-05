Phaser.Filter.Ground = function(game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [

        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "uniform vec2       offset;",
        "uniform float      time;",
        "uniform sampler2D  uSampler;",
        "uniform sampler2D  iChannel0;",

        "const float size = 48.;",

        "void main(void) {",
        "vec2 coord = vec2(gl_FragCoord.x, 640. - gl_FragCoord.y);",
        "vec4 origColor = texture2D(uSampler, vTextureCoord);",
        "vec4 texColor = texture2D(iChannel0, mod(coord, vec2(512))/vec2(512) );",
        "gl_FragColor = (1. - 0.5*origColor.r)*texColor;",
        "}"
    ];

};


Phaser.Filter.Ground.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Ground.prototype.constructor = Phaser.Filter.Ground;