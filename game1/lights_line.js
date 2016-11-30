Phaser.Filter.LightsLine = function(game) {
    Phaser.Filter.call(this, game);


    this.uniforms.offsetX = { type: '1f', value: 0.0 };
    this.uniforms.offsetY = { type: '1f', value: 0.0 };
    this.uniforms.rotation = {type: '1f', value: 0.0 };

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
            "vec2 p1 = (rotation == 0.0 ? vec2(0.0, 0.0) : vec2(0.0, resolution.y)); ",
            "vec2 p2 = (rotation == 0.0 ? resolution.xy : vec2(resolution.x, 0.0)); ",
            "float k = (p2.x-p1.x)/(p2.y-p1.y);",
            "float k2 = (fragCoord.x - p1.x) / (fragCoord.y - p1.y);",
            "float k3 = (p2.x - fragCoord.x) / (p2.y - fragCoord.y);",
            "float d1 = abs(-fragCoord.x + k*fragCoord.y + (p1.x - k*p1.y)) / sqrt(1.0+k*k);",
            "bool onLine = abs(d1) < 1.0;//abs(k2-k) < 0.2 || abs(k3-k)<0.2;",
            "bool inside = true;",
            "float dist = distance(fragCoord, p1);",
            "float realDist = distance(p1, p2);",
        
            "float l = sin((time/SLOW+dist/realDist)*PI*COUNT*2.0);",
            "gl_FragColor = vec4(1.0, 0.6, 0.0, 1.0) * (onLine && inside ? l : 0.0);",
        "}"
    ];

};


Phaser.Filter.LightsLine.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.LightsLine.prototype.constructor = Phaser.Filter.LightsLine;

Phaser.Filter.LightsLine.prototype.setOffset = function(x, y) {
    this.uniforms.offsetX.value = x;
    this.uniforms.offsetY.value = y;
};
Phaser.Filter.LightsLine.prototype.setRotation = function(b) {
    this.uniforms.rotation.value = b ? 1.0 : 0.0;
};