(function(global) {

    let particles;

    function createGrower(grid, bitmap) {

        prepareParticles();

        let growingBitmap = game.add.bitmapData(bitmap.width, bitmap.height);
        let growingSprite = game.add.sprite(-bitmap.width, 0, growingBitmap);

        return {

            update() {
                let updatedCount = 0;
                grid.forEach((val, gx, gy, cell, x, y) => {
                    if (cell.dirty) {
                        let updated = updateCell(cell, x, y, gx, gy);
                        cell.dirty = updated;
                        updatedCount++;
                        //todo: recolor
                    }
                });
                if (growingBitmap._inited) {
                    growingBitmap.ctx.drawImage(bitmap.canvas, 0, 0);
                    bitmap.ctx.globalCompositeOperation = "source-over";
                    bitmap.ctx.drawImage(growingBitmap.canvas, 0, 0);
                    bitmap.dirty = true;
                    growingBitmap._inited = false;
                }
                return updatedCount;
            }
        };


        function updateCell(cell, x, y, gx, gy) {
            if (!growingBitmap._inited) {
                growingBitmap.context.clearRect(0, 0, growingBitmap.width, growingBitmap.height);
                growingBitmap._inited = true;
            }
            let ar = aroundGrown(grid, gx, gy);
            if (!cell._state) {
                cell._state = {};
            }
            const SPEED = 2;
            const PIX_PER_STEP = 4;
            if (cell.value) {
                //growing
                if (!cell._state.growing) {
                    cell._state.delay = game.rnd.integerInRange(0, 5);
                    //need to init
                    if (ar.total == 0) {
                        //console.log('alone');
                        cell._state.growing = [{
                            particle: game.rnd.pick(particles),
                            x: x,
                            y: y,
                            dx: 0,
                            dy: 0,
                            stepsLeft: PIX/2,
                            skipLeft: (x+y)%SPEED,
                            size: (stepsLeft) => (1-stepsLeft/PIX*2)*1.8
                        }];
                        bitmap.dirty = true;
                    } else {
                        let ps = [];
                        ar.list.forEach(({ax,ay}) => {
                            ps.push({
                                x: x+ax*PIX+game.rnd.integerInRange(-1,1),
                                y: y+ay*PIX+game.rnd.integerInRange(-1,1),
                                dx: -ax*PIX_PER_STEP,
                                dy: -ay*PIX_PER_STEP,
                                stepsLeft: PIX/PIX_PER_STEP+1,
                                particle: game.rnd.pick(particles),
                                skipLeft: (x+y)%SPEED,
                                size: (stepsLeft) => { return (Math.abs(((stepsLeft-2)/(PIX/PIX_PER_STEP) - 0.5)))*1.8 + 0.5}
                            });
                        });
                        cell._state.growing = ps;
                    }

                }
                delete cell._state.reducing;
                if (cell._state.delay-->0) return true;

                if ( cell._state.growing !== true) {
                    let somethingChanged = 0;
                    cell._state.growing.forEach(part => {

                        if (part.skipLeft == 0) {
                            part.skipLeft = SPEED;
                        } else {
                            part.skipLeft--;
                            return;
                        }
                        growingBitmap.ctx.globalCompositeOperation = "source-over";
                        drawParticle(growingBitmap.ctx, part.x, part.y, part.particle, {scale: part.size(part.stepsLeft)});
                        //debug
                        //bitmap.context.strokeStyle = 'black';
                        //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
                        part.x += part.dx + Math.sign(part.dx)*game.rnd.pick([0,0,0,0,0,-1,1]);
                        part.y += part.dy + Math.sign(part.dy)*game.rnd.pick([0,0,0,0,0,-1,1]);
                        //bitmap.context.lineTo(100+part.x-sx,part.y-sy);
                        //bitmap.context.stroke();
                        part.stepsLeft--;
                        if (part.stepsLeft == 0) {
                            cell._state.growing = true;
                            grid.justGrown(gx, gy, cell);
                            //bitmap.update(0, 0, bitmap.width, bitmap.height);
                        }
                        somethingChanged++;
                    });
                    if (somethingChanged) {
                        growingBitmap.dirty = true;
                    }
                } else {
                    return false;
                }
            } else {
                if (!cell._state.reducing) {
                    if (ar.total == 0) {
                        //todo: animate;
                        cell._state.reducing = [{
                            x: x,
                            y: y,
                            dx: 0,
                            dy: 0,
                            particle: particles[0],
                            stepsLeft: PIX,
                            skipLeft: (x+y)%SPEED,
                            size: (stepsLeft) => (1-stepsLeft/PIX)*1.5
                        }];
                    } else {
                        let ps = [];
                        ar.list.forEach(({ax,ay,val}) => {
                            ps.push({
                                x: x,
                                y: y,
                                dx: ax*PIX_PER_STEP,
                                dy: ay*PIX_PER_STEP,
                                stepsLeft: PIX/PIX_PER_STEP/2,
                                particle: particles[0],
                                skipLeft: (x+y)%SPEED,
                                size: (stepsLeft) => { return 1.2}
                            });
                        });
                        ps.push({
                            x: x,
                            y: y,
                            dx: 0,
                            dy: 0,
                            particle: particles[0],
                            stepsLeft: PIX/2,
                            skipLeft: (x+y)%SPEED,
                            size: (stepsLeft) => (1-stepsLeft/PIX*2)*1.5
                        });

                        cell._state.reducing = ps;
                    }
                    bitmap.dirty = true;
                    delete cell._state.growing;
                }
                if (cell._state.reducing === true) {
                    return false;
                } else {
                    let somethingChanged = 0;
                    bitmap.ctx.globalCompositeOperation = "destination-out";
                    cell._state.reducing.forEach(part => {
                        if (part.skipLeft == 0) {
                            part.skipLeft = SPEED;
                        } else {
                            part.skipLeft--;
                            return;
                        }
                        drawParticle(bitmap.ctx, part.x, part.y, part.particle, {scale: part.size(part.stepsLeft)});
                        //debug
                        //bitmap.context.strokeStyle = 'black';
                        //bitmap.context.moveTo(100+part.x-sx,part.y-sy);
                        part.x += part.dx + Math.sign(part.dx)*game.rnd.pick([0,0,0,0,0,-1,1]);
                        part.y += part.dy + Math.sign(part.dy)*game.rnd.pick([0,0,0,0,0,-1,1]);
                        //bitmap.context.lineTo(100+part.x-sx,part.y-sy);
                        //bitmap.context.stroke();
                        part.stepsLeft--;
                        if (part.stepsLeft == 0) {
                            cell._state.reducing = true;
                            grid.justReduced(gx, gy, cell);

                            //bitmap.update(0, 0, bitmap.width, bitmap.height);
                        }
                        somethingChanged++;
                    });
                    if (somethingChanged) {
                        bitmap.dirty = true;
                    }
                }

            }

            return true;
        }
    }

    global.createGrower = createGrower;




    function prepareParticles() {
        if (particles) return;
        particles = [];
        for (let i = 0; i < 10; i++) {
            let canvas1 = document.createElement('canvas');
            document.body.appendChild(canvas1);
            canvas1.width = PIX;
            canvas1.height = PIX;
            let context = canvas1.getContext('2d');
            //context.globalAlpha = 1;// + 0.1*game.rnd.frac();
            context.fillStyle = `rgb(${game.rnd.integerInRange(250,255)},0,50)`;
            context.beginPath();
            context.arc(PIX / 2, PIX / 2, PIX / 8 * 2, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = 'rgba(255,0,255,255)';
            context.globalCompositeOperation = 'destination-out';
            context.beginPath();
            for (let j = 0; j < i*10; j++) {
                context.rect(
                    game.rnd.integerInRange(0, PIX-1),
                    game.rnd.integerInRange(0, PIX-1),
                    game.rnd.integerInRange(1,2),
                    game.rnd.integerInRange(1,2)
                );
            }
            context.fill();
            //todo: add some noise
            canvas1.cache = {};
            particles.push(canvas1);
        }
    }

    function drawParticle(context, x, y, particle, mode) {
        particle = particle || game.rnd.pick(particles);
        if (!mode || mode.scale == 1) {
            context.drawImage(particle, x | 0, y | 0);
        } else if (mode.scale) {

            if (!particle.cache[mode.scale]) {
                let oldW = PIX, oldH = PIX, oldMiddle = PIX/2;
                let newW = (oldW*mode.scale) |0, newH = (oldH*mode.scale)|0;
                let newMiddle = (newW/2)|0;
                let diff = newMiddle - oldMiddle;
                //todo: cache sized particles
                //console.log(mode, ': ', x,y, '->', newX, newY, newW, newH);

                let c = document.createElement('canvas');
                c.width = PIX;
                c.height = PIX;
                let ctx = c.getContext('2d');

                ctx.drawImage(particle, 0, 0, oldW, oldH, -diff, -diff, newW, newH);
                particle.cache[mode.scale] = c;
            }
            context.drawImage(particle.cache[mode.scale], x|0, y|0);


        }
    }


    function aroundBase(getter, gx, gy) {
        let res = {
            total: 0,
            list: []
        };
        for (let ax = -1; ax <= 1; ax++) {
            //let r = {};
            //res[ax] = r;
            for (let ay = -1; ay <= 1; ay++) {
                let val = /*r[ay] = */getter(gx+ax, gy+ay);
                if (val && (ay != 0 || ax != 0)) {
                    res.total++;
                    res.list.push({ax, ay, val});
                }
            }
        }
        return res;
    }

    function around(grid, gx, gy) {
        return aroundBase(grid, (gx,gy) => grid.get(gx, gy), gx, gy);
    }

    function aroundGrown(grid, gx, gy) {
        return aroundBase((gx, gy) => {
            let cell = grid.getCell(gx, gy);
            return cell && cell._state && cell._state.growing === true
        }, gx, gy)
    }



})(window);