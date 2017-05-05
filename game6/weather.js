
class Sun extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'sun');
        this.animations.add('idle', [0]);
        this.animations.add('smiling', [1,2,3,4,5,6], 8);
        this.animations.add('unsmiling', [5,4,3,2,1,0], 8);
        this.animations.add('scary', [7,8,9,10,11,12,13], 8);
        this.animations.add('unscary', [12,8,7,5], 8);

        this.bitmap = game.add.bitmapData(game.width, game.height);

        let bitmapSprite = game.add.sprite(0, 0, this.bitmap);
        game.add.existing(this);

        game.sun = this;
        this.state = 'idle';
        this.anchor.set(0.5, 0.5);

        this.pwr = 1;
        this.redrawSky();

        this.animations.play('smiling');

    }

    redrawSky() {
        drawLightSource1(this.bitmap, {x: this.x, y: this.y, radius: (48*this.pwr)|0, pwr: this.pwr});
    }

    update() {

        let hasOverlap = false;

        cloudGrp.forEach(cloud => {
            hasOverlap = hasOverlap || (cloud.overlap(this) && cloud.windResistance < 0.5);
        });
        let hadPwr = this.pwr;
        if (hasOverlap) {
            this.pwr *= 0.99;
            if (this.pwr < 0.1) this.pwr = 0;
        } else {
            if (this.pwr === 0) this.pwr = 0.1;
            this.pwr *= 1/0.99;
            this.pwr = Math.min(1, this.pwr);
        }
        if (this.pwr != hadPwr) {
            this.redrawSky();
        }

        if (hasOverlap && this.state == 'idle') {
            this.animations.play('scary');
            this.state = 'scary';
        }
        if (!hasOverlap && this.state == 'scary') {
            this.state = 'idle';
            this.animations.play('unscary');
        }
    }
}

class Cloud extends Phaser.Sprite {
    constructor(x, y) {
        super(game, x, y, 'cloud', 0);
        cloudGrp.add(this);
        this.windResistance = 0;
        this.anchor.set(0.5, 0.5);
        game.physics.arcade.enable(this);
    }


    update() {
        if (this.windResistance > 0) {
            this.windResistance *= 0.98;
        }
        let speedToSun = 0;
        if (this.x < game.sun.x) {
            speedToSun = Math.max(0.2, Math.pow(game.sun.x - this.x, 0.1)*0.2);
        }
        this.speedX = speedToSun - this.windResistance;

        this.x += this.speedX;
    }

    updateWind() {
        this.windResistance = 2;
    }
}


var _cache = {};
function lightGradient(size, rgb, stopColor) {
    var k = size + "_" + rgb;
    return _cache[k] || (_cache[k] = (function() {
            var c = document.createElement('canvas');
            c.setAttribute('width', size*2);
            c.setAttribute('height', size*2);
            var ctx = c.getContext('2d');
            var grad = ctx.createRadialGradient(size, size, size, size, size, 10);
            grad.addColorStop(1, "rgb(" + rgb + ")");
            grad.addColorStop(0.5, "rgba(" + rgb + ",0.5)");
            grad.addColorStop(0, stopColor || "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.arc(size, size, size, 0, Math.PI*2);
            ctx.fill();
            return c;
        })());
}

function drawLightSource1(bitmap, light) {
    bitmap.context.clearRect(0, 0, bitmap.width, bitmap.height);
    bitmap.context.fillStyle = "rgba(0,0,0," + (0.1 * (1 -light.pwr)).toFixed(3) + ")";
    bitmap.context.fillRect(0, 0, bitmap.width, bitmap.height);
    let gradient = lightGradient(light.radius, "255,255,240", "rgba(255,255,240,0)");
    bitmap.context.drawImage(gradient, light.x - light.radius, light.y - light.radius);
    bitmap.dirty = true;
}
