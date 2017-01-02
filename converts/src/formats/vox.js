let {Buffer} = require('buffer');
let fs = require('fs');

function intToRGBA(color) {
    return {
        r: color >> 16,
        g: (color >> 8) & 0xff,
        b: color & 0xff,
        a: 0xff
    }
}

class Vox {


    static saveModel(voxelModel, filename, cb) {
        let palette = [];
        let voxels = [];
        voxelModel.forEachIn((voxel) => {
            if (!voxel) return;
            let {x,y,z,color} = voxel;
            if (palette.indexOf(color) == -1) {
                palette.push(color);
            }
            voxels.push([x,y,z,palette.indexOf(color)]);
        });
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
                content: [voxelModel.maxX+1, voxelModel.maxY+1, voxelModel.maxZ+1],
                contentSize: 4*3,
                childrenSize: 0
            },{
                id: 'XYZI',
                content: [voxels.length].concat(voxels),
                contentSize: 4 + voxels.length*4,
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
                        let rgba = intToRGBA(color);
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
        fs.writeFile(filename, buffer, cb);
    }
}

module.exports = Vox;