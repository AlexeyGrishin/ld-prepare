Phaser.Filter.Blast = function(game) {
    Phaser.Filter.call(this, game);


    this.uniforms.offsetX = { type: '1f', value: 0.0 };
    this.uniforms.offsetY = { type: '1f', value: 0.0 };

    this.fragmentSrc = [

        "precision mediump float;",

        "uniform float     time;",
        "uniform vec2      resolution;",
        "uniform float     offsetX;",
        "uniform float     offsetY;",
        "uniform float     rotation;",

        "#define PI 3.1415926535897932384626433832795",

        "#define COUNT 12.0",
        "#define SLOW 4.0",
        "#define SLOW_EX 0.25",

        "void main(void) {",
        "//gl_FragColor = vec4(rotation,1.0-rotation,0,0);return;",
        "vec2 offset = vec2(offsetX, offsetY);",
        "vec2 fragCoord = gl_FragCoord.xy - offset;",
        "fragCoord.y += cos(time*20.0 + fragCoord.x/10.0);",
        "float dist = abs(fragCoord.y - resolution.y/2.0);",
        "float ndist = 16.0 + 2.0*sin(time*48.0);",
        "float l = dist <= ndist ? (1.0 - dist / ndist) : 0.0;",
        "gl_FragColor = vec4(1.0, 0.9, 0.8, 1.0) * l;",
        "}"
    ];

};


Phaser.Filter.Blast.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Blast.prototype.constructor = Phaser.Filter.Blast;

Phaser.Filter.Blast.prototype.setOffset = function(x, y) {
    this.uniforms.offsetX.value = x;
    this.uniforms.offsetY.value = y;
};
