class Breathing extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.uniforms.textureSize =  { value: { x: 0, y: 0 }, type: '2f' };

        this.fragmentSrc = `
        precision mediump float; 
        
        varying vec2       vTextureCoord;
        uniform float      time;
        uniform sampler2D  uSampler;
        uniform sampler2D  iChannel0;
        uniform sampler2D  iChannel1;
        uniform vec2       resolution;
        uniform vec2       textureSize;

        
        void main(void) {
            gl_FragColor = texture2D(uSampler, vTextureCoord.xy);
            //vec4 rnd = texture2D(uSampler, vec2(0.5 + 0.5*sin(vTextureCoord.x), 0.5 + 0.5*cos(vTextureCoord.y + mod(time, 6.28))));
            vec4 rnd = texture2D(iChannel1, vTextureCoord.yx*2.);
            float a2 = 3. * rnd.b;
            float a4 = 5. * rnd.g;
            //float k = mod(time + a2, a4) > a4/2. ? 1. : 0.;// cos(mod(time*2. + a2, 6.28))*0.5 + 0.5;
            float k = cos(mod(time*2. + a2, 6.28))*0.5 + 0.5;
            float r = gl_FragColor.r == 0. ? 1. : gl_FragColor.r;
            float b = gl_FragColor.b == 0. ? 1. : gl_FragColor.b;
            float rint = k * r  + (1.-k)* b;
           
            float a = 1.;// - pow(rint,10.);
            
            //vec4 clr = texture2D(iChannel0, vec2(1.-rint, 0.5));
            vec4 clr;
            if (rint > 0.9) {
              clr = vec4(74., 26., 39., 255.) / 255.;
              //clr = vec4(0,0,1,1);
            } else if (rint > 0.8) {
              clr = vec4(136., 47., 53., 255.) / 255.;
              //clr = vec4(0,1,0,1);
            } else {
              clr = vec4(190., 62., 62., 255.) / 255.;
              //clr = vec4(1,0,0,1);
            }
            //if (k > 0.5) clr = vec4(rint,0,0,1); else clr = vec4(0,0,rint,1);
            gl_FragColor = clr * a * (gl_FragColor.a > 0. ? 1. : 0.);
            
          
        }
        
        `;
    }

    attach(sprite) {
        this.uniforms.resolution.value = { x: game.world.width, y: game.world.height };
        this.uniforms.offset.value = { x: sprite.x, y: sprite.y };
    }

    update() {
        super.update();
    }

}
