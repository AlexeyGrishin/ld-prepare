let Jimp = require("jimp");
let fs = require("fs");
let {Buffer} = require("buffer");

function blitProjectionSymmetry(img, out, idx, x, y, config, startCol = 0) {
    let col = startCol;
    for (let row = config.size-1; row >= 0; row--) {
        let cx = config.size / 2;
        img.scan(x, y+row, config.size/2, 1, function(x1, y1, idx1) {
            if (this.bitmap.data[idx1+3] > 0) {
                let width = Math.abs(x1-x-cx);
                let color = config.keepColors ? [
                    this.bitmap.data[idx1],
                    this.bitmap.data[idx1+1],
                    this.bitmap.data[idx1+2],
                    this.bitmap.data[idx1+3]
                ] : [0,0,0,255];
                //draw 'circle'
                out.scan(col*config.size, idx*config.size, config.size, config.size, function(x2, y2, idx2) {
                    if (Math.hypot(x2-col*config.size-config.size/2, y2-idx*config.size-config.size/2) <= width) {
                        this.bitmap.data[idx2] = color[0];
                        this.bitmap.data[idx2+1] = color[1];
                        this.bitmap.data[idx2+2] = color[2];
                        this.bitmap.data[idx2+3] = color[3];
                    }
                });
            }
        });
        col++;
    }
}

function blitProjectionFlatX(img, out, idx, x, y, config, startCol = 0, {projectionCoord, projectionWidth}) {
    let col = startCol;
    for (let row = config.size-1; row >= 0; row--) {
        img.scan(x, y+row, config.size, 1, function(x1, y1, idx1) {
            if (this.bitmap.data[idx1+3] > 0) {
                let color = config.keepColors ? Jimp.rgbaToInt(
                    this.bitmap.data[idx1],
                    this.bitmap.data[idx1+1],
                    this.bitmap.data[idx1+2],
                    this.bitmap.data[idx1+3]
                ) : 0x000000FF;
                for (var w = 0; w < (projectionWidth || 1); w++) {
                    out.setPixelColor(color, col * config.size + x1 - x, idx * config.size + projectionCoord + w);
                }
            }
        });
        col++;
    }
}
//todo: not only 1-pix width

//for (var w = 0; w < projectionWidth || 1; w++) { ... }

function blitProjectionFlatY(img, out, idx, x, y, config, startCol = 0, {projectionCoord, projectionWidth}) {
    let col = startCol;
    for (let row = config.size-1; row >= 0; row--) {
        img.scan(x, y+row, config.size, 1, function(x1, y1, idx1) {
            let color = config.keepColors ? Jimp.rgbaToInt(
                this.bitmap.data[idx1],
                this.bitmap.data[idx1+1],
                this.bitmap.data[idx1+2],
                this.bitmap.data[idx1+3]
            ) : 0x000000FF;
            if (this.bitmap.data[idx1+3] > 0) {
                for (var w = 0; w < (projectionWidth || 1); w++) {
                    out.setPixelColor(color, col * config.size + projectionCoord + w, idx * config.size + (x1 - x));
                }
            }
        });
        col++;
    }
}

const Projections = {
    symmetry: blitProjectionSymmetry,
    flatX: blitProjectionFlatX,
    flatY: blitProjectionFlatY
};

module.exports.extractTiles = function(inputPath, outputPath, config, cb) {
    Jimp.read(inputPath, function(err, img) {
        let out = new Jimp(config.tiles.length*config.size, 2*config.size);
        if (err) return cb(err);
        let idx = 0;
        let cols = Math.round(img.bitmap.width / (config.size + config.pad));
        for (let tile of config.tiles) {
            let {tileNr, projection, tileTopNr} = tile;
            projection = projection || "symmetry";
            let y = ((tileNr / cols)|0) * (config.size + config.pad);
            let x = ((tileNr % cols)|0) * (config.size + config.pad);
            out.blit(img, idx*config.size, tileTopNr ? config.size: 0, x, y, config.size, config.size);
            if (tileTopNr) {
                let y = ((tileTopNr / cols)|0) * (config.size + config.pad);
                let x = ((tileTopNr % cols)|0) * (config.size + config.pad);
                out.blit(img, idx*config.size, 0, x, y, config.size, config.size);
            }
            idx++;
        }
        out.write(outputPath);
        cb();
    })  
};

