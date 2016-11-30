Phaser.Filter.LightsRound = function(game) {
    Phaser.Filter.call(this, game);


    this.uniforms.offsetX = { type: '1f', value: 0.0 };
    this.uniforms.offsetY = { type: '1f', value: 0.0 };
    
    this.fragmentSrc = [

        "precision mediump float;",

        "uniform float     time;",
        "uniform vec2      resolution;",
        "uniform float     offsetX;",
        "uniform float     offsetY;",
        "varying vec2      vTextureCoord;",

        "#define PI 3.1415926535897932384626433832795",

        "#define COUNT 36.0",
        "#define SLOW 2.0",
        "#define SLOW_EX 0.25",

        "void main(void) {",
            "//gl_FragColor=vec4(1,0,0,1)*((gl_FragCoord.x-offsetX)/resolution.x); return;",
            "vec2 offset = vec2(offsetX, offsetY);",
            "vec2 center = (resolution.xy / 2.0) + offset;",
            "vec2 dw = (0.45 * resolution.xy);",
            "float rad = min(dw.x, dw.y) * (1.0 + 0.03*sin(time/SLOW_EX));",
            "float dist = distance(gl_FragCoord.xy - offset, center - offset);",
            "float angle = atan(gl_FragCoord.x - center.x, gl_FragCoord.y - center.y);",
            "float r1 = rad*1.1, r2 = rad*0.9;",
            "bool inside = dist >= r2 && dist <= r1; //todo: smooth",
            "float l = inside ? max(0.0, sin(((angle - time/SLOW) / PI * 2.0 * COUNT))) : 0.0;",
            "float k = max(0.0, cos((dist-rad) * 6.0 / (r1-r2)));",
            "l = l * k;",
            "gl_FragColor = vec4(1.0, 0.6, 0.0, 1.0) * l;",
        "}"
    ];

};


Phaser.Filter.LightsRound.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.LightsRound.prototype.constructor = Phaser.Filter.LightsRound;

Phaser.Filter.LightsRound.prototype.setOffset = function(x, y) {
    this.uniforms.offsetX.value = x;
    this.uniforms.offsetY.value = y;
};