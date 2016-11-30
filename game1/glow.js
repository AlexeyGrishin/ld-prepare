Phaser.Filter.Glow = function(game) {
    Phaser.Filter.call(this, game);


    this.uniforms.mul = { type: '1f', value: 1.0 };

    //got from https://www.shadertoy.com/view/4slGW7#
    this.fragmentSrc = [

        "precision mediump float;",

        "varying vec2       vTextureCoord;",
        "varying vec4       vColor;",
        "uniform float      time;",
        "uniform float      mul;",
        "uniform sampler2D  uSampler;",

        "void main(void) {",
            "gl_FragColor = texture2D(uSampler, vTextureCoord);",
            "gl_FragColor.rgb = gl_FragColor.rgb * mul;",
        "}"
    ];

};


Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;

Object.defineProperty(Phaser.Filter.Glow.prototype, 'mul', {

    get: function() {
        return this.uniforms.mul.value;
    },

    set: function(value) {
        this.uniforms.mul.value = value;
    }

});