module.exports.extractTileShadows = function(inputPath, outputPath, config, cb) {
    Jimp.read(inputPath, function(err, img) {
        let out = new Jimp(config.size*config.size*2, config.tiles.length*config.size);
        if (err) return cb(err);
        let idx = 0;
        let cols = Math.round(img.bitmap.width / (config.size + config.pad));
        for (let tile of config.tiles) {
            let {tileNr, projection, tileTopNr, projectionTile} = tile;
            projection = projection || "symmetry";
            let tileToRead = projectionTile || tileNr;
            let y = ((tileToRead / cols)|0) * (config.size + config.pad);
            let x = ((tileToRead % cols)|0) * (config.size + config.pad);
            Projections[projection](img, out, idx, x, y, config, 0, tile);
            tile.idx = idx;
            //out.blit(img, 0, idx*config.size, x, y, config.size, config.size);
            if (tileTopNr) {
                let y = ((tileTopNr / cols)|0) * (config.size + config.pad);
                let x = ((tileTopNr % cols)|0) * (config.size + config.pad);
                Projections[projection](img, out, idx, x, y, config, config.size, tile);
                //idx++;
                //out.blit(img, 0, idx*config.size, x, y, config.size, config.size);
            }
            idx++;

        }
        out.write(outputPath, cb);
        console.log(config);
    })
};

module.exports.extractHotspots = function(inputPath, outputPath, config, cb) {
    Jimp.read(inputPath, function(err, img) {
        if (err) return cb(err);
        let out = new Jimp(config.size, img.bitmap.height);
        let spritesCount = img.bitmap.height / config.size;
        let hcount = img.bitmap.width / config.size;
        for (let i = 0; i < spritesCount; i++) {
            out.scan(0, i*config.size, config.size, config.size, function(x, y, idx) {

                let hasSomething = false;
                for (let frame = 0; frame < hcount; frame++) {
                    if (img.getPixelColor(x+frame*config.size, y) & 0xFF !== 0) {
                        hasSomething = true;
                        break;
                    }
                }
                if (hasSomething) {
                    this.bitmap.data[idx] = x;
                    this.bitmap.data[idx+1] = y-(i*config.size);
                    this.bitmap.data[idx+2] = i;
                    this.bitmap.data[idx+3] = 0xff;
                }


            });
        }
        out.write(outputPath);
        cb();
    });
};


module.exports.extractHeightMaps = function(inputPath, outputPath, config, cb) {
  //for x,y=z specify exact x,y,z in 3d
    Jimp.read(inputPath, function(err, img) {
        if (err) return cb(err);
        let spritesCount = img.bitmap.height / config.size;
        let hcount = img.bitmap.width / config.size;

        let out = new Jimp(spritesCount * config.size, 2 * config.size);
        for (let i = 0; i < spritesCount; i++) {
            
            for (let z = 0; z < config.size*2; z++) {
                for (let x = 0; x < config.size; x++) {
                    let y = config.size-1;
                    for (; y >= 0; y--) {
                        if (img.getPixelColor(z*config.size + x, i*config.size + y) & 0xff > 0) {
                            break;
                        }
                    }
                    if (y >= 0) {
                        //z - height from bottom, former y
                        //y - real y that shall be assigned
                        //so in shader we'll have y0 = (31-z), and we need to get y instead
                        //dy = y - 31 + z;
                        //  for tree top dy = 0. for tree bottom dy = radius, I think, or at least 0.
                        let dy = (config.tiles[i].hotspotOffsetY || 0) + y - (config.size-1-z);
                        //console.log(z, y,  config.tiles[i].hotspotOffsetY + y - (config.size-1-z));
                        out.setPixelColor(
                            ((0) << 24) | ((dy + 128) << 16) | (z << 8) | 0xff,
                            i*config.size + x, config.size*2-1-z
                        );
                    }
                }
            }
            
        }
        out.write(outputPath, cb);
    });
};


function setBit(i, nr) {
    var mask = 0x01 << nr;
    return i | mask;
}

module.exports.prepare3dSprites = function(inputPath, outputPath, config, cb) {
    Jimp.read(inputPath, function(err, img) {
        if (err) return cb(err);
        let spritesCount = img.bitmap.height / config.size;
        let maxHeight = img.bitmap.width / config.size;
        let hCount = Math.floor(maxHeight / 16);

        //store 2 sprites for each sprite (if height up to 32)
        let out = new Jimp(spritesCount * config.size, hCount * config.size);
        for (let i = 0; i < spritesCount; i++) {
            for (var y = 0; y < config.size; y++) {
                for (var x = 0; x < config.size; x++) {
                    var colors = [];
                    for (var k = 0; k < hCount; k++) colors.push(0xff000000);
                    for (var z = 0; z < maxHeight; z++) {
                        //var frame = {x: z*16, y: baseY, width: 16, height: 16};
                        var ci = (z/16)|0;
                        if ((img.getPixelColor(z*config.size + x, i*config.size + y) & 0xFF) > 0)
                            colors[ci] = setBit(colors[ci], z % 16);
                        //bitmap.copyRect(shadows, frame, tile.x*16, tile.y*16 - 16);
                    }
                    //colors[1] = 0xff000000;
                    for (var k = 0; k < hCount; k++) {
                        //todo: setPixelColor uses BE, I need LE. Not actually need, but I have code for LE
                        var idx = out.getPixelIndex(i*config.size + x, k*config.size + y);
                        out.bitmap.data.writeUInt32LE(colors[k], idx, true);
                        //out.setPixelColor((colors[k] << 8) | 0xFF, );
                    }
                    //bitmap.pixels[((tileY+y+config.hotspotOffsetY) * bitmap.width + tileX + x)|0] = colors[0];
                    //bitmap.pixels[((tileY+y+config.hotspotOffsetY) * bitmap.width + tileX + x + bitmap.width/2)|0] = colors[1];
                    //console.log(colors);
                }
            }
        }
        out.write(outputPath, cb);
    });
};



