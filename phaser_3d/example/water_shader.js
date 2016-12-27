//https://www.shadertoy.com/view/Mt2SzR#, bit modified
//https://www.shadertoy.com/view/XdXGR7# too
Phaser.Filter.WaterShader = function(game) {
    Phaser.Filter.call(this, game);


    var header = [
        "precision mediump float;",
        "uniform sampler2D uSampler;",
        'varying vec2 vTextureCoord;',
        "uniform float time;"
    ];



    var main = [
        `float random(float x) {
     
            return fract(sin(x) * 10000.);
                  
        }
        
        float noise(vec2 p) {
        
            return random(p.x + p.y * 10000.);
                    
        }
        
        vec2 sw(vec2 p) { return vec2(floor(p.x), floor(p.y)); }
        vec2 se(vec2 p) { return vec2(ceil(p.x), floor(p.y)); }
        vec2 nw(vec2 p) { return vec2(floor(p.x), ceil(p.y)); }
        vec2 ne(vec2 p) { return vec2(ceil(p.x), ceil(p.y)); }
        
        float smoothNoise(vec2 p) {
        
            vec2 interp = smoothstep(0., 1., fract(p));
            float s = mix(noise(sw(p)), noise(se(p)), interp.x);
            float n = mix(noise(nw(p)), noise(ne(p)), interp.x);
            return mix(s, n, interp.y);
                
        }
        
        float fractalNoise(vec2 p) {
        
            float x = 0.;
            x += smoothNoise(p      );
            x += smoothNoise(p * 2. ) / 2.;
            x += smoothNoise(p * 4. ) / 4.;
            x += smoothNoise(p * 8. ) / 8.;
            x += smoothNoise(p * 16.) / 16.;
            x /= 1. + 1./2. + 1./4. + 1./8. + 1./16.;
            return x;
                    
        }
        
        float movingNoise(vec2 p) {
         
            float x = fractalNoise(p + time/2.);
            float y = fractalNoise(p - time/2.);
            return fractalNoise(p + vec2(x, y));   
            
        }
        
        // call this for water noise function
        float nestedNoise(vec2 p) {
            
            float x = movingNoise(p);
            float y = movingNoise(p);
            return movingNoise(p + vec2(x, y));
            
        }
        
        void main(void) {
            vec2 uv = vTextureCoord;
            float n = nestedNoise(uv * 64.);
            vec2 xy = uv - vec2(+n,-n)/64.;
            vec4 c = texture2D(uSampler, xy);
            
            gl_FragColor = c*n;
        }
    `];

    var main2 = [
        `
        const float PI = 3.14159265359;
float time2 = time;

const vec3 eps = vec3(0.01, 0.0, 0.0);

float genWave1(float len)
{
	float wave = sin(8.0 * PI * len + time2);
	wave = (wave + 1.0) * 0.5; // <0 ; 1>
	wave -= 0.3;
	wave *= wave * wave;
	return wave;
}

float genWave2(float len)
{
	float wave = sin(7.0 * PI * len + time2);
	float wavePow = 1.0 - pow(abs(wave*1.1), 0.8);
	wave = wavePow * wave; 
	return wave;
}

float scene(float len)
{
	// you can select type of waves
	return genWave1(len);
}

vec2 normal(float len) 
{
	float tg = (scene(len + eps.x) - scene(len)) / eps.x;
	return normalize(vec2(-tg, 1.0));
}

void main()
{
	vec2 uv = vTextureCoord;
	vec2 pos2 = vec2(uv - vec2(0.5, 2.)); 	  //wave origin
	pos2.x = cos(pos2.x+time/10.);
	vec2 pos2n = normalize(pos2);

	float len = length(pos2);
	float wave = scene(len); 

	vec2 uv2 = -pos2n * wave/(1.0 + 5.0 * len);

	gl_FragColor = vec4(texture2D(uSampler, uv + uv2));
}
        `
    ];

    this.fragmentSrc = header.concat(main2);


};

Phaser.Filter.WaterShader.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.WaterShader.prototype.constructor = Phaser.Filter.WaterShader;

