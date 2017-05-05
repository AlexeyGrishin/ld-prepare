
function addDirection(item, last, direction) {
    item.x = last.x;
    item.y = last.y;
    item.color = last.color;
    item.delta = {x:0, y:0, angle:0, dist: 0};
    let ch = {
        u: {y:-1},
        ul: {y:-1, x:-1},
        ur: {y:-1, x:+1},
        l: {x:-1},
        r: {x:+1},
        dl: {y:+1, x:-1},
        dr: {y:+1, x:+1},
        d: {y:+1}
    }[direction];
    item.x += ch.x||0;
    item.y += ch.y||0;
    delete item.direction;
    return item;
}

function normalize(model, startPoint) {
    let out = [];
    for (let item of model) {
        let last = out.length == 0 ? startPoint : out[out.length-1];
        if (Array.isArray(item)) {
            out.push({branches: item.map(i => normalize(i, last))});
            continue;
        }

        if (typeof item === 'object') {
            item.delta = {x:0, y:0, angle: 0, dist: 0};
            if (item.direction) {
                addDirection(item, last, item.direction);
            }
        } else {
            item = addDirection({}, last, item);
        }
        if (last) {
            let dist = Math.hypot(item.y - last.y, item.x - last.x);
            item.angle = Math.atan2((item.y - last.y) / dist, (item.x - last.x) / dist);
            item.dist = dist;
            let check = {
                x: last.x + dist * Math.cos(item.angle),
                y: last.y + dist * Math.sin(item.angle)
            };
            if (!Phaser.Math.fuzzyEqual(check.x, item.x, 0.01) || !Phaser.Math.fuzzyEqual(check.y, item.y, 0.01)) {
                console.error(last, '+', item.angle, ' ==> ', check, '!=', item)
            }
        }

        out.push(item);
    }
    return out;
}

class GrassModel {

    constructor(model) {
        let bm = game.add.bitmapData(24, 24);
        this.bitmap = bm;
        //todo: ok, better to pre-calculate all possible sprites and render them as usual animation.
        this.model = normalize(model);
        this.impacter = fromLeafImpacter(this.model);
        this.butons = {};
        this.realSize = {
            x: 12,
            y: 23,
            width: 0,
            height: 0,
            calculated: false
        };
        this.recalculateModel();
        this.drawModel();
    }

    getButonSprite(item) {
        let k = item.key + '_' + item.frame;
        if (!this.butons[k]) {
            this.butons[k] = game.make.sprite(0,0,item.key, item.frame);
            this.butons[k].anchor.set(0.5, 0.5);
        }
        return this.butons[k];
    }

    recalculateModel() {
        let recalcBranch = (branch, prev, prevDeltaAngle) => {
            for (let item of branch) {
                if (item.branches) {
                    item.branches.forEach(branch => recalcBranch(branch, prev, prevDeltaAngle));
                    continue;
                } else {
                    if (prev) {
                        let px = prev.x + prev.delta.x;
                        let py = prev.y + prev.delta.y;
                        let angle = prevDeltaAngle + item.angle + item.delta.angle;
                        let dist = item.dist + item.delta.dist;
                        let nx = px + dist * Math.cos(angle);
                        let ny = py + dist * Math.sin(angle);
                        this.realSize.width = Math.max(this.realSize.width, Math.abs(nx-this.realSize.x)*2);
                        this.realSize.height = Math.max(this.realSize.height, Math.abs(ny-this.realSize.y));
                        item.delta.x = nx - item.x;
                        item.delta.y = ny - item.y;
                        item.calculatedAngle = angle;
                    }
                }
                prev = item;
                prevDeltaAngle += prev.delta.angle;
            }
        };
        recalcBranch(this.model, undefined, 0);
        this.realSize.calculated = true;
    }

