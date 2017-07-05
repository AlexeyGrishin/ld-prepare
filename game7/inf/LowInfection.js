class LowInfection extends Phaser.Filter {
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
            float pix = 1. / 1024.;
            float n = (cos(vTextureCoord.x*resolution.x * gl_FragColor.r) + sin(time)) / 4. + 0.5; 
            float around = texture2D(uSampler, vTextureCoord.xy + vec2(+pix,0)).a 
                       + texture2D(uSampler, vTextureCoord.xy + vec2(-pix,0)).a
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,+pix)).a
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,-pix)).a;
            float k = around <= 3. ? (0.5 + sin(time*around + vTextureCoord.x*time - vTextureCoord.y*around)/2.) : 1.;  
                     
            vec4 aclr = gl_FragColor * 0.2
                       + texture2D(uSampler, vTextureCoord.xy + vec2(+pix,0)) * 0.2
                       + texture2D(uSampler, vTextureCoord.xy + vec2(-pix,0)) * 0.2
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,+pix)) * 0.2
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,-pix)) * 0.2;
            float k2 = (0.5 + sin(time*around + vTextureCoord.x*time - vTextureCoord.y*aclr.a)/2.);           
            vec4 dclr = gl_FragColor * k2 + (
                         texture2D(uSampler, vTextureCoord.xy + vec2(+pix,0)) * 0.25
                       + texture2D(uSampler, vTextureCoord.xy + vec2(-pix,0)) * 0.25
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,+pix)) * 0.25
                       + texture2D(uSampler, vTextureCoord.xy + vec2(0,-pix)) * 0.25
                       ) * (1.-k2);                 
            gl_FragColor = dclr;   
            vec2 txy = vec2(gl_FragColor.r, 1.-gl_FragColor.r);
            vec4 color2 = vec4(12./256., 12./256., 12. / 256., 1.);// texture2D(iChannel0, txy);
            
            vec4 noise = texture2D(iChannel1, mod((vTextureCoord.xy*4.), vec2(1., 1.)));
            
                     
            if (gl_FragColor.a > 0.) {
                gl_FragColor.rgb = color2.rgb * gl_FragColor.a;
                gl_FragColor *= /*(0.9 + 0.1*n) * */ k;// * (noise.g > 0.95 ? 1. : 0.4);
            }
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
