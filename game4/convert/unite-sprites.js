let Jimp = require("jimp");
let fs = require("fs");

function uniteSprites(config, input, output) {
    let targetSize = config.size * input.reduce((s, i) => s + i.sprites, 0);
    let out = new Jimp(targetSize, config.size);

    let left = input.slice();
    let i = 0;
    function processOne() {
        let inp = left.shift();
        if (!inp) {
            out.write(output);
            return;
        }
        Jimp.read(inp.file, function(err, file) {
            if (err) return console.error(err);
            out.blit(file, i*config.size, 0, 0, 0, config.size, config.size);
            i++;
            processOne();
        });

    }
    processOne();
}

uniteSprites({size:24},[
    {file: "../door_fly.png", sprites: 1},
    {file: "../garderob_fly.png", sprites: 1},
    {file: "../audio.png", sprites: 1},
    {file: "../speaker1.png", sprites: 1},
    {file: "../speaker2.png", sprites: 1},
], "../furniture.png");