    drawModel(model = this.model) {

        this.bitmap.clear();
        this.bitmap.update(0, 0, 24, 24);

        let postAdd = [];

        let drawBranch = (branch, prev) => {
            //this.bitmap.context.beginPath();
            //this.bitmap.context.strokeStyle = "rgb(" + [branch[0].color.r, branch[0].color.g, branch[0].color.b].join(',') + ')';
            for (let item of branch) {
                if (item.branches) {
                    //this.bitmap.context.stroke();
                    item.branches.forEach(branch => drawBranch(branch, prev));
                    return;
                } else {
                    let px = prev ? ((prev.x + prev.delta.x)|0) : 0;
                    let py = prev ? ((prev.y + prev.delta.y)|0) : 0;
                    let x = (item.x + item.delta.x)|0;
                    let y = (item.y + item.delta.y)|0;
                    if (x >= 0 && y >= 0 && x < 24 && y < 24) {
                        if (!item.key) {
                            this.bitmap.setPixel(x, y, item.color.r, item.color.g, item.color.b, false);
                            if (prev && (Math.abs(px-x) > 1 || Math.abs(py-y) > 1)) {
                                let nx = ((px+x)/2)|0;
                                let ny = ((py+y)/2)|0;
                                this.bitmap.setPixel(nx, ny, item.color.r, item.color.g, item.color.b, false);
                            }
                            //this.bitmap.context[first ? 'moveTo' : 'lineTo'](x, y);
                        } else {
                            postAdd.push({x: x + (item.offsetX||0), y: y + (item.offsetY||0), sprite: this.getButonSprite(item), tint: item.tint || 0xffffff});
                        }
                    }
                }
                prev = item;
            }
            //this.bitmap.context.stroke();
        };

        drawBranch(model);

        this.bitmap.context.putImageData(this.bitmap.imageData, 0, 0);
        this.bitmap.dirty = true;

        for (let {x,y,sprite,tint} of postAdd) {
            sprite.tint = tint;
            this.bitmap.draw(sprite, x, y);
        }

    }

    updateWind(direction, power, offsetY) {
        //if (!this.impacting) {
            this.impact(direction, power, offsetY);
        //}
    }

    impact(direction, power, offsetY) {
        this.impacter.impact(direction, power, offsetY);
    }

    update() {
        let needRedraw = this.impacter.update();
        if (needRedraw) {
            this.recalculateModel();
            this.drawModel();
        }
    }

    resize(sprite) {
        sprite.width = 24;
        sprite.height = 24;
        if (sprite.body) {
            sprite.body.setSize(this.realSize.width+1, this.realSize.height, (this.realSize.x-this.realSize.width/2)|0, this.realSize.y - this.realSize.height);
        }
    }

}

function simpleImpacter(model) {
    let impacting = false, pwr = 0, direction = 0, startImpactingTime = 0;
    return {
        impact(dir, power) {
            if (power == 0) return;
            if (!impacting) {
                startImpactingTime = game.time.time;
            }
            impacting = true;
            pwr = Math.max(power, pwr);
            direction = dir;
        },

        update() {
            if (impacting) {
                //console.log(this.pwr);
                model[3].delta.angle = direction * pwr * Math.sin((game.time.time - startImpactingTime) / 200) * Math.PI / 12;
                pwr *= 0.98;
                if (pwr < 0.1) {
                    pwr = 0;
                    impacting = false;
                    model[3].delta.angle = 0;
                }
                return true;
            }
        }
    }
}

function fromLeafImpacter(model) {
    let leafs = [];

    function walkBranch(branch, reverseBranch) {
        let last;
        for (let item of branch) {
            if (item.branches) {
                item.branches.forEach(b => walkBranch(b, reverseBranch.slice()));
                return;
            } else {
                reverseBranch.unshift(item);
                last = item;
            }
        }
        leafs.push(reverseBranch);
    }

    walkBranch(model, []);

    let direction = 0, pwr = 0, impacting = false, startImpactingTime;

    return {


        impact(dir, power, offsetY) {
            if (power === 0) return;
            direction = dir;
            pwr = Math.max(pwr, power);
            impacting = true;
            startImpactingTime = game.time.time;
        },

        update() {
            if (impacting) {
                pwr *= 0.99;
                if (pwr < 0.1) {
                    pwr = 0;
                    impacting = false;
                }

                const REDUCE = 0.85;
                const SHIFT = 0.4;

                let lpwr = pwr;
                for (let li = 0; li < 24; li++) {
                    if (lpwr < 0.1) lpwr = 0;
                    for (let branch of leafs) {
                        if (branch[li]) {
                            let rev = isNaN(branch[li].angle) ? 1 : Math.sign(Math.cos(branch[li].angle));
                            branch[li].delta.angle = rev * direction * lpwr * Math.sin(SHIFT * li + (game.time.time - startImpactingTime) / 200) * Math.PI / 8;
                        }
                    }
                    lpwr *= REDUCE;
                }

                return true;
            }
        }
    }


}

function pointImpacter(model) {


    /*

     todo:
     impact initiates oscillation of grass fragment, then it is auto-reducing in update.
     so pwr is not "global", it is local for offset y

        create bi-linked list (up and down), and also map y -> grass part.
        then on impact - mark part as impacted, and propagate movement up and down.


     */
    let biList = [];

    let leafs = [];

    function walkBranch(branch, reverseBranch) {
        let last;
        for (let item of branch) {
            if (item.branches) {
                item.branches.forEach(b => walkBranch(b, reverseBranch.slice()));
                return;
            } else {
                reverseBranch.unshift(item);
                last = item;
            }
        }
        leafs.push(reverseBranch);
    }

    walkBranch(model, []);



}