module.exports.map3dToVex = function(inputPath, outputPath, config, cb) {
    Jimp.read(inputPath, function(err, img) {
        if (err) return cb(err);
        let spritesCount = img.bitmap.height / config.size;
        let maxHeight = img.bitmap.width / config.size;
        let palette = [];

        for (var i = 0; i < spritesCount; i++) {
            let sprite = {
                width: config.size, height: config.size, zheight: maxHeight,
                voxels: []
            };
            for (var x = 0; x < config.size; x++) {
                for (var y = 0; y < config.size; y++) {
                    for (var z = 0; z < maxHeight; z++) {
                        let color = img.getPixelColor(z*config.size + x, i*config.size + y);
                        if ((color & 0xFF) > 0) {
                            if (palette.indexOf(color) == -1) {
                                palette.push(color);
                            }
                            sprite.voxels.push([x,y,z,palette.indexOf(color)]);
                        }
                    }
                }
            }
            let mainChunk = {
                id: 'MAIN',
                contentSize: 0,
                childrenSize: 0,
                children: [{
                    id: 'PACK',
                    content: [1],
                    contentSize: 4,
                    childrenSize: 0
                },{
                    id: 'SIZE',
                    content: [sprite.width, sprite.height, sprite.zheight],
                    contentSize: 4*3,
                    childrenSize: 0
                },{
                    id: 'XYZI',
                    content: [sprite.voxels.length].concat(sprite.voxels),
                    contentSize: 4 + sprite.voxels.length*4,
                    childrenSize: 0
                }, {
                    id: 'RGBA',
                    content: palette,
                    contentSize: 4*palette.length,
                    childrenSize: 0
                }]
            };
            let totalSize = 8;
            function process(chunk, parent) {
                totalSize += (4 + 4 + 4 + chunk.contentSize);
                (chunk.children || []).forEach((ch) => process(ch, chunk));
                if (parent) parent.childrenSize += (chunk.contentSize + chunk.childrenSize + 12);

            }
            process(mainChunk);
            let buffer = Buffer.alloc(totalSize);

            let offset = 0;

            offset = buffer.write("VOX ");
            offset = buffer.writeInt32LE(150, offset);  //version

            function write(chunk) {
                offset += buffer.write(chunk.id, offset);
                offset = buffer.writeInt32LE(chunk.contentSize, offset);
                offset = buffer.writeInt32LE(chunk.childrenSize, offset);
                switch (chunk.id) {
                    case 'PACK':
                    case 'SIZE':
                        chunk.content.forEach(function(n) {
                            //console.log(chunk.id, offset);
                            offset = buffer.writeInt32LE(n, offset);
                        });
                        break;
                    case 'RGBA':
                        chunk.content.forEach(function(color) {
                            let rgba = Jimp.intToRGBA(color);
                            offset = buffer.writeUInt8(rgba.r, offset);
                            offset = buffer.writeUInt8(rgba.g, offset);
                            offset = buffer.writeUInt8(rgba.b, offset);
                            offset = buffer.writeUInt8(rgba.a, offset);
                        });
                        break;
                    case 'XYZI':
                        offset = buffer.writeInt32LE(chunk.content[0], offset);
                        chunk.content.slice(1).forEach(function(n) {
                            offset = buffer.writeUInt8(n[0], offset);
                            offset = buffer.writeUInt8(n[1], offset);
                            offset = buffer.writeUInt8(n[2], offset);
                            offset = buffer.writeUInt8(n[3], offset);
                        });
                        break;
                }
                (chunk.children || []).forEach(write);
            }
            write(mainChunk);
            let idx = config.tiles[i].tileNr;
            fs.writeFileSync(outputPath + "-" + idx + ".vox", buffer);
        }
        cb();




    });
};

module.exports.vexToMap3d = function(inputPath, outputPath, config, cb) {

};