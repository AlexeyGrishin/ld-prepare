(function(global) {

    //todo: print all sprites on single bitmap!

    let spritesPerSize = new Map();
    let MAX_SIZE = 32;
    let multiBitmap;

    function prepareInfectionSprites() {

        if (spritesPerSize.size != 0) return;

        let sprites = [];

        [[2,1], [3, 1], [4, 1], [5, 1], [6, 1], [7,1], [8,2], [9,2], [10,2], [11,2],[12,2]/*,[13,2],[14,3],[15,3],[16,3]*/].forEach(([r, d]) => {
            for (let si = 0; si < 2; si++) {
                sprites.push(createCircleSprites(r, d));
            }
            spritesPerSize.set(r, []);
        });
        multiBitmap = createMultiBitmap(MAX_SIZE, sprites, true);
        //game.add.sprite(512, 0, multiBitmap.bitmap);

        for (let size of spritesPerSize.keys()) {
            spritesPerSize.set(size, multiBitmap.find(size));
        }

    }


    function getSprite(size) {
        return game.rnd.pick(spritesPerSize.get(size));
    }

    function getFrames(sprite) {
        return sprite.width / sprite.height;
    }

    function drawSprite(bitmap, sprite, frame, rx, ry, xor) {
        multiBitmap.drawFrame(bitmap, sprite, frame, rx, ry,  xor ? 'xor' : null);
        /*
        bitmap.copyRect(sprite,
            {x: frame*sprite.height, y: 0, width: sprite.height, height: sprite.height},
            rx - sprite.height/2, ry - sprite.height/2, 1, xor ? 'xor' : null
            );*/
    }



    const GROW_SPEED = 1/120;

    function createInfectionController(points, textureBitmap, gridSize) {

        prepareInfectionSprites();

        let infectionPoints = points.map(p => {
            return {
                x: p.x, y: p.y, r: p.r, cells:p.cells,
                state: undefined,
                frame: 0
            }
        });

        let grid = [];
        for (let gx = 0; gx < gridSize; gx++) {
            let col = [];
            for (let gy = 0; gy < gridSize; gy++) {
                col.push(infectionPoints.filter(({cells}) => {
                    return cells.some(gp => gp.gx == gx && gp.gy == gy);
                }));
            }
            grid.push(col);
        }

        let growingPointIds = new Set();
        let removingPointIds = new Set();

        return {

            findPointsByGrid(gx, gy) {
                return grid[gx][gy];
            },

            addInfectionAt(point) {
                //todo: check state!
                if (point.state == 'growing') return;
                point.state = 'growing';
                point.sprite = getSprite(point.r);
                point.frame = -game.rnd.integerInRange(0,4);
                point.drawn = false;
                point.maxFrame = multiBitmap.getFrames(point.sprite) - 1;
                growingPointIds.add(infectionPoints.indexOf(point));
                removingPointIds.delete(infectionPoints.indexOf(point));
            },

            removeInfectionAt(point) {
                if (point.state != 'growing') return;
                point.state = 'removed';
                growingPointIds.delete(infectionPoints.indexOf(point));
                removingPointIds.add(infectionPoints.indexOf(point));

            },

            update() {
                for (let i = 0; i < infectionPoints.length; i++) {
                    let point = infectionPoints[i];
                    if (growingPointIds.has(i)) {
                        let oldIntFrame = point.frame|0;
                        point.frame += game.time.elapsed*GROW_SPEED;
                        let newIntFrame = point.frame|0;
                        if (point.frame >= 0 && (oldIntFrame != newIntFrame || !point.drawn)) {
                            if (point.drawn) {
                                drawSprite(textureBitmap, point.sprite, oldIntFrame, point.x, point.y, true);
                            }
                            drawSprite(textureBitmap, point.sprite, newIntFrame, point.x, point.y);
                            point.drawn = true;
                        }
                        if (newIntFrame == point.maxFrame) {
                            growingPointIds.delete(i);
                        }
                    }
                    if (removingPointIds.has(i)) {
                        if (point.state === 'removed' && point.drawn) {
                            drawSprite(textureBitmap, point.sprite, point.frame|0, point.x, point.y, true);
                            point.state = 'undefined';
                            point.drawn = false;
                        }
                        removingPointIds.delete(i);
                    }
                }
            }

        }


    }

    global.createInfectionController = createInfectionController;

})(window);