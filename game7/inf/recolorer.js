(function(global) {

    var t = 0;
    var each = 4;

    global.recolorAll = function(bitmap, grid) {
        if (!bitmap._updated) {
            bitmap.update(0, 0, bitmap.width, bitmap.height);
            bitmap._updated = true;
        }
        var width = bitmap.width;
        var height = bitmap.height;
        var data = bitmap.imageData.data;
        var len = data.length;
        var row = width * 4;
        var pad = 0;
        t = (t+1)%each;
        var x = t, y = 0;
        var dx = each;

        var red,blue,green,maxR,minR,alpha,gx,gy,cell, redAround, emptyAround, updatesCount=0;

        var updates = [];

        for (var i = t*4; i < len; i+= 4*each) {
            if (x < pad || x > width - pad || y < pad || y > height - pad) {
                x+=dx;
                if (x >= width) {
                    x-=width;
                    y++;
                }
                continue;
            }

            red = data[i];
            blue = data[i+2];
            green = data[i+1];
            maxR = red;
            minR = red;
            alpha = data[i+3];

            if (red && alpha < 250) {
                data[i+3] += 5;
                updatesCount++;
            }

            gx = (x)>>PIX_SHIFT;// 0;// ((sx+x)/PIX) |0;
            gy = (y)>>PIX_SHIFT;
            cell = grid.grid[gx][gy];
            if (!red) {
                if (cell.value && cell._total == 8) {
                    redAround = false;
                    if (i + 4 < len-4 && data[i+4]) {
                        redAround = true;
                    } else if (i - 4 > 0 && data[i-4]) {
                        redAround = true;
                    } else if (i + row < len && data[i+row]) {
                        redAround = true;
                    } else if (i - row > 0 && data[i-row]) {
                        redAround = true;
                    }

                    if (redAround) {
                        updates.push({i, r: 255, g: 3});
                    }
                }
            } else {
                if (!cell.value) {
                    if (cell._total === 0 || cell._state.reducing === true) {

                        if (blue >= 30) {
                            updates.push({i, del: true});
                        } else {
                            emptyAround = false;
                            if (i + 4 < len-4 && data[i+4+3] < 100) {
                                emptyAround = true;
                            } else if (i - 4 > 0 && data[i-4+3] < 100) {
                                emptyAround = true;
                            } else if (i + row < len && data[i+row+3]<100) {
                                emptyAround = true;
                            } else if (i - row > 0 && data[i-row+3]<100) {
                                emptyAround = true;
                            }

                            if (emptyAround) updates.push({i, b: Math.min(251, blue + 10)});
                        }
                    }
                }
            }

            x+=dx;
            if (x >= width) {
                x-=width;
                y++;
            }
        }
        for (var ui = 0; ui < updates.length; ui++) {
            var up = updates[ui];

            if (up.del) {
                data[up.i+3] = 0;
                data[up.i] = 0;
            } else if (up.b) {
                data[up.i] = 255-up.b;
                data[up.i+1] = 0;
                data[up.i+2] = up.b;
            } else if (up.r) {
                data[up.i] = up.r;
                if (up.g) {
                    //console.log(up.i, 'set up green', up.g, 'from', data[up.i+1]);
                    data[up.i+1] = up.g;
                    data[up.i+3] = 100;
                }
            }
        }
        if (updates.length || updatesCount) {
            bitmap.ctx.putImageData(bitmap.imageData, 0, 0);
            bitmap.dirty = true;
        }
        return updates.length + updatesCount;
    }

})(window);